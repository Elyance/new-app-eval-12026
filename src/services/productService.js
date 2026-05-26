import { xmlToJson } from '../utils/xmlParser'
import { API_URL } from '../constants/constant'
import { getCategories } from './CategorieService'
import { getStockAvailability } from './stockService'
import { getCombinations } from './combinationService'
import { getProductOptionsStructure } from './productOptionService'
import { getProductTaxRate } from './taxService'
import { getSpecificPrices, getProductPricingDisplay } from './specificPricesService'
import { removeProductFromStock } from './stockHelperService'

/**
 * Récupère la liste des produits depuis PrestaShop
 * @returns {Promise<Array>} Liste des produits formatée
 */
export async function getProducts(criteria = {}) {
  try {
    let url = `${API_URL}/products?display=full`
    
    if (criteria.name) {
      url += `&filter[name]=%[${encodeURIComponent(criteria.name)}]%`
    }
    if (criteria.categoryId) {
      url += `&filter[id_category_default]=[${criteria.categoryId}]`
    }
    if (criteria.minPrice || criteria.maxPrice) {
      const min = criteria.minPrice || 0
      const max = criteria.maxPrice || 9999999
      url += `&filter[price]=[${min},${max}]`
    }

    const response = await fetch(url)

    const xmlData = await response.text()

    const jsonData = await xmlToJson(xmlData)

    const products = jsonData?.prestashop?.products?.product || []

    const productArray = Array.isArray(products) ? products : [products]

    const categories = await getCategories()
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.nom]))

    const formattedProducts = productArray.map(async (item) => {
      const badges = []
      
      console.log("available_date : ", item.available_date)
      console.log("date_add : ", item.date_add)
      const productDateStr = item.available_date && !item.available_date.startsWith('0000') 
        ? item.available_date 
        : item.date_add;

      console.log("productDateStr : ", productDateStr)
      
        
      if (productDateStr && !productDateStr.startsWith('0000')) {
        const productDate = new Date(productDateStr);
        if (!isNaN(productDate.getTime())) {
          const diffDays = (Date.now() - productDate.getTime()) / (1000 * 60 * 60 * 24);
          console.log("diffDays : ", diffDays)
          if (diffDays >= 0 && diffDays <= 1) {
            badges.push('HOT');
          } else if (diffDays >= 0 && diffDays <= 7) {
            badges.push('NEW');
          }
        }
      }

      if (item.on_sale === 1 || item.on_sale === '1') badges.push('Solde')

      const imageId = item.id_default_image?.['#text'] || 1
      const image = `${API_URL}/images/products/${item.id}/${imageId}`

      const inStock = await getStockAvailability(item.id)
      const taxRate = await getProductTaxRate(item)
      const priceHt = Number(item.price || 0)
      const price = priceHt * (1 + taxRate / 100)
      const specificPrices = await getSpecificPrices(item.id)
      const pricingDisplay = getProductPricingDisplay({
        priceHt,
        taxRate,
        specificPrices
      })

      return {
        id: item.id,
        nom: item.name?.language?.['#text'] || 'Sans nom',
        description: item.description_short?.language?.['#text'] || 'Sans description',
        prix: pricingDisplay.finalPrice,
        prix_original: pricingDisplay.basePriceTtc,
        prix_ht: priceHt,
        tax_rate: taxRate,
        hasReduction: pricingDisplay.hasReduction,
        reductionBadgeLabel: pricingDisplay.reductionBadgeLabel,
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

    console.log("available_date : ", product.available_date)
    console.log("date_add : ", product.date_add)
    
    const productDateStr = product.available_date && !product.available_date.startsWith('0000') 
      ? product.available_date 
      : product.date_add;

    console.log("productDateStr : ", productDateStr)
      
    if (productDateStr && !productDateStr.startsWith('0000')) {
      const productDate = new Date(productDateStr);
      if (!isNaN(productDate.getTime())) {
        const diffDays = (Date.now() - productDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 1) {
          badges.push('HOT');
        } else if (diffDays >= 0 && diffDays <= 7) {
          badges.push('NEW');
        }
      }
    }

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

export async function getProductsByCategorie(categorieId) {
    const products = await getProducts()

    console.log("Resultat des produits : ",  products)
    
    // let map = new Map()
    const listProduct = []
    for (const item of products) {
      console.log(item.categorie_id, " ", categorieId) 
      console.log(item.categorie_id == categorieId)
      if(item.categorie_id == categorieId) {
        listProduct.push(item)
      }
    }
    console.log("Final liste product", listProduct)
    return listProduct
}

export async function doRemove(productsToRemove, delta) {
  console.log("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF" ,productsToRemove, " and ", delta)
  
  let successCount = 0
  let totalExpected = productsToRemove.length * delta
  
  for (let item of productsToRemove) {
    const result = await removeProductFromStock(item.id, 0, delta)
    if (result) {
      successCount++
    }
  }
  
  const totalRemoved = successCount * delta
  
  return {
    totalExpected,
    totalRemoved,
    successCount,
    totalProducts: productsToRemove.length,
    delta
  }
}
