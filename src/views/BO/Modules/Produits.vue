<template>
  <div class="container-fluid py-4 px-4 bg-light min-vh-100">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <span class="badge text-bg-dark mb-2">Backoffice</span>
        <h3 class="mb-1 fw-bold">Liste des produits</h3>
        <p class="text-muted mb-0">Vue statique avec ajout de stock simulé.</p>
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
        <span class="badge text-bg-secondary">Données statiques</span>
      </div>

      <div class="table-responsive">
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
              <th>État</th>
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
                <small class="text-muted">{{ product.subtitle }}</small>
              </td>
              <td>{{ product.reference }}</td>
              <td><span class="badge text-bg-light border">{{ product.category }}</span></td>
              <td class="text-end">{{ formatPrice(product.priceHT) }} €</td>
              <td class="text-end">{{ formatPrice(product.priceTTC) }} €</td>
              <td class="text-center">
                <span class="badge" :class="stockBadgeClass(product.quantity)">{{ product.quantity }}</span>
              </td>
              <td>
                <span class="badge" :class="product.state === 'Actif' ? 'text-bg-success' : 'text-bg-danger'">
                  {{ product.state }}
                </span>
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

          <label class="form-label">Quantité à ajouter</label>
          <input
            type="number"
            class="form-control"
            v-model.number="stockToAdd"
            min="1"
          />

          <div class="alert alert-info mt-3 mb-0 py-2">
            Cette version est statique pour le moment.
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
export default {
  name: 'Produits',
  data() {
    return {
      products: [
        {
          id: 1001,
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80',
          name: 'Veste Atelier',
          subtitle: 'Collection capsule 2026',
          reference: 'AT-1001',
          category: 'Prêt-à-porter',
          priceHT: 79.9,
          priceTTC: 95.88,
          quantity: 24,
          state: 'Actif'
        },
        {
          id: 1002,
          image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=200&q=80',
          name: 'Sac Nœud',
          subtitle: 'Accessoire signature',
          reference: 'AC-1002',
          category: 'Accessoires',
          priceHT: 34.5,
          priceTTC: 41.4,
          quantity: 8,
          state: 'Actif'
        },
        {
          id: 1003,
          image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=200&q=80',
          name: 'Bougie Atelier',
          subtitle: 'Edition limitée',
          reference: 'AT-1003',
          category: 'Maison',
          priceHT: 19.9,
          priceTTC: 23.88,
          quantity: 0,
          state: 'Rupture'
        },
        {
          id: 1004,
          image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=200&q=80',
          name: 'T-shirt Studio',
          subtitle: 'Basiques premium',
          reference: 'TS-1004',
          category: 'Prêt-à-porter',
          priceHT: 29.9,
          priceTTC: 35.88,
          quantity: 17,
          state: 'Actif'
        }
      ],
      showModal: false,
      selectedProduct: null,
      stockToAdd: 1,
      savingStock: false,
      modalError: null
    }
  },
  computed: {
    activeCount() {
      return this.products.filter(product => product.state === 'Actif').length
    },
    totalStock() {
      return this.products.reduce((sum, product) => sum + Number(product.quantity || 0), 0)
    }
  },
  methods: {
    formatPrice(value) {
      return Number(value).toFixed(2)
    },
    stockBadgeClass(quantity) {
      if (quantity === 0) return 'text-bg-danger'
      if (quantity < 10) return 'text-bg-warning'
      return 'text-bg-info'
    },
    openAddStock(product) {
      this.selectedProduct = product
      this.stockToAdd = 1
      this.modalError = null
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.selectedProduct = null
      this.stockToAdd = 1
      this.savingStock = false
      this.modalError = null
    },
    confirmAddStock() {
      const add = Number(this.stockToAdd) || 0

      if (add <= 0) {
        this.modalError = 'Entrez une quantité valide.'
        return
      }

      if (!this.selectedProduct) {
        this.modalError = 'Produit introuvable.'
        return
      }

      this.savingStock = true
      this.modalError = null

      setTimeout(() => {
        this.selectedProduct.quantity += add
        this.savingStock = false
        this.closeModal()
      }, 450)
    },
    viewProduct(product) {
      alert(`Produit: ${product.name} (réf ${product.reference})`)
    }
  }
}
</script>
