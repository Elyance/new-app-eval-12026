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


    let qtt = 0
    if (stockArray.length > 0) {
      console.log(`Stock trouvé pour productId ${productId} et combinationId ${combinationId}:`, stockArray)
      qtt = parseInt(stockArray[0].quantity?.['#text'] || stockArray[0].quantity || 0)
      console.log(`Quantité disponible pour productId ${productId} et combinationId ${combinationId}:`, qtt)
      return qtt
    }
    return 0
    
  } catch (error) {
    console.error('Erreur lors de la récupération du stock:', error)
    return 0
  }
}