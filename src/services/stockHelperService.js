import { jsonToXml, xmlToJson } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'

/*
 * stockHelperService.js
 * Helper utilities for stock operations:
 * - computeMatchingCombination: given product + selected options, find the matching combination
 * - payload builders: prepare objects to be converted into XML for PrestaShop
 * - updateStockInPrestashop: example implementation to POST stock_movement and PUT stock_available
 *
 * Ces fonctions sont utilisées depuis la vue BO pour simuler ou effectuer la mise à jour de stock.
 */

// Retourne la combinaison correspondant aux options sélectionnées si trouvée.
export function computeMatchingCombination(product, selectedOptions, selectedCombinationId) {
  const selectedOptionValueIds = Object.values(selectedOptions || {}).map(v => Number(v)).filter(Number.isFinite)

  if (selectedOptionValueIds.length > 0) {
    const matching = (product.combinations || []).find((comb) => {
      const comboOptionIds = comb.optionValueIds || []
      return selectedOptionValueIds.every(id => comboOptionIds.includes(id))
    })
    if (matching) return matching
  }

  // Si l'utilisateur a choisi explicitement une combinaison, la retrouver
  if (selectedCombinationId) {
    return (product.combinations || []).find(c => Number(c.id) === Number(selectedCombinationId)) || null
  }

  return null
}

// Builders pour payloads JSON (avant conversion XML)
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

/*
 * updateStockInPrestashop
 * Exemple de processus :
 * 1) Récupérer le `stock_available` existant pour le produit (+ combinaison)
 * 2) Poster un `stock_movement` (historique)
 * 3) Mettre à jour le `stock_available` (PUT)
 * Retourne true si succès, false sinon.
 */
export async function updateStockInPrestashop(productId, combinationId = 0, deltaQuantity) {
  try {
    const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }

    // 1. Fetch current stock_available
    let url = `${API_URL}/stock_availables?filter[id_product]=${productId}`
    if (combinationId) {
      url += `&filter[id_product_attribute]=${combinationId}`
    }
    url += '&display=full'

    const getResponse = await fetch(url, { headers: authHeader })
    if (!getResponse.ok) {
      throw new Error(`Failed to fetch stock_available: ${getResponse.status}`)
    }
    const xmlData = await getResponse.text()
    const jsonData = await xmlToJson(xmlData)
    
    let stockAvailable = jsonData?.prestashop?.stock_availables?.stock_available
    if (!stockAvailable) {
      console.warn(`No stock_available found for product ${productId} and combination ${combinationId}`)
      return false
    }
    if (Array.isArray(stockAvailable)) {
      stockAvailable = stockAvailable[0]
    }

    const extractValue = (obj) => typeof obj === 'object' && obj !== null ? (obj['#text'] || '') : obj;
    const id_stock_available = extractValue(stockAvailable.id) || stockAvailable['@_id']
    const currentQuantity = parseInt(extractValue(stockAvailable.quantity) || 0)
    const id_shop = extractValue(stockAvailable.id_shop) || 1
    const id_shop_group = extractValue(stockAvailable.id_shop_group) || 0
    const out_of_stock = extractValue(stockAvailable.out_of_stock) || 2
    const depends_on_stock = extractValue(stockAvailable.depends_on_stock) || 0
    const location = extractValue(stockAvailable.location) || ''

    const newQuantity = currentQuantity + deltaQuantity
    const dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ')

    // 2. Insert into stock_movements (POST)
    const mvtPayload = {
      id_product: productId,
      id_product_attribute: combinationId || 0,
      id_employee: 1,
      id_stock: id_stock_available,
      id_stock_mvt_reason: 1,
      physical_quantity: Math.abs(deltaQuantity),
      sign: deltaQuantity > 0 ? 1 : -1,
      price_te: 0,
      date_add: dateNow
    }

    const mvtXml = jsonToXml(mvtPayload, 'stock_mvt')

    const mvtResponse = await fetch(`${API_URL}/stock_movements`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/xml',
        ...authHeader
      },
      body: mvtXml
    })

    if (!mvtResponse.ok) {
      console.error("Erreur création stock_movement:", await mvtResponse.text())
    }

    // 3. Update stock_available (PUT)
    const availPayload = {
      id: id_stock_available,
      id_product: productId,
      id_product_attribute: combinationId || 0,
      id_shop: id_shop,
      id_shop_group: id_shop_group,
      quantity: newQuantity,
      depends_on_stock: depends_on_stock,
      out_of_stock: out_of_stock,
      location: location
    }

    const availXml = jsonToXml(availPayload, 'stock_available')

    const availResponse = await fetch(`${API_URL}/stock_availables/${id_stock_available}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/xml',
        ...authHeader
      },
      body: availXml
    })

    if (!availResponse.ok) {
      console.error("Erreur update stock_available:", await availResponse.text())
      return false
    }

    console.log(`Stock mis à jour avec succès : id_stock_available=${id_stock_available}, old_qty=${currentQuantity}, new_qty=${newQuantity}`)
    return true
  } catch (err) {
    console.error("Erreur dans updateStockInPrestashop:", err)
    return false
  }
}

export default {
  computeMatchingCombination,
  buildStockMovementPayload,
  buildStockAvailablePayload,
  generateStockMovementXml,
  generateStockAvailableXml,
  updateStockInPrestashop
}
