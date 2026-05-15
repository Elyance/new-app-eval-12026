<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getProductDetail } from '../../services/productService'
import { getProductPricingDisplay } from '../../services/specificPricesService'
import { createCart, addProductToCart, getIdCartInSessionStorage } from '../../services/cartService'
import { cartStore } from '../../stores/cartStore'
import '../../styles/product-detail.css'

const route = useRoute()

// État du produit
const productDetail = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isAddingToCart = ref(false)

// Charger le produit au montage
onMounted(async () => {
  try {
    isLoading.value = true
    error.value = null
    const productId = route.params.id
    productDetail.value = await getProductDetail(productId)
  } catch (err) {
    console.error('Erreur:', err)
    error.value = err.message || 'Impossible de charger le produit'
    productDetail.value = null
  } finally {
    isLoading.value = false
  }
})

// État du formulaire
const quantity = ref(1)
const selectedOptions = ref({})

const productOptions = computed(() => productDetail.value?.productOptions || [])
const hasProductOptions = computed(() => productOptions.value.length > 0)

const selectedOptionValueIds = computed(() => {
  return Object.values(selectedOptions.value)
    .map(value => Number(value))
    .filter(Number.isFinite)
})

const matchingCombination = computed(() => {
  if (!selectedOptionValueIds.value.length) return null

  return productDetail.value?.combinations?.find((combination) => {
    const combinationOptionIds = combination.optionValueIds || []
    return selectedOptionValueIds.value.every((selectedId) => combinationOptionIds.includes(selectedId))
  }) || null
})

const pricingDisplay = computed(() => getProductPricingDisplay(productDetail.value, matchingCombination.value))

const basePriceTtc = computed(() => pricingDisplay.value.basePriceTtc)
const currentPrice = computed(() => pricingDisplay.value.finalPrice)
const hasReduction = computed(() => pricingDisplay.value.hasReduction)
const reductionBadgeLabel = computed(() => pricingDisplay.value.reductionBadgeLabel)

const displayImage = computed(() => {
  return matchingCombination.value?.image || productDetail.value?.image || ''
})

const nbInStock = computed(() => {
  if (!productDetail.value) return 0

  if (matchingCombination.value) {
    return matchingCombination.value.inStock || 0
  }

  return productDetail.value.inStock || 0
})

const isInStock = computed(() => {
  return nbInStock.value > 0
})

watch(() => productDetail.value, () => {
  if (productDetail.value) {
    // Aucun calcul d'option: on se contente du prix de base.
    selectedOptions.value = {}
  }
}, { immediate: false })

const handleAddToCart = async () => {
  // pour les couleurs et la taille, il doit choisir
  if (hasProductOptions.value) {
    const missingOption = productOptions.value.find(group => !selectedOptions.value[group.id])
    if (missingOption) {
      alert(`Veuillez sélectionner ${missingOption.nom.toLowerCase()}`)
      return
    }
  }

  isAddingToCart.value = true

  try {
    // Données du produit à ajouter
    const productData = {
      id_product: productDetail.value.id,
      id_product_attribute: matchingCombination.value?.id || 0,
      quantity: quantity.value
    }

    const existingCartId = getIdCartInSessionStorage()

    if (existingCartId === null) {
      // Pas de panier en session → on crée un nouveau panier avec ce produit
      console.log('Création d\'un nouveau panier avec le produit:', productData)
      const newCart = await createCart(productData)

      if (newCart && newCart.id) {
        console.log('Panier créé avec succès, ID:', newCart.id)
        await cartStore.refreshCount()
        alert('Produit ajouté au panier !')
      } else {
        alert('Erreur lors de la création du panier.')
      }
    } else {
      // Panier existant → on ajoute le produit
      console.log('Ajout au panier existant ID:', existingCartId, 'Produit:', productData)
      const updatedCart = await addProductToCart(existingCartId, productData)

      if (updatedCart) {
        console.log('Produit ajouté au panier avec succès')
        await cartStore.refreshCount()
        alert('Produit ajouté au panier !')
      } else {
        alert('Erreur lors de l\'ajout au panier.')
      }
    }
  } catch (err) {
    console.error('Erreur handleAddToCart:', err)
    alert('Une erreur est survenue lors de l\'ajout au panier.')
  } finally {
    isAddingToCart.value = false
  }
}

const isColorGroup = (group) => String(group?.type || '').toLowerCase() === 'color'

const isOptionSelected = (groupId, valueId) => selectedOptions.value[groupId] === valueId

const selectOptionValue = (groupId, valueId) => {
  selectedOptions.value = {
    ...selectedOptions.value,
    [groupId]: valueId
  }
}

const getSelectedOptionLabel = (groupId) => {
  const group = productOptions.value.find(optionGroup => optionGroup.id === groupId)
  const selectedValueId = selectedOptions.value[groupId]
  const selectedValue = group?.valeurs?.find(value => value.id === selectedValueId)

  return selectedValue?.nom || ''
}

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const increaseQuantity = () => {
  quantity.value++
}
</script>

<template>
  <div class="product-detail-page">
    <!-- État de chargement -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement du produit...</p>
    </div>

    <!-- État d'erreur -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="$router.back()" class="btn-back">Retour</button>
    </div>

    <!-- Contenu du produit -->
    <div v-else-if="productDetail" class="content">
      <div class="breadcrumb">
        <router-link to="/fo">Accueil</router-link>
        <span>/</span>
        <router-link to="/fo/produits">Produits</router-link>
        <span>/</span>
        <span>{{ productDetail.name }}</span>
      </div>

      <div class="container">
        <!-- Partie Gauche: Images -->
        <div class="images-section">
          <!-- Grande image -->
          <div class="main-image-container">
            <!-- Badges -->
            <div v-if="productDetail.badges && productDetail.badges.length" class="badges-container">
              <span 
                v-for="badge in productDetail.badges"
                :key="badge"
                class="badge"
                :class="badge.toLowerCase()"
              >
                {{ badge }}
              </span>
            </div>

            <img 
              :src="displayImage" 
              :alt="productDetail.name"
              class="main-image"
            />
          </div>
        </div>

        <!-- Partie Droite: Informations & Actions -->
        <div class="info-section">
          <!-- Nom & Prix -->
          <div class="header-info">
            <h1 class="product-name">{{ productDetail.name }}</h1>
            
            <div class="price-container">
              <span v-if="hasReduction" class="original-price">
                {{ basePriceTtc.toFixed(2) }}€
              </span>
              <span class="price">{{ currentPrice.toFixed(2) }}€</span>
              <span v-if="hasReduction" class="price-discount-badge">
                {{ reductionBadgeLabel }}
              </span>
            </div>

          </div>

          <!-- Description -->
          <div class="description">
            <p v-html="productDetail.description"></p>
          </div>

          <!-- Disponibilité -->
          <div class="availability">
            <span v-if="isInStock" class="in-stock">
              En stock avec {{ nbInStock }} disponible{{ nbInStock > 1 ? 's' : '' }}
            </span>
            <span v-else class="out-of-stock">
              Rupture de stock
            </span>
          </div>

          <!-- Sélections -->
          <div v-if="hasProductOptions" class="selections">
            <div
              v-for="group in productOptions"
              :key="group.id"
              class="selection-group"
            >
              <label class="label">{{ group.nom }}</label>

              <div v-if="isColorGroup(group)" class="color-selector">
                <button
                  v-for="value in group.valeurs"
                  :key="value.id"
                  class="color-btn"
                  :class="{ active: isOptionSelected(group.id, value.id) }"
                  :style="{ borderColor: isOptionSelected(group.id, value.id) ? '#1f2937' : '#e5e7eb' }"
                  :title="value.nom"
                  @click="selectOptionValue(group.id, value.id)"
                >
                  <span class="color-dot" :style="{ backgroundColor: value.color || '#9ca3af' }"></span>
                </button>
              </div>

              <div v-else class="size-selector">
                <button
                  v-for="value in group.valeurs"
                  :key="value.id"
                  class="size-btn"
                  :class="{ active: isOptionSelected(group.id, value.id) }"
                  @click="selectOptionValue(group.id, value.id)"
                >
                  {{ value.nom }}
                </button>
              </div>

              <p v-if="getSelectedOptionLabel(group.id)" class="color-label">
                {{ getSelectedOptionLabel(group.id) }}
              </p>
            </div>
          </div>

          <!-- Quantité -->
          <div class="selection-group">
            <label class="label">Quantité *</label>
            <div class="quantity-selector">
              <button class="qty-btn" @click="decreaseQuantity">−</button>
              <input 
                v-model.number="quantity" 
                type="number" 
                class="qty-input"
                min="1"
              />
              <button class="qty-btn" @click="increaseQuantity">+</button>
            </div>
          </div>
        </div>

        <!-- Bouton Ajouter au Panier -->
        <button 
          class="add-to-cart-btn"
          @click="handleAddToCart"
          :disabled="!isInStock || isAddingToCart"
        >
          {{ isAddingToCart ? 'Ajout en cours...' : 'Ajouter au panier' }}
        </button>
      </div>
    </div>
  </div>
</template>
