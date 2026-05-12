<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProductDetail } from '../../services/productService'
import '../../styles/product-detail.css'

const route = useRoute()

// État du produit
const productDetail = ref(null)
const isLoading = ref(true)
const error = ref(null)

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
const selectedImage = ref(0)
const selectedSize = ref('')
const selectedColor = ref('')
const quantity = ref(1)

const isInStock = computed(() => productDetail.value.stock > 0)
const discountPercentage = computed(() => {
  if (productDetail.value.originalPrice) {
    return Math.round((1 - productDetail.value.price / productDetail.value.originalPrice) * 100)
  }
  return 0
})

const handleAddToCart = () => {
  if (!selectedSize.value || !selectedColor.value) {
    alert('Veuillez sélectionner une taille et une couleur')
    return
  }
  console.log('Produit ajouté au panier:', {
    id: productDetail.value.id,
    name: productDetail.value.name,
    size: selectedSize.value,
    color: selectedColor.value,
    quantity: quantity.value,
    price: productDetail.value.price
  })
  alert('Produit ajouté au panier !')
}

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const increaseQuantity = () => {
  if (quantity.value < productDetail.value.stock) quantity.value++
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
            <img 
              :src="productDetail.images[selectedImage]" 
              :alt="productDetail.name"
              class="main-image"
            />
            <span v-if="discountPercentage > 0" class="discount-badge">
              -{{ discountPercentage }}%
            </span>
          </div>

          <!-- Miniatures -->
          <div class="thumbnails">
            <button
              v-for="(image, index) in productDetail.images"
              :key="index"
              class="thumbnail"
              :class="{ active: selectedImage === index }"
              @click="selectedImage = index"
            >
              <img :src="image" :alt="`Miniature ${index + 1}`" />
            </button>
          </div>
        </div>

        <!-- Partie Droite: Informations & Actions -->
        <div class="info-section">
          <!-- Nom & Prix -->
          <div class="header-info">
            <h1 class="product-name">{{ productDetail.name }}</h1>
            
            <div class="price-container">
              <span class="price">{{ parseFloat(productDetail.price).toFixed(2) }}€</span>
              <span v-if="productDetail.originalPrice" class="original-price">
                {{ parseFloat(productDetail.originalPrice).toFixed(2) }}€
              </span>
            </div>

            <!-- Note & Avis -->
            <div class="rating">
              <span class="stars">★★★★☆</span>
              <span class="rating-text">{{ productDetail.rating }}/5 ({{ productDetail.reviews }} avis)</span>
            </div>
          </div>

          <!-- Description -->
          <div class="description">
            <p v-html="productDetail.description"></p>
          </div>

          <!-- Disponibilité -->
          <div class="availability">
            <span v-if="isInStock" class="in-stock">
              En stock ({{ productDetail.stock }} articles disponibles)
            </span>
            <span v-else class="out-of-stock">
              Rupture de stock
            </span>
          </div>

          <!-- Sélections -->
          <div class="selections">
            <!-- Taille -->
            <div class="selection-group">
              <label for="size" class="label">Taille *</label>
              <div class="size-selector">
                <button
                  v-for="size in productDetail.sizes"
                :key="size"
                class="size-btn"
                :class="{ active: selectedSize === size }"
                @click="selectedSize = size"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <!-- Couleur -->
          <div class="selection-group">
            <label for="color" class="label">Couleur *</label>
            <div class="color-selector">
              <button
                v-for="color in productDetail.colors"
                :key="color.name"
                class="color-btn"
                :class="{ active: selectedColor === color.name }"
                :style="{ borderColor: selectedColor === color.name ? '#1f2937' : '#e5e7eb' }"
                @click="selectedColor = color.name"
                :title="color.name"
              >
                <span class="color-dot" :style="{ backgroundColor: color.hex }"></span>
              </button>
            </div>
            <p v-if="selectedColor" class="color-label">{{ selectedColor }}</p>
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
                :max="productDetail.stock"
              />
              <button class="qty-btn" @click="increaseQuantity">+</button>
            </div>
          </div>
        </div>

        <!-- Bouton Ajouter au Panier -->
        <button 
          class="add-to-cart-btn"
          @click="handleAddToCart"
          :disabled="!isInStock"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
    </div>
  </div>
</template>
