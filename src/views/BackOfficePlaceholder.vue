<template>
  <div class="backoffice-placeholder">
    <p class="eyebrow">BackOffice</p>
    <h1>Espace d'administration</h1>
    <p>Choisissez une section dans le menu de gauche pour commencer.</p>
  </div>
</template>

<script setup>
// Vue d'accueil du backoffice
</script>

<style scoped>
.backoffice-placeholder {
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 32px;
  text-align: left;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6b7280;
}

h1 {
  margin: 0;
  font-size: 34px;
  color: #111827;
}

p {
  margin: 12px 0 0;
  color: #6b7280;
  max-width: 640px;
}
</style>
