<script setup>
import { ref, onMounted, computed } from 'vue'
import ProductCard from '../../components/FO/ProductCard.vue'
import { getProducts } from '../../services/productService'
import { getCategories } from '../../services/CategorieService'
import '../../styles/products.css'

const products = ref([])
const categories = ref([])
const isLoading = ref(false)
const error = ref(null)

const currentPage = ref(1)
const pageSize = ref(8)

const searchCriteria = ref({
  name: '',
  categoryId: '',
  minPrice: null,
  maxPrice: null
})

const loadProducts = async () => {
  isLoading.value = true
  error.value = null
  currentPage.value = 1
  
  try {
    products.value = await getProducts(searchCriteria.value)
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement des produits'
    console.error('Erreur:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadProducts()
})

const loadCategories = async () => {
  try {
    categories.value = await getCategories()
  } catch (err) {
    console.error('Erreur categories:', err)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadProducts()
}

const resetSearch = () => {
  currentPage.value = 1
  searchCriteria.value = {
    name: '',
    categoryId: '',
    minPrice: null,
    maxPrice: null
  }
  loadProducts()
}

const handleToggleFavorite = (productId) => {
  const product = products.value.find(p => p.id === productId)
  if (product) {
    product.isFavorite = !product.isFavorite
  }
}

const handlePreview = (productId) => {
  console.log('Aperçu du produit:', productId)
}

const totalPages = computed(() => Math.ceil(products.value.length / pageSize.value))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return products.value.slice(start, start + pageSize.value)
})

const visiblePages = computed(() => {
  const maxPages = 5
  const half = Math.floor(maxPages / 2)
  let start = Math.max(1, currentPage.value - half)
  let end = Math.min(totalPages.value, start + maxPages - 1)
  if (end - start + 1 < maxPages) {
    start = Math.max(1, end - maxPages + 1)
  }
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})
</script>

<template>
  <div class="products-page">
    <div class="page-container">
      <h1>Nos Produits</h1>
      <p class="subtitle">Découvrez notre sélection de produits</p>

      <!-- Search Filters -->
      <div class="search-filters">
        <div class="filter-group">
          <label>Recherche par nom</label>
          <input type="text" v-model="searchCriteria.name" placeholder="Ex: T-shirt..." @keyup.enter="handleSearch">
        </div>
        <div class="filter-group">
          <label>Catégorie</label>
          <select v-model="searchCriteria.categoryId" @change="handleSearch">
            <option value="">Toutes les catégories</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.nom }}</option>
          </select>
        </div>
        <div class="filter-group price-group">
          <label>Prix (min - max)</label>
          <div class="price-inputs">
            <input type="number" v-model="searchCriteria.minPrice" placeholder="Min" @keyup.enter="handleSearch">
            <span>-</span>
            <input type="number" v-model="searchCriteria.maxPrice" placeholder="Max" @keyup.enter="handleSearch">
          </div>
        </div>
        <div class="filter-actions">
          <button @click="handleSearch" class="btn-search">Rechercher</button>
          <button @click="resetSearch" class="btn-reset">Réinitialiser</button>
        </div>
      </div>

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
      <div v-else>
        <div class="products-grid">
          <ProductCard
            v-for="product in paginatedProducts"
            :key="product.id"
            :product="product"
            @toggle-favorite="handleToggleFavorite"
            @preview="handlePreview"
          />
        </div>

        <!-- Pagination FO -->
        <div v-if="totalPages > 1" class="fo-pagination">
          <button 
            class="btn-page-arrow" 
            :disabled="currentPage === 1" 
            @click="currentPage = 1"
            title="Première page"
          >
            &laquo;&laquo;
          </button>
          <button 
            class="btn-page-arrow" 
            :disabled="currentPage === 1" 
            @click="currentPage--"
            title="Précédent"
          >
            &laquo;
          </button>
          
          <button 
            v-for="page in visiblePages" 
            :key="page" 
            class="btn-page-number" 
            :class="{ active: currentPage === page }"
            @click="currentPage = page"
          >
            {{ page }}
          </button>

          <button 
            class="btn-page-arrow" 
            :disabled="currentPage === totalPages" 
            @click="currentPage++"
            title="Suivant"
          >
            &raquo;
          </button>
          <button 
            class="btn-page-arrow" 
            :disabled="currentPage === totalPages" 
            @click="currentPage = totalPages"
            title="Dernière page"
          >
            &raquo;&raquo;
          </button>
        </div>
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

/* Search Filters Styles */
.search-filters {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.filter-group input, .filter-group select {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  background-color: #f9fafb;
}

.filter-group input:focus, .filter-group select:focus {
  border-color: #3b82f6;
  background-color: white;
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price-inputs input {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 200px;
}

.btn-search {
  flex: 2;
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-search:hover {
  background: #2563eb;
}

.btn-reset {
  flex: 1;
  padding: 12px 20px;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .search-filters {
    flex-direction: column;
    padding: 16px;
  }
  .filter-group, .filter-actions {
    width: 100%;
  }
  .filter-actions {
    margin-top: 10px;
  }
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

/* Pagination FO */
.fo-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
  padding: 16px 0;
}

.btn-page-number, .btn-page-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: white;
  color: #374151;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-page-number:hover, .btn-page-arrow:not(:disabled):hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
  transform: translateY(-1px);
}

.btn-page-number.active {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
}

.btn-page-arrow:disabled {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  color: #d1d5db;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
