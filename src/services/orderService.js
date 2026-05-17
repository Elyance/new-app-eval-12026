import { xmlToJson, jsonToXml } from '../utils/xmlParser'
import { getXmlValue, getXmlString } from '../utils/parsing'
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
      current_state: 2,
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

    console.log('Commande créée avec succès:', createdOrder)

    const createdOrderId = getXmlValue(createdOrder.id)

    // Ajouter la ligne d'historique de statut pour la commande
    if (createdOrderId) {
      await addOrderHistory(createdOrderId, 2)
    }
    
    return {
      id: createdOrderId,
      reference: getXmlString(createdOrder.reference),
      id_cart: getXmlValue(createdOrder.id_cart),
      id_customer: getXmlValue(createdOrder.id_customer),
      total_paid: getXmlValue(createdOrder.total_paid),
      status: (await getOrderStateById(2))?.name || 'Etat inconnu'
    }
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error)
    return null
  }
}

/**
 * Ajoute un historique d'état à une commande
 * @param {number} id_order - ID de la commande
 * @param {number} id_order_state - ID du nouvel état
 */
export async function addOrderHistory(id_order, id_order_state) {
  try {
    const historyData = {
      id_order,
      id_order_state
    }

    const historyXML = jsonToXml(historyData, 'order_history')
    console.log('XML envoyé pour historique de commande:', historyXML)

    const response = await fetch(`${API_URL}/order_histories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      },
      body: historyXML
    })

    if (!response.ok) {
      console.error('Réponse erreur PrestaShop (order_histories):', await response.text())
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'historique de commande:', error)
  }
}

/**
 * Récupère les commandes d'un client donné
 * @param {number|string} customerId
 * @returns {Promise<Array>}
 */
export async function getOrdersByCustomerId(customerId) {
  try {
    const response = await fetch(`${API_URL}/orders?filter[id_customer]=[${customerId}]&display=full`, {
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

    const ordersNode = jsonData?.prestashop?.orders?.order || []
    const orderArray = Array.isArray(ordersNode) ? ordersNode : [ordersNode]

    return orderArray.map((order) => ({
      id: getXmlValue(order.id),
      id_cart: getXmlValue(order.id_cart),
      reference: getXmlString(order.reference),
      current_state: getXmlValue(order.current_state),
      payment: getXmlString(order.payment),
      total_paid: Number(getXmlValue(order.total_paid) || 0),
      date_add: getXmlString(order.date_add),
      productsCount: (() => {
        const orderRowsSource = order?.associations?.order_rows?.order_row || []
        const orderRows = Array.isArray(orderRowsSource) ? orderRowsSource : [orderRowsSource]

        return orderRows.reduce((sum, row) => {
          const quantity = Number(getXmlValue(row.product_quantity || row.quantity) || 0)
          return sum + quantity
        }, 0)
      })(),
      productsSummary: (() => {
        const orderRowsSource = order?.associations?.order_rows?.order_row || []
        const orderRows = Array.isArray(orderRowsSource) ? orderRowsSource : [orderRowsSource]
        const names = orderRows
          .map((row) => getXmlString(row.product_name))
          .filter(Boolean)

        if (!names.length) return ''
        if (names.length <= 2) return names.join(', ')
        return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
      })()
    }))
  } catch (error) {
    console.error('Erreur dans getOrdersByCustomerId:', error)
    return []
  }
}

export async function getOrderStateById(id_order_state) {
  try {
    console.log(`Récupération de l'état de la commande pour id_order_state: ${id_order_state} avec type: ${typeof id_order_state}`)
    const response = await fetch(`${API_URL}/order_states/${id_order_state}?display=full`, {
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

    const orderState = jsonData?.prestashop?.order_state
    if (!orderState) return null

    return {
      id: getXmlValue(orderState.id),
      name: getXmlString(orderState.name?.language)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état de la commande:', error)
    return null
  }
}
