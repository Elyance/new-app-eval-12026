<script setup>
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';

const route = useRoute();
</script>

<template>
  <div>
    <Sidebar v-if="!route.meta.hideSidebar" />
    <router-view />
  </div>
</template>