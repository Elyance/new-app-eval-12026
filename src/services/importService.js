import { useFileValidator } from './useFileValidator'
import Papa from 'papaparse'

const { validateFiles } = useFileValidator()

function normalizeFileList(files) {
  if (!files) return []
  if (Array.isArray(files)) return files.filter(Boolean)
  return Array.from(files).filter(Boolean)
}

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
