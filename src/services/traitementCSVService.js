import { normalizeText } from '../utils/importFormatters'

const MONTH_ALIASES = {
  1: ['janvier', 'january', 'jan', 'januari'],
  2: ['février', 'fevrier', 'february', 'feb', 'februari'],
  3: ['mars', 'march', 'mar', 'maart'],
  4: ['avril', 'april', 'apr'],
  5: ['mai', 'may', 'mei'],
  6: ['juin', 'june', 'jun', 'juni'],
  7: ['juillet', 'july', 'jul', 'juli'],
  8: ['août', 'aout', 'august', 'aug', 'augustus'],
  9: ['septembre', 'september', 'sep', 'sept'],
  10: ['octobre', 'october', 'oct'],
  11: ['novembre', 'november', 'nov'],
  12: ['décembre', 'decembre', 'december', 'dec']
}

const MONTH_LOOKUP = Object.entries(MONTH_ALIASES).reduce((acc, [num, aliases]) => {
  aliases.forEach((alias) => {
    acc[normalizeMonthToken(alias)] = parseInt(num, 10)
  })
  return acc
}, {})

function normalizeMonthToken(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.$/, '')
    .trim()
}

function parseLocalizedNumber(value) {
  const normalized = normalizeText(value)
    .replace(/\s+/g, '')
    .replace(/%$/, '')

  if (!normalized) return null

  const lastComma = normalized.lastIndexOf(',')
  const lastDot = normalized.lastIndexOf('.')

  let cleaned = normalized
  if (lastComma > -1 && lastDot > -1) {
    cleaned = lastComma > lastDot
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '')
  } else if (lastComma > -1) {
    cleaned = normalized.replace(',', '.')
  }

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function toIsoDate(year, month, day) {
  const isoDate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const date = new Date(`${isoDate}T00:00:00`)

  if (Number.isNaN(date.getTime())) return null
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) {
    return null
  }

  return isoDate
}

function toDisplayDate(year, month, day) {
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${String(year).padStart(4, '0')}`
}

function parseAnyDate(value) {
  const normalized = normalizeText(value)
  if (!normalized) {
    console.log('[traitementCSVService] Date vide ou absente:', value)
    return null
  }

  const cleaned = normalized
    .replace(/\bat\b/gi, ' ')
    .replace(/\bà\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  console.log('[traitementCSVService] Traitement date - entrée:', normalized, '| nettoyée:', cleaned)

  const dateOnly = cleaned.split(' ')[0].split('T')[0]

  const isoMatch = dateOnly.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    const displayDate = toDisplayDate(year, month, day)
    console.log('[traitementCSVService] Date ISO détectée ->', displayDate)
    return displayDate
  }

  const dmyMatch = dateOnly.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch
    const displayDate = toDisplayDate(year, month, day)
    console.log('[traitementCSVService] Date DMY détectée ->', displayDate)
    return displayDate
  }

  const mdyMatch = dateOnly.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)
  if (mdyMatch) {
    const [, month, day, yearRaw] = mdyMatch
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw
    const displayDate = toDisplayDate(year, month, day)
    console.log('[traitementCSVService] Date MDY détectée ->', displayDate)
    return displayDate
  }

  const textMonthMatch = cleaned.match(/^(\d{1,2})\s+([\p{L}.]+)\s+(\d{4})(?:\s+.*)?$/u)
  if (textMonthMatch) {
    const [, day, monthLabel, year] = textMonthMatch
    const month = MONTH_LOOKUP[normalizeMonthToken(monthLabel)]
    if (month) {
      const displayDate = toDisplayDate(year, month, day)
      console.log('[traitementCSVService] Date textuelle détectée ->', displayDate)
      return displayDate
    }
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    console.log('[traitementCSVService] Date non reconnue:', normalized)
    return null
  }

  const displayDate = toDisplayDate(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth() + 1,
    parsed.getUTCDate()
  )
  console.log('[traitementCSVService] Date fallback JS ->', displayDate)
  return displayDate
}

function normalizePercentage(value) {
  return parseLocalizedNumber(String(value ?? '').replace('%', ''))
}

function isEmptyRow(row) {
  return !Object.values(row || {}).some((value) => normalizeText(value) !== '')
}

export function traitementFichier1(rows = []) {
  const normalizedRows = Array.isArray(rows) ? rows : []

  return normalizedRows
    .filter((row) => !isEmptyRow(row))
    .map((row, index) => ({
      ligne: index + 1,
      date_availability_produit: parseAnyDate(row.date_availability_produit),
      nom: normalizeText(row.nom),
      reference: normalizeText(row.reference),
      prix_ttc: parseLocalizedNumber(row.prix_ttc),
      taxe: normalizePercentage(row.Taxe || row.taxe),
      categorie: normalizeText(row.categorie),
      prix_achat: parseLocalizedNumber(row.prix_achat)
    }))
}

export default {
  traitementFichier1
}