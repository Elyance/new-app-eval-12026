import { xmlToJson } from '../utils/xmlParser'
import { API_URL } from '../constants/constant'
import { getCategories } from './CategorieService'
import { getStockAvailability } from './stockService'
import { getCombinations } from './combinationService'
import { getProductOptionsStructure } from './productOptionService'
import { getProductTaxRate } from './taxService'
import { getSpecificPrices } from './specificPricesService'

/**
 * Récupère la liste des produits depuis PrestaShop
 * @returns {Promise<Array>} Liste des produits formatée
 */
export async function getProducts() {
  try {
    const response = await fetch(`${API_URL}/products?display=full`)

    const xmlData = await response.text()

    const jsonData = await xmlToJson(xmlData)

    const products = jsonData?.prestashop?.products?.product || []

    const productArray = Array.isArray(products) ? products : [products]

    const categories = await getCategories()
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.nom]))

    const formattedProducts = productArray.map(async (item) => {
      const badges = []
      if (item.new) badges.push('Nouveau')
      if (item.on_sale === 1 || item.on_sale === '1') badges.push('Solde')

      const imageId = item.id_default_image?.['#text'] || 1
      const image = `${API_URL}/images/products/${item.id}/${imageId}`

      const inStock = await getStockAvailability(item.id)
      const taxRate = await getProductTaxRate(item)
      const priceHt = Number(item.price || 0)
      // Calcul du prix TTC
      const price = priceHt * (1 + taxRate / 100)

      return {
        id: item.id,
        nom: item.name?.language?.['#text'] || 'Sans nom',
        description: item.description_short?.language?.['#text'] || 'Sans description',
        prix: price,
        prix_ht: priceHt,
        tax_rate: taxRate,
        image,
        badges,
        inStock,
        categorie_id: item.id_category_default?.['#text'] || null,
        reference: item.reference || null,
        statut: item.active === 1 ? 'Actif' : 'Inactif',
        categorie_nom: categoryMap.get(item.id_category_default?.['#text']) || 'Catégorie inconnue',
        isFavorite: false
      }
    })

    const resolvedProducts = await Promise.all(formattedProducts)

    return resolvedProducts
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    throw error
  }
}

export async function getProductDetail(productId) {
  try {
    const response = await fetch(`${API_URL}/products/${productId}?display=full`)
    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const product = jsonData?.prestashop?.product
    if (!product) throw new Error('Produit non trouvé')

    const productOptions = await getProductOptionsStructure(product)

    const combinations = await getCombinations(productId)

    const imageId = product.id_default_image?.id || product.id_default_image?.['#text'] || 1
    const image = `${API_URL}/images/products/${productId}/${imageId}`

    const badges = []
    if (product.new) badges.push('Nouveau')
    if (product.on_sale === 1 || product.on_sale === '1') badges.push('Solde')

    const inStock = await getStockAvailability(productId)
    const taxRate = await getProductTaxRate(product)
    const priceHt = Number(product.price || 0)
    const price = priceHt * (1 + taxRate / 100)

    // Récupérer les réductions disponibles
    const specificPrices = await getSpecificPrices(productId)

    const productDetail = {
      id: product.id,
      name: product.name?.language?.['#text'] || 'Sans nom',
      price,
      priceHt,
      taxRate,
      description: product.description?.language?.['#text'] || 'Sans description',
      descriptionLong: product.description?.language?.['#text'] || '',
      inStock,
      image,
      reference: product.reference || '',
      badges,
      productOptions,
      combinations,
      specificPrices
    }
    return productDetail
  } catch (error) {
    console.error('Erreur lors de la récupération du détail produit:', error)
    throw error
  }
}
