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
              <span class="badge" :class="getStatusBadgeClass(order)">{{ order.status || 'Etat inconnu' }}</span>
            </td>
            <td>{{ formatDate(order.date) }}</td>
            <td>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-sm btn-info" @click="viewDetails(order)">Détails</button>

                <template v-if="order.currentState === 2">
                  <button class="btn btn-sm btn-outline-danger" @click="changeOrderState(order, 6)">
                    Annuler
                  </button>
                  <button class="btn btn-sm btn-outline-success" @click="changeOrderState(order, 5)">
                    Livrer
                  </button>
                </template>
              </div>
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
import { getFinalList, getOrderByIdCart } from '@/services/commandePanierService'
import { addOrderHistory } from '@/services/orderService'
import { createStockMovement } from '@/services/stockHelperService'

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
    getStatusBadgeClass(order) {
      const state = Number(order?.currentState || 0)
      if (state === 1) return 'text-bg-secondary'
      if (state === 2) return 'text-bg-warning'
      if (state === 3) return 'text-bg-danger'
      if (state === 5) return 'text-bg-success'
      return 'text-bg-dark'
    },
    setStatusMessage(message, type = 'info') {
      this.statusMessage = message
      this.statusMessageType = type
    },
    async changeOrderState(order, targetStateId) {
      const currentState = Number(order?.currentState || 0)

      if (currentState !== 2) {
        this.setStatusMessage('Seules les commandes en paiement effectué peuvent être modifiées.', 'warning')
        return
      }

      if (!order?.id) {
        this.setStatusMessage('Impossible de modifier une commande inexistante.', 'warning')
        return
      }

      if (targetStateId !== 5 && targetStateId !== 6) {
        this.setStatusMessage('État cible invalide.', 'danger')
        return
      }

      try {
        if (targetStateId === 5) {
          // Passage technique par "expédié" en arrière-plan avant de marquer la commande comme livrée.
          await addOrderHistory(order.id, 4)
          await addOrderHistory(order.id, 5)

          // Enregistrer le mouvement de stock pour chaque produit de la commande lors de sa livraison
          try {
            const orderDetail = await getOrderByIdCart(order.cartId)
            if (orderDetail && orderDetail.associations && orderDetail.associations.order_rows) {
              const rows = orderDetail.associations.order_rows
              for (const row of rows) {
                console.log(`[Commandes] Enregistrement mouvement stock (-${row.product_quantity}) pour produit ${row.product_id} (déclinaison: ${row.product_attribute_id || 0})`)
                await createStockMovement(
                  row.product_id,
                  row.product_attribute_id || 0,
                  -Number(row.product_quantity),
                  order.id
                )
              }
            }
          } catch (errMvt) {
            console.error('[Commandes] Erreur lors de l\'enregistrement des mouvements de stock lors de la livraison:', errMvt)
          }

          order.currentState = 5
          order.status = 'Livré'
          this.setStatusMessage('Commande expédiée, livrée et mouvements de stock enregistrés.', 'success')
          console.log(`Commande ${order.id} mise à jour via expédié (4) puis livré (5) et mouvements stock enregistrés`)
          return
        }

        await addOrderHistory(order.id, targetStateId)

        order.currentState = 3
        order.status = 'Annulé'
        this.setStatusMessage('Commande annulée.', 'success')
        console.log(`Commande ${order.id} annulée via order_histories (id_order_state=6)`)
      } catch (error) {
        this.setStatusMessage('Erreur lors de la mise à jour de la commande.', 'danger')
        console.error('[Commandes] Erreur lors du changement d\'état:', error)
      }
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
