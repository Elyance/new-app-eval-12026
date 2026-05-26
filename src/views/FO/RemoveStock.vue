<!-- <template>
   <div>
        <label for="delta">Entrer la valeur delta : </label>
        <input 
            v-model.number="deltaValue" 
            type="number" 
            id="delta"
            placeholder="0"
        >
   </div>
    <div>
        <label>Catégories</label>
        <select v-model="searchCriteria.categoryId" @change="handleSearch">
          <option value="">Selectionner une categorie </option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.nom }}</option>
        </select>
    </div>
  <div class="popup-actions">
    <button @click="handleRemove" class="btn btn-primary">Remove</button>
  </div>
</template>
<script setup>
import { getProducts } from '../../services/productService'
import { getCategories } from '../../services/CategorieService'

const categories = ref([])

onMounted(async () => {
    this.categories = await getCategories()
})

const handleRemove = async () => {
    this.
    
    console.log(`Remove from Stock de la commande ${selectedOrder.value.id} avec delta: ${deltaValue.value}`)
    // Ajouter ici la logique de duplication
    // await duplicateOrderById(selectedOrder.value.id, deltaValue.value)  
}
</script> -->

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../../stores/authStore'
import { getCategories } from '@/services/CategorieService'
import { getProductsByCategorie, doRemove } from '@/services/productService'

const router = useRouter()
const categories = ref([])
const isLoading = ref(true)

const form = reactive({
  deltaValue: '',
  categorie: ''
})

const loadCategories = async () => {
  try {
    categories.value = await getCategories()
  } catch (err) {
    console.error('Erreur de chargement des clients', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadCategories()
})

const handleRemove = async () => {
  console.log("Les valeurs dans les champs : ", form.deltaValue, form.categorie)
  const productToRemove = await getProductsByCategorie(form.categorie)

  const summary = await doRemove(productToRemove, form.deltaValue)

  // Rediriger vers la page de récapitulatif avec les données
  const encodedSummary = encodeURIComponent(JSON.stringify(summary))
  router.push(`/fo/remove-summary/${encodedSummary}`)
}
</script>

<template>
  <div class="home-page">
    <div class="container">
      <h1>Bienvenue sur EvaluationShop</h1>
      <p>Veuillez choisir votre profil pour continuer</p>
      
      <div v-if="isLoading" class="loading">Chargement...</div>
      
      <div v-else class="selection-container">
        <div class="customer-list">
          <!-- Carte Utilisateur anonyme -->
          
            <div>
                <label for="delta">Entrer la valeur delta : </label>
                <input 
                    v-model.number="form.deltaValue" 
                    type="number" 
                    id="delta"
                    placeholder="0"
                >
            </div>
            <div>
                <label>Catégories</label>
                <select v-model="form.categorie">
                    <option value="">Selectionner une categorie </option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id" id="categorie">{{ cat.nom }}</option>
                </select>
            </div>
          <!-- Liste des vrais clients -->

          <div class="popup-actions">
            <button @click="handleRemove" class="btn btn-primary">Remove</button>
        </div>  
          
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, #f3f4f6, #ffffff);
}

.container {
  width: 100%;
  max-width: 1000px;
  padding: 40px 20px;
}

h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 10px;
}

p {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 30px;
}

.selection-container {
  width: 100%;
}

.customer-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  width: 100%;
}

.customer-card {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.customer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
}

.anonymous-card {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}

.anonymous-card:hover {
  border-style: solid;
  border-color: #94a3b8;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: #475569;
  margin-right: 15px;
  flex-shrink: 0;
}

.customer-info {
  text-align: left;
}

.customer-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #1e293b;
}

.customer-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.loading {
  font-size: 1.2rem;
  color: #6b7280;
}
</style>
