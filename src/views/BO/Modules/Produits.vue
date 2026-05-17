<template>
  <div class="container-fluid py-4 px-4 bg-light min-vh-100">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <span class="badge text-bg-dark mb-2">Backoffice</span>
        <h3 class="mb-1 fw-bold">Liste des produits</h3>
        <p class="text-muted mb-0">Liste alimentée depuis `getProducts()` avec popup d’ajout de stock.</p>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 class="mb-1 fw-bold">Inventaire produits</h5>
          <p class="mb-0 text-muted">Colonnes demandées avec popup d’ajout de stock.</p>
        </div>
        <span class="badge text-bg-secondary">Catalogue API</span>
      </div>

      <div v-if="loading" class="p-4 text-center text-muted">
        Chargement des produits...
      </div>

      <div v-else-if="error" class="p-4">
        <div class="alert alert-danger mb-0">{{ error }}</div>
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Nom</th>
              <th>Référence</th>
              <th>Catégorie</th>
              <th class="text-end">Montant HT</th>
              <th class="text-end">Montant TTC</th>
              <th class="text-center">Quantité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td class="fw-semibold">#{{ product.id }}</td>
              <td>
                <img :src="product.image" :alt="product.name" class="rounded" width="60" height="60" />
              </td>
              <td>
                <div class="fw-semibold">{{ product.name }}</div>
                <small class="text-muted" v-html="product.subtitle"></small>
              </td>
              <td>{{ product.reference }}</td>
              <td><span class="badge text-bg-light border">{{ product.category }}</span></td>
              <td class="text-end">{{ formatPrice(product.priceHT) }} €</td>
              <td class="text-end">{{ formatPrice(product.priceTTC) }} €</td>
              <td class="text-center">
                <span class="badge" :class="stockBadgeClass(product.quantity)">{{ product.quantity }}</span>
              </td>
              <td>
                <div class="d-flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-primary" @click="openAddStock(product)">Ajouter dans le stock</button>
                  <button class="btn btn-sm btn-outline-secondary" @click="viewProduct(product)">Voir</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showModal"
      class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 p-3"
      style="z-index: 2000;"
      @click.self="closeModal"
    >
      <div class="card shadow-lg border-0" style="max-width: 520px; width: 100%;">
        <div class="card-header bg-white border-0 d-flex justify-content-between align-items-start gap-3">
          <div>
            <span class="badge text-bg-dark mb-2">Ajouter dans le stock</span>
            <h5 class="mb-0 fw-bold">{{ selectedProduct.name }}</h5>
          </div>
          <button type="button" class="btn btn-light btn-sm" @click="closeModal">×</button>
        </div>

        <div class="card-body">
          <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
            <img :src="selectedProduct.image" :alt="selectedProduct.name" class="rounded" width="72" height="72" />
            <div>
              <div class="fw-semibold">{{ selectedProduct.name }}</div>
              <div class="text-muted small">Réf. {{ selectedProduct.reference }} · {{ selectedProduct.category }}</div>
              <div class="text-muted small">Quantité actuelle : <strong>{{ selectedProduct.quantity }}</strong></div>
            </div>
          </div>

          <div v-if="hasCombinations" class="mb-3">
            <label class="form-label">Options / Combinaison</label>

            <div v-if="selectedProduct.productOptions && selectedProduct.productOptions.length">
              <div
                v-for="group in selectedProduct.productOptions"
                :key="group.id"
                class="mb-2"
              >
                <label class="form-label small mb-1">{{ group.nom }}</label>

                <div v-if="isColorGroup(group)" class="d-flex gap-2 mb-1">
                  <button
                    v-for="value in group.valeurs"
                    :key="value.id"
                    type="button"
                    class="btn btn-outline-secondary"
                    :class="{ active: isOptionSelected(group.id, value.id) }"
                    :title="value.nom"
                    @click="selectOptionValue(group.id, value.id)"
                    style="padding:6px; min-width:36px"
                  >
                    <span :style="{ display: 'inline-block', width: '16px', height: '16px', background: value.color || '#cbd5e1', borderRadius: '50%' }"></span>
                  </button>
                </div>

                <div v-else class="d-flex gap-2 mb-1">
                  <button
                    v-for="value in group.valeurs"
                    :key="value.id"
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    :class="{ active: isOptionSelected(group.id, value.id) }"
                    @click="selectOptionValue(group.id, value.id)"
                  >
                    {{ value.nom }}
                  </button>
                </div>

                <div v-if="getSelectedOptionLabel(group.id)" class="form-text small">Selected: {{ getSelectedOptionLabel(group.id) }}</div>
              </div>

              <div class="form-text mt-1">La combinaison correspondante sera déterminée automatiquement selon les options sélectionnées.</div>
            </div>

            <div v-else>
              <label class="form-label">Combinaison à mettre à jour</label>
              <select class="form-select" v-model.number="selectedCombinationId">
                <option :value="null" disabled>Choisir une combinaison</option>
                <option v-for="combination in selectedProduct.combinations" :key="combination.id" :value="combination.id">
                  {{ combinationLabel(combination) }}
                </option>
              </select>
            </div>
          </div>

          <div v-else class="alert alert-secondary py-2 mb-3">
            Ce produit n’a pas de combinaison, l’ajout sera automatique sur la fiche produit.
          </div>

          <label class="form-label">Quantité à ajouter</label>
          <input
            type="number"
            class="form-control"
            v-model.number="stockToAdd"
            min="1"
          />

          <div class="alert alert-info mt-3 mb-0 py-2">
            Le stock sera mis à jour directement dans PrestaShop.
          </div>

          <div v-if="modalError" class="alert alert-danger mt-3 mb-0 py-2">
            {{ modalError }}
          </div>
        </div>

        <div class="card-footer bg-white border-0 d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" @click="closeModal">Annuler</button>
          <button class="btn btn-primary" :disabled="savingStock" @click="confirmAddStock">
            {{ savingStock ? 'Enregistrement...' : 'Valider' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Historique de Stock -->
    <div
      v-if="showHistoryModal"
      class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 p-3"
      style="z-index: 2000;"
      @click.self="closeHistoryModal"
    >
      <div class="card shadow-lg border-0" style="max-width: 680px; width: 100%;">
        <div class="card-header bg-white border-0 d-flex justify-content-between align-items-start gap-3">
          <div>
            <span class="badge text-bg-info mb-2 text-white">Historique d'Évolution des Stocks</span>
            <h5 class="mb-0 fw-bold">{{ selectedHistoryProduct.name }}</h5>
          </div>
          <button type="button" class="btn btn-light btn-sm font-monospace" @click="closeHistoryModal">×</button>
        </div>

        <div class="card-body" style="max-height: 480px; overflow-y: auto;">
          <!-- Filtre Date -->
          <div class="d-flex align-items-center justify-content-between bg-light p-3 rounded-3 mb-4 flex-wrap gap-2">
            <div>
              <label class="form-label mb-0 fw-semibold">Sélectionner une date :</label>
              <input
                type="date"
                class="form-control d-inline-block w-auto ms-2"
                v-model="selectedHistoryDate"
              />
            </div>
            <!-- Badges synthèse -->
            <div class="d-flex gap-2">
              <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-10 px-3 py-2 fs-6">
                Entrées : +{{ totalEntries }}
              </span>
              <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10 px-3 py-2 fs-6">
                Sorties : -{{ totalExits }}
              </span>
            </div>
          </div>

          <!-- Loader -->
          <div v-if="historyLoading" class="text-center py-5">
            <div class="spinner-border text-info" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="text-muted mt-2 small">Chargement de l'historique des mouvements...</p>
          </div>

          <!-- Liste des mouvements -->
          <div v-else>
            <div v-if="filteredMovements.length === 0" class="text-center py-5 text-muted">
              Aucun mouvement de stock enregistré pour cette date.
            </div>

            <div v-else class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr class="table-light">
                    <th>Heure</th>
                    <th>Variante</th>
                    <th>Action</th>
                    <th class="text-end">Quantité</th>
                    <th>Motif</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mvt in filteredMovements" :key="mvt.id">
                    <td>{{ formatHistoryTime(mvt.date_add) }}</td>
                    <td>
                      <span v-if="mvt.variantLabel" class="badge text-bg-secondary">{{ mvt.variantLabel }}</span>
                      <span v-else class="text-muted small">Simple</span>
                    </td>
                    <td>
                      <span class="badge" :class="mvt.sign > 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'">
                        {{ mvt.sign > 0 ? 'Entrée' : 'Sortie' }}
                      </span>
                    </td>
                    <td class="text-end fw-bold" :class="mvt.sign > 0 ? 'text-success' : 'text-danger'">
                      {{ mvt.sign > 0 ? '+' : '-' }}{{ mvt.quantity }}
                    </td>
                    <td>
                      <span v-if="mvt.id_order" class="badge text-bg-warning">Commande #{{ mvt.id_order }}</span>
                      <span v-else class="text-muted small">Mise à jour manuelle</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card-footer bg-white border-0 d-flex justify-content-end">
          <button class="btn btn-outline-secondary" @click="closeHistoryModal">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Vue component: Liste des produits (BackOffice)
// Comportement principal:
// - charge les produits via `getProducts()`
// - ouvre un modal pour ajouter du stock (récupère le détail produit à la demande)
// - utilise `updateStockInPrestashop` pour appliquer les changements côté PrestaShop
import { getProducts, getProductDetail } from '../../../services/productService'
import {
  updateStockInPrestashop,
  getStockMovements
} from '../../../services/stockHelperService'

export default {
  name: 'Produits',
  data() {
    return {
      products: [],
      showModal: false,
      selectedProduct: null,
      selectedOptions: {},
      selectedCombinationId: null,
      stockToAdd: 1,
      savingStock: false,
      modalError: null,
      loading: false,
      error: null,
      // Variables historiques de stock
      showHistoryModal: false,
      selectedHistoryProduct: null,
      historyMovements: [],
      selectedHistoryDate: '',
      historyLoading: false
    }
  },
  created() {
    this.loadProducts()
  },
  computed: {
    hasCombinations() {
      return Array.isArray(this.selectedProduct?.combinations) && this.selectedProduct.combinations.length > 0
    },
    filteredMovements() {
      if (!this.selectedHistoryDate) return []
      return this.historyMovements.filter((m) => {
        return String(m.date_add).startsWith(this.selectedHistoryDate)
      })
    },
    totalEntries() {
      return this.filteredMovements
        .filter(m => m.sign > 0)
        .reduce((sum, m) => sum + m.quantity, 0)
    },
    totalExits() {
      return this.filteredMovements
        .filter(m => m.sign < 0)
        .reduce((sum, m) => sum + m.quantity, 0)
    }
  },
  methods: {
    async loadProducts() {
      this.loading = true
      this.error = null

      try {
        const fetchedProducts = await getProducts()
        this.products = fetchedProducts.map((product) => ({
          id: product.id,
          image: product.image,
          name: product.nom || 'Sans nom',
          subtitle: product.description || 'Produit du catalogue',
          reference: product.reference || '',
          category: product.categorie_nom || 'Catégorie inconnue',
          priceHT: Number(product.prix_ht || 0),
          priceTTC: Number(product.prix || product.prix_original || 0),
          quantity: Number(product.inStock ?? 0),
          state: product.statut || 'Inactif',
          combinations: Array.isArray(product.combinations) ? product.combinations : []
        }))
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error)
        this.error = 'Impossible de charger les produits.'
      } finally {
        this.loading = false
      }
    },
    formatPrice(value) {
      return Number(value).toFixed(2)
    },
    stockBadgeClass(quantity) {
      // if (quantity === 0) return 'text-bg-danger'
      // if (quantity < 10) return 'text-bg-warning'
      // return 'text-bg-info'
      return 'text-bg-light border'
    },
    // Ouvre le modal d'ajout de stock et récupère le détail (combinations, options)
    openAddStock(product) {
      this.selectedProduct = { ...product }
      this.selectedCombinationId = null
      this.stockToAdd = 1
      this.modalError = null
      this.selectedOptions = {}
      this.showModal = true

      // fetch product detail (combinations + productOptions) on demand
      ;(async () => {
        try {
          const detail = await getProductDetail(product.id)
          // merge combinations and productOptions into the selectedProduct
          this.selectedProduct.combinations = Array.isArray(detail.combinations) ? detail.combinations : []
          this.selectedProduct.productOptions = Array.isArray(detail.productOptions) ? detail.productOptions : []
          // ensure quantity present
          this.selectedProduct.quantity = Number(this.selectedProduct.quantity ?? detail.inStock ?? 0)
        } catch (err) {
          // Erreurs réseau / API ne bloquent pas l'ouverture du modal
          console.error('Impossible de récupérer le détail produit pour le modal:', err)
        }
      })()
    },
    closeModal() {
      this.showModal = false
      this.selectedProduct = null
      this.selectedCombinationId = null
      this.stockToAdd = 1
      this.savingStock = false
      this.modalError = null
    },
    // Valide et soumet la mise à jour de stock
    // - recherche la combinaison correspondante si options sélectionnées
    // - appelle `updateStockInPrestashop` pour appliquer la modification
    async confirmAddStock() {
      const add = Number(this.stockToAdd) || 0
      const hasCombinations = Array.isArray(this.selectedProduct?.combinations) && this.selectedProduct.combinations.length > 0

      if (add <= 0) {
        this.modalError = 'Entrez une quantité valide.'
        return
      }

      if (!this.selectedProduct) {
        this.modalError = 'Produit introuvable.'
        return
      }

      // If there are product options, compute matching combination from selectedOptions
      const productOptions = Array.isArray(this.selectedProduct?.productOptions) ? this.selectedProduct.productOptions : []
      const selectedOptionValueIds = Object.values(this.selectedOptions).map(v => Number(v)).filter(Number.isFinite)

      let matchingCombination = null
      if (selectedOptionValueIds.length > 0) {
        matchingCombination = (this.selectedProduct.combinations || []).find((comb) => {
          const comboOptionIds = comb.optionValueIds || []
          return selectedOptionValueIds.every(id => comboOptionIds.includes(id))
        }) || null
      }

      // If product has combinations, ensure either a matching combination is found or user selected one
      if (hasCombinations && !matchingCombination && !this.selectedCombinationId) {
        this.modalError = 'Veuillez sélectionner toutes les options pour identifier la combinaison.'
        return
      }

      const selectedCombination = matchingCombination || (hasCombinations ? this.selectedProduct.combinations.find(c => Number(c.id) === Number(this.selectedCombinationId)) : null)

      this.savingStock = true
      this.modalError = null

      try {
        const success = await updateStockInPrestashop(this.selectedProduct.id, selectedCombination?.id || 0, add)

        if (success) {
          // Mise à jour locale de l'UI pour refléter le changement immédiatement
          if (selectedCombination) {
            selectedCombination.inStock = (selectedCombination.inStock || 0) + add
          }
          if (this.selectedProduct) {
             // For the modal UI
            this.selectedProduct.quantity = Number(this.selectedProduct.quantity || 0) + add
          }
          // Update the list reference
          const prodInList = this.products.find(p => p.id === this.selectedProduct.id)
          if (prodInList) {
            prodInList.quantity = Number(prodInList.quantity || 0) + add
          }

          this.savingStock = false
          this.closeModal()
        } else {
          this.modalError = "Erreur de l'API lors de la mise à jour."
          this.savingStock = false
        }
      } catch (err) {
        // Gérer les erreurs réseau / API proprement
        console.error('Erreur API lors de la mise à jour du stock :', err)
        this.modalError = "Erreur de communication avec l'API."
        this.savingStock = false
      }
    },
    combinationLabel(combination) {
      const reference = combination.reference ? ` - ${combination.reference}` : ''
      const stock = typeof combination.inStock !== 'undefined' ? ` (stock: ${combination.inStock})` : ''
      return `Combinaison #${combination.id}${reference}${stock}`
    },
    isColorGroup(group) {
      return String(group?.type || '').toLowerCase() === 'color'
    },
    isOptionSelected(groupId, valueId) {
      return this.selectedOptions[groupId] === valueId
    },
    selectOptionValue(groupId, valueId) {
      this.selectedOptions = {
        ...this.selectedOptions,
        [groupId]: valueId
      }
    },
    getSelectedOptionLabel(groupId) {
      const group = (this.selectedProduct?.productOptions || []).find(g => g.id === groupId)
      const selectedValueId = this.selectedOptions[groupId]
      const selectedValue = group?.valeurs?.find(v => v.id === selectedValueId)
      return selectedValue?.nom || ''
    },
    async viewProduct(product) {
      // 1. Initialiser le state
      this.selectedHistoryProduct = { ...product }
      this.selectedHistoryDate = new Date().toISOString().split('T')[0] // Aujourd'hui
      this.historyMovements = []
      this.historyLoading = true
      this.showHistoryModal = true

      try {
        // 2. Charger les mouvements de stock depuis l'API PrestaShop
        const movements = await getStockMovements(product.id)
        
        // 3. Charger le détail produit pour décoder les déclinaisons si nécessaire
        const detail = await getProductDetail(product.id)
        this.selectedHistoryProduct.combinations = Array.isArray(detail?.combinations) ? detail.combinations : []

        // 4. Mapper les étiquettes de déclinaison sur chaque mouvement
        this.historyMovements = movements.map((mvt) => {
          let variantLabel = ''
          if (mvt.id_product_attribute > 0) {
            const comb = this.selectedHistoryProduct.combinations.find(c => Number(c.id) === Number(mvt.id_product_attribute))
            variantLabel = comb?.reference || `Déclinaison #${mvt.id_product_attribute}`
          }
          return {
            ...mvt,
            variantLabel
          }
        })
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique des stocks:', error)
      } finally {
        this.historyLoading = false
      }
    },
    closeHistoryModal() {
      this.showHistoryModal = false
      this.selectedHistoryProduct = null
      this.historyMovements = []
    },
    formatHistoryTime(dateString) {
      if (!dateString) return '-'
      const parts = dateString.split(' ')
      if (parts.length > 1) {
        // Retourne juste HH:MM:SS
        return parts[1]
      }
      return dateString
    }
  }
}
</script>
