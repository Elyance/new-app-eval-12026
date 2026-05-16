<template>
  <div class="dashboard-page">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
      <div>
        <h2 class="mb-1">Tableau de bord des commandes</h2>
        <p class="text-muted mb-0">Vue par jour et total général.</p>
      </div>
      <router-link class="btn btn-outline-secondary" to="/backoffice/modules/commandes">Retour aux commandes</router-link>
    </div>

    <div v-if="isLoading" class="alert alert-info mb-4">
      Chargement du tableau de bord...
    </div>

    <div v-else-if="loadError" class="alert alert-warning mb-4">
      {{ loadError }}
    </div>

    <template v-else>
      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="table-dark">
                <tr>
                  <th>Par jour</th>
                  <th>Nb de commande</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in dashboardRows" :key="row.date">
                  <td>{{ row.date }}</td>
                  <td>{{ row.nbCommande }}</td>
                  <td class="fw-bold">{{ formatCurrency(row.montant) }}</td>
                </tr>
              </tbody>
              <tfoot class="table-light">
                <tr>
                  <th>Total général</th>
                  <th>{{ totalOrders }}</th>
                  <th class="fw-bold">{{ formatCurrency(totalGeneral.montant) }}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { getDataForTB } from '@/services/commandeTBService'

export default {
  name: 'TableauBord',
  data() {
    return {
      dashboardRows: [],
      totalGeneral: {
        nbCommande: 0,
        montant: 0
      },
      isLoading: false,
      loadError: ''
    }
  },
  async mounted() {
    try {
      this.isLoading = true
      const dataForTB = await getDataForTB()
      console.log('[TableauBord] getDataForTB() return:', dataForTB)
      console.log('[TableauBord] JSON preview:', JSON.stringify(dataForTB, null, 2))

      this.dashboardRows = Array.isArray(dataForTB.dailyStats) ? dataForTB.dailyStats : []
      this.totalGeneral = dataForTB.totalGeneral || { nbCommande: 0, montant: 0 }
    } catch (error) {
      this.loadError = 'Impossible de charger les données du tableau de bord'
      console.error('[TableauBord] Error while calling getDataForTB():', error)
    } finally {
      this.isLoading = false
    }
  },
  computed: {
    totalOrders() {
      return this.totalGeneral.nbCommande
    },
    averageOrderAmount() {
      return this.totalOrders ? this.totalGeneral.montant / this.totalOrders : 0
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(Number(value || 0))
    }
  }
}
</script>

<style scoped>
.dashboard-page {
  padding: 2rem;
  background: white;
  border-radius: 8px;
}
</style>
