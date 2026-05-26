import { useFileValidator } from './useFileValidator'
import Papa from 'papaparse'
import { traitementFichier1, traitementFichier2, traitementFichier3 } from './traitementCSVService'
import {
  buildFichier1ImportPlan,
  executeImportPlan,
  insertProducts,
  uploadProductImages,
  executeFichier2Import,
  executeFichier3Import
} from './traitementDonneesService'
import { resetData } from './ResetService'
import { getModules } from './ModulesService'

/*
 * importService.js
 * - Valide la présence et le type des fichiers (3 CSV + ZIP optionnel) via `useFileValidator`
 * - Parse les CSV avec PapaParse (header: true)
 * - Orchestre l'importation complète via le pipeline runFullImportPipeline avec rollback transactionnel
 *
 * Fonctions principales exposées:
 *  - validateImportFiles({ csvFiles, zipFile, skipImages }) -> { valid, errors, files }
 *  - parseCsvFile(file) -> Promise<rows>
 *  - parseCsvFiles(files) -> Promise< [{fileName, rows}] >
 *  - runFullImportPipeline({ csvFiles, zipFile, skipImages }, onProgress) -> Promise<summary>
 */

const { validateFiles } = useFileValidator()

function normalizeFileList(files) {
  if (!files) return []
  if (Array.isArray(files)) return files.filter(Boolean)
  return Array.from(files).filter(Boolean)
}

// Valide la présence des 3 CSV et du ZIP, puis délègue la vérification binaire
export async function validateImportFiles({ csvFiles = [], zipFile = null, skipImages = false } = {}) {
  const normalizedCsvFiles = normalizeFileList(csvFiles)
  const errors = []

  if (normalizedCsvFiles.length !== 3) {
    errors.push(`Il faut exactement 3 fichiers CSV, reçu(s): ${normalizedCsvFiles.length}.`)
  }
  if (!zipFile && !skipImages) {
    errors.push('Le fichier ZIP contenant les images est obligatoire.')
  }

  const fileValidationErrors = await validateFiles({
    csv1: normalizedCsvFiles[0],
    csv2: normalizedCsvFiles[1],
    csv3: normalizedCsvFiles[2],
    zip: zipFile
  })

  errors.push(...fileValidationErrors)

  const valid = errors.length === 0

  return {
    valid,
    errors,
    files: {
      csvFiles: normalizedCsvFiles,
      zipFile
    }
  }
}

// Parse un CSV via PapaParse et renvoie les lignes en en-têtes -> valeurs
export function parseCsvFile(file, papaOptions = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Aucun fichier CSV fourni.'))
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => String(header || '').trim(),
      complete: (result) => {
        if (result.errors?.length) {
          reject(new Error(result.errors[0].message || 'Erreur lors du parsing CSV.'))
          return
        }

        resolve(result.data)
      },
      error: (error) => {
        reject(error)
      },
      ...papaOptions
    })
  })
}

// Parse une liste de fichiers CSV en parallèle
export async function parseCsvFiles(csvFiles = []) {
  const normalizedCsvFiles = normalizeFileList(csvFiles)
  const parsedFiles = await Promise.all(
    normalizedCsvFiles.map(async (file) => ({
      fileName: file?.name || '',
      rows: await parseCsvFile(file)
    }))
  )

  return parsedFiles
}

// Résumé utile pour l'UI
export function getImportFileSummary({ csvFiles = [], zipFile = null } = {}) {
  const normalizedCsvFiles = normalizeFileList(csvFiles)
  return {
    csvCount: normalizedCsvFiles.length,
    csvNames: normalizedCsvFiles.map(file => file?.name || ''),
    zipName: zipFile?.name || ''
  }
}

// Orchestre le pipeline complet d'importation
export async function runFullImportPipeline({ csvFiles = [], zipFile = null, skipImages = false }, onProgress = () => {}) {
  // 1) Validation des fichiers
  onProgress('Validation des fichiers en cours...')
  const validation = await validateImportFiles({ csvFiles, zipFile, skipImages })
  if (!validation.valid) {
    throw new Error(validation.errors.join(' | '))
  }

  // 2) Parsing des fichiers CSV
  onProgress('Lecture et parsing des fichiers CSV...')
  const parsedCsvFiles = await parseCsvFiles(validation.files.csvFiles)

  // 3) Traitement et importation du Fichier 1
  const fichier1 = parsedCsvFiles[0]
  if (!fichier1) {
    throw new Error('Le fichier 1 (Produits) est requis.')
  }

  onProgress('Normalisation et validation du Fichier 1 (Produits)...')
  const fichier1Traite = traitementFichier1(fichier1.rows)

  onProgress('Préparation du plan d’import (Fichier 1)...')
  const planImportFichier1 = buildFichier1ImportPlan(fichier1Traite)

  try {
    onProgress('Création des Catégories et des Taxes dans PrestaShop...')
    const planEnrichi = await executeImportPlan(planImportFichier1)

    onProgress('Insertion des nouveaux Produits dans PrestaShop...')
    const planFinal = await insertProducts(planEnrichi)

    // 4) Upload des images si le ZIP est présent ET skipImages est false
    if (validation.files.zipFile && !skipImages) {
      onProgress('Extraction et envoi des images produits...')
      await uploadProductImages(validation.files.zipFile, planFinal)
    } else if (skipImages) {
      onProgress('Import des images ignoré (option cochée)...')
    }

    // 5) Traitement et importation du Fichier 2
    const fichier2 = parsedCsvFiles[1]
    if (fichier2) {
      onProgress('Normalisation et Importation des déclinaisons et stocks (Fichier 2)...')
      const fichier2Traite = traitementFichier2(fichier2.rows)
      await executeFichier2Import(fichier2Traite, planFinal)
    }

    // 6) Traitement et importation du Fichier 3
    const fichier3 = parsedCsvFiles[2]
    if (fichier3) {
      onProgress('Normalisation et Importation des paniers et commandes (Fichier 3)...')
      const fichier3Traite = traitementFichier3(fichier3.rows)
      await executeFichier3Import(fichier3Traite, planFinal)
    }
  } catch (error) {
    onProgress('Erreur durant l\'importation. Nettoyage de la base de données en cours...')
    try {
      const modules = await getModules()
      await resetData(modules)
      console.log('[importService] Base de données réinitialisée avec succès suite à l\'erreur.')
    } catch (resetError) {
      console.error('[importService] Échec de la réinitialisation de la base de données :', resetError)
    }
    throw error // On propage l'erreur d'origine pour l'affichage dans l'UI
  }

  onProgress('Importation terminée avec succès !')
  return getImportFileSummary(validation.files)
}

export default {
  validateImportFiles,
  parseCsvFile,
  parseCsvFiles,
  getImportFileSummary,
  runFullImportPipeline
}
