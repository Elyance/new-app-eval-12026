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
      <table class="table table-striped table-hover align-middle">
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
          <tr v-for="order in orders" :key="order.id || order.cartId">
            <td>{{ order.id || '-' }}</td>
            <td>{{ order.cartId }}</td>
            <td><code class="text-secondary fw-semibold">{{ order.reference || '-' }}</code></td>
            <td>
              <span :class="['badge', order.isNewCustomer ? 'bg-info text-dark' : 'bg-light text-secondary']">
                {{ order.isNewCustomer ? 'Oui' : 'Non' }}
              </span>
            </td>
            <td>{{ order.shipping || '-' }}</td>
            <td>{{ order.customer || '-' }}</td>
            <td class="fw-bold text-primary">{{ formatCurrency(order.total) }}</td>
            <td><span class="small text-muted">{{ order.payment || '-' }}</span></td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(order)">{{ order.status || 'Etat inconnu' }}</span>
            </td>
            <td>{{ formatDate(order.date) }}</td>
            <td>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-sm btn-info text-white" @click="viewDetails(order)">Détails</button>

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

    <!-- Info messages (loading, error, empty) -->
    <div v-if="isLoading" class="alert alert-info mt-4 d-flex align-items-center gap-2">
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Chargement des commandes...
    </div>

    <div v-else-if="loadError" class="alert alert-danger mt-4">
      {{ loadError }}
    </div>

    <div v-else-if="orders.length === 0" class="alert alert-info mt-4">
      Aucune commande trouvée.
    </div>

    <!-- Pagination & Limits Controls -->
    <div v-if="!isLoading && !loadError && orders.length > 0" class="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4 pagination-bar">
      <div class="d-flex align-items-center gap-3 flex-wrap">
        <span class="text-muted small">
          Affichage de <strong>{{ startEntry }}</strong> à <strong>{{ endEntry }}</strong> sur <strong>{{ totalOrders }}</strong> commandes
        </span>
        <div class="d-flex align-items-center gap-2 limit-selector">
          <span class="text-muted small text-nowrap">Afficher</span>
          <select v-model="limit" class="form-select form-select-sm limit-dropdown" @change="resetAndFetch">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="text-muted small text-nowrap">par page</span>
        </div>
      </div>
      
      <nav aria-label="Page navigation">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button class="page-link prev-next-btn" @click="changePage(currentPage - 1)" aria-label="Précédent">
              <span aria-hidden="true">&laquo;</span>
            </button>
          </li>
          
          <li v-for="(page, idx) in visiblePages" :key="idx" class="page-item" :class="{ active: currentPage === page, disabled: page === '...' }">
            <button class="page-link page-num-btn" @click="changePage(page)">
              {{ page }}
            </button>
          </li>
          
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button class="page-link prev-next-btn" @click="changePage(currentPage + 1)" aria-label="Suivant">
              <span aria-hidden="true">&raquo;</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script>
import { getFinalListPaginated, getOrderByIdCart } from '@/services/commandePanierService'
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
      statusMessageType: 'info',
      currentPage: 1,
      limit: 10,
      totalOrders: 0
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalOrders / this.limit) || 1
    },
    startEntry() {
      if (this.totalOrders === 0) return 0
      return (this.currentPage - 1) * this.limit + 1
    },
    endEntry() {
      const value = this.currentPage * this.limit
      return value > this.totalOrders ? this.totalOrders : value
    },
    visiblePages() {
      const total = this.totalPages
      const current = this.currentPage
      const delta = 2
      const range = []

      for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
        range.push(i)
      }

      if (current - delta > 2) {
        range.unshift('...')
      }
      range.unshift(1)

      if (current + delta < total - 1) {
        range.push('...')
      }
      if (total > 1) {
        range.push(total)
      }

      return range
    }
  },
  async mounted() {
    await this.fetchOrders()
  },
  methods: {
    async fetchOrders() {
      try {
        this.isLoading = true
        this.loadError = ''
        const { orders, total } = await getFinalListPaginated(this.currentPage, this.limit)
        this.orders = orders
        this.totalOrders = total
        this.orders.forEach((order) => {
          order._previousState = Number(order.currentState || 1)
        })
      } catch (error) {
        this.loadError = 'Impossible de charger les commandes'
        console.error('[Commandes] Error while calling getFinalListPaginated():', error)
      } finally {
        this.isLoading = false
      }
    },
    changePage(page) {
      if (page === '...') return
      if (page < 1 || page > this.totalPages) return
      this.currentPage = page
      this.fetchOrders()
    },
    resetAndFetch() {
      this.currentPage = 1
      this.fetchOrders()
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (this.statusMessage === message) {
          this.statusMessage = ''
        }
      }, 5000)
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
          await addOrderHistory(order.id, 4)
          await addOrderHistory(order.id, 5)

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
          return
        }

        await addOrderHistory(order.id, targetStateId)

        order.currentState = 3
        order.status = 'Annulé'
        this.setStatusMessage('Commande annulée.', 'success')
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
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

h2 {
  color: #2c3e50;
  font-weight: 700;
  position: relative;
  padding-bottom: 0.5rem;
}

h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 4px;
  background: linear-gradient(90deg, #007bff, #00d2ff);
  border-radius: 2px;
}

.table-responsive {
  margin-top: 1.5rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.02);
}

.table {
  margin-bottom: 0;
}

.table thead {
  background-color: #2c3e50;
}

.table th {
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: none;
}

.table td {
  font-size: 0.9rem;
  color: #495057;
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f1f3f5;
}

.table tbody tr:hover {
  background-color: #f8f9fa !important;
}

.badge {
  padding: 0.5em 0.8em;
  font-weight: 500;
  border-radius: 6px;
}

.pagination-bar {
  border-top: 1px solid #dee2e6;
  padding-top: 1.5rem;
}

.limit-selector {
  border-left: 1px solid #dee2e6;
  padding-left: 1rem;
}

.limit-dropdown {
  width: auto;
  border-radius: 6px;
  padding: 0.25rem 1.5rem 0.25rem 0.5rem;
  cursor: pointer;
}

.pagination .page-link {
  color: #007bff;
  border: 1px solid #dee2e6;
  padding: 0.375rem 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
}

.pagination .page-link:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
  color: #0056b3;
}

.pagination .page-item.active .page-link {
  background: linear-gradient(135deg, #007bff, #0056b3);
  border-color: #007bff;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 123, 255, 0.25);
}

.pagination .page-item.disabled .page-link {
  color: #6c757d;
  background-color: #fff;
  border-color: #dee2e6;
}

.btn-sm {
  font-size: 0.8rem;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-weight: 500;
}

.btn-info {
  background-color: #17a2b8;
  border-color: #17a2b8;
}

.btn-info:hover {
  background-color: #138496;
  border-color: #117a8b;
}
</style>
