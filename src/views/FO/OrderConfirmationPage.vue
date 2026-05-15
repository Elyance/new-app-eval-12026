<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '../../stores/orderStore'
import '../../styles/checkout.css'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const orderData = ref(null)

onMounted(() => {
  // Récupérer les données de la commande depuis le store Pinia
  if (orderStore.confirmation) {
    orderData.value = orderStore.confirmation
    // Nettoyer après lecture pour éviter les données obsolètes
    orderStore.clearConfirmation()
  } else {
    // Pas de données → rediriger vers l'accueil
    router.push('/fo')
  }
})
</script>

<template>
  <div class="checkout-page">
    <div class="breadcrumb">
      <router-link to="/fo">Accueil</router-link>
      <span>/</span>
      <span>Confirmation</span>
    </div>

    <div class="checkout-container">
      <h1>Commande confirmée</h1>

      <!-- Stepper -->
      <div class="checkout-stepper">
        <div class="step completed">
          <span class="step-number">✓</span>
          <span class="step-label">Panier</span>
        </div>
        <div class="step-line active"></div>
        <div class="step completed">
          <span class="step-number">✓</span>
          <span class="step-label">Informations</span>
        </div>
        <div class="step-line active"></div>
        <div class="step active">
          <span class="step-number">3</span>
          <span class="step-label">Confirmation</span>
        </div>
      </div>

      <div v-if="orderData" class="confirmation-content">
        <div class="confirmation-card">
          <!-- Icon succès -->
          <div class="confirmation-icon">✓</div>

          <h2>Merci pour votre commande !</h2>
          <p class="order-ref">
            Commande n° <strong>#{{ orderData.id }}</strong>
            <span v-if="orderData.reference"> — Réf : {{ orderData.reference }}</span>
          </p>

          <!-- Détails en grid -->
          <div class="confirmation-details">
            <div class="detail-block">
              <h3>Client</h3>
              <p class="detail-highlight">{{ orderData.customer.firstname }} {{ orderData.customer.lastname }}</p>
            </div>

            <div class="detail-block">
              <h3>Adresse de livraison</h3>
              <p>{{ orderData.address.address1 }}</p>
              <p>{{ orderData.address.postcode }} {{ orderData.address.city }}</p>
              <p>{{ orderData.address.country }}</p>
            </div>

            <div class="detail-block">
              <h3>État de la commande</h3>
              <p class="detail-highlight">{{ orderData.state }}</p>
            </div>

            <div class="detail-block">
              <h3>Livraison</h3>
              <p class="detail-highlight">{{ orderData.carrier }}</p>
              <p v-if="orderData.carrierDelay">{{ orderData.carrierDelay }}</p>
            </div>

            <div class="detail-block">
              <h3>Paiement</h3>
              <p class="detail-highlight">{{ orderData.payment }}</p>
            </div>
          </div>

          <!-- Produits -->
          <div class="confirmation-products">
            <h3>Produits commandés</h3>
            <div
              v-for="item in orderData.items"
              :key="`${item.id}-${item.id_product_attribute}`"
              class="confirmation-product-row"
            >
              <span class="confirmation-product-name">{{ item.name }}</span>
              <span class="confirmation-product-qty">× {{ item.quantity }}</span>
              <span class="confirmation-product-price">{{ (item.price * item.quantity).toFixed(2) }} €</span>
            </div>

            <div class="confirmation-total">
              <span>Total</span>
              <span>{{ orderData.total.toFixed(2) }} €</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="confirmation-actions">
            <router-link to="/fo" class="btn-back-home">
              Retour à l'accueil
            </router-link>
            <router-link to="/fo/produits" class="btn-continue-shopping-confirm">
              Continuer les achats
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
