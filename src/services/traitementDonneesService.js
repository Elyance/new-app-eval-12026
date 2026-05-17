import { normalizeText, slugify, toNumber, round2 } from '../utils/importFormatters'

function buildProductPriceHt(priceTtc, taxRate) {
  const ttc = toNumber(priceTtc)
  const taxe = toNumber(taxRate) || 0

  if (ttc === null) return null
  if (taxe <= 0) return round2(ttc)

  return round2(ttc / (1 + taxe / 100))
}

function splitRowFile1(row) {
  const categoryName = normalizeText(row.categorie)
  const taxRate = toNumber(row.taxe)
  const priceTtc = toNumber(row.prix_ttc)
  const priceHt = buildProductPriceHt(priceTtc, taxRate)

  return {
    category: {
      name: categoryName,
      slug: slugify(categoryName)
    },
    tax: {
      name: taxRate === null ? '' : `${taxRate}%`,
      rate: taxRate
    },
    product: {
      name: normalizeText(row.nom),
      reference: normalizeText(row.reference),
      available_date: normalizeText(row.date_availability_produit),
      price_ttc: priceTtc,
      price_ht: priceHt,
      taxe: taxRate,
      category_name: categoryName,
      prix_achat: toNumber(row.prix_achat)
    }
  }
}

export function buildFichier1ImportPlan(rows = []) {
  const normalizedRows = Array.isArray(rows) ? rows : []

  const rowsWithEntities = normalizedRows
    .filter((row) => Object.values(row || {}).some((value) => normalizeText(value) !== ''))
    .map((row, index) => ({
      ligne: index + 1,
      source: row,
      ...splitRowFile1(row)
    }))

  const categories = []
  const taxes = []
  const products = []
  const categoryMap = new Map()
  const taxMap = new Map()

  for (const row of rowsWithEntities) {
    const categoryKey = row.category.slug || row.category.name || `categorie-${row.ligne}`
    if (row.category.name && !categoryMap.has(categoryKey)) {
      const categoryEntry = {
        key: categoryKey,
        ...row.category
      }
      categoryMap.set(categoryKey, categoryEntry)
      categories.push(categoryEntry)
    }

    const taxKey = row.tax.rate === null ? null : String(row.tax.rate)
    if (taxKey !== null && !taxMap.has(taxKey)) {
      const taxEntry = {
        key: taxKey,
        ...row.tax
      }
      taxMap.set(taxKey, taxEntry)
      taxes.push(taxEntry)
    }

    products.push({
      key: row.product.reference || `produit-${row.ligne}`,
      ...row.product,
      category_key: categoryKey,
      tax_key: taxKey
    })
  }

  return {
    categories,
    taxes,
    products,
    rows: rowsWithEntities
  }
}

export function logFichier1ImportPlan(plan) {
  console.log('[traitementDonneesService] Plan catégories:', plan.categories)
  console.log('[traitementDonneesService] Plan taxes:', plan.taxes)
  console.log('[traitementDonneesService] Plan produits:', plan.products)
}

export default {
  buildFichier1ImportPlan,
  logFichier1ImportPlan
}