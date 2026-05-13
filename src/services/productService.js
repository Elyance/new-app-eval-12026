import { xmlToJson } from '../utils/xmlParser'
import { API_URL } from '../constants/constant'
import { getCategories } from './CategorieService'

function extractLocalizedText(field) {
  if (!field) return ''
  if (typeof field === 'string' || typeof field === 'number') return String(field)

  if (Array.isArray(field)) {
    for (const item of field) {
      const value = extractLocalizedText(item)
      if (value) return value
    }
    return ''
  }

  if (field['#text']) return String(field['#text'])
  if (field.language) return extractLocalizedText(field.language)

  return ''
}

export function extractProductOptionValueIds(product) {
  const optionValues = product?.associations?.product_option_values?.product_option_value
  if (!optionValues) return []

  const optionValueArray = Array.isArray(optionValues) ? optionValues : [optionValues]

  return optionValueArray
    .map((optionValue) => String(optionValue?.id?.['#text'] || optionValue?.id || '').trim())
    .filter(Boolean)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id))
}

async function getProductOptionValuesDetails(optionValueIds) {
  if (!optionValueIds.length) return []

  const filterValue = `[${optionValueIds.join('|')}]`
  const url = `${API_URL}/product_option_values?filter[id]=${filterValue}&display=full`

  try {
    console.log('Product option values URL:', url)

    const response = await fetch(url)
    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const optionValues = jsonData?.prestashop?.product_option_values?.product_option_value || []
    const optionValueArray = Array.isArray(optionValues) ? optionValues : [optionValues]

    return optionValueArray
      .filter(Boolean)
      .map((optionValue) => ({
        id: String(optionValue.id?.['#text'] || optionValue.id || ''),
        id_attribute_group: String(optionValue.id_attribute_group?.['#text'] || optionValue.id_attribute_group || ''),
        name: extractLocalizedText(optionValue.name),
        color: String(optionValue.color?.['#text'] || optionValue.color || '')
      }))
      .filter((optionValue) => optionValue.id)
  } catch (error) {
    console.error('Erreur lors de la récupération des product_option_values:', error)
    return []
  }
}

async function getProductOptionGroupsDetails(optionValues) {
  const uniqueGroupIds = [...new Set(
    optionValues
      .map((optionValue) => Number(optionValue?.id_attribute_group))
      .filter(Number.isFinite)
  )]

  if (!uniqueGroupIds.length) return []

  try {
    const groups = await Promise.all(uniqueGroupIds.map(async (groupId) => {
      const url = `${API_URL}/product_options/${groupId}?display=full`
      console.log('Product option group URL:', url)

      const response = await fetch(url)
      const xmlData = await response.text()
      const jsonData = await xmlToJson(xmlData)

      const group = jsonData?.prestashop?.product_option
      if (!group) return null

      return {
        id: Number(group.id?.['#text'] || group.id || groupId),
        name: extractLocalizedText(group.name),
        group_type: String(group.group_type?.['#text'] || group.group_type || '').toLowerCase()
      }
    }))

    return groups.filter(Boolean)
  } catch (error) {
    console.error('Erreur lors de la récupération des product_options:', error)
    return []
  }
}

async function getProductOptionsStructure(product) {
  const optionValueIds = extractProductOptionValueIds(product)
  if (!optionValueIds.length) return []

  const optionValues = await getProductOptionValuesDetails(optionValueIds)
  if (!optionValues.length) return []

  const optionGroups = await getProductOptionGroupsDetails(optionValues)
  if (!optionGroups.length) return []

  const groupsById = new Map(
    optionGroups.map((group) => [String(group.id), { ...group, valeurs: [] }])
  )

  optionValues.forEach((optionValue) => {
    const groupId = String(Number(optionValue.id_attribute_group))
    const group = groupsById.get(groupId)
    if (!group) return

    group.valeurs.push({
      id: Number(optionValue.id),
      nom: optionValue.name,
      color: optionValue.color || ''
    })
  })

  return optionGroups
    .map((group) => groupsById.get(String(group.id)))
    .filter(Boolean)
    .map((group) => ({
      id: Number(group.id),
      nom: group.name,
      type: group.group_type,
      valeurs: group.valeurs
    }))
}

async function getStockAvailability(productId, combinationId = null) {
  try {
    let url = `${API_URL}/stock_availables?filter[id_product]=${productId}`
    if (combinationId) {
      url += `&filter[id_product_attribute]=${combinationId}`
    }
    url += '&display=full'
    
    console.log('Stock URL:', url)
    
    const response = await fetch(url)
    const xmlData = await response.text()
    console.log('Stock XML Response:', xmlData)
    
    const jsonData = await xmlToJson(xmlData)
    console.log('Stock JSON Response:', jsonData)

    const stocks = jsonData?.prestashop?.stock_availables?.stock_available || []
    console.log('Stocks array:', stocks)
    
    const stockArray = Array.isArray(stocks) ? stocks : [stocks]
    console.log('Stock array final:', stockArray)

    // Si au moins une ligne de stock existe avec une quantité > 0, c'est en stock
    const hasStock = stockArray.some(stock => {
      console.log('Checking stock:', stock)
      const quantity = parseInt(stock.quantity?.['#text'] || stock.quantity || 0)
      console.log('Quantity:', quantity)
      return quantity > 0
    })
    
    console.log('Has stock:', hasStock)
    return hasStock
  } catch (error) {
    console.error('Erreur lors de la récupération du stock:', error)
    // En cas d'erreur, on assume que c'est en stock
    return true
  }
}

/**
 * Récupère les combinations d'un produit avec leurs attributs
 * @param {number} productId - ID du produit
 * @returns {Promise<Array>} Tableau des combinations formatées
 */
async function getCombinations(productId) {
  try {
    const url = `${API_URL}/combinations?filter[id_product]=${productId}&display=full`
    console.log('Combinations URL:', url)
    
    const response = await fetch(url)
    const xmlData = await response.text()
    console.log('Combinations XML:', xmlData)
    
    const jsonData = await xmlToJson(xmlData)
    console.log('Combinations JSON:', jsonData)

    const combos = jsonData?.prestashop?.combinations?.combination || []
    const comboArray = Array.isArray(combos) ? combos : [combos]
    
    console.log('Combinations array:', comboArray)

    // Parser les combinations
    const combinations = []
    for (const combo of comboArray) {
      // Récupérer le stock disponible pour cette combination
      const hasStock = await getStockAvailability(productId, combo.id)

      // Construire l'URL de l'image
      let image = null
      if (combo.associations?.images?.image) {
        const imageList = Array.isArray(combo.associations.images.image)
          ? combo.associations.images.image
          : [combo.associations.images.image]
        
        if (imageList.length > 0) {
          console.log('Combination has images:', imageList)
          const imageId = imageList[0].id || imageList[0]['#text']
          console.log('Combination image found:', { imageId })
          image = `${API_URL}/images/products/${productId}/${imageId}`
          console.log('Combination image constructed:', { productId, imageId, image })
        }
      }

      combinations.push({
        id: combo.id,
        reference: combo.reference || '',
        price: parseFloat(combo.price) || 0,
        weight: combo.weight || 0,
        image: image,
        inStock: hasStock
      })
    }

    console.log('Combinations formatted:', combinations)
    return combinations
  } catch (error) {
    console.error('Erreur lors de la récupération des combinations:', error)
    return []
  }
}

/**
 * Récupère la liste des produits depuis PrestaShop
 * @returns {Promise<Array>} Liste des produits formatée
 */
export async function getProducts() {
  try {
    console.log('URL : ', `${API_URL}/products?display=full`)
    const response = await fetch(`${API_URL}/products?display=full`)

    console.log('response: ', response)

    const xmlData = await response.text()
    console.log('xmlData: ', xmlData)

    const jsonData = await xmlToJson(xmlData)
    console.log('jsonData: ', jsonData)

    const products = jsonData?.prestashop?.products?.product || []
    console.log('products: ', products)

    // Pour éviter les problèmes au cas où il n'y a qu'un seul produit
    const productArray = Array.isArray(products) ? products : [products]

    // Prendre la liste de catégories pour faire le mapping id => nom
    const categories = await getCategories()
    const categoryMap = new Map(
      categories.map(cat => [cat.id, cat.nom])
    )

    const formattedProducts = productArray.map(async (item) => {
      // Construire les badges basés sur les propriétés
      const badges = []
      if (item.new) badges.push('Nouveau')
      if (item.on_sale === 1 || item.on_sale === '1') badges.push('Solde')

      // Construire l'URL de l'image
      const imageId = item.id_default_image?.['#text'] || 1
      const image = `${API_URL}/images/products/${item.id}/${imageId}`

      // Récupérer la disponibilité du stock
      const inStock = await getStockAvailability(item.id)

      return {
        id: item.id,
        nom: item.name?.language?.['#text'] || 'Sans nom',
        description: item.description_short?.language?.['#text'] || 'Sans description',
        prix: item.price || 0,
        image: image,
        badges: badges,
        inStock: inStock,
        categorie_id: item.id_category_default?.['#text'] || null,
        reference: item.reference || null,
        statut: item.active === 1 ? 'Actif' : 'Inactif',
        categorie_nom: categoryMap.get(item.id_category_default?.['#text']) || 'Catégorie inconnue',
        isFavorite: false
      }
    })
    
    // Attendre que toutes les promesses se résolvent
    const resolvedProducts = await Promise.all(formattedProducts)
    console.log('formattedProducts: ', resolvedProducts)

    return resolvedProducts
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    throw error
  }
}

export async function getProductDetail(productId) {
  try {
    console.log('Chargement détail produit:', productId)
    
    // Récupérer le produit
    const response = await fetch(`${API_URL}/products/${productId}?display=full`)
    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)
    
    const product = jsonData?.prestashop?.product
    if (!product) throw new Error('Produit non trouvé')

    console.log('Product data from API:', product)

    const productOptions = await getProductOptionsStructure(product)
    console.log('Product options structure:', productOptions)

    // Récupérer les combinations pour extraire attributs et prix
    const combinations = await getCombinations(productId)
    console.log('Combinations for detail:', combinations)

    // Construire l'URL de l'image (même approche que getProducts)
    const imageId = product.id_default_image?.id || product.id_default_image?.['#text'] || 1
    const image = `${API_URL}/images/products/${productId}/${imageId}`
    console.log('Product image constructed:', { productId, imageId, image })

    // Badges
    const badges = []
    if (product.new) badges.push('Nouveau')
    if (product.on_sale === 1 || product.on_sale === '1') badges.push('Solde')

    // Récupérer la disponibilité du stock
    const inStock = await getStockAvailability(productId)

    // Construire la réponse
    const productDetail = {
      id: product.id,
      name: product.name?.language?.['#text'] || 'Sans nom',
      price: parseFloat(product.price) || 0,
      description: product.description?.language?.['#text'] || 'Sans description',
      descriptionLong: product.description?.language?.['#text'] || '',
      inStock: inStock,
      image: image,
      reference: product.reference || '',
      badges: badges,
      productOptions: productOptions,
      combinations: combinations
    }

    console.log('Product detail formatted:', productDetail)
    return productDetail

  } catch (error) {
    console.error('Erreur lors de la récupération du détail produit:', error)
    throw error
  }
}
