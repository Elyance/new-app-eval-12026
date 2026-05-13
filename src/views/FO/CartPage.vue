<script setup>
import { ref } from 'vue'
import CartItem from '../../components/FO/CartItem.vue'
import CartSummary from '../../components/FO/CartSummary.vue'
import '../../styles/cart.css'

// Mock data - sera remplacé par Vuex/Pinia
const cartItems = ref([
  {
    id: 1,
    name: 'T-Shirt Classique Premium',
    price: 29.99,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop'
  },
  {
    id: 2,
    name: 'Jeans Premium',
    price: 79.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=100&h=100&fit=crop'
  },
  {
    id: 3,
    name: 'Chemise Blanche',
    price: 45.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&h=100&fit=crop'
  }
])

const handleRemoveItem = (itemId) => {
  const index = cartItems.value.findIndex(item => item.id === itemId)
  if (index > -1) {
    cartItems.value.splice(index, 1)
  }
}

const handleUpdateQuantity = (itemId, newQuantity) => {
  const item = cartItems.value.find(item => item.id === itemId)
  if (item) {
    item.quantity = Math.max(1, newQuantity)
  }
}

const handleContinueShopping = () => {
  console.log('Continuer les achats')
  // Naviguer vers la page produits
}

const handleCheckout = () => {
  console.log('Passer la commande')
  // Naviguer vers la page paiement/commande
}
</script>

<template>
  <div class="cart-page">
    <div class="breadcrumb">
      <router-link to="/fo">Accueil</router-link>
      <span>/</span>
      <span>Panier</span>
    </div>

    <div class="cart-container">
      <h1>Panier</h1>

      <!-- Panier vide -->
      <div v-if="cartItems.length === 0" class="empty-cart">
        <p>Votre panier est vide</p>
        <router-link to="/fo/produits" class="btn-continue">
          Continuer les achats
        </router-link>
      </div>

      <!-- Panier avec produits -->
      <div v-else class="cart-content">
        <!-- Colonne gauche: Produits -->
        <div class="cart-items-section">
          <div class="items-header">
            <span>{{ cartItems.length }} article{{ cartItems.length > 1 ? 's' : '' }}</span>
          </div>

          <div class="items-list">
            <CartItem
              v-for="item in cartItems"
              :key="item.id"
              :item="item"
              @remove="handleRemoveItem"
              @update-quantity="handleUpdateQuantity"
            />
          </div>

          <button class="btn-continue-shopping" @click="handleContinueShopping">
            ← Continuer les achats
          </button>
        </div>

        <!-- Colonne droite: Récapitulatif -->
        <div class="cart-summary-section">
          <CartSummary
            :items="cartItems"
            @checkout="handleCheckout"
          />
        </div>
      </div>
    </div>
  </div>
</template>
