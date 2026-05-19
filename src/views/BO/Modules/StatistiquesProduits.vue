<template>
  <div class="statistics-page">
    <!-- Header Section with beautiful gradient background -->
    <div class="stats-header p-4 mb-4 text-white rounded-3 shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-3">
      <div>
        <h2 class="mb-1 fw-bold">Statistiques par Produit</h2>
        <p class="mb-0 text-white-50">Analyse détaillée des performances, coûts d'achat et rentabilité de chaque produit.</p>
      </div>
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <router-link to="/backoffice/modules/statistiques" class="btn btn-outline-light d-flex align-items-center gap-2 fw-semibold shadow-sm">
          <i class="bi bi-arrow-left"></i>
          Voir par Catégorie
        </router-link>
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
        <p class="mt-3 text-muted fw-medium">Calcul des performances produits en cours...</p>
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
        <div class="col-md-6 col-lg-3">
          <div class="card kpi-card border-0 shadow-sm rounded-3 overflow-hidden h-100">
            <div class="card-body p-4 position-relative">
              <div class="kpi-icon bg-primary-subtle text-primary mb-3 rounded-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-cash-stack fs-4"></i>
              </div>
              <h6 class="text-uppercase text-muted fw-bold mb-2">Ventes (HT)</h6>
              <h3 class="fw-bold mb-0 text-dark">{{ formatCurrency(globalTotals.totalSalesHt) }}</h3>
              <div class="progress mt-3" style="height: 4px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: 100%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Coût d'Achat HT -->
        <div class="col-md-6 col-lg-3">
          <div class="card kpi-card border-0 shadow-sm rounded-3 overflow-hidden h-100">
            <div class="card-body p-4 position-relative">
              <div class="kpi-icon bg-danger-subtle text-danger mb-3 rounded-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-cart-dash fs-4"></i>
              </div>
              <h6 class="text-uppercase text-muted fw-bold mb-2">Achats (HT)</h6>
              <h3 class="fw-bold mb-0 text-dark">{{ formatCurrency(globalTotals.totalPurchaseHt) }}</h3>
              <div class="progress mt-3" style="height: 4px;">
                <div class="progress-bar bg-danger" role="progressbar" :style="{ width: purchaseRatio + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bénéfice Net HT -->
        <div class="col-md-6 col-lg-3">
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
                <div class="progress-bar bg-success" role="progressbar" :style="{ width: profitRatio + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quantité totale vendue -->
        <div class="col-md-6 col-lg-3">
          <div class="card kpi-card border-0 shadow-sm rounded-3 overflow-hidden h-100">
            <div class="card-body p-4 position-relative">
              <div class="kpi-icon bg-info-subtle text-info mb-3 rounded-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-box-seam fs-4"></i>
              </div>
              <h6 class="text-uppercase text-muted fw-bold mb-2">Articles Vendus</h6>
              <h3 class="fw-bold mb-0 text-dark">{{ globalTotals.totalQtySold }} u.</h3>
              <div class="progress mt-3" style="height: 4px;">
                <div class="progress-bar bg-info" role="progressbar" style="width: 100%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Performance Card -->
      <div class="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <div class="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 class="mb-0 fw-bold text-dark">Répartition par produit</h5>
          
          <!-- Search input -->
          <div class="search-box">
            <div class="input-group input-group-sm" style="max-width: 300px;">
              <span class="input-group-text bg-light border-end-0"><i class="bi bi-search"></i></span>
              <input v-model="searchQuery" type="text" class="form-control bg-light border-start-0" placeholder="Rechercher produit..." @input="resetPagination">
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 custom-table">
            <thead class="table-light-premium text-uppercase text-muted small">
              <tr>
                <th class="ps-4 py-3 sortable-th" @click="toggleSort('id')">
                  ID
                  <i class="bi" :class="getSortIcon('id')"></i>
                </th>
                <th class="py-3 sortable-th" @click="toggleSort('reference')">
                  Réf
                  <i class="bi" :class="getSortIcon('reference')"></i>
                </th>
                <th class="py-3 sortable-th" @click="toggleSort('name')">
                  Nom
                  <i class="bi" :class="getSortIcon('name')"></i>
                </th>
                <th class="py-3 text-end sortable-th" @click="toggleSort('qtySold')">
                  Qté Vendue
                  <i class="bi" :class="getSortIcon('qtySold')"></i>
                </th>
                <th class="py-3 text-end sortable-th" @click="toggleSort('totalSalesHt')">
                  Ventes (HT)
                  <i class="bi" :class="getSortIcon('totalSalesHt')"></i>
                </th>
                <th class="py-3 text-end sortable-th" @click="toggleSort('totalPurchaseHt')">
                  Coût Achat (HT)
                  <i class="bi" :class="getSortIcon('totalPurchaseHt')"></i>
                </th>
                <th class="pe-4 py-3 text-end sortable-th" @click="toggleSort('totalProfit')">
                  Bénéfice
                  <i class="bi" :class="getSortIcon('totalProfit')"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prod in paginatedProducts" :key="prod.id">
                <td class="ps-4 py-3 text-secondary small">#{{ prod.id }}</td>
                <td class="py-3 text-muted"><code>{{ prod.reference || '-' }}</code></td>
                <td class="py-3 fw-semibold text-dark">{{ prod.name }}</td>
                <td class="py-3 text-end fw-medium" :class="prod.qtySold > 0 ? 'text-dark' : 'text-muted'">{{ prod.qtySold }}</td>
                <td class="py-3 text-end fw-semibold text-dark">{{ formatCurrency(prod.totalSalesHt) }}</td>
                <td class="py-3 text-end text-muted">{{ formatCurrency(prod.totalPurchaseHt) }}</td>
                <td class="pe-4 py-3 text-end fw-bold" :class="prod.totalProfit >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(prod.totalProfit) }}
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-2 mb-2 d-block"></i>
                  Aucun produit trouvé.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div v-if="filteredProducts.length > 0" class="d-flex justify-content-between align-items-center flex-wrap gap-3 p-3 border-top bg-light-subtle">
          <div class="d-flex align-items-center gap-3">
            <span class="text-muted small">
              Affichage de <strong>{{ startEntry }}</strong> à <strong>{{ endEntry }}</strong> sur <strong>{{ filteredProducts.length }}</strong> produits
            </span>
            <div class="d-flex align-items-center gap-2 limit-selector">
              <span class="text-muted small text-nowrap">Afficher</span>
              <select v-model="limit" class="form-select form-select-sm limit-dropdown" @change="resetPagination">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
              <span class="text-muted small text-nowrap">par page</span>
            </div>
          </div>
          
          <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="changePage(currentPage - 1)" aria-label="Précédent">
                  <span aria-hidden="true">&laquo;</span>
                </button>
              </li>
              
              <li v-for="(page, idx) in visiblePages" :key="idx" class="page-item" :class="{ active: currentPage === page, disabled: page === '...' }">
                <button class="page-link" @click="changePage(page)">
                  {{ page }}
                </button>
              </li>
              
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="changePage(currentPage + 1)" aria-label="Suivant">
                  <span aria-hidden="true">&raquo;</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getProductSalesStats } from '@/services/statsService'

export default {
  name: 'StatistiquesProduits',
  data() {
    return {
      productsStats: [],
      globalTotals: {
        totalSalesHt: 0,
        totalPurchaseHt: 0,
        totalProfit: 0,
        totalQtySold: 0
      },
      searchQuery: '',
      sortKey: 'totalSalesHt',
      sortOrder: 'desc',
      currentPage: 1,
      limit: 10,
      isLoading: false,
      error: null
    }
  },
  computed: {
    purchaseRatio() {
      if (!this.globalTotals.totalSalesHt) return 0
      return Math.min(100, Math.round((this.globalTotals.totalPurchaseHt / this.globalTotals.totalSalesHt) * 100))
    },
    profitRatio() {
      if (!this.globalTotals.totalSalesHt) return 0
      return Math.min(100, Math.round((this.globalTotals.totalProfit / this.globalTotals.totalSalesHt) * 100))
    },
    filteredProducts() {
      let result = [...this.productsStats]

      // Appliquer le filtre de recherche
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim()
        result = result.filter(p => 
          p.name.toLowerCase().includes(query) || 
          (p.reference && p.reference.toLowerCase().includes(query)) ||
          p.id.includes(query)
        )
      }

      // Appliquer le tri
      result.sort((a, b) => {
        let valA = a[this.sortKey]
        let valB = b[this.sortKey]

        // Gestion du cas où le champ est textuel
        if (typeof valA === 'string') {
          valA = valA.toLowerCase()
          valB = valB.toLowerCase()
        }

        if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1
        if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1
        return 0
      })

      return result
    },
    totalPages() {
      return Math.ceil(this.filteredProducts.length / this.limit) || 1
    },
    startEntry() {
      if (this.filteredProducts.length === 0) return 0
      return (this.currentPage - 1) * this.limit + 1
    },
    endEntry() {
      const value = this.currentPage * this.limit
      return value > this.filteredProducts.length ? this.filteredProducts.length : value
    },
    paginatedProducts() {
      const start = (this.currentPage - 1) * this.limit
      return this.filteredProducts.slice(start, start + this.limit)
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
    await this.loadStats()
  },
  methods: {
    async loadStats() {
      try {
        this.isLoading = true
        this.error = null
        const data = await getProductSalesStats()
        this.productsStats = data.productsStats || []
        this.globalTotals = data.globalTotals || { totalSalesHt: 0, totalPurchaseHt: 0, totalProfit: 0, totalQtySold: 0 }
      } catch (err) {
        console.error('[StatistiquesProduits] Erreur de récupération des statistiques produits:', err)
        this.error = 'Impossible de charger les statistiques par produit. Assurez-vous d’avoir configuré la liaison API.'
      } finally {
        this.isLoading = false
      }
    },
    toggleSort(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortKey = key
        this.sortOrder = 'desc' // Default descend pour les statistiques
      }
      this.resetPagination()
    },
    getSortIcon(key) {
      if (this.sortKey !== key) return 'bi-arrow-down-up text-muted small'
      return this.sortOrder === 'asc' ? 'bi-sort-up text-primary' : 'bi-sort-down text-primary'
    },
    changePage(page) {
      if (page === '...') return
      if (page < 1 || page > this.totalPages) return
      this.currentPage = page
    },
    resetPagination() {
      this.currentPage = 1
    },
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
.statistics-page {
  padding: 1rem;
}

.stats-header {
  background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
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

.sortable-th {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.sortable-th:hover {
  background-color: #f1f5f9;
}

.sortable-th i {
  margin-left: 4px;
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

.progress {
  background-color: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}
</style>
