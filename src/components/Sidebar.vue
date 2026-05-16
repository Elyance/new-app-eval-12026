<template>
  <aside class="bg-light p-0 border-end" style="width: 250px; height: 100vh; position: fixed; left: 0; top: 0; z-index: 100; overflow-y: auto;">
    <!-- Header -->
    <div class="border-bottom p-3">
      <h5 class="mb-0 fw-bold">App PrestaShop</h5>
    </div>

    <!-- Navigation -->
    <nav class="nav flex-column p-3">
      <!-- Accueil -->
      <router-link 
        to="/backoffice" 
        class="nav-link text-dark rounded mb-2"
        :class="{ 'bg-primary text-white': isActive('/backoffice') }"
      >
        Accueil
      </router-link>

      <!-- Modules Section -->
      <button 
        @click="toggleSection('modules')"
        class="btn btn-outline-secondary w-100 text-start mb-2"
      >
        Modules
      </button>
      <div v-if="openSections.modules" class="ps-4 mb-2">
        <router-link 
          to="/backoffice/modules/produits"
          class="nav-link text-dark text-decoration-none ps-2 rounded mb-2"
          :class="{ 'text-primary fw-bold': isActive('/backoffice/modules/produits') }"
        >
          Produits
        </router-link>
        <router-link 
          to="/backoffice/modules/clients"
          class="nav-link text-dark text-decoration-none ps-2 rounded mb-2"
          :class="{ 'text-primary fw-bold': isActive('/backoffice/modules/clients') }"
        >
          Clients
        </router-link>
      </div>

      <!-- Gestion de Données Section -->
      <button 
        @click="toggleSection('gestion')"
        class="btn btn-outline-secondary w-100 text-start mb-2"
      >
        Gestion de Données
      </button>
      <div v-if="openSections.gestion" class="ps-4 mb-2">
        <router-link 
          to="/backoffice/gestion-donnees/reset"
          class="nav-link text-danger text-decoration-none ps-2 rounded mb-2"
          :class="{ 'fw-bold': isActive('/backoffice/gestion-donnees/reset') }"
        >
          Reset
        </router-link>
        <router-link 
          to="/backoffice/gestion-donnees/importer"
          class="nav-link text-dark text-decoration-none ps-2 rounded mb-2"
          :class="{ 'text-primary fw-bold': isActive('/backoffice/gestion-donnees/importer') }"
        >
          Importer des données
        </router-link>
      </div>
    </nav>

    <!-- Footer avec bouton Déconnexion -->
    <div class="border-top p-3 mt-auto">
      <div class="mb-3 text-muted small">
        <p class="mb-2">Connecté</p>
      </div>
      <button 
        @click="handleLogout"
        class="btn btn-danger w-100"
      >
        Déconnexion
      </button>
    </div>
  </aside>
</template>

<script>
import { authService } from '@/services/AuthService';

export default {
  name: 'Sidebar',
  data() {
    return {
      openSections: {
        modules: false,
        gestion: false
      }
    }
  },
  methods: {
    toggleSection(section) {
      this.openSections[section] = !this.openSections[section];
    },
    isActive(path) {
      return this.$route.path === path;
    },
    handleLogout() {
      const confirmation = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      if (confirmation) {
        authService.logout();
        this.$router.push('/backoffice/login');
      }
    }
  },
  watch: {
    '$route.path': {
      handler() {
        if (this.$route.path.includes('/backoffice/modules')) {
          this.openSections.modules = true;
        }
        if (this.$route.path.includes('/backoffice/gestion-donnees')) {
          this.openSections.gestion = true;
        }
      },
      immediate: true
    }
  }
}
</script>

<style scoped>
aside {
  display: flex;
  flex-direction: column;
}

nav {
  flex: 1;
}

.nav-link:hover {
  background-color: #e9ecef;
}
.nav-link.text-danger:hover {
  background-color: #f8d7da;
}
</style>
