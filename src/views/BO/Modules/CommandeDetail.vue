<template>
  <div class="commande-detail-page">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1">Détail de la commande</h2>
        <p class="text-muted mb-0">Aperçu statique du panier/commande sélectionné.</p>
      </div>
      <button class="btn btn-outline-secondary" @click="goBack">Retour</button>
    </div>

    <div v-if="isLoading" class="alert alert-info">Chargement du détail...</div>
    <div v-else-if="loadError" class="alert alert-danger">{{ loadError }}</div>

    <div v-else>
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Commande</h5>
              <p class="mb-1"><strong>ID commande:</strong> {{ detail.order?.id || '-' }}</p>
              <p class="mb-1"><strong>ID panier:</strong> {{ detail.cartId }}</p>
              <p class="mb-1"><strong>Référence:</strong> {{ detail.order?.reference || '-' }}</p>
              <p class="mb-1"><strong>État:</strong> {{ detail.stateName }}</p>
              <p class="mb-1"><strong>Paiement:</strong> {{ detail.order?.payment || '-' }}</p>
              <p class="mb-0"><strong>Total:</strong> {{ formatCurrency(detail.order?.total_paid || 0) }}</p>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Client et transporteur</h5>
              <p class="mb-1"><strong>Client:</strong> {{ detail.customerName || '-' }}</p>
              <p class="mb-1"><strong>Transporteur:</strong> {{ detail.carrierName || '-' }}</p>
              <p class="mb-1"><strong>Date:</strong> {{ formatDate(detail.order?.date_add) }}</p>
              <p class="mb-0"><strong>Nouveau client:</strong> {{ isNewCustomer ? 'Oui' : 'Non' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-4 shadow-sm">
        <div class="card-body">
          <h5 class="card-title mb-3">Lignes de commande</h5>
          <div v-if="orderRows.length === 0" class="text-muted">Aucune ligne de commande.</div>
          <div v-else class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Référence</th>
                  <th>Quantité</th>
                  <th>Prix</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in orderRows" :key="row.id">
                  <td>{{ row.product_name || '-' }}</td>
                  <td>{{ row.product_reference || '-' }}</td>
                  <td>{{ row.product_quantity || 0 }}</td>
                  <td>{{ formatCurrency(row.product_price || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getCommandeDetail } from '@/services/commandePanierService'

export default {
  name: 'CommandeDetail',
  data() {
    return {
      detail: {},
      isLoading: false,
      loadError: ''
    }
  },
  computed: {
    orderRows() {
      return this.detail?.order?.associations?.order_rows || []
    },
    isNewCustomer() {
      return Number(this.detail?.cart?.id_customer || 0) === 0
    }
  },
  async mounted() {
    const idCart = Number(this.$route.params.id_cart)

    try {
      this.isLoading = true
      const detail = await getCommandeDetail(idCart)
      this.detail = detail || {}
      console.log('[CommandeDetail] getCommandeDetail() return:', detail)
      console.log('[CommandeDetail] JSON preview:', JSON.stringify(detail, null, 2))
    } catch (error) {
      this.loadError = 'Impossible de charger le détail de la commande'
      console.error('[CommandeDetail] Error while calling getCommandeDetail():', error)
    } finally {
      this.isLoading = false
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(Number(value || 0))
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('fr-FR')
    },
    goBack() {
      this.$router.push('/backoffice/modules/commandes')
    }
  }
}
</script>

<style scoped>
.commande-detail-page {
  padding: 2rem;
  background: white;
  border-radius: 8px;
}
</style>
