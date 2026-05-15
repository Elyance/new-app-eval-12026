import { xmlToJson } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'

/**
 * Recherche un client par email dans PrestaShop
 * @param {string} email - Email du client
 * @returns {Object|null} Le client trouvé ou null
 */
export async function getCustomerByEmail(email) {
  try {
    const response = await fetch(
      `${API_URL}/customers?filter[email]=${encodeURIComponent(email)}&display=full`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const customers = jsonData?.prestashop?.customers?.customer || []
    const customerArray = Array.isArray(customers) ? customers : [customers]

    if (customerArray.length === 0) return null

    const customer = customerArray[0]
    if (!customer || !customer.id) return null

    return {
      id: Number(customer.id || 0),
      firstname: customer.firstname || '',
      lastname: customer.lastname || '',
      email: customer.email || '',
      secure_key: customer.secure_key || '',
      is_guest: customer.is_guest === '1' || customer.is_guest === 1
    }
  } catch (error) {
    console.error('Erreur lors de la recherche du client:', error)
    return null
  }
}

/**
 * Récupère un client par son ID
 * @param {number} customerId - ID du client
 * @returns {Object|null} Le client trouvé ou null
 */
export async function getCustomerById(customerId) {
  try {
    const response = await fetch(`${API_URL}/customers/${customerId}?display=full`, {
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

    const customer = jsonData?.prestashop?.customer
    if (!customer) return null

    return {
      id: Number(customer.id || 0),
      firstname: customer.firstname || '',
      lastname: customer.lastname || '',
      email: customer.email || '',
      secure_key: customer.secure_key || '',
      is_guest: customer.is_guest === '1' || customer.is_guest === 1
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération du client ${customerId}:`, error)
    return null
  }
}
