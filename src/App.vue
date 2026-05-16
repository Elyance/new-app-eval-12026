<script setup>
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import Navbar from './components/FO/Navbar.vue'

const route = useRoute();
</script>

<template>
  <div>
    <Sidebar v-if="!route.meta.hideSidebar" />
    <Navbar v-if="route.path.startsWith('/fo')" />
    <router-view />
  </div>
</template>