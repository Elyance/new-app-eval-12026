import { xmlToJson } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'
import { getCategories } from './CategorieService'

const INCLUDED_ORDER_STATES = new Set([2, 5])
const FALLBACK_CATEGORY_NAME = 'Autre / Inconnue'

function extractValue(value) {
  return typeof value === 'object' && value !== null ? (value['#text'] ?? '') : value
}

function extractText(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return extractText(value[0])
  }
  if (typeof value === 'object') {
    if (value['#text'] != null) return String(value['#text'])
    if (value.language != null) return extractText(value.language)
    const firstKey = Object.keys(value)[0]
    if (firstKey) return extractText(value[firstKey])
  }
  return ''
}

function extractNumber(value, fallback = 0) {
  const parsed = Number(extractValue(value) || 0)
  return Number.isFinite(parsed) ? parsed : fallback
}

function createCategoryBucket(categoryName) {
  return {
    categoryName,
    totalSalesHt: 0,
    totalPurchaseHt: 0,
    totalProfit: 0,
    ordersCount: 0,
    qtyPhysical: 0,
    qtyReserved: 0,
    qtyAvailable: 0
  }
}

async function fetchXmlCollection(path, authHeader, collectionKey, itemKey) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: authHeader
  })

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération de ${path}: ${response.status}`)
  }

  const xmlData = await response.text()
  const jsonData = await xmlToJson(xmlData)
  const nodes = jsonData?.prestashop?.[collectionKey]?.[itemKey] || []
  return Array.isArray(nodes) ? nodes : [nodes]
}

function buildProductLookup(products, categoryMap) {
  const productMap = new Map()
  const referenceMap = new Map()

  for (const product of products) {
    if (!product) continue

    const id = String(extractValue(product.id) || '')
    const categoryId = String(extractValue(product.id_category_default) || '')
    const reference = extractText(product.reference).trim().toLowerCase()
    const wholesalePrice = extractNumber(product.wholesale_price, 0)
    const basePrice = extractNumber(product.price, 0)
    const categoryName = categoryMap.get(categoryId) || FALLBACK_CATEGORY_NAME

    const productInfo = {
      id,
      categoryId,
      categoryName,
      reference,
      wholesalePrice,
      basePrice
    }

    productMap.set(id, productInfo)

    if (reference) {
      referenceMap.set(reference, productInfo)
    }
  }

  return { productMap, referenceMap }
}

function buildCategoryAccumulator(categories) {
  const accumulator = {}

  for (const category of categories) {
    accumulator[category.nom] = createCategoryBucket(category.nom)
  }

  accumulator[FALLBACK_CATEGORY_NAME] = createCategoryBucket(FALLBACK_CATEGORY_NAME)
  return accumulator
}

function resolveProductFromOrderRow(row, productMap, referenceMap) {
  const productId = String(extractValue(row.product_id || row.id_product) || '')
  const productReference = String(extractValue(row.product_reference) || '').trim().toLowerCase()

  return productMap.get(productId) || (productReference ? referenceMap.get(productReference) : null)
}

function finalizeCategoryStats(statsAccumulator) {
  const statsList = Object.values(statsAccumulator).map((stat) => ({
    ...stat,
    totalSalesHt: Number(stat.totalSalesHt.toFixed(2)),
    totalPurchaseHt: Number(stat.totalPurchaseHt.toFixed(2)),
    totalProfit: Number(stat.totalProfit.toFixed(2))
  }))

  statsList.sort((a, b) => b.totalSalesHt - a.totalSalesHt)
  return statsList
}

function computeGlobalCategoryTotals(statsList) {
  const globalTotals = statsList.reduce((acc, current) => {
    acc.totalSalesHt += current.totalSalesHt
    acc.totalPurchaseHt += current.totalPurchaseHt
    acc.totalProfit += current.totalProfit
    acc.globalQtyPhysical += current.qtyPhysical
    acc.globalQtyReserved += current.qtyReserved
    acc.globalQtyAvailable += current.qtyAvailable
    return acc
  }, {
    totalSalesHt: 0,
    totalPurchaseHt: 0,
    totalProfit: 0,
    globalQtyPhysical: 0,
    globalQtyReserved: 0,
    globalQtyAvailable: 0
  })

  globalTotals.totalSalesHt = Number(globalTotals.totalSalesHt.toFixed(2))
  globalTotals.totalPurchaseHt = Number(globalTotals.totalPurchaseHt.toFixed(2))
  globalTotals.totalProfit = Number(globalTotals.totalProfit.toFixed(2))

  return globalTotals
}

function filterUsefulCategoryStats(statsList) {
  return statsList.filter((stat) => (
    stat.totalSalesHt > 0 ||
    stat.ordersCount > 0 ||
    stat.qtyPhysical > 0 ||
    stat.categoryName !== FALLBACK_CATEGORY_NAME
  ))
}

function logCategorySummary(statsList, globalTotals) {
  console.groupCollapsed('[statsService] Résumé statistiques catégories')
  console.table(statsList.map((stat) => ({
    categorie: stat.categoryName,
    ventes_ht: stat.totalSalesHt,
    achats_ht: stat.totalPurchaseHt,
    benefice_ht: stat.totalProfit,
    commandes: stat.ordersCount,
    qte_physique: stat.qtyPhysical,
    qte_reservee: stat.qtyReserved,
    qte_disponible: stat.qtyAvailable
  })))
  console.table([{
    total_ventes_ht: globalTotals.totalSalesHt,
    total_achats_ht: globalTotals.totalPurchaseHt,
    total_benefice_ht: globalTotals.totalProfit,
    total_qte_physique: globalTotals.globalQtyPhysical,
    total_qte_reservee: globalTotals.globalQtyReserved,
    total_qte_disponible: globalTotals.globalQtyAvailable
  }])
  console.groupEnd()
}

function logProductSummary(statsList, globalTotals) {
  console.groupCollapsed('[statsService] Résumé statistiques produits')
  console.table(statsList.slice(0, 20).map((stat) => ({
    id: stat.id,
    reference: stat.reference || '',
    produit: stat.name,
    qte_vendue: stat.qtySold,
    ventes_ht: stat.totalSalesHt,
    achats_ht: stat.totalPurchaseHt,
    benefice_ht: stat.totalProfit
  })))
  console.table([{
    total_ventes_ht: globalTotals.totalSalesHt,
    total_achats_ht: globalTotals.totalPurchaseHt,
    total_benefice_ht: globalTotals.totalProfit,
    total_qte_vendue: globalTotals.totalQtySold
  }])
  console.groupEnd()
}

/**
 * Service pour calculer les statistiques financières de la boutique
 */
export async function getCategoryStats() {
  try {
    const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }

    // 1. Récupérer toutes les catégories pour le mappage ID -> Nom
    const categories = await getCategories()
    const categoryMap = new Map(categories.map(c => [String(c.id), c.nom]))

    // 2. Récupérer tous les produits pour connaître leur catégorie par défaut et prix d'achat
    const productArray = await fetchXmlCollection('/products?display=full', authHeader, 'products', 'product')
    const { productMap, referenceMap } = buildProductLookup(productArray, categoryMap)

    // 3. Récupérer toutes les commandes
    const orderArray = await fetchXmlCollection('/orders?display=full', authHeader, 'orders', 'order')

    // 4. Récupérer tous les stocks disponibles (pour calculer la quantité disponible par produit)
    const stockArray = await fetchXmlCollection('/stock_availables?display=full', authHeader, 'stock_availables', 'stock_available')

    // Objet temporaire pour accumuler par catégorie
    const statsAccumulator = buildCategoryAccumulator(categories)

    // Accumuler les stocks disponibles par catégorie
    for (const s of stockArray) {
      if (!s) continue
      const productId = String(extractValue(s.id_product) || '')
      const productAttributeId = Number(extractValue(s.id_product_attribute) || 0)
      
      // On prend uniquement l'enregistrement global du produit (id_product_attribute === 0)
      // pour éviter de compter plusieurs fois si le produit a des déclinaisons.
      if (productAttributeId === 0) {
        const quantity = Number(extractValue(s.quantity) || 0)
        const matchedProduct = productMap.get(productId)
        const categoryName = matchedProduct ? matchedProduct.categoryName : FALLBACK_CATEGORY_NAME
        
        if (statsAccumulator[categoryName]) {
          statsAccumulator[categoryName].qtyAvailable += quantity
        }
      }
    }

    // Parcourir les commandes valides
    for (const o of orderArray) {
      if (!o) continue
      const currentState = Number(extractValue(o.current_state) || 0)
      
      // On ne garde que les commandes livrées ou au paiement effectué
      if (!INCLUDED_ORDER_STATES.has(currentState)) {
        continue
      }

      const orderRowsSource = o?.associations?.order_rows?.order_row || []
      const orderRows = Array.isArray(orderRowsSource) ? orderRowsSource : [orderRowsSource]

      for (const row of orderRows) {
        if (!row) continue
        const productAttributeId = String(extractValue(row.product_attribute_id || row.id_product_attribute) || '0')
        const quantity = Number(extractValue(row.product_quantity || row.quantity) || 0)

        const matchedProduct = resolveProductFromOrderRow(row, productMap, referenceMap)
        const categoryName = matchedProduct ? matchedProduct.categoryName : FALLBACK_CATEGORY_NAME

        // Le CA HT vient de la ligne de commande, déjà au bon niveau de détail.
        // Le coût d'achat HT vient du produit parent uniquement.
        const unitPriceExclTax = Number(extractValue(row.product_price || row.unit_price_tax_excl) || 0)
        const unitPurchaseHt = matchedProduct ? matchedProduct.wholesalePrice : 0

        const rowSalesHt = unitPriceExclTax * quantity
        const rowPurchaseHt = unitPurchaseHt * quantity
        const rowProfit = rowSalesHt - rowPurchaseHt

        // Accumuler dans la catégorie
        if (!statsAccumulator[categoryName]) {
          statsAccumulator[categoryName] = {
            categoryName: categoryName,
            totalSalesHt: 0,
            totalPurchaseHt: 0,
            totalProfit: 0,
            ordersCount: 0,
            qtyPhysical: 0,
            qtyReserved: 0,
            qtyAvailable: 0
          }
        }

        statsAccumulator[categoryName].totalSalesHt += rowSalesHt
        statsAccumulator[categoryName].totalPurchaseHt += rowPurchaseHt
        statsAccumulator[categoryName].totalProfit += rowProfit

        // Si la commande est au statut "Paiement accepté" (ID 2), elle est réservée (non encore livrée)
        if (currentState === 2) {
          statsAccumulator[categoryName].qtyReserved += quantity
        }
      }
      
      // Incrémenter le compteur de commandes pour les catégories concernées par cette commande
      const categoriesInOrder = new Set()
      for (const row of orderRows) {
        if (!row) continue
        const matchedProduct = resolveProductFromOrderRow(row, productMap, referenceMap)
        categoriesInOrder.add(matchedProduct ? matchedProduct.categoryName : FALLBACK_CATEGORY_NAME)
      }
      for (const catName of categoriesInOrder) {
        if (statsAccumulator[catName]) {
          statsAccumulator[catName].ordersCount++
        }
      }
    }

    // Calculer la quantité physique (Disponible + Réservée) pour chaque catégorie
    for (const catName in statsAccumulator) {
      const cat = statsAccumulator[catName]
      cat.qtyPhysical = cat.qtyAvailable + cat.qtyReserved
    }

    // Convertir l'accumulateur en tableau et arrondir les résultats à 2 décimales
    const statsList = finalizeCategoryStats(statsAccumulator)
    const usefulStats = filterUsefulCategoryStats(statsList)
    const globalTotals = computeGlobalCategoryTotals(usefulStats)

    logCategorySummary(usefulStats, globalTotals)

    return {
      categoriesStats: usefulStats,
      globalTotals
    }
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error)
    return {
      categoriesStats: [],
      globalTotals: { totalSalesHt: 0, totalPurchaseHt: 0, totalProfit: 0 }
    }
  }
}

/**
 * Calcule la somme des ventes et des achats générés par les commandes pour chaque produit.
 * Les quantités proviennent des commandes, mais les prix de vente/achat unitaire proviennent de la ressource produit.
 */
export async function getProductSalesStats() {
  try {
    const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }

    // 1. Récupérer tous les produits
    const prodRes = await fetch(`${API_URL}/products?display=full`, {
      method: 'GET',
      headers: authHeader
    })
    if (!prodRes.ok) {
      throw new Error(`Erreur lors de la récupération des produits: ${prodRes.status}`)
    }
    const prodXml = await prodRes.text()
    const prodJson = await xmlToJson(prodXml)
    const prodNodes = prodJson?.prestashop?.products?.product || []
    const productArray = Array.isArray(prodNodes) ? prodNodes : [prodNodes]

    const extractValue = (obj) => typeof obj === 'object' && obj !== null ? (obj['#text'] || '') : obj;

    const productsStatsMap = new Map()
    const productsReferenceMap = new Map()

    for (const p of productArray) {
      if (!p) continue
      const id = String(extractValue(p.id) || '')
      
      // Extraction sécurisée du nom multilingue
      const name = extractText(p.name) || 'Sans nom'
      
      const reference = String(extractValue(p.reference) || '')
      const referenceKey = reference.trim().toLowerCase()
      const wholesalePrice = extractNumber(p.wholesale_price, 0)
      const basePrice = extractNumber(p.price, 0)

      productsStatsMap.set(id, {
        id,
        name,
        reference,
        wholesalePrice,
        basePrice,
        qtySold: 0, // Représente la quantité vendue cumulée via les commandes
        totalSalesHt: 0,
        totalPurchaseHt: 0,
        totalProfit: 0
      })

      if (referenceKey) {
        productsReferenceMap.set(referenceKey, productsStatsMap.get(id))
      }
    }

    // 2. Récupérer toutes les commandes (en excluant les commandes annulées (ID 6))
    const orderRes = await fetch(`${API_URL}/orders?display=full`, {
      method: 'GET',
      headers: authHeader
    })
    if (!orderRes.ok) {
      throw new Error(`Erreur lors de la récupération des commandes: ${orderRes.status}`)
    }
    const orderXml = await orderRes.text()
    const orderJson = await xmlToJson(orderXml)
    const orderNodes = orderJson?.prestashop?.orders?.order || []
    const orderArray = Array.isArray(orderNodes) ? orderNodes : [orderNodes]

    for (const o of orderArray) {
      if (!o) continue
      const currentState = Number(extractValue(o.current_state) || 0)
      if (!INCLUDED_ORDER_STATES.has(currentState)) continue

      const orderRowsSource = o?.associations?.order_rows?.order_row || []
      const orderRows = Array.isArray(orderRowsSource) ? orderRowsSource : [orderRowsSource]

      for (const row of orderRows) {
        if (!row) continue
        const productId = String(extractValue(row.product_id || row.id_product) || '')
        const quantity = Number(extractValue(row.product_quantity || row.quantity) || 0)
        const productReference = String(extractValue(row.product_reference) || '').trim().toLowerCase()
        const rowSalesHt = Number(extractValue(row.product_price || row.unit_price_tax_excl) || 0) * quantity

        const matchedProduct = productsStatsMap.get(productId) || (productReference ? productsReferenceMap.get(productReference) : null)
        if (matchedProduct) {
          matchedProduct.qtySold += quantity
          matchedProduct.totalSalesHt += rowSalesHt
          matchedProduct.totalPurchaseHt += matchedProduct.wholesalePrice * quantity
          matchedProduct.totalProfit = matchedProduct.totalSalesHt - matchedProduct.totalPurchaseHt
        } else {
          // Si le produit n'existe plus dans le catalogue, on le conserve comme produit orphelin
          const orphanName = extractText(row.product_name) || 'Produit supprimé'
          const orphanRef = String(extractValue(row.product_reference) || '')
          const orphanPrice = Number(extractValue(row.product_price || row.unit_price_tax_excl) || 0)
          
          productsStatsMap.set(productId, {
            id: productId,
            name: orphanName,
            reference: orphanRef,
            wholesalePrice: 0,
            basePrice: orphanPrice, // Fallback historique
            qtySold: quantity,
            totalSalesHt: rowSalesHt,
            totalPurchaseHt: 0,
            totalProfit: rowSalesHt
          })
        }
      }
    }

    // 3. Calculer les totaux de vente et d'achat directement à partir des lignes de commande
    const statsList = Array.from(productsStatsMap.values()).map(prod => {
      const totalSalesHt = Number(prod.totalSalesHt || 0)
      const totalPurchaseHt = Number(prod.totalPurchaseHt || 0)
      const totalProfit = Number(prod.totalProfit || (totalSalesHt - totalPurchaseHt))

      return {
        ...prod,
        totalSalesHt: Number(totalSalesHt.toFixed(2)),
        totalPurchaseHt: Number(totalPurchaseHt.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2))
      }
    })

    // Trier les produits par volume de vente décroissant
    statsList.sort((a, b) => b.totalSalesHt - a.totalSalesHt)

    // Calculer les totaux globaux
    const globalTotals = statsList.reduce((acc, curr) => {
      acc.totalSalesHt += curr.totalSalesHt
      acc.totalPurchaseHt += curr.totalPurchaseHt
      acc.totalProfit += curr.totalProfit
      acc.totalQtySold += curr.qtySold
      return acc
    }, { totalSalesHt: 0, totalPurchaseHt: 0, totalProfit: 0, totalQtySold: 0 })

    globalTotals.totalSalesHt = Number(globalTotals.totalSalesHt.toFixed(2))
    globalTotals.totalPurchaseHt = Number(globalTotals.totalPurchaseHt.toFixed(2))
    globalTotals.totalProfit = Number(globalTotals.totalProfit.toFixed(2))

    logProductSummary(statsList, globalTotals)

    return {
      productsStats: statsList,
      globalTotals
    }
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques produits:', error)
    return {
      productsStats: [],
      globalTotals: { totalSalesHt: 0, totalPurchaseHt: 0, totalProfit: 0, totalQtySold: 0 }
    }
  }
}

export default {
  getCategoryStats,
  getProductSalesStats
}
