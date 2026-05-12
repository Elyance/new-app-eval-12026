<script setup>
import Navbar from './components/FO/Navbar.vue'
import './styles/variables.css'
</script>

<template>
  <Navbar />
  <main>
    <router-view />
  </main>
</template>

<style>
main {
  min-height: 100vh;
}
</style>