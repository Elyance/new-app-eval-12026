<script setup>
import { ref, onMounted } from 'vue'
import ProductCard from '../../components/FO/ProductCard.vue'
import { getProducts } from '../../services/productService'
import '../../styles/products.css'

const products = ref([])
const isLoading = ref(false)
const error = ref(null)

const loadProducts = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    products.value = await getProducts()
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement des produits'
    console.error('Erreur:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadProducts()
})

const handleToggleFavorite = (productId) => {
  const product = products.value.find(p => p.id === productId)
  if (product) {
    product.isFavorite = !product.isFavorite
  }
}

const handlePreview = (productId) => {
  console.log('Aperçu du produit:', productId)
}
</script>

<template>
  <div class="products-page">
    <div class="page-container">
      <h1>Nos Produits</h1>
      <p class="subtitle">Découvrez notre sélection de produits</p>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-spinner">
        <div class="spinner"></div>
        <p>Chargement des produits...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-message">
        <p>⚠️ {{ error }}</p>
        <button @click="loadProducts" class="btn-retry">Réessayer</button>
      </div>

      <!-- Empty -->
      <div v-else-if="products.length === 0" class="empty-message">
        <p>Aucun produit disponible</p>
      </div>

      <!-- Products Grid -->
      <div v-else class="products-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @toggle-favorite="handleToggleFavorite"
          @preview="handlePreview"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.products-page {
  min-height: 100vh;
  padding: 40px 20px;
  background: #f9fafb;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 10px;
  text-align: center;
}

.subtitle {
  color: #6b7280;
  text-align: center;
  margin-bottom: 40px;
  font-size: 1.1rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}

/* Loading State */
.loading-spinner {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #1f2937;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-spinner p {
  color: #6b7280;
  margin: 0;
}

/* Error State */
.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  margin: 20px 0;
}

.error-message p {
  color: #991b1b;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.btn-retry {
  padding: 10px 20px;
  background: #1f2937;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-retry:hover {
  background: #111827;
  transform: translateY(-2px);
}

/* Empty State */
.empty-message {
  text-align: center;
  padding: 60px 20px;
  background: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
}

.empty-message p {
  margin: 0;
  font-size: 16px;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  h1 {
    font-size: 1.8rem;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
