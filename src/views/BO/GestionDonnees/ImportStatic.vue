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
          <label class="form-label">Images</label>
          <input type="file" class="form-control" ref="images" multiple />
        </div>

        <button class="btn btn-primary" :disabled="isSubmitting">Importer</button>
      </form>

      <div v-if="message" class="mt-3 alert" :class="success ? 'alert-success' : 'alert-info'">{{ message }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImportStatic',
  data() {
    return {
      isSubmitting: false,
      message: '',
      success: false
    }
  },
  methods: {
    handleSubmit() {
      this.isSubmitting = true;
      // Simple static behaviour: show a message and clear after a moment
      setTimeout(() => {
        this.isSubmitting = false;
        this.success = true;
        this.message = 'Données prêtes (page statique) — implémentation réelle non incluse.';
      }, 700);
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 720px;
}
</style>
