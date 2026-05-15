<script setup>
import Navbar from './components/FO/Navbar.vue'
import { useRoute } from 'vue-router'
import './styles/variables.css'
import { computed } from 'vue'

const route = useRoute()
const showNavbar = computed(() => route.path && route.path.startsWith('/fo'))
</script>

<template>
  <div>
    <Navbar v-if="showNavbar" />
    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
main {
  min-height: 100vh;
}
</style>