<script setup>
import ProductCard from '../../components/FO/ProductCard.vue'
import '../../styles/products.css'

const products = [
  {
    id: 1,
    name: 'T-Shirt Classique',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    badges: ['nouveau'],
    isFavorite: false
  },
  {
    id: 2,
    name: 'Jeans Premium',
    price: 79.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=400&h=400&fit=crop',
    badges: ['promo'],
    isFavorite: false
  },
  {
    id: 3,
    name: 'Sneakers Modernes',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    badges: [],
    isFavorite: false
  },
  {
    id: 4,
    name: 'Veste Élégante',
    price: 149.99,
    originalPrice: 179.99,
    image: 'https://images.unsplash.com/photo-1539533057592-4ee2537260c4?w=400&h=400&fit=crop',
    badges: ['nouveau', 'promo'],
    isFavorite: false
  },
  {
    id: 5,
    name: 'Chemise Blanche',
    price: 45.99,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop',
    badges: [],
    isFavorite: false
  },
  {
    id: 6,
    name: 'Short d\'Été',
    price: 34.99,
    originalPrice: 49.99,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop',
    badges: ['promo'],
    isFavorite: false
  },
  {
    id: 7,
    name: 'Pull Confortable',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1556821552-5c63fe13db2d?w=400&h=400&fit=crop',
    badges: ['nouveau'],
    isFavorite: false
  },
  {
    id: 8,
    name: 'Pantalon Chino',
    price: 64.99,
    image: 'https://images.unsplash.com/photo-1473621038790-b3a47bc2b2f5?w=400&h=400&fit=crop',
    badges: [],
    isFavorite: false
  }
]

const handleToggleFavorite = (productId) => {
  const product = products.find(p => p.id === productId)
  if (product) {
    product.isFavorite = !product.isFavorite
  }
}

const handlePreview = (productId) => {
  console.log('Aperçu du produit:', productId)
  // API integration point: ouvrir modal ou naviguer vers page détail
}
</script>

<template>
  <div class="products-page">
    <div class="page-container">
      <h1>Nos Produits</h1>
      <p class="subtitle">Découvrez notre sélection de produits</p>

      <div class="products-grid">
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
