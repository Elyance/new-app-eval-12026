import { xmlToJson } from '../utils/xmlParser'
import { API_URL } from '../constants/constant'

function toNumber(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function extractTaxRulesGroupId(product) {
  return Number(product?.id_tax_rules_group?.['#text'] || product?.id_tax_rules_group || 0)
}

export async function getProductTaxRate(product) {
  const taxRulesGroupId = extractTaxRulesGroupId(product)

  if (!Number.isFinite(taxRulesGroupId) || taxRulesGroupId <= 0) {
    return 0
  }

  try {
    const taxRulesResponse = await fetch(`${API_URL}/tax_rules?filter[id_tax_rules_group]=[${taxRulesGroupId}]&display=full`)
    const taxRulesXml = await taxRulesResponse.text()
    const taxRulesJson = await xmlToJson(taxRulesXml)

    const rawTaxRules =
      taxRulesJson?.prestashop?.tax_rules?.tax_rule ||
      []

    const taxRules = Array.isArray(rawTaxRules) ? rawTaxRules : [rawTaxRules]
    const firstTaxRule = taxRules.find(Boolean)
    const taxId = Number(firstTaxRule?.id_tax?.['#text'] || firstTaxRule?.id_tax || 0)

    if (!Number.isFinite(taxId) || taxId <= 0) {
      return 0
    }

    const taxResponse = await fetch(`${API_URL}/taxes/${taxId}?display=full`)
    const taxXml = await taxResponse.text()
    const taxJson = await xmlToJson(taxXml)

    const tax = taxJson?.prestashop?.tax || taxJson?.prestashop?.taxes?.tax || null
    const taxRate = toNumber(tax?.rate?.['#text'] || tax?.rate)

    return taxRate
  } catch (error) {
    console.error('Erreur lors de la récupération du taux de taxe:', error)
    return 0
  }
}