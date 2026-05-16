import { jsonToXml } from '../utils/xmlParser'

export function computeMatchingCombination(product, selectedOptions, selectedCombinationId) {
  const selectedOptionValueIds = Object.values(selectedOptions || {}).map(v => Number(v)).filter(Number.isFinite)

  if (selectedOptionValueIds.length > 0) {
    const matching = (product.combinations || []).find((comb) => {
      const comboOptionIds = comb.optionValueIds || []
      return selectedOptionValueIds.every(id => comboOptionIds.includes(id))
    })
    if (matching) return matching
  }

  if (selectedCombinationId) {
    return (product.combinations || []).find(c => Number(c.id) === Number(selectedCombinationId)) || null
  }

  return null
}

export function buildStockMovementPayload({ productId, combinationId = 0, quantity, note = '' }) {
  const dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ')
  return {
    id_product: productId,
    id_product_attribute: combinationId || 0,
    quantity,
    date_add: dateNow,
    note
  }
}

export function buildStockAvailablePayload({ productId, combinationId = 0, quantity }) {
  return {
    id_product: productId,
    id_product_attribute: combinationId || 0,
    quantity
  }
}

export function generateStockMovementXml(payload) {
  return jsonToXml(payload, 'stock_movement')
}

export function generateStockAvailableXml(payload) {
  return jsonToXml(payload, 'stock_available')
}

export default {
  computeMatchingCombination,
  buildStockMovementPayload,
  buildStockAvailablePayload,
  generateStockMovementXml,
  generateStockAvailableXml
}
