import { xmlToJson } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'

/**
 * Récupère la liste des transporteurs depuis PrestaShop
 * @returns {Promise<Array>} Liste des transporteurs avec id, nom et délai
 */
export async function getCarriers() {
  try {
    const response = await fetch(`${API_URL}/carriers?display=full`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const carriers = jsonData?.prestashop?.carriers?.carrier || []
    const carrierArray = Array.isArray(carriers) ? carriers : [carriers]

    return carrierArray.map((carrier) => ({
      id: Number(carrier.id || 0),
      name: carrier.name || 'Sans nom',
      delay: carrier.delay?.language?.['#text'] || carrier.delay?.language || '',
      active: carrier.active === '1' || carrier.active === 1
    })).filter((carrier) => carrier.active)
  } catch (error) {
    console.error('Erreur lors de la récupération des transporteurs:', error)
    return []
  }
}

/**
 * Récupère un transporteur par son ID
 * @param {number} carrierId
 * @returns {Promise<Object|null>}
 */
export async function findCarrierById(carrierId) {
  try {
    if (!carrierId || Number(carrierId) === 0) return null

    const response = await fetch(`${API_URL}/carriers/${carrierId}?display=full`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const carrier = jsonData?.prestashop?.carrier
    if (!carrier) return null

    return {
      id: Number(carrier.id || 0),
      name: carrier.name || 'Sans nom',
      delay: carrier.delay?.language?.['#text'] || carrier.delay?.language || '',
      active: carrier.active === '1' || carrier.active === 1
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération du transporteur ${carrierId}:`, error)
    return null
  }
}
