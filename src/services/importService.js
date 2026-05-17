import { useFileValidator } from './useFileValidator'
import Papa from 'papaparse'

/*
 * importService.js
 * - Valide la présence et le type des fichiers (3 CSV + ZIP) via `useFileValidator`
 * - Parse les CSV avec PapaParse (header: true)
 *
 * Fonctions principales exposées:
 *  - validateImportFiles({ csvFiles, zipFile }) -> { valid, errors, files }
 *  - parseCsvFile(file) -> Promise<rows>
 *  - parseCsvFiles(files) -> Promise< [{fileName, rows}] >
 */

const { validateFiles } = useFileValidator()

function normalizeFileList(files) {
  if (!files) return []
  if (Array.isArray(files)) return files.filter(Boolean)
  return Array.from(files).filter(Boolean)
}

// Valide la présence des 3 CSV et du ZIP, puis délègue la vérification binaire
export async function validateImportFiles({ csvFiles = [], zipFile = null } = {}) {
  const normalizedCsvFiles = normalizeFileList(csvFiles)
  const errors = []

  if (normalizedCsvFiles.length !== 3) {
    errors.push(`Il faut exactement 3 fichiers CSV, reçu(s): ${normalizedCsvFiles.length}.`)
  }
  if (!zipFile) {
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

export default {
  validateImportFiles,
  parseCsvFile,
  parseCsvFiles,
  getImportFileSummary
}
