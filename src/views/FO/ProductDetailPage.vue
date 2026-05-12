<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Mock data - sera remplacé par API PrestaShop
const productDetail = ref({
  id: route.params.id || 1,
  name: 'T-Shirt Classique Premium',
  price: 29.99,
  originalPrice: 39.99,
  rating: 4.5,
  reviews: 128,
  description: 'T-shirt de haute qualité en coton 100% biologique. Confortable et durable, idéal pour tous les jours. Coupe classique qui convient à tous les morphotypes.',
  stock: 45,
  images: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&rotate=5',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&rotate=-5'
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  colors: [
    { name: 'Noir', hex: '#1f2937' },
    { name: 'Blanc', hex: '#ffffff' },
    { name: 'Gris', hex: '#9ca3af' },
    { name: 'Bleu', hex: '#3b82f6' }
  ]
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
            <span class="price">{{ productDetail.price.toFixed(2) }}€</span>
            <span v-if="productDetail.originalPrice" class="original-price">
              {{ productDetail.originalPrice.toFixed(2) }}€
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
          <p>{{ productDetail.description }}</p>
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

        <!-- Info additionnelle -->
        <div class="additional-info">
          <p>✓ Livraison gratuite à partir de 50€</p>
          <p>✓ Retour gratuit sous 30 jours</p>
          <p>✓ Paiement sécurisé</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 20px;
}

/* Breadcrumb */
.breadcrumb {
  max-width: 1200px;
  margin: 0 auto 30px;
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 10px;
}

.breadcrumb a {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.3s;
}

.breadcrumb a:hover {
  color: #1f2937;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* ==================== Images Section ==================== */
.images-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image-container {
  position: relative;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.main-image-container:hover .main-image {
  transform: scale(1.05);
}

.discount-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
}

/* Miniatures */
.thumbnails {
  display: flex;
  gap: 12px;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
  background: #f3f4f6;
}

.thumbnail:hover {
  border-color: #6b7280;
}

.thumbnail.active {
  border-color: #1f2937;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ==================== Info Section ==================== */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header Info */
.header-info {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 20px;
}

.product-name {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.price-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.price {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.original-price {
  font-size: 16px;
  color: #9ca3af;
  text-decoration: line-through;
}

.rating {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}

.stars {
  font-size: 16px;
  color: #1f2937;
}

/* Description */
.description {
  color: #6b7280;
  line-height: 1.6;
}

.description p {
  margin: 0;
}

/* Disponibilité */
.availability {
  padding: 12px 16px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
}

.in-stock {
  background: #f0fdf4;
  color: #166534;
  display: block;
}

.out-of-stock {
  background: #fef2f2;
  color: #991b1b;
  display: block;
}

/* ==================== Selections ==================== */
.selections {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.selection-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

/* Tailles */
.size-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.size-btn {
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  transition: all 0.3s;
  min-width: 50px;
  text-align: center;
}

.size-btn:hover {
  border-color: #6b7280;
}

.size-btn.active {
  border-color: #1f2937;
  background: #1f2937;
  color: white;
}

/* Couleurs */
.color-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-btn {
  width: 50px;
  height: 50px;
  border: 3px solid #e5e7eb;
  border-radius: 50%;
  padding: 4px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.color-btn:hover {
  border-color: #6b7280;
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #1f2937;
}

.color-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.color-label {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  min-height: 18px;
}

/* Quantité */
.quantity-selector {
  display: flex;
  align-items: center;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  width: fit-content;
}

.qty-btn {
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 18px;
  color: #1f2937;
  transition: background 0.3s;
}

.qty-btn:hover {
  background: #f3f4f6;
}

.qty-input {
  border: none;
  background: transparent;
  width: 50px;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
  outline: none;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* ==================== CTA Button ==================== */
.add-to-cart-btn {
  padding: 16px 24px;
  background: #1f2937;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: #111827;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.add-to-cart-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* Additional Info */
.additional-info {
  padding: 16px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
}

.additional-info p {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==================== Responsive ==================== */
@media (max-width: 1024px) {
  .container {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 30px;
  }

  .main-image-container {
    max-width: 400px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 20px;
  }

  .product-name {
    font-size: 22px;
  }

  .price {
    font-size: 20px;
  }

  .thumbnails {
    gap: 8px;
  }

  .thumbnail {
    width: 60px;
    height: 60px;
  }

  .size-selector {
    gap: 8px;
  }

  .size-btn {
    padding: 8px 12px;
    min-width: 45px;
    font-size: 13px;
  }

  .color-btn {
    width: 45px;
    height: 45px;
  }

  .color-selector {
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 16px;
    gap: 20px;
  }

  .product-name {
    font-size: 18px;
  }

  .price {
    font-size: 18px;
  }

  .price-container {
    gap: 8px;
  }

  .original-price {
    font-size: 14px;
  }

  .disable-badge {
    top: 12px;
    right: 12px;
    font-size: 12px;
    padding: 6px 10px;
  }

  .thumbnails {
    gap: 6px;
  }

  .thumbnail {
    width: 50px;
    height: 50px;
  }

  .size-selector {
    gap: 6px;
  }

  .size-btn {
    padding: 8px 10px;
    font-size: 12px;
    min-width: 40px;
  }

  .color-btn {
    width: 40px;
    height: 40px;
  }

  .add-to-cart-btn {
    padding: 14px 20px;
    font-size: 14px;
  }

  .qty-input {
    width: 40px;
  }

  .qty-btn {
    width: 35px;
    height: 35px;
    font-size: 16px;
  }

  .additional-info {
    font-size: 12px;
  }

  .additional-info p {
    margin: 6px 0;
  }
}
</style>
