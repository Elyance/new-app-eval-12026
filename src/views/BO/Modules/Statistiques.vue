<template>
  <div class="statistics-page">
    <!-- Header Section with beautiful gradient background -->
    <div class="stats-header p-4 mb-4 text-white rounded-3 shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-3">
      <div>
        <h2 class="mb-1 fw-bold">Statistiques & Rentabilité</h2>
        <p class="mb-0 text-white-50">Analyse détaillée du chiffre d'affaires, des coûts d'achat et des bénéfices par catégorie.</p>
      </div>
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <button class="btn btn-light btn-refresh d-flex align-items-center gap-2 fw-semibold shadow-sm" @click="loadStats" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <i v-else class="bi bi-arrow-clockwise"></i>
          {{ isLoading ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-content-center align-items-center py-5">
      <div class="text-center">
        <div class="spinner-grow text-primary" style="width: 3rem; height: 3rem;" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="mt-3 text-muted fw-medium">Calcul des performances en cours...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger shadow-sm border-0 d-flex align-items-center gap-3 p-4 mb-4" role="alert">
      <i class="bi bi-exclamation-triangle-fill fs-3"></i>
      <div>
        <h5 class="alert-heading fw-bold mb-1">Erreur de chargement</h5>
        <p class="mb-0">{{ error }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- KPI Widgets Grid -->
      <div class="row g-4 mb-4">
        <!-- Ventes HT -->
        <div class="col-md-4">
          <div class="card kpi-card border-0 shadow-sm rounded-3 overflow-hidden h-100">
            <div class="card-body p-4 position-relative">
              <div class="kpi-icon bg-primary-subtle text-primary mb-3 rounded-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-cash-stack fs-4"></i>
              </div>
              <h6 class="text-uppercase text-muted fw-bold mb-2">Ventes (HT)</h6>
              <h3 class="fw-bold mb-0 text-dark">{{ formatCurrency(globalTotals.totalSalesHt) }}</h3>
              <div class="progress mt-3" style="height: 4px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Coût d'Achat HT -->
        <div class="col-md-4">
          <div class="card kpi-card border-0 shadow-sm rounded-3 overflow-hidden h-100">
            <div class="card-body p-4 position-relative">
              <div class="kpi-icon bg-danger-subtle text-danger mb-3 rounded-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-cart-dash fs-4"></i>
              </div>
              <h6 class="text-uppercase text-muted fw-bold mb-2">Achats (HT)</h6>
              <h3 class="fw-bold mb-0 text-dark">{{ formatCurrency(globalTotals.totalPurchaseHt) }}</h3>
              <div class="progress mt-3" style="height: 4px;">
                <div class="progress-bar bg-danger" role="progressbar" :style="{ width: purchaseRatio + '%' }" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bénéfice Net HT -->
        <div class="col-md-4">
          <div class="card kpi-card border-0 shadow-sm rounded-3 overflow-hidden h-100">
            <div class="card-body p-4 position-relative">
              <div class="kpi-icon bg-success-subtle text-success mb-3 rounded-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-graph-up-arrow fs-4"></i>
              </div>
              <h6 class="text-uppercase text-muted fw-bold mb-2">Bénéfice global</h6>
              <h3 class="fw-bold mb-0" :class="globalTotals.totalProfit >= 0 ? 'text-success' : 'text-danger'">
                {{ formatCurrency(globalTotals.totalProfit) }}
              </h3>
              <div class="progress mt-3" style="height: 4px;">
                <div class="progress-bar bg-success" role="progressbar" :style="{ width: profitRatio + '%' }" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance by Category -->
      <div class="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <div class="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold text-dark">Répartition par catégorie de produit</h5>
          <span class="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill fw-medium">
            {{ categoriesStats.length }} catégories actives
          </span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 custom-table">
            <thead class="table-light-premium text-uppercase text-muted small">
              <tr>
                <th class="ps-4 py-3">Catégorie</th>
                <th class="py-3 text-end">Ventes (HT)</th>
                <th class="py-3 text-end">Coût Achat (HT)</th>
                <th class="pe-4 py-3 text-end">Bénéfice</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in categoriesStats" :key="cat.categoryName">
                <td class="ps-4 py-3 fw-semibold text-dark">{{ cat.categoryName }}</td>
                <td class="py-3 text-end fw-semibold text-dark">{{ formatCurrency(cat.totalSalesHt) }}</td>
                <td class="py-3 text-end text-muted">{{ formatCurrency(cat.totalPurchaseHt) }}</td>
                <td class="pe-4 py-3 text-end fw-bold" :class="cat.totalProfit >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(cat.totalProfit) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Stocks by Category -->
      <div class="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <div class="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold text-dark">État des Stocks par Catégorie</h5>
          <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-medium">
            Volumes globaux : {{ totalPhysicalStock }} physiques
          </span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 custom-table">
            <thead class="table-light-premium text-uppercase text-muted small">
              <tr>
                <th class="ps-4 py-3">Catégorie</th>
                <th class="py-3 text-end">Qté physique</th>
                <th class="py-3 text-end">Qté reservé</th>
                <th class="pe-4 py-3 text-end">Qté disponible</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in categoriesStats" :key="'stock-' + cat.categoryName">
                <td class="ps-4 py-3 fw-semibold text-dark">{{ cat.categoryName }}</td>
                <td class="py-3 text-end fw-bold text-dark">{{ cat.qtyPhysical }}</td>
                <td class="py-3 text-end text-warning-emphasis fw-medium">{{ cat.qtyReserved }}</td>
                <td class="pe-4 py-3 text-end fw-semibold" :class="cat.qtyAvailable > 0 ? 'text-success' : 'text-danger'">
                  {{ cat.qtyAvailable }}
                </td>
              </tr>
            </tbody>
            <tfoot class="table-light border-top">
              <tr class="fw-bold text-dark">
                <td class="ps-4 py-3">Total Général</td>
                <td class="py-3 text-end">{{ globalTotals.globalQtyPhysical || 0 }}</td>
                <td class="py-3 text-end text-warning-emphasis">{{ globalTotals.globalQtyReserved || 0 }}</td>
                <td class="pe-4 py-3 text-end text-success">{{ globalTotals.globalQtyAvailable || 0 }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getCategoryStats } from '@/services/statsService'

export default {
  name: 'Statistiques',
  data() {
    return {
      categoriesStats: [],
      globalTotals: {
        totalSalesHt: 0,
        totalPurchaseHt: 0,
        totalProfit: 0,
        globalQtyPhysical: 0,
        globalQtyReserved: 0,
        globalQtyAvailable: 0
      },
      isLoading: false,
      error: null
    }
  },
  computed: {
    totalPhysicalStock() {
      return this.categoriesStats.reduce((sum, cat) => sum + (cat.qtyPhysical || 0), 0)
    },
    globalMargin() {
      if (!this.globalTotals.totalSalesHt) return '0.0'
      const margin = (this.globalTotals.totalProfit / this.globalTotals.totalSalesHt) * 100
      return margin.toFixed(1)
    },
    purchaseRatio() {
      if (!this.globalTotals.totalSalesHt) return 0
      return Math.min(100, Math.round((this.globalTotals.totalPurchaseHt / this.globalTotals.totalSalesHt) * 100))
    },
    profitRatio() {
      if (!this.globalTotals.totalSalesHt) return 0
      return Math.min(100, Math.round((this.globalTotals.totalProfit / this.globalTotals.totalSalesHt) * 100))
    }
  },
  async mounted() {
    await this.loadStats()
  },
  methods: {
    async loadStats() {
      try {
        this.isLoading = true
        this.error = null
        const data = await getCategoryStats()
        this.categoriesStats = data.categoriesStats || []
        this.globalTotals = data.globalTotals || { totalSalesHt: 0, totalPurchaseHt: 0, totalProfit: 0 }
      } catch (err) {
        console.error('[Statistiques] Erreur lors de la récupération des statistiques :', err)
        this.error = 'Impossible de calculer les statistiques de ventes. Vérifiez votre connexion à la base de données PrestaShop.'
      } finally {
        this.isLoading = false
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(Number(value || 0))
    },
    calculateMargin(cat) {
      if (!cat.totalSalesHt) return '0.0'
      return ((cat.totalProfit / cat.totalSalesHt) * 100).toFixed(1)
    },
    getSalesPercentage(catSales) {
      if (!this.globalTotals.totalSalesHt) return '0.0'
      return ((catSales / this.globalTotals.totalSalesHt) * 100).toFixed(1)
    },
    getMarginBadgeClass(margin) {
      const parsed = parseFloat(margin)
      if (parsed >= 40) return 'text-bg-success'
      if (parsed >= 20) return 'text-bg-info text-dark'
      if (parsed > 0) return 'text-bg-warning text-dark'
      return 'text-bg-danger'
    }
  }
}
</script>

<style scoped>
.statistics-page {
  padding: 1rem;
}

.stats-header {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  border: none;
}

.btn-refresh {
  transition: all 0.2s ease-in-out;
  border: none;
}

.btn-refresh:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255,255,255,0.15) !important;
}

.kpi-card {
  transition: all 0.3s ease;
  background-color: white;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05) !important;
}

.kpi-icon {
  width: 48px;
  height: 48px;
}

.table-light-premium {
  background-color: #f8fafc;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
}

.custom-table tbody tr {
  transition: background-color 0.15s ease;
}

.custom-table tbody tr:hover {
  background-color: #f8fafc;
}

.badge {
  font-size: 0.8rem;
  letter-spacing: 0.25px;
}

.progress {
  background-color: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}
</style>
