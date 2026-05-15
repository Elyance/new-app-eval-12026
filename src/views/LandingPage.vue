<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goFO() {
  router.push('/fo')
}

function goBackOffice() {
  router.push('/backoffice')
}
</script>

<template>
  <div class="landing flex-center">
    <h1>Bienvenue — Choisissez une section</h1>
    <div class="choices">
      <button class="btn" @click="goBackOffice">BackOffice</button>
      <button class="btn primary" @click="goFO">Front Office</button>
    </div>
  </div>
</template>

<style scoped>
.landing{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center}
.choices{display:flex;gap:1rem;margin-top:1.25rem}
.btn{padding:0.6rem 1rem;border:1px solid #ccc;background:#fff;border-radius:6px;cursor:pointer}
.btn.primary{background:#0ea5a4;color:#fff;border-color:transparent}
.muted{margin-top:1rem;color:#666;font-size:0.9rem}
</style>
