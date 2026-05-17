import { xmlToJson } from '@/utils/xmlParser'
import { getXmlValue, getXmlString } from '@/utils/parsing'
import { API_URL, API_KEY } from '@/constants/constant'
import { getCarts, getCart } from './cartService'
import { getOrderStateById } from './orderService'
import { getCustomerById } from './customerService'
import { findCarrierById } from './carrierService'
import { getProductDetail } from './productService'

function toUiState(orderStateId) {
  const normalizedStateId = Number(orderStateId || 0)
  if (normalizedStateId === 6) return 3
  if (normalizedStateId === 1) return 1
  if (normalizedStateId === 2) return 2
  return normalizedStateId || 1
}

/**
 * Calcule le total TTC d'un panier à partir des prix des produits et de leurs déclinaisons.
 * @param {Object} cart
 * @returns {number} total TTC
 */
export async function calculateCartTotal(cart) {
  if (!cart || !Array.isArray(cart.rows) || cart.rows.length === 0) return 0
  
  let total = 0
  for (const row of cart.rows) {
    try {
      const product = await getProductDetail(row.id_product)
      if (product) {
        let price = Number(product.price || 0) // prix TTC de base du produit
        
        // Si c'est une déclinaison, on applique l'impact de prix
        if (row.id_product_attribute > 0) {
          const comb = (product.combinations || []).find(
            c => Number(c.id) === Number(row.id_product_attribute)
          )
          if (comb) {
            // L'impact de prix dans la combinaison est hors taxe, on lui applique la taxe du produit
            const priceHtImpact = Number(comb.price || 0)
            const priceTtcImpact = priceHtImpact * (1 + (product.taxRate || 0) / 100)
            price += priceTtcImpact
          }
        }
        
        total += price * Number(row.quantity || 0)
      }
    } catch (err) {
      console.error(`Erreur calcul prix article panier pour produit ${row.id_product}:`, err)
    }
  }
  return Number(total.toFixed(2))
}

/**
 * Récupère la commande liée à un panier (première commande trouvée pour ce panier)
 * @param {number} id_cart
 * @returns {Object|null} order object or null
 */
export async function getOrderByIdCart(id_cart) {
  try {
    const response = await fetch(`${API_URL}/orders?filter[id_cart]=[${id_cart}]&display=full`, {
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

    let orders = jsonData?.prestashop?.orders?.order || []
    if (!orders) return null
    orders = Array.isArray(orders) ? orders : [orders]

    const order = orders[0]
    if (!order) return null

    // Map order to a simpler JS object similar to example structure
    const orderRowsSource = order?.associations?.order_rows?.order_row || []
    const orderRows = Array.isArray(orderRowsSource) ? orderRowsSource : [orderRowsSource]

    return {
      id: getXmlValue(order.id),
      id_address_delivery: getXmlValue(order.id_address_delivery),
      id_address_invoice: getXmlValue(order.id_address_invoice),
      id_cart: getXmlValue(order.id_cart),
      id_currency: getXmlValue(order.id_currency),
      id_lang: getXmlValue(order.id_lang),
      id_customer: getXmlValue(order.id_customer),
      id_carrier: getXmlValue(order.id_carrier),
      current_state: getXmlValue(order.current_state),
      module: getXmlString(order.module),
      reference: getXmlString(order.reference),
      payment: getXmlString(order.payment),
      total_paid: getXmlValue(order.total_paid),
      date_add: getXmlString(order.date_add),
      associations: {
        order_rows: orderRows.map((r) => ({
          id: getXmlValue(r.id),
          product_id: getXmlValue(r.product_id || r.id_product),
          product_attribute_id: getXmlValue(r.product_attribute_id || r.id_product_attribute),
          product_quantity: getXmlValue(r.product_quantity || r.product_quantity),
          product_name: getXmlString(r.product_name),
          product_reference: getXmlString(r.product_reference),
          product_price: getXmlValue(r.product_price || r.unit_price_tax_incl)
        }))
      }
    }
  } catch (error) {
    console.error('Erreur getOrderByIdCart:', error)
    return null
  }
}

export async function hasOrder(id_cart) {
  const order = await getOrderByIdCart(id_cart)
  return !!order
}

/**
 * Récupère le détail complet d'une commande par id_cart.
 * @param {number} id_cart
 * @returns {Object|null}
 */
export async function getCommandeDetail(id_cart) {
  try {
    const cartId = Number(id_cart)
    if (!Number.isFinite(cartId) || cartId === 0) return null

    const cart = await getCart(cartId)
    const order = await getOrderByIdCart(cartId)

    const rawCustomerId = Number.isFinite(Number(cart?.id_customer))
      ? Number(cart.id_customer)
      : Number(order?.id_customer || 0)

    const customer = rawCustomerId !== 0 && Number.isFinite(rawCustomerId)
      ? await getCustomerById(rawCustomerId)
      : null

    const carrier = Number.isFinite(Number(order?.id_carrier)) && Number(order?.id_carrier) !== 0
      ? await findCarrierById(Number(order.id_carrier))
      : null

    const orderState = order?.current_state
      ? await getOrderStateById(order.current_state)
      : null

    const detail = {
      cartId,
      cart,
      order,
      customer,
      carrier,
      orderState,
      currentState: toUiState(order?.current_state),
      customerName: customer ? `${customer.firstname || ''} ${customer.lastname || ''}`.trim() : '',
      carrierName: carrier?.name || '',
      stateName: orderState?.name || (order ? 'Etat inconnu' : 'Dans le panier')
    }

    console.log('[commandePanierService] getCommandeDetail return:', detail)
    return detail
  } catch (error) {
    console.error('Erreur getCommandeDetail:', error)
    return null
  }
}

/**
 * Retourne la liste finale prête pour le front: pour chaque panier on ajoute
 * les informations de commande si elle existe, sinon état = 'Dans le panier'
 */
export async function getFinalList() {
  const result = []
  const carts = await getCarts()

  for (const cart of carts) {
    console.log('Traitement du panier ID:', cart.id)
    const foundOrder = await getOrderByIdCart(cart.id)
    const rawCustomerId = Number.isFinite(Number(cart.id_customer))
      ? Number(cart.id_customer)
      : Number(foundOrder?.id_customer || 0)

    // console.log('Id customer résolu du panier:', rawCustomerId)

    const customer = rawCustomerId !== 0 && Number.isFinite(rawCustomerId)
      ? await getCustomerById(rawCustomerId)
      : null
    const customerName = customer ? `${customer.firstname || ''} ${customer.lastname || ''}`.trim() : ''
    const carrier = Number.isFinite(Number(foundOrder?.id_carrier)) && Number(foundOrder?.id_carrier) !== 0
      ? await findCarrierById(Number(foundOrder.id_carrier))
      : null
    const carrierName = carrier?.name || foundOrder?.id_carrier || ''

    if (foundOrder) {
      const stateName = (await getOrderStateById(foundOrder.current_state))?.name || 'Etat inconnu'
      result.push({
        id: foundOrder.id,
        cartId: cart.id,
        reference: foundOrder.reference || '',
        isNewCustomer: rawCustomerId === 0,
        shipping: carrierName,
        customer: customerName,
        total: Number(foundOrder.total_paid || 0),
        payment: foundOrder.payment || '',
        currentState: toUiState(foundOrder.current_state),
        status: stateName,
        date: foundOrder.date_add || ''
      })
    } else {
      const cartTotal = await calculateCartTotal(cart)
      result.push({
        id: null,
        cartId: cart.id,
        reference: '',
        isNewCustomer: rawCustomerId === 0,
        shipping: carrierName,
        customer: customerName,
        total: cartTotal,
        payment: '',
        currentState: 1,
        status: 'Dans le panier',
        date: cart.date_add || ''
      })
    }
  }

  return result
}

export default {
  getOrderByIdCart,
  hasOrder,
  getCommandeDetail,
  getFinalList,
  calculateCartTotal
}
