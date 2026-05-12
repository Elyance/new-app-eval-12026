import { xmlToJson } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'

/**
 * Récupère la liste des catégories depuis PrestaShop
 * @returns {Promise<Array>} Liste des catégories avec id et nom
 */
export async function getCategories() {
  try {
    const response = await fetch(`${API_URL}/categories?display=full`, {
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

    const categories = jsonData?.prestashop?.categories?.category || []
    const categoryArray = Array.isArray(categories) ? categories : [categories]

    return categoryArray.map(cat => ({
      id: cat.id,
      nom: cat.name?.language?.['#text'] || cat.name || 'Catégorie'
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error)
    // Retourner un tableau vide en cas d'erreur
    return []
  }
}
