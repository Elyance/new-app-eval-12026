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
 * Retourne le stock_available récupéré si succès, null sinon.
 */
export async function createStockMovement(productId, combinationId = 0, deltaQuantity, id_order = 0) {
  try {
    const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }

    // 1. Récupérer stock_available pour avoir l'id_stock_available (id_stock requis)
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
      return null
    }
    if (Array.isArray(stockAvailable)) {
      stockAvailable = stockAvailable[0]
    }

    const extractValue = (obj) => typeof obj === 'object' && obj !== null ? (obj['#text'] || '') : obj;
    const id_stock_available = extractValue(stockAvailable.id) || stockAvailable['@_id']
    const dateNow = new Date().toISOString().slice(0, 19).replace('T', ' ')

    // 2. Poster le stock_movement
    const mvtPayload = {
      id_product: productId,
      id_product_attribute: combinationId || 0,
      id_employee: 1,
      id_stock: id_stock_available,
      id_stock_mvt_reason: 1,
      physical_quantity: Math.abs(deltaQuantity),
      sign: deltaQuantity > 0 ? 1 : -1,
      price_te: 0,
      id_order: id_order || 0,
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
      return null
    }

    console.log(`Mouvement de stock enregistré avec succès : id_stock_available=${id_stock_available}, qty=${deltaQuantity}, id_order=${id_order}`)
    return stockAvailable
  } catch (err) {
    console.error("Erreur dans createStockMovement:", err)
    return null
  }
}

export async function updateStockInPrestashop(productId, combinationId = 0, deltaQuantity) {
  try {
    const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }

    // 1. Appeler createStockMovement pour insérer le mouvement ET récupérer le stock_available existant
    const stockAvailable = await createStockMovement(productId, combinationId, deltaQuantity, 0)
    if (!stockAvailable) {
      console.warn(`Impossible de mettre à jour le stock car le mouvement n'a pas pu être inséré pour le produit ${productId}`)
      return false
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

    // 2. Mettre à jour stock_available (PUT)
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

export async function removeProductFromStock(productId, combinationId = 0, deltaQuantity) {
  try {
    console.log("DANS LA FOCNTION DANS LA FONCTION", deltaQuantity)
    const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }

    // // 1. Appeler createStockMovement pour insérer le mouvement ET récupérer le stock_available existant
     const stockAvailable = await getStockAvailable(productId)
     console.log("STOCK STOCK STOCK : ", stockAvailable)
    if (!stockAvailable) {
      console.warn(`Stock available non trouve`)
      return false
    }

    const extractValue = (obj) => typeof obj === 'object' && obj !== null ? (obj['#text'] || '') : obj;
    const id_stock_available = stockAvailable[0].id
    const currentQuantity = parseInt(extractValue(stockAvailable[0].quantity) || 0)
    const id_shop = extractValue(stockAvailable[0].id_shop) || 1
    const id_shop_group = extractValue(stockAvailable[0].id_shop_group) || 0
    const out_of_stock = extractValue(stockAvailable[0].out_of_stock) || 2
    const depends_on_stock = extractValue(stockAvailable[0].depends_on_stock) || 0
    const location = extractValue(stockAvailable[0].location) || ''

    let newQuantity = currentQuantity - parseInt(deltaQuantity)
    if (newQuantity < 0) {
      newQuantity = 0
    }
    console.log("AAAAAAAAAAAAAAAAAA", currentQuantity, deltaQuantity)
    // 2. Mettre à jour stock_available (PUT)
    const availPayload = {
      // id: id_stock_available,
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
    console.log("AVAIL JSON: ", availPayload)


    const availXml = jsonToXml(availPayload, 'stock_available')
    console.log("AVAIL XML: ", availXml)


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


export async function getStockAvailables(productId) {
  try {
    const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }
    
    // 1. Récupérer tous les stock_availables pour ce produit
    const urlStock = `${API_URL}/stock_availables?filter[id_product]=${productId}&display=full`
    const resStock = await fetch(urlStock, { headers: authHeader })
    if (!resStock.ok) return []
    
    const xmlStock = await resStock.text()
    const jsonStock = await xmlToJson(xmlStock)
    const stockNodes = jsonStock?.prestashop?.stock_availables?.stock_available || []
    console.log("stock_availables raw", jsonStock)
    const stockArray = Array.isArray(stockNodes) ? stockNodes : [stockNodes]
    console.log("stockArray raw", stockArray)
    
    const extractValue = (obj) => typeof obj === 'object' && obj !== null ? (obj['#text'] || '') : obj;
    
    return stockArray
      .map(s => ({
        id: Number(extractValue(s.id) || s['@_id'] || 0),
        id_product: Number(extractValue(s.id_product) || 0),
        id_product_attribute: Number(extractValue(s.id_product_attribute) || 0),
        quantity: Number(extractValue(s.quantity) || 0)
      }))
      .filter(s => s.id > 0)
  } catch (err) {
    console.error("Erreur lors de la recuperation des stocks availables:", err)
    return []
  }
}

export async function getStockAvailable(productId) {
  try {
    const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }
    
    // 1. Récupérer tous les stock_availables pour ce produit
    const urlStock = `${API_URL}/stock_availables?filter[id_product]=${productId}&filter[id_product_attribute]=0&display=full`
    const resStock = await fetch(urlStock, { headers: authHeader })
    if (!resStock.ok) return []
    
    const xmlStock = await resStock.text()
    const jsonStock = await xmlToJson(xmlStock)
    const stockNodes = jsonStock?.prestashop?.stock_availables?.stock_available || []
    console.log("stock_availables raw", jsonStock)
    const stockArray = Array.isArray(stockNodes) ? stockNodes : [stockNodes]
    console.log("stockArray raw", stockArray)
        
    return stockArray
  } catch (err) {
    console.error("Erreur lors de la recuperation des stocks availables:", err)
    return []
  }
}

export async function getStockMovements(productId) {
  try {
    const stockAvailables = await getStockAvailables(productId)
    console.log("stockAvailables resolved", stockAvailables)
    if (!Array.isArray(stockAvailables) || stockAvailables.length === 0) return []

    const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }
    const stockMovements = []

    for (const stockAvailable of stockAvailables) {
      const urlStock = `${API_URL}/stock_movements?filter[id_stock]=${stockAvailable.id}&display=full`
      const resStock = await fetch(urlStock, { headers: authHeader })
      if (!resStock.ok) continue
      
      const xmlStock = await resStock.text()
      const jsonStock = await xmlToJson(xmlStock)
      const stockNodes = jsonStock?.prestashop?.stock_mvts?.stock_mvt || jsonStock?.prestashop?.stock_movements?.stock_mvt || []
      const stockArray = Array.isArray(stockNodes) ? stockNodes : [stockNodes]
      
      const extractValue = (obj) => typeof obj === 'object' && obj !== null ? (obj['#text'] || '') : obj;

      const formattedMvts = stockArray
        .filter(m => m && extractValue(m.id))
        .map(m => ({
          id: Number(extractValue(m.id)),
          id_stock: Number(extractValue(m.id_stock) || 0),
          id_product_attribute: Number(extractValue(m.id_product_attribute) || 0),
          quantity: Number(extractValue(m.physical_quantity) || 0),
          sign: Number(extractValue(m.sign) || 1),
          date_add: extractValue(m.date_add) || '',
          id_order: Number(extractValue(m.id_order) || 0),
          id_stock_mvt_reason: Number(extractValue(m.id_stock_mvt_reason) || 0)
        }))
      stockMovements.push(...formattedMvts)
    }
    
    // Trier tous les mouvements par date_add décroissante (plus récents en premier)
    console.log("stockMovements", stockMovements)
    return stockMovements.sort((a, b) => new Date(b.date_add) - new Date(a.date_add))
  } catch (err) {
    console.error("Erreur dans getStockMovements:", err)
    return []
  }
}

export default {
  computeMatchingCombination,
  buildStockMovementPayload,
  buildStockAvailablePayload,
  generateStockMovementXml,
  generateStockAvailableXml,
  updateStockInPrestashop,
  getStockMovements,
  createStockMovement
}
