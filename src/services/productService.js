import { xmlToJson } from '../utils/xmlParser'
import { API_URL } from '../constants/constant'
import { getCategories } from './CategorieService'

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

    const formattedProducts = productArray.map(item => {
      // Construire les badges basés sur les propriétés
      const badges = []
      if (item.new) badges.push('Nouveau')
      if (item.on_sale === 1 || item.on_sale === '1') badges.push('Solde')

      // Construire l'URL de l'image
      const imageId = item.id_default_image?.['#text'] || 1
      const image = `${API_URL}/images/products/${item.id}/${imageId}`

      return {
        id: item.id,
        nom: item.name?.language?.['#text'] || 'Sans nom',
        description: item.description_short?.language?.['#text'] || 'Sans description',
        prix: item.price || 0,
        image: image,
        badges: badges,
        quantite: item.quantity?.['#text'] || 0,
        inStock: (item.quantity?.['#text'] || 0) > 0,
        categorie_id: item.id_category_default?.['#text'] || null,
        reference: item.reference || null,
        statut: item.active === 1 ? 'Actif' : 'Inactif',
        categorie_nom: categoryMap.get(item.id_category_default?.['#text']) || 'Catégorie inconnue',
        isFavorite: false // Sera géré plus tard si tu ajoutes la persistance
      }
    })
    console.log('formattedProducts: ', formattedProducts)

    return formattedProducts
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    throw error
  }
}

/**
 * Récupère les détails complets d'un produit (avec combinations, images, etc.)
 * @param {number} productId - ID du produit
 * @returns {Promise<Object>} Détails du produit formatés
 */
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

    // Construire l'URL de l'image (même approche que getProducts)
    const imageId = product.id_default_image?.['#text'] || 1
    const image = `${API_URL}/images/products/${productId}/${imageId}`
    const images = [image]

    // Extraire les tailles et couleurs depuis les combinations
    const sizesSet = new Set()
    const colorsSet = new Set()
    
    if (product.associations?.combinations?.combination) {
      const combinationsList = Array.isArray(product.associations.combinations.combination)
        ? product.associations.combinations.combination
        : [product.associations.combinations.combination]
      
      combinationsList.forEach(combo => {
        // Les features sont dans product_option_values
        // On assume: Size = feature 1, Color = feature 2 (peut varier selon PrestaShop)
        // Pour le moment on va juste extraire ce qui est disponible
        if (combo.id_product_attribute || combo.reference) {
          // On pourrait ajouter les attributs ici si besoin
        }
      })
    }

    // Si pas d'attributs détectés, utiliser des valeurs par défaut
    const sizes = sizesSet.size > 0 ? Array.from(sizesSet) : ['S', 'M', 'L', 'XL']
    const colors = colorsSet.size > 0 ? Array.from(colorsSet) : [
      { name: 'Noir', hex: '#1f2937' },
      { name: 'Blanc', hex: '#ffffff' }
    ]

    // Badges
    const badges = []
    if (product.new) badges.push('Nouveau')
    if (product.on_sale === 1 || product.on_sale === '1') badges.push('Solde')

    // Construire la réponse
    const productDetail = {
      id: product.id,
      name: product.name?.language?.['#text'] || 'Sans nom',
      price: parseFloat(product.price) || 0,
      originalPrice: null, // PrestaShop ne fournit pas directement le prix original
      rating: 0, // À implémenter selon les données d'avis de PrestaShop
      reviews: 0,
      description: product.description?.language?.['#text'] || 'Sans description',
      descriptionLong: product.description?.language?.['#text'] || '',
      stock: parseInt(product.quantity?.['#text'] || 0),
      images: images.length > 0 ? images : [
        'https://via.placeholder.com/600x600?text=Produit+image'
      ],
      sizes: sizes,
      colors: colors,
      reference: product.reference || '',
      badges: badges
    }

    console.log('Product detail formatted:', productDetail)
    return productDetail

  } catch (error) {
    console.error('Erreur lors de la récupération du détail produit:', error)
    throw error
  }
}
