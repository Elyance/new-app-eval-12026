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


        <div class="mb-3">
          <input type="checkbox" id="image" value="image" />
          <label for="image">Ne pas afficher</label>
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
// Page d'import statique utilisant le pipeline unifié de importService
import { runFullImportPipeline } from '../../../services/importService'

export default {
  name: 'ImportStatic',
  data() {
    return {
      // imageOrNot: true,
      isSubmitting: false,
      message: '',
      success: false,
      validationErrors: []
    }
  },
  methods: {
    async handleSubmit() {
      const checkbox = document.getElementById(image);
      if (checkbox && checkbox.checked) {
        console.log("Pas besoin d'images")
      }

      // console.log("checkbox ", imageOrNot)
      const csvFiles = [this.$refs.f1?.files?.[0], this.$refs.f2?.files?.[0], this.$refs.f3?.files?.[0]].filter(Boolean)
      const zipFile = null
      if (checkbox && checkbox.checked) {
        zipFile = this.$refs.images?.files?.[0]
      }
      // const zipFile =  || null
      console.log('[ImportStatic] Soumission reçue', {
        csvNames: csvFiles.map(file => file?.name || ''),
        zipName: zipFile?.name || ''
      })

      this.isSubmitting = true
      this.success = false
      this.validationErrors = []
      this.message = 'Initialisation de l\'importation...'

      try {
        const summary = await runFullImportPipeline({ csvFiles, zipFile , }, (stepMessage) => {
          console.log('[ImportStatic] Progrès :', stepMessage)
          this.message = stepMessage
        })

        this.isSubmitting = false
        this.success = true
        this.message = `Importation terminée avec succès ! Fichiers traités : ${summary.csvNames.join(', ')}`
      } catch (error) {
        console.error('[ImportStatic] Échec de l\'importation', error)
        this.isSubmitting = false
        this.success = false
        if (error.message && error.message.includes(' | ')) {
          this.validationErrors = error.message.split(' | ')
          this.message = 'Les fichiers sélectionnés ne sont pas valides.'
        } else {
          this.message = error.message || 'Une erreur est survenue pendant l\'importation.'
        }
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
