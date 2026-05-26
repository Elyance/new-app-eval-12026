<script setup>
import { ref, onMounted } from 'vue'
import { authStore } from '../../stores/authStore'
import { getOrdersByCustomerId } from '../../services/orderService'
import { getOrderStateById } from '../../services/orderService'
import { duplicateOrderById } from '../../services/orderService'

const orders = ref([])
const loading = ref(true)
const error = ref(null)
const showPopup = ref(false)
const selectedOrder = ref(null)
const deltaValue = ref(0)
const duplicating = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const openDuplicatePopup = (order) => {
  selectedOrder.value = order
  deltaValue.value = 0
  showPopup.value = true
  successMessage.value = ''
  errorMessage.value = ''
}

const closeDuplicatePopup = () => {
  showPopup.value = false
  selectedOrder.value = null
  deltaValue.value = 0
  successMessage.value = ''
  errorMessage.value = ''
}

const handleDuplicate = async () => {
  if (!selectedOrder.value) return
  
  if (!deltaValue.value || deltaValue.value <= 0) {
    errorMessage.value = 'Veuillez entrer une quantité supérieure à 0'
    return
  }

  duplicating.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    console.log(`Duplication de la commande ${selectedOrder.value.id} avec delta: ${deltaValue.value}`)
    const result = await duplicateOrderById(selectedOrder.value.id, deltaValue.value)
    
    successMessage.value = result.message || 'Commande dupliquée avec succès!'
    
    // Recharger les commandes
    setTimeout(() => {
      closeDuplicatePopup()
      loadOrders()
    }, 2000)
  } catch (err) {
    console.error('Erreur duplication:', err)
    errorMessage.value = err.message || 'Une erreur est survenue lors de la duplication'
  } finally {
    duplicating.value = false
  }
}

const loadOrders = async () => {
  loading.value = true
  error.value = null

  try {
    if (!authStore.isLoggedIn) {
      orders.value = []
      return
    }

    const customerId = authStore.customer.id
    const fetched = await getOrdersByCustomerId(customerId)

    // Fetch human readable state names
    const withState = await Promise.all(fetched.map(async (o) => {
      const state = await getOrderStateById(o.current_state)
      return {
        ...o,
        stateName: state?.name || String(o.current_state)
      }
    }))

    orders.value = withState
  } catch (err) {
    console.error('Erreur récupération commandes utilisateur:', err)
    error.value = 'Impossible de charger vos commandes.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="container py-4">
    <h3>Mes commandes</h3>

    <div v-if="loading" class="text-muted">Chargement...</div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else>
      <div v-if="orders.length === 0" class="alert alert-info">Aucune commande trouvée.</div>

      <div v-else class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Paiement</th>
              <th>Statut</th>
              <th>Produits</th>
              <th class="text-end">Total payé</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>#{{ order.id }}</td>
              <td>{{ order.date_add }}</td>
              <td>{{ order.payment || '-' }}</td>
              <td>{{ order.stateName }}</td>
              <td>
                <span v-if="order.productsCount > 0">
                  {{ order.productsCount }} produit{{ order.productsCount > 1 ? 's' : '' }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="text-end">{{ Number(order.total_paid).toFixed(2) }} €</td>
              <td>
                <button @click="openDuplicatePopup(order)" class="btn btn-sm btn-primary">
                  Dupliquer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div v-if="showPopup" id="popupDupliquer" class="popup-overlay actif">
    <div class="popup-contenu">
      <span class="fermer" @click="closeDuplicatePopup" v-if="!duplicating">&times;</span>
      <h2>Duplication de commande #{{ selectedOrder?.id }}</h2>
      
      <div v-if="successMessage" class="alert alert-success">
        ✓ {{ successMessage }}
      </div>
      
      <div v-if="errorMessage" class="alert alert-danger">
        ✗ {{ errorMessage }}
      </div>

      <div v-if="!successMessage" class="form-group">
        <label for="delta">Entrer la valeur delta (multiplicateur) : </label>
        <input 
          v-model.number="deltaValue" 
          type="number" 
          id="delta"
          placeholder="ex: 2"
          :disabled="duplicating"
          min="1"
          step="1"
        >
        <small class="form-text text-muted">
          Les quantités de la commande originale seront multipliées par cette valeur.
          Le stock disponible sera vérifié avant la duplication.
        </small>
      </div>
      
      <div class="popup-actions">
        <button 
          @click="handleDuplicate" 
          class="btn btn-primary"
          :disabled="duplicating"
        >
          {{ duplicating ? 'Duplication en cours...' : 'Dupliquer' }}
        </button>
        <button 
          @click="closeDuplicatePopup" 
          class="btn btn-secondary"
          :disabled="duplicating"
        >
          {{ successMessage ? 'Fermer' : 'Annuler' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.popup-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}

.popup-overlay.actif {
  display: flex;
}

.popup-contenu {
  background: white;
  padding: 30px;
  border-radius: 8px;
  position: relative;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.popup-contenu h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-text {
  display: block;
  margin-top: 8px;
  font-size: 0.875rem;
  color: #666;
}

.alert {
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  border: 1px solid;
}

.alert-success {
  background: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.alert-danger {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
  word-break: break-word;
}

.popup-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.popup-actions .btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.popup-actions .btn-primary {
  background: #007bff;
  color: white;
}

.popup-actions .btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.popup-actions .btn-primary:disabled {
  background: #999;
  cursor: not-allowed;
}

.popup-actions .btn-secondary {
  background: #6c757d;
  color: white;
}

.popup-actions .btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.popup-actions .btn-secondary:disabled {
  background: #999;
  cursor: not-allowed;
}

.fermer {
  position: absolute;
  top: 10px;
  right: 15px;
  cursor: pointer;
  font-size: 28px;
  font-weight: bold;
  color: #999;
  transition: color 0.2s;
}

.fermer:hover {
  color: #000;
}
</style>
