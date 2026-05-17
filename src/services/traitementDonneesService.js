import { normalizeText, slugify, toNumber, round2 } from '../utils/importFormatters'
import { jsonToXml, xmlToJson } from '../utils/xmlParser'
import { API_URL, API_KEY } from '../constants/constant'
import JSZip from 'jszip'
import { updateStockInPrestashop } from './stockHelperService'


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

export default {
  buildFichier1ImportPlan,
  logFichier1ImportPlan,
  executeImportPlan,
  insertProducts,
  uploadProductImages,
  executeFichier2Import
}