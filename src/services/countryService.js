import { xmlToJson } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'

/**
 * Récupère la liste des pays depuis PrestaShop
 * @returns {Promise<Array>} Liste des pays avec id et nom
 */
export async function getCountries() {
  try {
    const response = await fetch(`${API_URL}/countries?display=full`, {
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

    const countries = jsonData?.prestashop?.countries?.country || []
    const countryArray = Array.isArray(countries) ? countries : [countries]

    return countryArray.map((country) => ({
      id: Number(country.id || 0),
      name: country.name?.language?.['#text'] || country.name?.language || country.name || 'Inconnu',
      active: country.active === '1' || country.active === 1
    })).filter((country) => country.active)
  } catch (error) {
    console.error('Erreur lors de la récupération des pays:', error)
    return []
  }
}
