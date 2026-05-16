<template>
  <div class="container-fluid py-4 px-4 bg-light min-vh-100">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <span class="badge text-bg-dark mb-2">Backoffice</span>
        <h3 class="mb-1 fw-bold">Liste des produits</h3>
        <p class="text-muted mb-0">Liste alimentée depuis `getProducts()` avec popup d’ajout de stock.</p>
      </div>

      <div class="d-flex gap-2 flex-wrap">
        <div class="card border-0 shadow-sm">
          <div class="card-body py-2 px-3">
            <small class="text-muted d-block">Produits</small>
            <strong>{{ products.length }}</strong>
          </div>
        </div>
        <div class="card border-0 shadow-sm bg-dark text-white">
          <div class="card-body py-2 px-3">
            <small class="text-white-50 d-block">Actifs</small>
            <strong>{{ activeCount }}</strong>
          </div>
        </div>
        <div class="card border-0 shadow-sm">
          <div class="card-body py-2 px-3">
            <small class="text-muted d-block">Stock total</small>
            <strong>{{ totalStock }}</strong>
          </div>
        </div>
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
            Cette version reste statique, le bouton modifie seulement la liste locale pour l’instant.
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
  </div>
</template>

<script>
import { getProducts, getProductDetail } from '../../../services/productService'
import {
  computeMatchingCombination,
  buildStockMovementPayload,
  buildStockAvailablePayload,
  generateStockMovementXml,
  generateStockAvailableXml
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
      error: null
    }
  },
  created() {
    this.loadProducts()
  },
  computed: {
    activeCount() {
      return this.products.filter(product => product.state === 'Actif').length
    },
    totalStock() {
      return this.products.reduce((sum, product) => sum + Number(product.quantity || 0), 0)
    },
    hasCombinations() {
      return Array.isArray(this.selectedProduct?.combinations) && this.selectedProduct.combinations.length > 0
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
      if (quantity === 0) return 'text-bg-danger'
      if (quantity < 10) return 'text-bg-warning'
      return 'text-bg-info'
    },
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
    confirmAddStock() {
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

      // Determine current quantity before update
      const qttBefore = selectedCombination?.inStock ?? Number(this.selectedProduct.quantity ?? 0)

      // Build example payloads (not sent) using helper service and log them
      const stockMovementPayload = buildStockMovementPayload({
        productId: this.selectedProduct.id,
        combinationId: selectedCombination?.id || 0,
        quantity: add,
        note: 'Ajout effectué depuis BO (simulé)'
      })

      const stockAvailablePayload = buildStockAvailablePayload({
        productId: this.selectedProduct.id,
        combinationId: selectedCombination?.id || 0,
        quantity: qttBefore + add
      })

      try {
        const xmlStockMovement = generateStockMovementXml(stockMovementPayload)
        const xmlStockAvailable = generateStockAvailableXml(stockAvailablePayload)

        console.log('Ajout de stock (simulation) — données :', {
          productId: this.selectedProduct.id,
          productName: this.selectedProduct.name,
          quantityToAdd: add,
          mode: hasCombinations ? 'combination' : 'automatic',
          selectedCombination,
          qttBefore,
          xmlStockMovement,
          xmlStockAvailable
        })
      } catch (err) {
        console.error('Erreur lors de la génération des XML de simulation :', err)
      }

      // locally update view (simulate)
      setTimeout(() => {
        if (selectedCombination) {
          selectedCombination.inStock = (selectedCombination.inStock || 0) + add
        } else if (this.selectedProduct) {
          this.selectedProduct.quantity = Number(this.selectedProduct.quantity || 0) + add
        }
        this.savingStock = false
        this.closeModal()
      }, 450)
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
    viewProduct(product) {
      alert(`Produit: ${product.name} (réf ${product.reference})`)
    }
  }
}
</script>
