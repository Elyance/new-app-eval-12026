import { xmlToJson, jsonToXml } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'

export async function getCarts() {
  try {
    const response = await fetch(`${API_URL}/carts?display=full`, {
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

    const carts = jsonData?.prestashop?.carts?.cart || []
    const cartArray = Array.isArray(carts) ? carts : [carts]

    return cartArray.map((cart) => {
      const cartRows = cart?.associations?.cart_rows
      const rowSource = cartRows?.cart_row || cartRows || []
      const rows = Array.isArray(rowSource) ? rowSource : [rowSource]

      return {
        id: Number(cart.id || 0),
        id_customer: Number(typeof cart.id_customer === 'object' ? cart.id_customer?.['#text'] : cart.id_customer) || 0,
        id_currency: Number(cart.id_currency["#text"] || 0),
        date_add: typeof cart.date_add === 'object' ? cart.date_add?.['#text'] : cart.date_add,
        rows: rows
          .filter((row) => row && (row.id_product || row.id_product === 0))
          .map((row) => ({
            id_product: Number(row.id_product["#text"] || 0),
            id_product_attribute: Number(row.id_product_attribute["#text"] || 0),
            quantity: Number(row.quantity || 0)
          }))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des paniers:', error)
    // Retourner un tableau vide en cas d'erreur
    return []
  }
}

export async function getCart(cartId) {
  try {
    const response = await fetch(`${API_URL}/carts/${cartId}?display=full`, {
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

    const cart = jsonData?.prestashop?.cart
    if (!cart) return null

    const cartRows = cart?.associations?.cart_rows
    const rowSource = cartRows?.cart_row || cartRows || []
    const rows = Array.isArray(rowSource) ? rowSource : [rowSource]

    console.log(`Panier ${cartId} récupéré:`, {
      id: cart.id,
      id_customer: cart.id_customer,
      id_currency: cart.id_currency["#text"],
      rows: rows
        .filter((row) => row && (row.id_product || row.id_product === 0))
        .map((row) => ({
          id_product: row.id_product["#text"] || 0,
          id_product_attribute: row.id_product_attribute["#text"] || 0,
          quantity: row.quantity || 0
        }))
    })

    return {
      id: Number(cart.id),
      id_customer: Number(typeof cart.id_customer === 'object' ? cart.id_customer?.['#text'] : cart.id_customer) || 0,
      id_currency: Number(cart.id_currency["#text"] || 0),
      id_lang: Number(cart.id_lang["#text"] || 0),
      date_add: typeof cart.date_add === 'object' ? cart.date_add?.['#text'] : cart.date_add,
      rows: rows
        .filter((row) => row && (row.id_product || row.id_product === 0))
        .map((row) => ({
          id_product: Number(row.id_product["#text"] || 0),
          id_product_attribute: Number(row.id_product_attribute["#text"] || 0),
          quantity: Number(row.quantity || 0)
        }))
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération du panier ${cartId}:`, error)
    return null
  }
}

/**
 * Crée un nouveau panier dans PrestaShop avec un premier produit
 * @param {Object} productData - { id_product, id_product_attribute, quantity }
 * @returns {Object|null} Le panier créé avec son ID
 */
export async function createCart(productData, customerId = 0) {
  try {
    // jsonToXml wraps data inside { prestashop: { [moduleName]: data } }
    // so we only pass the cart content here
    const cartData = {
      id_currency: 1,
      id_customer: customerId,
      id_lang: 1,
      associations: {
        cart_rows: {
          cart_row: {
            id_product: productData.id_product,
            id_product_attribute: productData.id_product_attribute || 0,
            quantity: productData.quantity || 1
          }
        }
      }
    }

    const cartXML = jsonToXml(cartData, 'cart')
    console.log('XML envoyé pour création du panier:', cartXML)

    const response = await fetch(`${API_URL}/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      },
      body: cartXML
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Réponse erreur PrestaShop:', errorText)
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const cart = jsonData?.prestashop?.cart
    if (!cart) return null

    // Stocker l'id du panier dans sessionStorage
    const cartId = Number(cart.id || 0)
    addIdCartInSessionStorage(cartId)

    return {
      id: cartId,
      id_customer: Number(cart.id_customer || 0),
      id_currency: Number(cart.id_currency["#text"] || 0),
      id_lang: Number(cart.id_lang["#text"] || 0)
    }
  } catch (error) {
    console.error('Erreur lors de la création du panier:', error)
    return null
  }
}

/**
 * Ajoute un produit dans un panier existant (POST)
 * Récupère d'abord le panier, ajoute le produit aux lignes existantes, puis envoie
 * une requête POST vers `api/carts/[id_cart]` contenant l'objet `prestashop/cart`.
 * @param {number} cartId - ID du panier existant
 * @param {Object} productData - { id_product, id_product_attribute, quantity }
 * @returns {Object|null} Le panier mis à jour
 */
export async function addProductToCart(cartId, productData) {
  try {
    // 1. Récupérer le panier actuel pour vérifier si le produit existe
    const currentCart = await getCart(cartId)
    if (!currentCart) {
      throw new Error(`Panier ${cartId} introuvable`)
    }

    const existingRow = currentCart.rows.find(
      (row) =>
        row.id_product === Number(productData.id_product) &&
        row.id_product_attribute === Number(productData.id_product_attribute || 0)
    )

    if (existingRow) {
      // Produit existant -> PATCH pour modifier la quantité via query params
      const newQuantity = existingRow.quantity + Number(productData.quantity || 1)
      // Use the helper that builds and sends a PATCH with a valid XML body
      const updated = await updateCartItemQuantity(
        cartId,
        productData.id_product,
        productData.id_product_attribute || 0,
        newQuantity
      )

      if (!updated) return null
      return {
        id: Number(updated.id || cartId),
        id_customer: Number(updated.id_customer || 0),
        id_currency: Number(updated.id_currency || 0),
        id_lang: Number(updated.id_lang || 0)
      }
    }

    // Sinon -> on insère le nouveau produit dans la liste des cart_rows
    // PUT = remplacement complet, il faut renvoyer TOUTES les lignes existantes + la nouvelle
    const allRows = [
      ...currentCart.rows.map((row) => ({
        id_product: row.id_product,
        id_product_attribute: row.id_product_attribute,
        quantity: row.quantity
      })),
      {
        id_product: productData.id_product,
        id_product_attribute: productData.id_product_attribute || 0,
        quantity: productData.quantity || 1
      }
    ]

    const cartData = {
      id: cartId,
      id_currency: currentCart.id_currency,
      id_lang: currentCart.id_lang,
      associations: {
        cart_rows: {
          cart_row: allRows
        }
      }
    }

    const cartXML = jsonToXml(cartData, 'cart')
    console.log('XML envoyé pour ajout du produit au panier:', cartXML)

    const postResponse = await fetch(`${API_URL}/carts/${cartId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      },
      body: cartXML
    })

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      console.error('Réponse erreur PrestaShop (PUT):', errorText)
      throw new Error(`Erreur API PrestaShop: ${postResponse.status}`)
    }

    const xmlData = await postResponse.text()
    const jsonData = await xmlToJson(xmlData)

    const cart = jsonData?.prestashop?.cart
    if (!cart) return null

    return {
      id: Number(cart.id || 0),
      id_customer: Number(cart.id_customer || 0),
      id_currency: Number(cart.id_currency || 0),
      id_lang: Number(cart.id_lang || 0)
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout au panier:", error)
    return null
  }
}

/**
 * Met à jour la quantité d'un produit dans le panier (PUT avec toutes les lignes)
 * @param {number} cartId - ID du panier
 * @param {number} idProduct - ID du produit à modifier
 * @param {number} idProductAttribute - ID de l'attribut produit
 * @param {number} newQuantity - Nouvelle quantité
 * @returns {Object|null} Le panier mis à jour
 */
export async function updateCartItemQuantity(cartId, idProduct, idProductAttribute, newQuantity) {
  try {
    console.log(`Mise à jour de la quantité du produit ${idProduct} (attribut ${idProductAttribute}) à ${newQuantity} dans le panier ${cartId}`)

    // 1. Récupérer le panier actuel
    const currentCart = await getCart(cartId)
    if (!currentCart) {
      throw new Error(`Panier ${cartId} introuvable`)
    }


    let response = null
    if (newQuantity <= 0) {
      console.log(`Quantité ${newQuantity} <= 0, suppression du produit ${idProduct} (attribut ${idProductAttribute}) du panier ${cartId}`)
      return;
    }
    if (newQuantity > 0) {
      // data json pour le PATCH: modifier la quantité du produit ciblé
      const data = {
        id: cartId,
        associations: {
          cart_rows: {
            cart_row: [
              {
                id_product: idProduct,
                id_product_attribute: idProductAttribute,
                quantity: newQuantity
              }
            ]
          }
        }
      }

      const cartXML = jsonToXml(data, 'cart')

      // Log du XML envoyé pour débogage (trace le corps de la requête PATCH)
      console.log('XML envoyé pour mise à jour de la quantité (PATCH):', cartXML)

      response = await fetch(`${API_URL}/carts/${cartId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'text/xml',
          'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
        },
        body: cartXML
      })

    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Réponse erreur PrestaShop:', errorText)
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)
    return jsonData?.prestashop?.cart || null
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la quantité:', error)
    return null
  }
}

/**
 * Supprime un produit du panier (PUT sans la ligne du produit)
 * @param {number} cartId - ID du panier
 * @param {number} idProduct - ID du produit à supprimer
 * @param {number} idProductAttribute - ID de l'attribut produit
 * @returns {Object|null} Le panier mis à jour
 */
export async function removeProductFromCart(cartId, idProduct, idProductAttribute) {
  try {
    // 1. Récupérer le panier actuel
    const currentCart = await getCart(cartId)
    if (!currentCart) {
      throw new Error(`Panier ${cartId} introuvable`)
    }

    console.log(`Suppression du produit ${idProduct} (attribut ${idProductAttribute}) du panier ${cartId}`)
    // les produits dans le panier sont dans currentCart.rows
    console.log('Lignes actuelles du panier avant suppression:', currentCart.rows)

    // 2. Filtrer pour retirer le produit
    const updatedRows = currentCart.rows.filter(
      (row) => !(row.id_product === Number(idProduct) && row.id_product_attribute === Number(idProductAttribute))
    )

    console.log('Lignes du panier après suppression du produit:', updatedRows)

    // 3. Construire les cart_rows pour le XML
    const cartRowsXml = updatedRows.map((row) => ({
      id_product: row.id_product,
      id_product_attribute: row.id_product_attribute,
      quantity: row.quantity
    }))

    // 4. Construire le XML complet (PUT = objet entier avec TOUTES les lignes restantes)
    const cartData = {
      id: cartId,
      id_currency: currentCart.id_currency,
      id_lang: currentCart.id_lang,
      associations: {
        cart_rows: {
          cart_row: cartRowsXml.length === 1 ? cartRowsXml[0] : cartRowsXml
        }
      }
    }

    const cartXML = jsonToXml(cartData, 'cart')
    console.log('XML envoyé pour suppression du produit du panier:', cartXML)

    const response = await fetch(`${API_URL}/carts/${cartId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      },
      body: cartXML
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Réponse erreur PrestaShop:', errorText)
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)
    return jsonData?.prestashop?.cart || null
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error)
    return null
  }
}

export function getIdCartInSessionStorage() {
  const idCart = sessionStorage.getItem('id_cart')
  return idCart ? Number(idCart) : null
}

export function addIdCartInSessionStorage(idCart) {
  sessionStorage.setItem('id_cart', String(idCart))
}

/**
 * Met à jour le id_customer d'un panier existant (PATCH)
 * Nécessaire avant de créer une commande pour lier le cart au guest customer
 * @param {number} cartId - ID du panier
 * @param {number} idCustomer - ID du client guest
 * @returns {Object|null} Le panier mis à jour
 */
export async function updateCartCustomer(cartId, idCustomer) {
  try {
    const cartData = {
      id: cartId,
      id_customer: idCustomer
    }

    const cartXML = jsonToXml(cartData, 'cart')
    console.log('XML envoyé pour mise à jour du customer dans le panier:', cartXML)

    const response = await fetch(`${API_URL}/carts/${cartId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
      },
      body: cartXML
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Réponse erreur PrestaShop (updateCartCustomer):', errorText)
      throw new Error(`Erreur API PrestaShop: ${response.status}`)
    }

    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)
    return jsonData?.prestashop?.cart || null
  } catch (error) {
    console.error('Erreur lors de la mise à jour du customer du panier:', error)
    return null
  }
}
