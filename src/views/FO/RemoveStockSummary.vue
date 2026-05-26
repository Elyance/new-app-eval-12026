<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const summary = ref(null)
const isLoading = ref(true)

onMounted(() => {
  // Récupérer les données de résumé depuis le state de la route
  if (route.params.summary) {
    summary.value = JSON.parse(decodeURIComponent(route.params.summary))
  }
  isLoading.value = false
})

const handleBackToRemove = () => {
  router.push('/fo/remove')
}

const handleBackToHome = () => {
  router.push('/fo')
}
</script>

<template>
  <div class="summary-page">
    <div class="container">
      <h1>Récapitulatif de la Suppression de Stock</h1>
      
      <div v-if="isLoading" class="loading">Chargement...</div>
      
      <div v-else-if="summary" class="summary-container">
        <table class="summary-table">
          <tbody>
            <tr>
              <td class="label">Nombre de produits traités</td>
              <td class="value">{{ summary.totalProducts }}</td>
            </tr>
            <tr>
              <td class="label">Valeur delta appliquée</td>
              <td class="value">{{ summary.delta }} unités</td>
            </tr>
            <tr class="divider">
              <td colspan="2"></td>
            </tr>
            <tr class="highlight">
              <td class="label">Total à modifier (attendu)</td>
              <td class="value success">{{ summary.totalExpected }} unités</td>
            </tr>
            <tr class="highlight">
              <td class="label">Total modifié (réalisé)</td>
              <td class="value" :class="{ success: summary.totalRemoved === summary.totalExpected, warning: summary.totalRemoved < summary.totalExpected }">
                {{ summary.totalRemoved }} unités
              </td>
            </tr>
            <tr>
              <td class="label">Produits traités avec succès</td>
              <td class="value">{{ summary.successCount }} / {{ summary.totalProducts }}</td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="summary.totalRemoved === summary.totalExpected" class="status-message success-message">
          ✓ Opération complétée avec succès
        </div>
        
        <div v-else class="status-message warning-message">
          ⚠ Attention : Certains produits n'ont pas pu être traités
        </div>
        
        <div class="actions">
          <button @click="handleBackToRemove" class="btn btn-primary">
            Faire une autre suppression
          </button>
          <button @click="handleBackToHome" class="btn btn-secondary">
            Retourner à l'accueil
          </button>
        </div>
      </div>
      
      <div v-else class="error-message">
        Aucune donnée disponible. Veuillez <router-link to="/fo/remove">recommencer l'opération</router-link>.
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6, #ffffff);
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 600px;
}

h1 {
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 30px;
  text-align: center;
}

.summary-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.summary-table tr {
  border-bottom: 1px solid #e5e7eb;
}

.summary-table tr.divider {
  height: 10px;
}

.summary-table tr.divider td {
  border: none;
}

.summary-table tr.highlight {
  background: #f9fafb;
}

.summary-table td {
  padding: 15px;
  text-align: left;
}

.summary-table td.label {
  color: #6b7280;
  font-weight: 500;
  width: 60%;
}

.summary-table td.value {
  color: #1f2937;
  font-weight: 700;
  font-size: 1.1rem;
  text-align: right;
}

.summary-table td.value.success {
  color: #059669;
}

.summary-table td.value.warning {
  color: #d97706;
}

.status-message {
  padding: 15px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
}

.success-message {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.warning-message {
  background: #fef3c7;
  color: #78350f;
  border: 1px solid #fcd34d;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
}

.loading {
  text-align: center;
  font-size: 1.1rem;
  color: #6b7280;
  padding: 40px;
}

.error-message {
  text-align: center;
  padding: 30px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-weight: 500;
}

.error-message a {
  color: #dc2626;
  text-decoration: underline;
}

.error-message a:hover {
  color: #991b1b;
}
</style>
