<script setup>
import '../../styles/product-card.css'

defineProps({
  product: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle-favorite', 'preview'])

const toggleFavorite = () => {
  emit('toggle-favorite', product.id)
}

const handlePreview = () => {
  emit('preview', product.id)
}
</script>

<template>
  <router-link :to="`/fo/produits/${product.id}`" class="product-card-link">
    <div class="product-card">
      <!-- Image Container -->
      <div class="image-container">
        <img 
          :src="product.image || 'https://via.placeholder.com/250x250?text=Produit'" 
          :alt="product.nom" 
          class="product-image" 
        />
        
        <!-- Favorite Button -->
        <button 
          class="favorite-btn" 
          @click.stop="toggleFavorite" 
          :class="{ active: product.isFavorite }"
        >
          ♡
        </button>
      </div>

      <!-- Info Container -->
      <div class="info-container">
        <!-- Nom du produit -->
        <h3 class="product-name">{{ product.nom }}</h3>

        <!-- Référence -->
        <p class="product-reference" v-if="product.reference">{{ product.reference }}</p>

        <!-- Prix -->
        <div class="price-container">
          <span class="price">{{ Number(product.prix).toFixed(2) }}€</span>
        </div>
      </div>
    </div>
  </router-link>
</template>
