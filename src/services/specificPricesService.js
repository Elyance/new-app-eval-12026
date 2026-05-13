import { xmlToJson } from '../utils/xmlParser'
import { API_URL } from '../constants/constant'


export async function getSpecificPrices(productId) {
  try {
    const response = await fetch(`${API_URL}/specific_prices?filter[id_product]=${productId}&display=full`)
    const xmlData = await response.text()
    const jsonData = await xmlToJson(xmlData)

    const specificPrices = jsonData?.prestashop?.specific_prices?.specific_price || []
    const pricesArray = Array.isArray(specificPrices) ? specificPrices : [specificPrices]

    return pricesArray.map(price => ({
      id: price.id,
      id_product: Number(price.id_product),
      id_product_attribute: Number(price.id_product_attribute), // 0 = tous, sinon combination ID
      id_customer: price.id_customer,
      id_group: price.id_group,
      from_quantity: Number(price.from_quantity || 1),
      reduction: Number(price.reduction || 0),
      reduction_type: price.reduction_type || 'percentage', // 'percentage' ou 'amount'
      reduction_tax: price.reduction_tax, // '1' ou '0'
      from: price.from || '0000-00-00 00:00:00',
      to: price.to || '0000-00-00 00:00:00'
    }))
  } catch (error) {
    console.warn(`[pricing] Aucune réduction trouvée pour le produit ${productId}`)
    return []
  }
}

export function findBestApplicableReduction(priceHt, specificPrices, context = {}) {
  if (!specificPrices || specificPrices.length === 0) return null

  const { combinationId = null, taxRate = 0 } = context
  const now = new Date()

  // Filtrer les réductions applicables
  const applicableReductions = specificPrices.filter(spec => {
    // Vérifier la combinaison (0 = tous les produits, sinon ID spécifique)
    if (spec.id_product_attribute !== 0 && spec.id_product_attribute !== combinationId) return false

    // Vérifier les dates
    const hasValidFromDate = spec.from === '0000-00-00 00:00:00' || new Date(spec.from) <= now
    const hasValidToDate = spec.to === '0000-00-00 00:00:00' || new Date(spec.to) >= now

    if (!hasValidFromDate || !hasValidToDate) return false

    return true
  })

  if (applicableReductions.length === 0) return null
  console.log(`[pricing] ${applicableReductions.length} réduction(s) applicable(s) trouvée(s) pour le produit ${context.productId || 'unknown'}`, {
    applicableReductions
  })

  // On garde la première réduction applicable pour rester simple
  return applicableReductions[0]
}

export function applyReduction(price, reduction) {
  if (!reduction) return price

  if (reduction.reduction_type === 'percentage') {
    return price * (1 - reduction.reduction)
  } else {
    // reduction_type === 'amount'
    return Math.max(0, price - reduction.reduction)
  }
}

export function calculateFinalPrice(priceHt, taxRate, reduction) {
  const priceTTC = priceHt * (1 + taxRate / 100)

  if (!reduction) {
    return {
      priceHt,
      priceTTC,
      reducedPrice: priceTTC,
      discount: null,
      discountAmount: 0
    }
  }

  // Déterminer le prix sur lequel appliquer la réduction
  const priceForReduction = reduction.reduction_tax === '1' ? priceTTC : priceHt
  const reducedPrice = applyReduction(priceForReduction, reduction)

  // Si la réduction est appliquée sur HT, recalculer TTC
  const finalPrice = reduction.reduction_tax === '0'
    ? reducedPrice * (1 + taxRate / 100)
    : reducedPrice

  const discountAmount = priceTTC - finalPrice

  console.log('[pricing] réduction appliquée', {
    reduction_type: reduction.reduction_type,
    reduction: reduction.reduction,
    reduction_tax: reduction.reduction_tax,
    priceTTC,
    finalPrice,
    discountAmount
  })

  return {
    priceHt,
    priceTTC,
    reducedPrice: finalPrice,
    discount: reduction,
    discountAmount
  }
}

// pour eviter les codes non necessaires dans les vue
export function getProductPricingDisplay(productDetail, matchingCombination = null) {
  const priceHt = Number(matchingCombination?.price || productDetail?.priceHt || productDetail?.price || 0)
  const taxRate = Number(productDetail?.taxRate || 0)
  const basePriceTtc = priceHt * (1 + taxRate / 100)
  const reduction = findBestApplicableReduction(priceHt, productDetail?.specificPrices || [], {
    combinationId: matchingCombination?.id || 0,
    taxRate
  })

  let finalPrice = basePriceTtc

  if (reduction) {
    if (reduction.reduction_tax === '1') {
      finalPrice = applyReduction(basePriceTtc, reduction)
    } else {
      const reducedHt = applyReduction(priceHt, reduction)
      finalPrice = reducedHt * (1 + taxRate / 100)
    }
  }

  return {
    priceHt,
    taxRate,
    basePriceTtc,
    finalPrice,
    hasReduction: Boolean(reduction) && finalPrice < basePriceTtc,
    reduction,
    reductionBadgeLabel: reduction
      ? reduction.reduction_type === 'percentage'
        ? `-${Math.round(reduction.reduction * 100)}%`
        : `-${Number(reduction.reduction).toFixed(2)}€`
      : ''
  }
}
