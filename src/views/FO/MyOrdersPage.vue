<script setup>
import { ref, onMounted } from 'vue'
import { authStore } from '../../stores/authStore'
import { getOrdersByCustomerId } from '../../services/orderService'
import { getOrderStateById } from '../../services/orderService'

const orders = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
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
                  <router-link to="/fo/dupliquer" class="btn btn-outline-primary btn-sm">
                    Dupliquer
                  </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
