import { xmlToJson } from '@/utils/xmlParser'
import { getXmlValue, getXmlString } from '@/utils/parsing'
import { API_URL, API_KEY } from '@/constants/constant'

function normalizeOrders(orderNode) {
  if (!orderNode) return []
  return Array.isArray(orderNode) ? orderNode : [orderNode]
}

function extractDateKey(dateValue) {
  const rawDate = getXmlString(dateValue)
  if (!rawDate) return 'unknown'

  const normalized = rawDate.replace('T', ' ').trim()
  const datePart = normalized.split(' ')[0] || normalized
  return datePart || 'unknown'
}

function createEmptyDayBucket(date) {
  return {
    date,
    nbCommande: 0,
    montant: 0,
    orders: []
  }
}

async function parseOrdersResponse(xmlData) {
  const jsonData = await xmlToJson(xmlData)
  const ordersNode = jsonData?.prestashop?.orders?.order || []

  return normalizeOrders(ordersNode).map((order) => ({
    id: getXmlValue(order.id),
    id_cart: getXmlValue(order.id_cart),
    reference: getXmlString(order.reference),
    current_state: getXmlValue(order.current_state),
    payment: getXmlString(order.payment),
    total_paid: Number(getXmlValue(order.total_paid) || 0),
    date_add: getXmlString(order.date_add),
    date_key: extractDateKey(order.date_add)
  }))
}

/**
 * Charge toutes les commandes depuis /api/orders.
 * @returns {Promise<Array>}
 */
export async function getOrders() {
  try {
    const response = await fetch(`${API_URL}/orders?display=full`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    return await parseOrdersResponse(xmlData)
  } catch (error) {
    console.error('Erreur dans getOrders:', error)
    return []
  }
}

/**
 * Regroupe les commandes par date et calcule les totaux.
 * @returns {Promise<{orders: Array, dailyStats: Array, totalGeneral: {nbCommande: number, montant: number}}>} 
 */
export async function getDataForTB() {
  try {
    const orders = await getOrders()

    const dailyBucketMap = new Map()
    let totalMontant = 0
    let totalCommande = 0

    for (const order of orders) {
      totalCommande += 1
      totalMontant += Number(order.total_paid || 0)

      const bucketKey = order.date_key || 'unknown'
      if (!dailyBucketMap.has(bucketKey)) {
        dailyBucketMap.set(bucketKey, createEmptyDayBucket(bucketKey))
      }

      const bucket = dailyBucketMap.get(bucketKey)
      bucket.nbCommande += 1
      bucket.montant += Number(order.total_paid || 0)
      bucket.orders.push(order)
    }

    const dailyStats = Array.from(dailyBucketMap.values())
      .sort((left, right) => String(left.date).localeCompare(String(right.date)))

    return {
      orders,
      dailyStats,
      totalGeneral: {
        nbCommande: totalCommande,
        montant: totalMontant
      }
    }
  } catch (error) {
    console.error('Erreur dans getDataForTB:', error)
    return {
      orders: [],
      dailyStats: [],
      totalGeneral: {
        nbCommande: 0,
        montant: 0
      }
    }
  }
}

export default {
  getOrders,
  getDataForTB
}
