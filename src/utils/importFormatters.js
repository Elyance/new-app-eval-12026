export function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

export function slugify(value) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function toNumber(value) {
  const normalized = normalizeText(value)
    .replace(/\s+/g, '')
    .replace(/%$/, '')
    .replace(',', '.')

  if (!normalized) return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function round2(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100) / 100
}
