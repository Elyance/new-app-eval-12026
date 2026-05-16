<template>
  <div class="backoffice-layout">
    <Sidebar />
    <main class="backoffice-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
</script>

<style scoped>
.backoffice-layout {
  min-height: 100vh;
}

.backoffice-content {
  margin-left: 250px;
  min-height: 100vh;
  background: #f9fafb;
}
</style>