import { normalizeText } from '../utils/importFormatters'

/*
 * traitementCSVService.js
 * Fonctions utilitaires pour parser / normaliser les valeurs issues des CSV
 * - validation stricte du format de date DD/MM/YYYY avec levée d'exception
 * - validation des montants strictement positifs (> 0)
 * - conversion des nombres localisés (ex: "1 234,56" -> 1234.56)
 * - nettoyage des champs texte
 */

// Convertit une chaîne contenant un nombre localisé en Number
// Exemples: "1 234,56" -> 1234.56 ; "1.234.56" -> null (invalid)
function parseLocalizedNumber(value) {
  const normalized = normalizeText(value)
    .replace(/\s+/g, '')
    .replace(/%$/, '')

  if (!normalized) return null

  const lastComma = normalized.lastIndexOf(',')
  const lastDot = normalized.lastIndexOf('.')

  let cleaned = normalized
  if (lastComma > -1 && lastDot > -1) {
    // les deux séparateurs présents : on décide selon la position du dernier
    cleaned = lastComma > lastDot
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '')
  } else if (lastComma > -1) {
    // format francophone: 1234,56
    cleaned = normalized.replace(',', '.')
  }

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

// Valide et formate une date strictement au format DD/MM/YYYY
function validateAndFormatDisplayDate(value, fieldName = 'date', lineNum) {
  const str = String(value ?? '').trim()
  if (!str) {
    throw new Error(`Ligne ${lineNum} : Le champ '${fieldName}' est obligatoire et ne peut pas être vide.`)
  }

  // Format exact DD/MM/YYYY
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) {
    throw new Error(`Ligne ${lineNum} : Le format de la date '${str}' pour le champ '${fieldName}' est incorrect. Format attendu : DD/MM/YYYY.`)
  }

  const [, dayStr, monthStr, yearStr] = match
  const day = parseInt(dayStr, 10)
  const month = parseInt(monthStr, 10)
  const year = parseInt(yearStr, 10)

  // Validation calendrier standard
  if (month < 1 || month > 12) {
    throw new Error(`Ligne ${lineNum} : Le mois '${monthStr}' de la date '${str}' est invalide (doit être entre 01 et 12).`)
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) {
    throw new Error(`Ligne ${lineNum} : Le jour '${dayStr}' de la date '${str}' est invalide pour ce mois (maximum ${daysInMonth} jours).`)
  }

  return str
}

// Valide qu'un montant est strictement supérieur à 0
function validatePositivePrice(value, fieldName, lineNum) {
  const parsed = parseLocalizedNumber(value)
  if (parsed === null) {
    throw new Error(`Ligne ${lineNum} : Le montant '${fieldName}' est invalide ou manquant (reçu: '${value}').`)
  }
  if (parsed <= 0) {
    throw new Error(`Ligne ${lineNum} : Le montant '${fieldName}' doit être strictement positif (trouvé: ${parsed}).`)
  }
  return parsed
}

// Définition des colonnes attendues pour chaque fichier CSV
export const COLUMNS_FICHIER1 = [
  'date_availability_produit',
  'nom',
  'reference',
  'prix_ttc',
  'Taxe',
  'categorie',
  'prix_achat'
]

export const COLUMNS_FICHIER2 = [
  'reference',
  'specificité',
  'karazany',
  'stock_initial',
  'prix_vente_ttc'
]

export const COLUMNS_FICHIER3 = [
  'date',
  'nom',
  'email',
  'pwd',
  'adresse',
  'achat',
  'etat'
]

// Vérifie que les en-têtes du CSV correspondent exactement en noms et en quantité
function validateCsvHeaders(rows, expectedHeaders, fileLabel) {
  const filtered = Array.isArray(rows) ? rows.filter(r => !isEmptyRow(r)) : []
  if (filtered.length === 0) return

  const actualHeaders = Object.keys(filtered[0])

  // 1. Vérification du nombre de colonnes
  if (actualHeaders.length !== expectedHeaders.length) {
    throw new Error(`${fileLabel} invalide : le nombre de colonnes ne correspond pas. Attendu : ${expectedHeaders.length} (colonnes : [${expectedHeaders.join(', ')}]), reçu : ${actualHeaders.length} (colonnes : [${actualHeaders.join(', ')}]).`)
  }

  // 2. Vérification de l'orthographe exacte et présence de chaque colonne
  for (const expected of expectedHeaders) {
    if (!actualHeaders.includes(expected)) {
      throw new Error(`${fileLabel} invalide : la colonne '${expected}' est manquante ou mal orthographiée. Colonnes attendues : [${expectedHeaders.join(', ')}], reçues : [${actualHeaders.join(', ')}].`)
    }
  }
}

// Parse une valeur de pourcentage et retourne un nombre (ex: '20%' -> 20)
function normalizePercentage(value) {
  return parseLocalizedNumber(String(value ?? '').replace('%', ''))
}

function isEmptyRow(row) {
  return !Object.values(row || {}).some((value) => normalizeText(value) !== '')
}

export function traitementFichier1(rows = []) {
  const normalizedRows = Array.isArray(rows) ? rows : []
  
  // Validation des colonnes (noms exacts et nombre conforme)
  validateCsvHeaders(normalizedRows, COLUMNS_FICHIER1, 'Fichier 1 (Produits)')

  // Filtre les lignes vides puis normalise chaque champ important
  return normalizedRows
    .filter((row) => !isEmptyRow(row))
    .map((row, index) => {
      const lineNum = index + 1
      
      let dateAvailability = null
      const dateVal = String(row.date_availability_produit ?? '').trim()
      if (dateVal) {
        dateAvailability = validateAndFormatDisplayDate(dateVal, 'date_availability_produit', lineNum)
      }

      const prixTtc = validatePositivePrice(row.prix_ttc, 'prix_ttc', lineNum)
      const prixAchat = validatePositivePrice(row.prix_achat, 'prix_achat', lineNum)

      return {
        ligne: lineNum,
        date_availability_produit: dateAvailability,
        nom: normalizeText(row.nom),
        reference: normalizeText(row.reference),
        prix_ttc: prixTtc,
        taxe: normalizePercentage(row.Taxe),
        categorie: normalizeText(row.categorie),
        prix_achat: prixAchat,
        quantite: 0
      }
    })
}

export function traitementFichier2(rows = []) {
  const normalizedRows = Array.isArray(rows) ? rows : []
  
  // Validation des colonnes (noms exacts et nombre conforme)
  validateCsvHeaders(normalizedRows, COLUMNS_FICHIER2, 'Fichier 2 (Déclinaisons)')

  return normalizedRows
    .filter((row) => !isEmptyRow(row))
    .map((row, index) => {
      const lineNum = index + 1
      const prixVenteTtc = validatePositivePrice(row.prix_vente_ttc, 'prix_vente_ttc', lineNum)

      return {
        ligne: lineNum,
        reference: normalizeText(row.reference),
        specificite: normalizeText(row.specificité),
        karazany: normalizeText(row.karazany),
        stock_initial: parseLocalizedNumber(row.stock_initial),
        prix_vente_ttc: prixVenteTtc
      }
    })
}

// Parse la chaîne de caractères [("T_01";3;"ngoza"),("C_03";1;"")] en tableau d'objets
export function parseAchat(achatStr) {
  const normalized = normalizeText(achatStr)
  if (!normalized) return []

  const results = []
  // Capture les groupes de la forme ("REF";QUANTITE;"SPECIFICITE")
  const matches = normalized.match(/\("([^"]+)"\s*;\s*(\d+)\s*;\s*"([^"]*)"\)/g)
  if (matches) {
    for (const m of matches) {
      const parts = m.match(/\("([^"]+)"\s*;\s*(\d+)\s*;\s*"([^"]*)"\)/)
      if (parts) {
        results.push({
          reference: normalizeText(parts[1]),
          quantite: parseInt(parts[2], 10) || 1,
          specificite_valeur: normalizeText(parts[3])
        })
      }
    }
  }
  return results
}

export function traitementFichier3(rows = []) {
  const normalizedRows = Array.isArray(rows) ? rows : []
  
  // Validation des colonnes (noms exacts et nombre conforme)
  validateCsvHeaders(normalizedRows, COLUMNS_FICHIER3, 'Fichier 3 (Commandes)')

  return normalizedRows
    .filter((row) => !isEmptyRow(row))
    .map((row, index) => {
      const lineNum = index + 1
      const dateDisplay = validateAndFormatDisplayDate(row.date, 'date', lineNum)

      return {
        ligne: lineNum,
        date: dateDisplay,
        nom: normalizeText(row.nom),
        email: normalizeText(row.email),
        pwd: normalizeText(row.pwd),
        adresse: normalizeText(row.adresse),
        achat: parseAchat(row.achat),
        etat: normalizeText(row.etat)
      }
    })
}

export default {
  COLUMNS_FICHIER1,
  COLUMNS_FICHIER2,
  COLUMNS_FICHIER3,
  traitementFichier1,
  traitementFichier2,
  traitementFichier3
}