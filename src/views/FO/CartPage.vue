<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CartItem from '../../components/FO/CartItem.vue'
import CartSummary from '../../components/FO/CartSummary.vue'
import {
  getCart,
  getIdCartInSessionStorage,
  updateCartItemQuantity,
  removeProductFromCart
} from '../../services/cartService'
import { getProductDetail } from '../../services/productService'
import { getProductPricingDisplay } from '../../services/specificPricesService'
import { API_URL } from '../../constants/constant'
import { cartStore } from '../../stores/cartStore'
import '../../styles/cart.css'

const router = useRouter()

const cartItems = ref([])
const isLoading = ref(true)
const error = ref(null)

/**
 * Charge le panier depuis PrestaShop et enrichit chaque ligne
 * avec les infos du produit (nom, prix, image)
 */
const loadCart = async () => {
  isLoading.value = true
  error.value = null

  try {
    const cartId = getIdCartInSessionStorage()

    if (!cartId) {
      // Pas de panier en session → panier vide
      cartItems.value = []
      return
    }

    const cart = await getCart(cartId)

    if (!cart || !cart.rows || cart.rows.length === 0) {
      cartItems.value = []
      return
    }

    // Enrichir chaque ligne du panier avec les détails du produit
    const enrichedItems = await Promise.all(
      cart.rows.map(async (row) => {
        try {
          const product = await getProductDetail(row.id_product)
          // Calculer le prix final en tenant compte des promotions
          const pricing = getProductPricingDisplay(product)

          return {
            id: row.id_product,
            id_product_attribute: row.id_product_attribute,
            name: product?.name || `Produit #${row.id_product}`,
            price: pricing.finalPrice,
            originalPrice: pricing.basePriceTtc,
            hasReduction: pricing.hasReduction,
            reductionLabel: pricing.reductionBadgeLabel,
            quantity: row.quantity,
            image: product?.image || ''
          }
        } catch (err) {
          // En cas d'erreur pour un produit, on affiche quand même la ligne
          console.error(`Erreur chargement produit ${row.id_product}:`, err)
          return {
            id: row.id_product,
            id_product_attribute: row.id_product_attribute,
            name: `Produit #${row.id_product}`,
            price: 0,
            originalPrice: 0,
            hasReduction: false,
            reductionLabel: '',
            quantity: row.quantity,
            image: ''
          }
        }
      })
    )

    cartItems.value = enrichedItems
  } catch (err) {
    console.error('Erreur chargement panier:', err)
    error.value = 'Impossible de charger le panier'
    cartItems.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadCart()
})

const handleRemoveItem = async (itemId) => {
  const cartId = getIdCartInSessionStorage()
  if (!cartId) return

  const item = cartItems.value.find(i => i.id === itemId)
  if (!item) return

  // Retirer localement pour un feedback immédiat
  const index = cartItems.value.findIndex(i => i.id === itemId)
  if (index > -1) {
    cartItems.value.splice(index, 1)
  }

  // PUT vers PrestaShop (sans la ligne supprimée)
  const result = await removeProductFromCart(cartId, item.id, item.id_product_attribute)
  if (!result) {
    // En cas d'erreur, recharger le panier
    await loadCart()
  }
  // Rafraîchir le badge du panier dans la Navbar
  await cartStore.refreshCount()
}

const handleUpdateQuantity = async (itemId, newQuantity) => {
  const cartId = getIdCartInSessionStorage()
  if (!cartId) return

  const item = cartItems.value.find(i => i.id === itemId)
  if (!item) return

  // Mettre à jour localement pour un feedback immédiat
  item.quantity = Math.max(0, newQuantity)

  // PUT vers PrestaShop (objet entier avec nouvelle quantité)
  const result = await updateCartItemQuantity(cartId, item.id, item.id_product_attribute, item.quantity)
  if (!result) {
    // En cas d'erreur, recharger le panier
    await loadCart()
  }
  // Rafraîchir le badge du panier dans la Navbar
  await cartStore.refreshCount()
}

const handleContinueShopping = () => {
  router.push('/fo/produits')
}

const handleCheckout = () => {
  router.push('/fo/commande')
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

      <!-- Chargement -->
      <div v-if="isLoading" class="loading-cart">
        <div class="spinner"></div>
        <p>Chargement du panier...</p>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="error-cart">
        <p>⚠️ {{ error }}</p>
        <button class="btn-retry" @click="loadCart">Réessayer</button>
      </div>

      <!-- Panier vide -->
      <div v-else-if="cartItems.length === 0" class="empty-cart">
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
              :key="`${item.id}-${item.id_product_attribute}`"
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

<style scoped>
.loading-cart {
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

.loading-cart p {
  color: #6b7280;
  margin: 0;
}

.error-cart {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  margin: 20px 0;
}

.error-cart p {
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
</style>
