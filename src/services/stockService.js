import { xmlToJson } from '../utils/xmlParser'
import { API_URL } from '../constants/constant'

export async function getStockAvailability(productId, combinationId = null) {
  try {
    let url = `${API_URL}/stock_availables?filter[id_product]=${productId}`
    if (combinationId) {
      url += `&filter[id_product_attribute]=${combinationId}`
    }
    url += '&display=full'

    const response = await fetch(url)
    const xmlData = await response.text()

    const jsonData = await xmlToJson(xmlData)

    const stocks = jsonData?.prestashop?.stock_availables?.stock_available || []

    const stockArray = Array.isArray(stocks) ? stocks : [stocks]

    const hasStock = stockArray.some(stock => {
      const quantity = parseInt(stock.quantity?.['#text'] || stock.quantity || 0)
      return quantity > 0
    })
    return hasStock
  } catch (error) {
    console.error('Erreur lors de la récupération du stock:', error)
    return true
  }
}