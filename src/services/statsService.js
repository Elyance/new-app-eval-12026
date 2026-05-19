import { xmlToJson } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'
import { getCategories } from './CategorieService'

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

    const productMap = new Map()
    const extractValue = (obj) => typeof obj === 'object' && obj !== null ? (obj['#text'] || '') : obj;

    for (const p of productArray) {
      if (!p) continue
      const id = String(extractValue(p.id))
      const categoryId = String(extractValue(p.id_category_default))
      const wholesalePrice = Number(extractValue(p.wholesale_price) || 0)
      const basePrice = Number(extractValue(p.price) || 0)
      const categoryNom = categoryMap.get(categoryId) || 'Catégorie inconnue'

      productMap.set(id, {
        categoryId,
        categoryNom,
        wholesalePrice,
        basePrice
      })
    }

    // 3. Récupérer toutes les commandes (en excluant les commandes annulées (ID 6))
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

    // 4. Récupérer tous les stocks disponibles (pour calculer la quantité disponible par produit)
    const stockRes = await fetch(`${API_URL}/stock_availables?display=full`, {
      method: 'GET',
      headers: authHeader
    })
    if (!stockRes.ok) {
      throw new Error(`Erreur lors de la récupération des stocks: ${stockRes.status}`)
    }
    const stockXml = await stockRes.text()
    const stockJson = await xmlToJson(stockXml)
    const stockNodes = stockJson?.prestashop?.stock_availables?.stock_available || []
    const stockArray = Array.isArray(stockNodes) ? stockNodes : [stockNodes]

    // Objet temporaire pour accumuler par catégorie
    const statsAccumulator = {}

    // Initialiser les catégories connues dans l'accumulateur pour s'assurer qu'elles apparaissent même à 0
    for (const cat of categories) {
      statsAccumulator[cat.nom] = {
        categoryName: cat.nom,
        totalSalesHt: 0,
        totalPurchaseHt: 0,
        totalProfit: 0,
        ordersCount: 0,
        qtyPhysical: 0,
        qtyReserved: 0,
        qtyAvailable: 0
      }
    }
    // Ajouter aussi une catégorie par défaut "Autre / Inconnue" au cas où
    const fallbackCategoryName = 'Autre / Inconnue'
    statsAccumulator[fallbackCategoryName] = {
      categoryName: fallbackCategoryName,
      totalSalesHt: 0,
      totalPurchaseHt: 0,
      totalProfit: 0,
      ordersCount: 0,
      qtyPhysical: 0,
      qtyReserved: 0,
      qtyAvailable: 0
    }

    // Accumuler les stocks disponibles par catégorie
    for (const s of stockArray) {
      if (!s) continue
      const productId = String(extractValue(s.id_product))
      const productAttributeId = Number(extractValue(s.id_product_attribute) || 0)
      
      // On prend uniquement l'enregistrement global du produit (id_product_attribute === 0)
      // pour éviter de compter plusieurs fois si le produit a des déclinaisons.
      if (productAttributeId === 0) {
        const quantity = Number(extractValue(s.quantity) || 0)
        const matchedProduct = productMap.get(productId)
        const categoryName = matchedProduct ? matchedProduct.categoryNom : fallbackCategoryName
        
        if (statsAccumulator[categoryName]) {
          statsAccumulator[categoryName].qtyAvailable += quantity
        }
      }
    }

    // Parcourir les commandes valides
    for (const o of orderArray) {
      if (!o) continue
      const currentState = Number(extractValue(o.current_state) || 0)
      
      // On ignore les commandes annulées (ID 6)
      if (currentState === 6) {
        console.log(`[statsService] Commande ID ${extractValue(o.id)} ignorée car annulée.`)
        continue
      }

      const orderRowsSource = o?.associations?.order_rows?.order_row || []
      const orderRows = Array.isArray(orderRowsSource) ? orderRowsSource : [orderRowsSource]

      for (const row of orderRows) {
        if (!row) continue
        const productId = String(extractValue(row.product_id || row.id_product))
        const quantity = Number(extractValue(row.product_quantity || row.quantity) || 0)
        
        // Prix de vente unitaire Hors Taxe de l'article dans la commande
        const unitPriceExclTax = Number(extractValue(row.unit_price_tax_excl || row.product_price) || 0)
        const rowSalesHt = unitPriceExclTax * quantity

        // Récupérer le produit depuis notre map pour avoir le prix d'achat
        const matchedProduct = productMap.get(productId)
        const categoryName = matchedProduct ? matchedProduct.categoryNom : fallbackCategoryName
        const unitPurchaseHt = matchedProduct ? matchedProduct.wholesalePrice : 0
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
        const productId = String(extractValue(row.product_id || row.id_product))
        const matchedProduct = productMap.get(productId)
        categoriesInOrder.add(matchedProduct ? matchedProduct.categoryNom : fallbackCategoryName)
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
    const statsList = Object.values(statsAccumulator).map(stat => ({
      ...stat,
      totalSalesHt: Number(stat.totalSalesHt.toFixed(2)),
      totalPurchaseHt: Number(stat.totalPurchaseHt.toFixed(2)),
      totalProfit: Number(stat.totalProfit.toFixed(2))
    }))

    // Trier les catégories par chiffre d'affaires décroissant
    statsList.sort((a, b) => b.totalSalesHt - a.totalSalesHt)

    // Calculer les totaux généraux
    const globalTotals = statsList.reduce((acc, current) => {
      acc.totalSalesHt += current.totalSalesHt
      acc.totalPurchaseHt += current.totalPurchaseHt
      acc.totalProfit += current.totalProfit
      acc.globalQtyPhysical += current.qtyPhysical
      acc.globalQtyReserved += current.qtyReserved
      acc.globalQtyAvailable += current.qtyAvailable
      return acc
    }, { totalSalesHt: 0, totalPurchaseHt: 0, totalProfit: 0, globalQtyPhysical: 0, globalQtyReserved: 0, globalQtyAvailable: 0 })

    globalTotals.totalSalesHt = Number(globalTotals.totalSalesHt.toFixed(2))
    globalTotals.totalPurchaseHt = Number(globalTotals.totalPurchaseHt.toFixed(2))
    globalTotals.totalProfit = Number(globalTotals.totalProfit.toFixed(2))

    return {
      categoriesStats: statsList.filter(s => s.totalSalesHt > 0 || s.ordersCount > 0 || s.qtyPhysical > 0 || s.categoryName !== fallbackCategoryName),
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

export default {
  getCategoryStats
}
