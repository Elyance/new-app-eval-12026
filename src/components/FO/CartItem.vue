<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['remove', 'update-quantity'])

const subtotal = computed(() => {
  return (props.item.price * props.item.quantity).toFixed(2)
})

const handleRemove = () => {
  emit('remove', props.item.id)
}

const handleQuantityChange = (newQuantity) => {
  emit('update-quantity', props.item.id, newQuantity)
}

const decreaseQuantity = () => {
  if (props.item.quantity > 1) {
    handleQuantityChange(props.item.quantity - 1)
  } else if (props.item.quantity === 1) {
    // Si la quantité est à 1 et que l'utilisateur veut la diminuer, on peut soit empêcher, soit supprimer l'article
    handleRemove()
  }
}

const increaseQuantity = () => {
  handleQuantityChange(props.item.quantity + 1)
}
</script>

<template>
  <div class="cart-item">
    <!-- Image -->
    <div class="item-image">
      <img :src="item.image" :alt="item.name" />
    </div>

    <!-- Infos Produit -->
    <div class="item-info">
      <h3 class="item-name">{{ item.name }}</h3>

      <!-- Prix unitaire -->
      <div class="item-price">
        <span v-if="item.hasReduction" class="item-original-price">
          {{ item.originalPrice.toFixed(2) }}€
        </span>
        {{ item.price.toFixed(2) }}€
        <span v-if="item.hasReduction" class="item-reduction-badge">
          {{ item.reductionLabel }}
        </span>
      </div>
    </div>

    <!-- Quantité -->
    <div class="item-quantity">
      <button class="qty-btn" @click="decreaseQuantity">−</button>
      <input 
        v-model.number="item.quantity" 
        type="number" 
        class="qty-input"
        min="1"
        @change="handleQuantityChange($event.target.value)"
      />
      <button class="qty-btn" @click="increaseQuantity">+</button>
    </div>

    <!-- Sous-total -->
    <div class="item-subtotal">
      {{ subtotal }}€
    </div>

    <!-- Suppression -->
    <button class="btn-remove" @click="handleRemove" title="Supprimer">
      ✕
    </button>
  </div>
</template>
