import { normalizeText, slugify, toNumber, round2 } from '../utils/importFormatters'
import { jsonToXml, xmlToJson } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'
import JSZip from 'jszip'
import { updateStockInPrestashop } from './stockHelperService'
import { createAddress, createOrder } from './orderService'


/*
 * traitementDonneesService.js
 * Regroupe et prépare les entités (catégories, taxes, produits) à partir
 * des lignes normalisées (format attendu par traitementCSVService.traitementFichier1).
 *
 * Usage principal:
 *  - appeler `buildFichier1ImportPlan(rows)` avec les lignes déjà normalisées
 *    pour obtenir un plan d'import (catégories, taxes, produits) sans doublons.
 *  - `logFichier1ImportPlan(plan)` pour afficher un résumé en console.
 */

// Calcule le prix HT à partir d'un prix TTC et d'un taux de taxe (en %)
function buildProductPriceHt(priceTtc, taxRate) {
  const ttc = toNumber(priceTtc)
  const taxe = toNumber(taxRate) || 0

  if (ttc === null) return null
  if (taxe <= 0) return round2(ttc)

  return round2(ttc / (1 + taxe / 100))
}

// Transforme une ligne normalisée en objets entités (category, tax, product)
function splitRowFile1(row) {
  const categoryName = normalizeText(row.categorie)
  const taxRate = toNumber(row.taxe)
  const priceTtc = toNumber(row.prix_ttc)
  const priceHt = buildProductPriceHt(priceTtc, taxRate)

  return {
    category: {
      name: categoryName,
      slug: slugify(categoryName)
    },
    tax: {
      // Nom utilisé pour affichage (ex: "20%")
      name: taxRate === null ? '' : `${taxRate}%`,
      rate: taxRate
    },
    product: {
      name: normalizeText(row.nom),
      reference: normalizeText(row.reference),
      available_date: normalizeText(row.date_availability_produit),
      price_ttc: priceTtc,
      price_ht: priceHt,
      taxe: taxRate,
      category_name: categoryName,
      prix_achat: toNumber(row.prix_achat),
      quantite: toNumber(row.quantite) || 0
    }
  }
}

/**
 * buildFichier1ImportPlan(rows)
 * - rows: tableau de lignes déjà normalisées (output de traitementCSVService.traitementFichier1)
 * Retourne un objet { categories, taxes, products, rows } prêt à être transformé
 * en requêtes vers PrestaShop. Les doublons sont filtrés par clé (slug / taux).
 */
export function buildFichier1ImportPlan(rows = []) {
  const normalizedRows = Array.isArray(rows) ? rows : []

  // On filtre les lignes vides et on enrichit chaque ligne avec ses entités
  const rowsWithEntities = normalizedRows
    .filter((row) => Object.values(row || {}).some((value) => normalizeText(value) !== ''))
    .map((row, index) => ({
      ligne: index + 1,
      source: row,
      ...splitRowFile1(row)
    }))

  const categories = []
  const taxes = []
  const products = []
  const categoryMap = new Map()
  const taxMap = new Map()

  // Construire listes uniques: catégories, taxes, produits
  for (const row of rowsWithEntities) {
    const categoryKey = row.category.slug || row.category.name || `categorie-${row.ligne}`
    if (row.category.name && !categoryMap.has(categoryKey)) {
      const categoryEntry = {
        key: categoryKey,
        ...row.category
      }
      categoryMap.set(categoryKey, categoryEntry)
      categories.push(categoryEntry)
    }

    const taxKey = row.tax.rate === null ? null : String(row.tax.rate)
    if (taxKey !== null && !taxMap.has(taxKey)) {
      const taxEntry = {
        key: taxKey,
        ...row.tax
      }
      taxMap.set(taxKey, taxEntry)
      taxes.push(taxEntry)
    }

    // Produit: on garde une clé basée sur la référence si disponible
    products.push({
      key: row.product.reference || `produit-${row.ligne}`,
      ...row.product,
      category_key: categoryKey,
      tax_key: taxKey
    })
  }

  return {
    categories,
    taxes,
    products,
    rows: rowsWithEntities
  }
}

// Affiche un résumé du plan d'importation pour debug
export function logFichier1ImportPlan(plan) {
  console.log('[traitementDonneesService] Plan catégories:', plan.categories)
  console.log('[traitementDonneesService] Plan taxes:', plan.taxes)
  console.log('[traitementDonneesService] Plan produits:', plan.products)
}

/**
 * executeImportPlan(plan)
 * Exécute la création des catégories et des taxes via l'API PrestaShop,
 * puis enrichit le plan des produits avec les identifiants créés.
 */
export async function executeImportPlan(plan) {
  const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }
  
  // 1. Création des Catégories
  const createdCategories = {}
  for (const cat of plan.categories) {
    if (!cat.name) continue
    
    const catXml = jsonToXml({
      active: 1,
      id_parent: 2, // 2 = Catégorie Accueil (Home) par défaut
      name: { language: { '@_id': '1', '#text': cat.name } },
      link_rewrite: { language: { '@_id': '1', '#text': cat.slug } }
    }, 'category')
    
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml', ...authHeader },
        body: catXml
      })
      if (res.ok) {
        const text = await res.text()
        const json = await xmlToJson(text)
        const newId = json?.prestashop?.category?.id
        if (newId) {
          createdCategories[cat.key] = newId
          console.log(`Catégorie "${cat.name}" créée (ID: ${newId})`)
        }
      } else {
        console.error(`Erreur création catégorie ${cat.name}`, await res.text())
      }
    } catch (err) {
      console.error(`Exception création catégorie ${cat.name}`, err)
    }
  }

  // 2. Création des Taxes et Groupes de Règles de Taxes
  const createdTaxesRules = {}
  for (const tax of plan.taxes) {
    if (tax.rate === null || tax.rate === undefined) continue

    try {
      // 2a. Créer la Taxe
      const taxXml = jsonToXml({
        rate: tax.rate,
        active: 1,
        name: { language: { '@_id': '1', '#text': `TVA ${tax.rate}%` } }
      }, 'tax')
      
      const taxRes = await fetch(`${API_URL}/taxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml', ...authHeader },
        body: taxXml
      })
      if (!taxRes.ok) {
         console.error(`Erreur création taxe ${tax.rate}%`, await taxRes.text())
         continue
      }
      const taxText = await taxRes.text()
      const taxJson = await xmlToJson(taxText)
      const idTax = taxJson?.prestashop?.tax?.id

      // 2b. Créer le Groupe de Règle de Taxe
      const taxGroupXml = jsonToXml({
        name: `Règle TVA ${tax.rate}%`,
        active: 1
      }, 'tax_rule_group')

      const groupRes = await fetch(`${API_URL}/tax_rule_groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml', ...authHeader },
        body: taxGroupXml
      })
      if (!groupRes.ok) {
         console.error(`Erreur création tax_rule_group ${tax.rate}%`, await groupRes.text())
         continue
      }
      const groupText = await groupRes.text()
      const groupJson = await xmlToJson(groupText)
      const idTaxRulesGroup = groupJson?.prestashop?.tax_rule_group?.id

      // 2c. Lier la taxe au groupe via une Règle de Taxe (tax_rule)
      const taxRuleXml = jsonToXml({
        id_tax_rules_group: idTaxRulesGroup,
        id_tax: idTax,
        id_country: 8, // 8 = France par défaut (modifiez selon besoin)
        behavior: 0 // 0 = Cette taxe uniquement
      }, 'tax_rule')

      const ruleRes = await fetch(`${API_URL}/tax_rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml', ...authHeader },
        body: taxRuleXml
      })

      if (ruleRes.ok) {
        createdTaxesRules[tax.key] = idTaxRulesGroup
        console.log(`Groupe de règles de taxe ${tax.rate}% créé avec succès (ID: ${idTaxRulesGroup})`)
      } else {
        console.error(`Erreur création tax_rule ${tax.rate}%`, await ruleRes.text())
      }
    } catch (err) {
      console.error(`Exception création taxe ${tax.rate}%`, err)
    }
  }

  // 3. Enrichir les produits avec les IDs récupérés
  for (const product of plan.products) {
    if (product.category_key && createdCategories[product.category_key]) {
      product.id_category_default = createdCategories[product.category_key]
    }
    if (product.tax_key && createdTaxesRules[product.tax_key]) {
      product.id_tax_rules_group = createdTaxesRules[product.tax_key]
    }
  }

  return {
    ...plan,
    createdCategories,
    createdTaxesRules
  }
}

/**
 * insertProducts(plan)
 * Exécute la création des produits via l'API PrestaShop en utilisant le plan
 * enrichi (contenant id_category_default et id_tax_rules_group).
 */
export async function insertProducts(plan) {
  const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }
  const createdProducts = []

  for (const product of plan.products) {
    if (!product.name) continue

    const id_category_default = product.id_category_default || 2 // Catégorie Accueil par défaut
    const id_tax_rules_group = product.id_tax_rules_group || 0

    const productXml = jsonToXml({
      id_category_default: id_category_default,
      id_tax_rules_group: id_tax_rules_group,
      price: product.price_ht || 0,
      wholesale_price: product.prix_achat || 0,
      active: 1,
      state: 1,
      available_for_order: 1,
      show_price: 1,
      reference: product.reference || '',
      name: { language: { '@_id': '1', '#text': product.name } },
      link_rewrite: { language: { '@_id': '1', '#text': slugify(product.name) } },
      associations: {
        categories: {
          category: { id: id_category_default }
        }
      }
    }, 'product')

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml', ...authHeader },
        body: productXml
      })

      if (res.ok) {
        const text = await res.text()
        const json = await xmlToJson(text)
        const newId = json?.prestashop?.product?.id
        
        if (newId) {
          createdProducts.push({
            ...product,
            id_product_prestashop: newId
          })
          console.log(`Produit "${product.name}" créé avec succès (ID: ${newId})`)

          // Initialisation du stock si une quantité a été définie
          /*
          if (product.quantite > 0) {
            console.log(`[Import] Initialisation du stock pour le produit ID ${newId} (Quantité: ${product.quantite})...`)
            const stockSuccess = await updateStockInPrestashop(newId, 0, product.quantite)
            if (!stockSuccess) {
              console.error(`[Import] Échec de l'initialisation du stock pour le produit ID ${newId}`)
            }
          }
          */
        }
      } else {
        console.error(`Erreur création produit "${product.name}" :`, await res.text())
      }
    } catch (err) {
      console.error(`Exception lors de la création du produit "${product.name}" :`, err)
    }
  }

  return {
    ...plan,
    createdProducts
  }
}

/**
 * uploadProductImages(zipFile, planFinal)
 * Parcourt le ZIP d'images, cherche une correspondance avec la référence de chaque
 * produit créé, et upload l'image via l'API PrestaShop.
 */
export async function uploadProductImages(zipFile, planFinal) {
  if (!zipFile || !planFinal.createdProducts || planFinal.createdProducts.length === 0) {
    return planFinal
  }

  try {
    const zip = await JSZip.loadAsync(zipFile)
    
    // Créer un dictionnaire des images par nom de fichier sans extension (en minuscules)
    const imageEntries = {}
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        const filename = relativePath.split('/').pop()
        const basename = filename.substring(0, filename.lastIndexOf('.')).toLowerCase()
        if (basename) {
          imageEntries[basename] = zipEntry
        }
      }
    })

    // Boucler sur les produits créés
    for (const product of planFinal.createdProducts) {
      if (!product.reference || !product.id_product_prestashop) continue

      const refLower = String(product.reference).toLowerCase().trim()
      const zipEntry = imageEntries[refLower]

      if (zipEntry) {
        console.log(`[Import] Upload de l'image pour ${product.reference} (ID Produit: ${product.id_product_prestashop})...`)
        
        // Convertir l'entrée du ZIP en Blob (fichier)
        const blob = await zipEntry.async('blob')
        
        // Préparer le formulaire multipart
        const formData = new FormData()
        formData.append('image', blob, zipEntry.name.split('/').pop())

        // Appel POST à l'API d'images
        const res = await fetch(`${API_URL}/images/products/${product.id_product_prestashop}`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${API_KEY}:`)}`
            // NE PAS METTRE DE Content-Type ICI ! fetch() s'en charge avec le "boundary"
          },
          body: formData
        })

        if (res.ok) {
           console.log(`[Import] Image uploadée avec succès pour ${product.reference}`)
        } else {
           console.error(`[Import] Erreur upload image pour ${product.reference}:`, await res.text())
        }
      } else {
        console.warn(`[Import] Aucune image trouvée dans le ZIP pour la référence ${product.reference}`)
      }
    }
  } catch (error) {
    console.error("[Import] Erreur lors du traitement du ZIP des images:", error)
  }

  return planFinal
}

/**
 * executeFichier2Import(rowsFichier2, planFinal)
 * Gère l'importation du deuxième fichier contenant les déclinaisons (combinaisons)
 * et les stocks associés, ou le stock initial direct pour les produits simples.
 */
export async function executeFichier2Import(rowsFichier2, planFinal) {
  const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }
  const createdOptions = {} // nom -> id
  const createdOptionValues = {} // optionId_valeur -> id
  const hasDefaultCombination = {} // productId -> boolean

  const results = {
    simpleProductsUpdated: 0,
    combinationsCreated: 0,
    errors: []
  }

  for (const row of rowsFichier2) {
    // 1. Trouver le produit correspondant
    const product = planFinal.createdProducts.find(
      (p) => String(p.reference).toLowerCase().trim() === String(row.reference).toLowerCase().trim()
    )

    if (!product || !product.id_product_prestashop) {
      console.warn(`[Import Fichier 2] Produit introuvable pour la référence : ${row.reference}`)
      results.errors.push(`Produit introuvable pour la référence : ${row.reference}`)
      continue
    }

    const productId = product.id_product_prestashop

    // 2. Si pas de spécificité (produit simple)
    if (!row.specificite || !row.karazany) {
      if (row.stock_initial !== null && row.stock_initial !== undefined) {
        console.log(`[Import Fichier 2] Mise à jour du stock simple pour ${row.reference} (Quantité: ${row.stock_initial})`)
        const stockSuccess = await updateStockInPrestashop(productId, 0, row.stock_initial)
        if (stockSuccess) {
          results.simpleProductsUpdated++
        } else {
          results.errors.push(`Erreur mise à jour stock simple pour ${row.reference}`)
        }
      }
      continue
    }

    // 3. Produit avec déclinaison
    try {
      // 3a. Gérer le groupe d'options (product_options)
      const optionName = row.specificite.trim()
      let optionId = createdOptions[optionName.toLowerCase()]

      if (!optionId) {
        console.log(`[Import Fichier 2] Création de l'attribut (product_option) : ${optionName}`)
        const optionXml = jsonToXml({
          name: { language: { '@_id': '1', '#text': optionName } },
          public_name: { language: { '@_id': '1', '#text': optionName } },
          group_type: 'select',
          is_color_group: optionName.toLowerCase() === 'couleur' ? 1 : 0
        }, 'product_option')

        const resOpt = await fetch(`${API_URL}/product_options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/xml', ...authHeader },
          body: optionXml
        })

        if (resOpt.ok) {
          const textOpt = await resOpt.text()
          const jsonOpt = await xmlToJson(textOpt)
          optionId = jsonOpt?.prestashop?.product_option?.id
          if (optionId) {
            createdOptions[optionName.toLowerCase()] = optionId
          }
        } else {
          console.error(`Erreur création option ${optionName}`, await resOpt.text())
          results.errors.push(`Erreur création attribut ${optionName}`)
          continue
        }
      }

      // 3b. Gérer la valeur de l'option (product_option_values)
      const valueName = row.karazany.trim()
      const valueKey = `${optionId}_${valueName.toLowerCase()}`
      let valueId = createdOptionValues[valueKey]

      if (!valueId) {
        console.log(`[Import Fichier 2] Création de la valeur : ${valueName} pour l'attribut ID ${optionId}`)
        const valueXml = jsonToXml({
          id_attribute_group: optionId,
          name: { language: { '@_id': '1', '#text': valueName } }
        }, 'product_option_value')

        const resVal = await fetch(`${API_URL}/product_option_values`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/xml', ...authHeader },
          body: valueXml
        })

        if (resVal.ok) {
          const textVal = await resVal.text()
          const jsonVal = await xmlToJson(textVal)
          valueId = jsonVal?.prestashop?.product_option_value?.id
          if (valueId) {
            createdOptionValues[valueKey] = valueId
          }
        } else {
          console.error(`Erreur création valeur ${valueName}`, await resVal.text())
          results.errors.push(`Erreur création valeur ${valueName} pour ${optionName}`)
          continue
        }
      }

      // 3c. Créer la déclinaison (combination)
      const taxRate = toNumber(product.taxe) || 0
      const combPriceTtc = toNumber(row.prix_vente_ttc) || 0
      const combPriceHt = round2(combPriceTtc / (1 + taxRate / 100))
      
      const basePriceHt = toNumber(product.price_ht) || 0
      const priceImpactHt = round2(combPriceHt - basePriceHt)

      const isFirstComb = !hasDefaultCombination[productId]
      if (isFirstComb) {
        hasDefaultCombination[productId] = true
      }

      const combinationXml = jsonToXml({
        id_product: productId,
        reference: `${product.reference}-${valueName}`,
        price: priceImpactHt,
        minimal_quantity: 1,
        default_on: isFirstComb ? 1 : 0,
        associations: {
          product_option_values: {
            product_option_value: { id: valueId }
          }
        }
      }, 'combination')

      console.log(`[Import Fichier 2] Création de la déclinaison ${product.reference} - ${valueName} (Impact prix HT: ${priceImpactHt})`)
      const resComb = await fetch(`${API_URL}/combinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml', ...authHeader },
        body: combinationXml
      })

      if (resComb.ok) {
        const textComb = await resComb.text()
        const jsonComb = await xmlToJson(textComb)
        const combinationId = jsonComb?.prestashop?.combination?.id

        if (combinationId) {
          results.combinationsCreated++
          console.log(`[Import Fichier 2] Déclinaison créée avec succès (ID: ${combinationId})`)

          // 3d. Initialisation du stock de la déclinaison
          if (row.stock_initial !== null && row.stock_initial !== undefined) {
            console.log(`[Import Fichier 2] Initialisation du stock pour la combinaison ID ${combinationId} (Quantité: ${row.stock_initial})...`)
            const stockSuccess = await updateStockInPrestashop(productId, combinationId, row.stock_initial)
            if (!stockSuccess) {
              console.error(`[Import Fichier 2] Échec de l'initialisation du stock pour la combinaison ID ${combinationId}`)
              results.errors.push(`Erreur stock déclinaison ${product.reference}-${valueName}`)
            }
          }
        }
      } else {
        console.error(`Erreur création combinaison ${product.reference}-${valueName}`, await resComb.text())
        results.errors.push(`Erreur création déclinaison ${product.reference}-${valueName}`)
      }
    } catch (err) {
      console.error(`Exception déclinaison ${product.reference}-${row.karazany}`, err)
      results.errors.push(`Exception déclinaison ${product.reference}-${row.karazany}`)
    }
  }

  return results
}

/**
 * findCustomerByEmail(email, authHeader)
 * Vérifie si le client existe déjà dans PrestaShop à partir de son email.
 */
async function findCustomerByEmail(email, authHeader) {
  try {
    const res = await fetch(`${API_URL}/customers?filter[email]=[${email}]&display=full`, {
      method: 'GET',
      headers: authHeader
    })

    if (res.ok) {
      const text = await res.text()
      const json = await xmlToJson(text)
      const cust = json?.prestashop?.customers?.customer
      if (cust) {
        const c = Array.isArray(cust) ? cust[0] : cust
        return {
          id: Number(c.id),
          firstname: c.firstname,
          lastname: c.lastname,
          email: c.email,
          secure_key: c.secure_key
        }
      }
    }
  } catch (err) {
    console.error(`[Import Fichier 3] Erreur findCustomerByEmail pour ${email}:`, err)
  }
  return null
}

/**
 * createRealCustomer(customerData, authHeader)
 * Crée un compte client réel dans PrestaShop (non invité) avec le mot de passe spécifié.
 */
async function createRealCustomer(customerData, authHeader) {
  try {
    const customerXml = jsonToXml({
      firstname: customerData.firstname,
      lastname: customerData.lastname,
      email: customerData.email,
      passwd: customerData.passwd,
      is_guest: 0,
      active: 1,
      id_default_group: 3, // Client
      id_lang: 1,
      associations: {
        groups: {
          group: { id: 3 }
        }
      }
    }, 'customer')

    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml', ...authHeader },
      body: customerXml
    })

    if (res.ok) {
      const text = await res.text()
      const json = await xmlToJson(text)
      const cust = json?.prestashop?.customer
      if (cust) {
        return {
          id: Number(cust.id),
          firstname: cust.firstname,
          lastname: cust.lastname,
          email: cust.email,
          secure_key: cust.secure_key
        }
      }
    } else {
      console.error(`[Import Fichier 3] Erreur API création client:`, await res.text())
    }
  } catch (err) {
    console.error(`[Import Fichier 3] Exception createRealCustomer:`, err)
  }
  return null
}

/**
 * createImportCart(cartData, authHeader)
 * Crée un panier multi-produits pour un client importé.
 */
async function createImportCart(cartData, authHeader) {
  try {
    const cartXml = jsonToXml({
      id_currency: 1,
      id_lang: 1,
      id_customer: cartData.id_customer,
      id_address_delivery: cartData.id_address_delivery,
      id_address_invoice: cartData.id_address_invoice,
      associations: {
        cart_rows: {
          cart_row: cartData.cart_rows
        }
      }
    }, 'cart')

    const res = await fetch(`${API_URL}/carts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml', ...authHeader },
      body: cartXml
    })

    if (res.ok) {
      const text = await res.text()
      const json = await xmlToJson(text)
      const cart = json?.prestashop?.cart
      if (cart) {
        return Number(cart.id)
      }
    } else {
      console.error(`[Import Fichier 3] Erreur API création panier:`, await res.text())
    }
  } catch (err) {
    console.error(`[Import Fichier 3] Exception createImportCart:`, err)
  }
  return null
}

/**
 * resolveProductAndCombination(reference, specValue, planFinal, authHeader)
 * Résout les IDs de produits et de déclinaisons de manière intelligente.
 */
async function resolveProductAndCombination(reference, specValue, planFinal, authHeader) {
  try {
    // 1. Chercher le produit dans notre plan d'import
    let product = planFinal.createdProducts?.find(
      (p) => String(p.reference).toLowerCase().trim() === String(reference).toLowerCase().trim()
    )

    let id_product = product?.id_product_prestashop
    let name = product?.name || reference
    let taxRate = product ? (toNumber(product.taxe) || 0) : 20
    let priceHt = product ? (toNumber(product.price_ht) || 0) : 0

    // Si le produit n'est pas dans le planFinal, on tente de le retrouver via l'API de PrestaShop
    if (!id_product) {
      const resProd = await fetch(`${API_URL}/products?filter[reference]=[${reference}]&display=full`, {
        method: 'GET',
        headers: authHeader
      })
      if (resProd.ok) {
        const text = await resProd.text()
        const json = await xmlToJson(text)
        const pNode = json?.prestashop?.products?.product
        if (pNode) {
          const singleP = Array.isArray(pNode) ? pNode[0] : pNode
          id_product = Number(singleP.id)
          name = singleP.name?.language?.['#text'] || singleP.name?.language || reference
          priceHt = Number(singleP.price || 0)
        }
      }
    }

    if (!id_product) return null

    // 2. Si pas de spécification de variante (produit simple)
    if (!specValue) {
      return {
        id_product,
        name,
        price_wt: round2(priceHt * (1 + taxRate / 100)),
        id_product_attribute: 0
      }
    }

    // 3. Si variante, on cherche la combinaison par sa référence (ex: T_01-ngoza)
    const combRef = `${reference}-${specValue}`
    const resComb = await fetch(`${API_URL}/combinations?filter[reference]=[${combRef}]&display=full`, {
      method: 'GET',
      headers: authHeader
    })

    if (resComb.ok) {
      const textComb = await resComb.text()
      const jsonComb = await xmlToJson(textComb)
      const combNode = jsonComb?.prestashop?.combinations?.combination
      if (combNode) {
        const singleC = Array.isArray(combNode) ? combNode[0] : combNode
        const combId = Number(singleC.id)
        const combPriceImpact = Number(singleC.price || 0)
        const combPriceHt = priceHt + combPriceImpact
        return {
          id_product,
          name: `${name} - ${specValue}`,
          price_wt: round2(combPriceHt * (1 + taxRate / 100)),
          id_product_attribute: combId
        }
      }
    }

    // Fallback simple si pas de déclinaison trouvée sur l'API
    return {
      id_product,
      name,
      price_wt: round2(priceHt * (1 + taxRate / 100)),
      id_product_attribute: 0
    }
  } catch (err) {
    console.error(`[Import Fichier 3] Erreur dans resolveProductAndCombination pour ${reference}:`, err)
    return null
  }
}

/**
 * executeFichier3Import(rowsFichier3, planFinal)
 * Parcourt les lignes du Fichier 3 pour :
 * 1) Créer les clients (comptes réels actifs).
 * 2) Créer leurs adresses associées.
 * 3) Résoudre les produits et déclinaisons.
 * 4) Créer les paniers (`carts`).
 * 5) Convertir les paniers en commandes (`orders`) payées si spécifié.
 */
export async function executeFichier3Import(rowsFichier3, planFinal) {
  const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}` }
  
  const results = {
    cartsCreated: 0,
    ordersCreated: 0,
    errors: []
  }

  for (const row of rowsFichier3) {
    try {
      console.log(`[Import Fichier 3] Traitement de l'achat pour ${row.nom} (${row.email})...`)

      // 1. Gérer le client
      let customer = await findCustomerByEmail(row.email, authHeader)
      if (!customer) {
        console.log(`[Import Fichier 3] Création du compte client réel pour : ${row.nom}`)
        const nameParts = row.nom.split(' ')
        const firstname = nameParts[0] || 'Client'
        const lastname = nameParts.slice(1).join(' ') || nameParts[0] || 'Import'

        customer = await createRealCustomer({
          firstname,
          lastname,
          email: row.email,
          passwd: row.pwd
        }, authHeader)

        if (!customer) {
          results.errors.push(`Erreur création client ${row.email}`)
          continue
        }
      } else {
        console.log(`[Import Fichier 3] Client existant identifié ID : ${customer.id}`)
      }

      // 2. Gérer l'adresse
      console.log(`[Import Fichier 3] Création de l'adresse pour le client ID : ${customer.id}`)
      const addressParts = row.adresse.split(' ')
      const postcode = addressParts.find(p => /^\d{5}$/.test(p)) || '10100'

      const address = await createAddress({
        id_customer: customer.id,
        firstname: customer.firstname,
        lastname: customer.lastname,
        address1: row.adresse,
        postcode: postcode,
        city: row.adresse,
        id_country: 8 // France
      })

      if (!address || !address.id) {
        results.errors.push(`Erreur création adresse pour ${row.email}`)
        continue
      }

      // 3. Résoudre tous les produits de l'achat
      const cartRows = []
      const orderRows = []
      let totalPaidTtc = 0

      for (const item of row.achat) {
        const resolved = await resolveProductAndCombination(item.reference, item.specificite_valeur, planFinal, authHeader)
        if (!resolved) {
          console.warn(`[Import Fichier 3] Référence introuvable : ${item.reference}`)
          results.errors.push(`Référence introuvable : ${item.reference}`)
          continue
        }

        cartRows.push({
          id_product: resolved.id_product,
          id_product_attribute: resolved.id_product_attribute,
          quantity: item.quantite
        })

        const unitPriceTtc = resolved.price_wt
        const unitPriceHt = round2(unitPriceTtc / 1.20) // Taxe 20% par défaut pour le total

        orderRows.push({
          product_id: resolved.id_product,
          product_attribute_id: resolved.id_product_attribute,
          product_quantity: item.quantite,
          product_name: resolved.name,
          product_reference: item.reference,
          product_price: unitPriceHt,
          unit_price_tax_incl: unitPriceTtc,
          unit_price_tax_excl: unitPriceHt
        })

        totalPaidTtc += unitPriceTtc * item.quantite
      }

      if (cartRows.length === 0) {
        results.errors.push(`Aucun article valide trouvé pour ${row.email}`)
        continue
      }

      // 4. Créer le panier dans PrestaShop
      console.log(`[Import Fichier 3] Création du panier pour le client ID : ${customer.id}`)
      const cartId = await createImportCart({
        id_customer: customer.id,
        id_address_delivery: address.id,
        id_address_invoice: address.id,
        cart_rows: cartRows
      }, authHeader)

      if (!cartId) {
        results.errors.push(`Erreur création panier pour ${row.email}`)
        continue
      }
      results.cartsCreated++

      // 5. Si panier simple (état vide ou "dans le panier")
      if (!row.etat || row.etat.toLowerCase() === 'dans le panier') {
        console.log(`[Import Fichier 3] Ligne finalisée comme panier simple ID : ${cartId}`)
        continue
      }

      // 6. Si paiement accepté -> Création de la commande correspondante
      if (row.etat.toLowerCase() === 'paiement accepte' || row.etat.toLowerCase() === 'paiement accepté') {
        console.log(`[Import Fichier 3] Conversion du panier ID ${cartId} en commande...`)
        const order = await createOrder({
          id_address_delivery: address.id,
          id_address_invoice: address.id,
          id_cart: cartId,
          id_customer: customer.id,
          total_paid: totalPaidTtc,
          secure_key: customer.secure_key,
          order_rows: orderRows
        })

        if (order && order.id) {
          results.ordersCreated++
          console.log(`[Import Fichier 3] Commande créée avec succès ID : ${order.id}`)
        } else {
          results.errors.push(`Erreur conversion commande pour ${row.email}`)
        }
      }

    } catch (err) {
      console.error(`[Import Fichier 3] Exception sur la ligne de ${row.email}:`, err)
      results.errors.push(`Exception sur la ligne de ${row.email}`)
    }
  }

  return results
}

export default {
  buildFichier1ImportPlan,
  logFichier1ImportPlan,
  executeImportPlan,
  insertProducts,
  uploadProductImages,
  executeFichier2Import,
  executeFichier3Import
}