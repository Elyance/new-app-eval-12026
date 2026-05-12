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
        <img :src="product.image" :alt="product.name" class="product-image" />
        
        <!-- Badges -->
        <div class="badges" v-if="product.badges.length">
            <span v-for="badge in product.badges" :key="badge" :class="['badge', `badge-${badge}`]">
            {{ badge.charAt(0).toUpperCase() + badge.slice(1) }}
            </span>
        </div>

        <!-- Favorite Button -->
        <button class="favorite-btn" @click.stop="toggleFavorite" :class="{ active: product.isFavorite }">
            ♡
        </button>

        <!-- Preview Button (au hover) -->
        <button class="preview-btn" @click="handlePreview">
            Voir l'aperçu
        </button>
        </div>

    <!-- Info Container -->
        <div class="info-container">
        <!-- Nom du produit -->
        <h3 class="product-name">{{ product.name }}</h3>

        <!-- Prix -->
        <div class="price-container">
            <span class="price">{{ product.price.toFixed(2) }}€</span>
            <span v-if="product.originalPrice" class="original-price">{{ product.originalPrice.toFixed(2) }}€</span>
        </div>
        </div>
    </div>
  </router-link>
</template>
