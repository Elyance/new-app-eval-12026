<script setup>
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
  </router-link>
</template>

<style scoped>
.product-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
}

.product-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.product-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

/* Image Container */
.image-container {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  overflow: hidden;
  background: #f3f4f6;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

/* Badges */
.badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-nouveau {
  background: #1f2937;
  color: white;
}

.badge-promo {
  background: #6b7280;
  color: white;
}

/* Favorite Button */
.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: white;
  border: 2px solid #e5e7eb;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-btn:hover {
  border-color: #1f2937;
  transform: scale(1.1);
}

.favorite-btn.active {
  background: #1f2937;
  color: white;
  border-color: #1f2937;
}

/* Preview Button */
.preview-btn {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(31, 41, 55, 0.95);
  color: white;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  transform: translateY(100%);
}

.product-card:hover .preview-btn {
  transform: translateY(0);
}

.preview-btn:hover {
  background: rgba(31, 41, 55, 1);
}

/* Info Container */
.info-container {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Nom du produit */
.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
  line-height: 1.4;
  min-height: 32px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Prix */
.price-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.original-price {
  font-size: 14px;
  color: #9ca3af;
  text-decoration: line-through;
}

/* Responsive */
@media (max-width: 768px) {
  .badges {
    top: 8px;
    left: 8px;
    gap: 4px;
  }

  .badge {
    padding: 3px 8px;
    font-size: 11px;
  }

  .favorite-btn {
    top: 8px;
    right: 8px;
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .product-name {
    font-size: 13px;
    min-height: 26px;
  }

  .price {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .info-container {
    padding: 12px;
  }

  .product-name {
    font-size: 12px;
    min-height: 24px;
  }

  .price {
    font-size: 14px;
  }

  .favorite-btn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}
</style>
