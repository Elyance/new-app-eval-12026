import { xmlToJson } from '../utils/xmlParser'
import { API_URL } from '../constants/constant'
import { getStockAvailability } from './stockService'

export async function getCombinations(productId) {
  try {
    const url = `${API_URL}/combinations?filter[id_product]=${productId}&display=full`

    const response = await fetch(url)
    const xmlData = await response.text()

    const jsonData = await xmlToJson(xmlData)

    const combos = jsonData?.prestashop?.combinations?.combination || []
    const comboArray = Array.isArray(combos) ? combos : [combos]

    const combinations = []
    for (const combo of comboArray) {
      const optionValues = combo.associations?.product_option_values?.product_option_value
      const optionValueArray = optionValues
        ? (Array.isArray(optionValues) ? optionValues : [optionValues])
        : []

      const optionValueIds = optionValueArray
        .map((optionValue) => Number(optionValue?.id?.['#text'] || optionValue?.id || null))
        .filter(Number.isFinite)

      const hasStock = await getStockAvailability(productId, combo.id)

      let image = null
      if (combo.associations?.images?.image) {
        const imageList = Array.isArray(combo.associations.images.image)
          ? combo.associations.images.image
          : [combo.associations.images.image]

        if (imageList.length > 0) {
          const imageId = imageList[0].id || imageList[0]['#text']
          image = `${API_URL}/images/products/${productId}/${imageId}`
        }
      }

      combinations.push({
        id: combo.id,
        reference: combo.reference || '',
        price: parseFloat(combo.price) || 0,
        weight: combo.weight || 0,
        optionValueIds,
        image,
        inStock: hasStock
      })
    }
    return combinations
  } catch (error) {
    console.error('Erreur lors de la récupération des combinations:', error)
    return []
  }
}