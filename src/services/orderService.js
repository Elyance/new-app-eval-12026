import { xmlToJson, jsonToXml } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'

/**
 * Crée un client invité (guest) dans PrestaShop
 * @param {Object} guestData - { firstname, lastname, email }
 * @returns {Object|null} Le client créé avec son ID
 */
export async function createGuestCustomer(guestData) {
  try {
    const customerData = {
      firstname: guestData.firstname,
      lastname: guestData.lastname,
      email: guestData.email,
      passwd: 'guest' + Date.now(),
      is_guest: 1,
      active: 1,
      id_default_group: 1,
      id_lang: 1,
      associations: {
        groups: {
          group: {
            id: 1
          }
        }
      }
    }

    const customerXML = jsonToXml(customerData, 'customer')
    console.log('XML envoyé pour création du client guest:', customerXML)

    const response = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      },
      body: customerXML
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Réponse erreur PrestaShop (customer):', errorText)
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
      secure_key: customer.secure_key || ''
    }
  } catch (error) {
    console.error('Erreur lors de la création du client guest:', error)
    return null
  }
}

/**
 * Crée une adresse dans PrestaShop
 * @param {Object} addressData - { id_customer, firstname, lastname, address1, postcode, city, id_country }
 * @returns {Object|null} L'adresse créée avec son ID
 */
export async function createAddress(addressData) {
  try {
    const address = {
      id_customer: addressData.id_customer,
      firstname: addressData.firstname,
      lastname: addressData.lastname,
      address1: addressData.address1,
      postcode: addressData.postcode,
      city: addressData.city,
      id_country: addressData.id_country,
      alias: addressData.alias || 'Mon adresse'
    }

    const addressXML = jsonToXml(address, 'address')
    console.log('XML envoyé pour création de l\'adresse:', addressXML)

    const response = await fetch(`${API_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      },
      body: addressXML
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Réponse erreur PrestaShop (address):', errorText)
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const addr = jsonData?.prestashop?.address
    if (!addr) return null

    return {
      id: Number(addr.id || 0),
      id_customer: Number(addr.id_customer || 0),
      firstname: addr.firstname || '',
      lastname: addr.lastname || '',
      address1: addr.address1 || '',
      postcode: addr.postcode || '',
      city: addr.city || '',
      id_country: Number(addr.id_country || 0)
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'adresse:', error)
    return null
  }
}

/**
 * Crée une commande dans PrestaShop
 * @param {Object} orderData - Données de la commande
 * @returns {Object|null} La commande créée avec son ID
 */
export async function createOrder(orderData) {
  try {
    const order = {
      id_address_delivery: orderData.id_address_delivery,
      id_address_invoice: orderData.id_address_invoice,
      id_cart: orderData.id_cart,
      id_currency: orderData.id_currency || 1,
      id_lang: orderData.id_lang || 1,
      id_customer: orderData.id_customer,
      id_carrier: orderData.id_carrier || 1,
      current_state: 1,
      module: orderData.module || 'ps_cashondelivery',
      payment: orderData.payment || 'Paiement à la livraison',
      total_paid: orderData.total_paid || 0,
      total_paid_tax_incl: orderData.total_paid_tax_incl || orderData.total_paid || 0,
      total_paid_tax_excl: orderData.total_paid_tax_excl || 0,
      total_paid_real: 0,
      total_products: orderData.total_products || 0,
      total_products_wt: orderData.total_products_wt || 0,
      total_shipping: orderData.total_shipping || 0,
      total_shipping_tax_incl: orderData.total_shipping || 0,
      total_shipping_tax_excl: orderData.total_shipping || 0,
      conversion_rate: 1,
      secure_key: orderData.secure_key || '',
      associations: {
        order_rows: {
          order_row: orderData.order_rows || []
        }
      }
    }

    const orderXML = jsonToXml(order, 'order')
    console.log('XML envoyé pour création de la commande:', orderXML)

    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      },
      body: orderXML
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Réponse erreur PrestaShop (order):', errorText)
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const createdOrder = jsonData?.prestashop?.order
    if (!createdOrder) return null

    return {
      id: Number(createdOrder.id || 0),
      reference: createdOrder.reference || '',
      id_cart: Number(createdOrder.id_cart || 0),
      id_customer: Number(createdOrder.id_customer || 0),
      total_paid: Number(createdOrder.total_paid || 0)
    }
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error)
    return null
  }
}
