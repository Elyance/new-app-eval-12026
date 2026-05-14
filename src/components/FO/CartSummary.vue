<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['checkout'])



const totalItems = computed(() => {
  return props.items.reduce((sum, item) => sum + item.quantity, 0)
})

const subtotal = computed(() => {
  return props.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
})

const total = computed(() => {
  return parseFloat(subtotal.value).toFixed(2)
})

const handleCheckout = () => {
  emit('checkout')
}

const handleContinueShopping = () => {
  // Naviguer vers produits
}
</script>

<template>
  <div class="cart-summary">
    <h2>Récapitulatif</h2>

    <!-- Articles -->
    <div class="summary-row">
      <span>Nombre d'articles:</span>
      <strong>{{ totalItems }}</strong>
    </div>

    <!-- Sous-total -->
    <div class="summary-row">
      <span>Sous-total:</span>
      <strong>{{ subtotal }}€</strong>
    </div>



    <!-- Divider -->
    <div class="divider"></div>

    <!-- Total -->
    <div class="summary-row total-row">
      <span>Total:</span>
      <strong>{{ total }}€</strong>
    </div>

    <!-- Buttons -->
    <div class="summary-actions">
      <button class="btn-checkout" @click="handleCheckout">
        Passer la commande
      </button>
      <router-link to="/fo/produits" class="btn-continue">
        Continuer les achats
      </router-link>
    </div>
  </div>
</template>
