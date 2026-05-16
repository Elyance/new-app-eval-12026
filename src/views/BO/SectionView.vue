<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => route.meta.title ?? 'Section')
const description = computed(() => route.meta.description ?? 'Contenu à venir.')
</script>

<template>
  <section class="section-view">
    <div class="section-card">
      <p class="section-eyebrow">BackOffice</p>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
  </section>
</template>

<style scoped>
.section-view {
  padding: 32px;
}

.section-card {
  max-width: 900px;
  padding: 32px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.section-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6b7280;
}

h1 {
  margin: 0;
  font-size: 28px;
  color: #111827;
}

p {
  margin: 10px 0 0;
  color: #6b7280;
}
</style>