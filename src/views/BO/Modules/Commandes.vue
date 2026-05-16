<template>
  <div class="commandes-container">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
      <h2 class="mb-0">Gestion des Commandes</h2>
      <router-link to="/backoffice/modules/tableau-de-bord" class="btn btn-outline-primary btn-sm">
        Tableau de bord
      </router-link>
    </div>

    <div v-if="statusMessage" class="alert mt-4" :class="`alert-${statusMessageType}`">
      {{ statusMessage }}
    </div>
    
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>ID Panier</th>
            <th>Référence</th>
            <th>Nouveau Client</th>
            <th>Livraison</th>
            <th>Client</th>
            <th>Total</th>
            <th>Paiement</th>
            <th>État</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>{{ order.cartId }}</td>
            <td>{{ order.reference }}</td>
            <td>{{ order.isNewCustomer ? 'Oui' : 'Non' }}</td>
            <td>{{ order.shipping }}</td>
            <td>{{ order.customer || '-' }}</td>
            <td class="fw-bold">{{ formatCurrency(order.total) }}</td>
            <td>{{ order.payment || '-' }}</td>
            <td>
              <select v-model.number="order.currentState" @change="updateStatus(order)" class="form-select form-select-sm">
                <option :value="1">Dans le panier</option>
                <option :value="2">Paiement effectué</option>
                <option :value="3">Annulé</option>
              </select>
            </td>
            <td>{{ formatDate(order.date) }}</td>
            <td>
              <button class="btn btn-sm btn-info" @click="viewDetails(order)">Détails</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isLoading" class="alert alert-info mt-4">
      Chargement des commandes...
    </div>

    <div v-else-if="loadError" class="alert alert-danger mt-4">
      {{ loadError }}
    </div>

    <div v-else-if="orders.length === 0" class="alert alert-info mt-4">
      Aucune commande trouvée.
    </div>
  </div>
</template>

<script>
import { getFinalList } from '@/services/commandePanierService'
import { addOrderHistory } from '@/services/orderService'

export default {
  name: 'Commandes',
  data() {
    return {
      orders: [],
      isLoading: false,
      loadError: '',
      statusMessage: '',
      statusMessageType: 'info'
    }
  },
  async mounted() {
    try {
      this.isLoading = true
      const finalList = await getFinalList()
      this.orders = finalList
      this.orders.forEach((order) => {
        order._previousState = Number(order.currentState || 1)
      })
    //   console.log('[Commandes] getFinalList() return:', finalList)
    //   console.log('[Commandes] JSON preview:', JSON.stringify(finalList, null, 2))
    } catch (error) {
      this.loadError = 'Impossible de charger les commandes'
      console.error('[Commandes] Error while calling getFinalList():', error)
    } finally {
      this.isLoading = false
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('fr-FR');
    },
    setStatusMessage(message, type = 'info') {
      this.statusMessage = message
      this.statusMessageType = type
    },
    async updateStatus(order) {
      const nextState = Number(order.currentState)
      const previousState = Number(order._previousState || nextState)

      if (nextState === previousState) {
        return
      }

      if (previousState === 1 && nextState === 2) {
        order.currentState = previousState
        this.setStatusMessage('Le client n\'a pas encore commandé, vous ne pouvez pas commander à sa place.', 'warning')
        return
      }

      if (previousState === 1 && nextState === 3) {
        order.currentState = previousState
        this.setStatusMessage('Le retour de "dans le panier" vers "annulé" est interdit.', 'warning')
        return
      }

      if (previousState === 2 && nextState === 1) {
        order.currentState = previousState
        this.setStatusMessage('Le retour de "paiement effectué" vers "dans le panier" est interdit.', 'warning')
        return
      }

      if (previousState === 3 && nextState === 2) {
        order.currentState = previousState
        this.setStatusMessage('Le retour de "annulé" vers "paiement effectué" est interdit.', 'warning')
        return
      }

      if (previousState === 2 && nextState === 3) {
        if (!order.id) {
          order.currentState = previousState
          this.setStatusMessage('Impossible d\'annuler une commande inexistante.', 'warning')
          return
        }

        try {
          await addOrderHistory(order.id, 6)
          order._previousState = 3
          order.currentState = 3
          this.setStatusMessage('Commande annulée.', 'success')
          console.log(`Commande ${order.id} annulée via order_histories (id_order_state=6)`)
        } catch (error) {
          order.currentState = previousState
          this.setStatusMessage('Erreur lors de l\'annulation de la commande.', 'danger')
          console.error('[Commandes] Erreur lors du changement d\'état:', error)
        }
        return
      }

      order._previousState = nextState
      this.setStatusMessage('Statut mis à jour.', 'success')
      console.log(`Commande ${order.id} - État mis à jour à: ${order.currentState}`)
    },
    viewDetails(orderOrId) {
      const cartId = typeof orderOrId === 'object' ? orderOrId?.cartId : orderOrId
      console.log('[Commandes] Navigation vers le détail pour id_cart:', cartId)

      if (!cartId && cartId !== 0) {
        console.warn('[Commandes] Impossible de naviguer vers le détail: cartId manquant')
        return
      }

      this.$router.push({ name: 'CommandeDetail', params: { id_cart: cartId } })
    }
  }
}
</script>

<style scoped>
.commandes-container {
  padding: 2rem;
  background: white;
  border-radius: 8px;
}

h2 {
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 1rem;
}

.table {
  margin-top: 1.5rem;
}

.form-select-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-sm {
  font-size: 0.75rem;
}
</style>
