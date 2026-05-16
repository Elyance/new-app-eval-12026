<script>
import { getModules, sortModulesByOrder } from '@/services/ModulesService';
import { resetData } from '@/services/ResetService';

export default {
    name: 'Reset',
    data() {
        return {
            listeModule: [],
            isResetting: false,
            resetMessage: ''
        }
    },
    methods: {
        async resetData() {
            const selectedModules = [];
            this.listeModule.forEach(module => {
                const checkbox = document.getElementById(module);
                if (checkbox && checkbox.checked) {
                    selectedModules.push(module);
                }
            });

            if (selectedModules.length === 0) {
                this.resetMessage = 'Veuillez sélectionner au moins un module';
                return;
            }

            try {
                this.isResetting = true;
                this.resetMessage = 'Tri des modules...';
                const orderedModules = await sortModulesByOrder(selectedModules);
                
                this.resetMessage = `Réinitialisation de ${orderedModules.length} module(s): ${orderedModules.join(', ')}`;
                console.log('Modules ordonnés pour la réinitialisation:', orderedModules);
                
                await resetData(orderedModules);
                
                this.resetMessage = 'Données réinitialisées avec succès !';
            } catch (error) {
                this.resetMessage = `Erreur lors de la réinitialisation: ${error.message}`;
                console.error('Erreur dans resetData:', error);
            } finally {
                this.isResetting = false;
            }
        },
        toggleSelectAll(event) {
            const isChecked = event.target.checked;
            this.listeModule.forEach(module => {
                const checkbox = document.getElementById(module);
                if (checkbox) {
                    checkbox.checked = isChecked;
                }
            });
        }
    },
    async mounted() {
        this.listeModule = await getModules();
    }
}
</script>
<template>
    <div class="form-container">
        <h2 class="form-title">Réinitialisation des données PrestaShop</h2>
        <p class="text-muted mb-4">
            Cochez les tables de la base de données que vous souhaitez vider.
            <strong class="text-danger">Attention, cette action est irréversible.</strong>
        </p>

        <div class="form-group border-bottom pb-3">
            <div class="form-check">
                <input type="checkbox" class="form-check-input" id="selectAll" @change="toggleSelectAll">
                <label class="form-check-label fw-bold" for="selectAll">
                    Tout sélectionner ({{ listeModule.length }})
                </label>
            </div>
        </div>

        <div class="checkbox-grid">
            <div v-for="module in listeModule" :key="module" class="form-check">
                <input type="checkbox" class="form-check-input" :name="module" :id="module">
                <label class="form-check-label" :for="module">{{ module }}</label>
            </div>
        </div>

        <div class="mt-4">
            <button @click="resetData" class="btn-submit btn-danger" :disabled="isResetting">
                {{ isResetting ? 'Réinitialisation en cours...' : 'Réinitialiser les données' }}
            </button>
        </div>

        <div v-if="resetMessage" class="alert mt-4" :class="resetMessage.includes('Erreur') ? 'alert-danger' : 'alert-success'">
            {{ resetMessage }}
        </div>
    </div>
</template>

<style scoped>
@import '@/assets/styles/form.css';

.form-container {
    max-width: none;
    margin: 0;
    width: 100%;
}

.checkbox-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

@media (max-width: 768px) {
    .checkbox-grid {
        grid-template-columns: 1fr;
    }
}

.form-check-label {
    cursor: pointer;
}

.alert {
    padding: 1rem;
    border-radius: 0.375rem;
}

.alert-success {
    background-color: #d1e7dd;
    color: #0f5132;
    border: 1px solid #badbcc;
}

.alert-danger {
    background-color: #f8d7da;
    color: #842029;
    border: 1px solid #f5c2c7;
}
</style>
