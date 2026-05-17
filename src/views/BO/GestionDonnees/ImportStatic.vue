<template>
  <div class="p-4">
    <div class="container">
      <h3>Importer des données (formulaire statique)</h3>
      <p class="text-muted">Remplissez les champs ci-dessous et cliquez sur <strong>Importer</strong>.</p>

      <form @submit.prevent="handleSubmit" class="mt-3">
        <div class="mb-3">
          <label class="form-label">Fichier 1</label>
          <input type="file" class="form-control" ref="f1" />
        </div>

        <div class="mb-3">
          <label class="form-label">Fichier 2</label>
          <input type="file" class="form-control" ref="f2" />
        </div>

        <div class="mb-3">
          <label class="form-label">Fichier 3</label>
          <input type="file" class="form-control" ref="f3" />
        </div>

        <div class="mb-3">
          <label class="form-label">Images (ZIP)</label>
          <input type="file" class="form-control" ref="images" accept=".zip,application/zip" />
        </div>

        <button class="btn btn-primary" :disabled="isSubmitting">Importer</button>
      </form>

      <div v-if="validationErrors.length" class="mt-3 alert alert-danger">
        <ul class="mb-0">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <div v-if="message" class="mt-3 alert" :class="success ? 'alert-success' : 'alert-info'">{{ message }}</div>
    </div>
  </div>
</template>

<script>
// Page d'import statique utilisée pour tester le pipeline CSV -> normalisation -> plan d'import
// Étapes documentées:
// 1) validateImportFiles : vérifie présence/format des fichiers (3 CSV + ZIP)
// 2) parseCsvFiles : parse les CSV avec PapaParse
// 3) traitementFichier1 : normalise les lignes (dates, nombres, etc.)
// 4) buildFichier1ImportPlan : prépare le plan d'import pour PrestaShop
// 5) executeImportPlan : crée les catégories et les taxes via l'API
// 6) insertProducts : insère les produits via l'API
import { validateImportFiles, getImportFileSummary, parseCsvFiles } from '../../../services/importService'
import { traitementFichier1 } from '../../../services/traitementCSVService'
import { buildFichier1ImportPlan, logFichier1ImportPlan, executeImportPlan, insertProducts, uploadProductImages } from '../../../services/traitementDonneesService'

export default {
  name: 'ImportStatic',
  data() {
    return {
      isSubmitting: false,
      message: '',
      success: false,
      validationErrors: []
    }
  },
  methods: {
    async handleSubmit() {
      const csvFiles = [this.$refs.f1?.files?.[0], this.$refs.f2?.files?.[0], this.$refs.f3?.files?.[0]].filter(Boolean)
      const zipFile = this.$refs.images?.files?.[0] || null
      console.log('[ImportStatic] Soumission reçue', {
        csvNames: csvFiles.map(file => file?.name || ''),
        zipName: zipFile?.name || ''
      })

      // 1) Validation basique des fichiers
      const validation = await validateImportFiles({ csvFiles, zipFile })
      console.log('[ImportStatic] Résultat validation', validation)
      this.validationErrors = validation.errors

      if (!validation.valid) {
        this.success = false
        this.message = 'Les fichiers sélectionnés ne sont pas valides.'
        return
      }

      // 2) Parsing des CSV
      this.isSubmitting = true
      try {
        console.log('[ImportStatic] Début du parsing CSV')
        const parsedCsvFiles = await parseCsvFiles(validation.files.csvFiles)
        console.log('[ImportStatic] Parsing CSV terminé', parsedCsvFiles)

        // 3) On traite le premier CSV (format attendu par traitementFichier1)
        const fichier1 = parsedCsvFiles[0]
        if (fichier1) {
          console.log('[ImportStatic] CSV 1 brut', fichier1.rows)
          const fichier1Traite = traitementFichier1(fichier1.rows)
          console.log('[ImportStatic] CSV 1 traité', fichier1Traite)

          // 4) Préparer un plan d'import (catégories/taxes/produits)
          const planImportFichier1 = buildFichier1ImportPlan(fichier1Traite)
          console.log('[ImportStatic] Plan d’import fichier 1', planImportFichier1)
          logFichier1ImportPlan(planImportFichier1)

          // 5) Exécuter la création des entités parentes (Catégories et Taxes)
          console.log('[ImportStatic] Création des Catégories et Taxes via l\'API...')
          const planEnrichi = await executeImportPlan(planImportFichier1)

          // 6) Insérer les produits avec les bons IDs
          console.log('[ImportStatic] Insertion des Produits via l\'API...')
          const planFinal = await insertProducts(planEnrichi)
          
          // 7) Uploader les images (seulement si on a un zip et des produits créés)
          if (validation.files.zipFile) {
            console.log('[ImportStatic] Traitement et Upload des Images depuis le ZIP...')
            await uploadProductImages(validation.files.zipFile, planFinal)
          }

          console.log('[ImportStatic] Import terminé avec succès !', planFinal)
        }

        const summary = getImportFileSummary(validation.files)

        this.isSubmitting = false
        this.success = true
        this.message = `Importation terminée ! Fichiers traités : ${summary.csvNames.join(', ')}`
      } catch (error) {
        console.error('[ImportStatic] Erreur pendant le parsing CSV', error)
        this.isSubmitting = false
        this.success = false
        this.message = 'Une erreur est survenue pendant le parsing des CSV.'
      }
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 720px;
}
</style>
