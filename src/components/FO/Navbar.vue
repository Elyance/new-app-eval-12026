<script setup>
import { ref } from 'vue'
import '../../styles/navbar.css'

const searchQuery = ref('')
const isMobileMenuOpen = ref(false)

const categories = [
  { id: 1, name: 'Vêtements' },
  { id: 2, name: 'Accessoires' },
  { id: 3, name: 'Art' }
]

const handleSearch = () => {
  console.log('Recherche pour:', searchQuery.value)
  // API integration point: dispatch search event or call API
}

const handleLogin = () => {
  console.log('Redirection vers connexion')
  // API integration point: navigate to login or open modal
}

const handleCart = () => {
  console.log('Afficher le panier')
  // Naviguer vers le panier avec router-link
}

const handleContact = () => {
  console.log('Redirection vers contact')
  // API integration point: navigate to contact page
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<template>
  <nav class="navbar">
    <!-- Header Principal -->
    <div class="navbar-header">
      <div class="navbar-container">
        <!-- Logo -->
        <div class="navbar-logo">
          <a href="/" class="logo-link">
            <span class="logo-text">EvaluationShop</span>
          </a>
        </div>

        <!-- Menu Hamburger Mobile -->
        <button 
          class="mobile-toggle" 
          @click="toggleMobileMenu"
          :class="{ active: isMobileMenuOpen }"
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <!-- Actions Droite (toujours visibles) -->
        <div class="navbar-actions">
          <!-- Barre de Recherche -->
          <div class="search-container">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un produit..."
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <button 
              class="search-button"
              @click="handleSearch"
              aria-label="Rechercher"
            >
              ⌕
            </button>
          </div>

          <!-- Connexion -->
          <button 
            class="action-button login-button"
            @click="handleLogin"
            title="Se connecter"
          >
            <span class="label">Connexion</span>
          </button>

          <!-- Panier -->
          <router-link to="/fo/panier" class="action-button cart-button">
            <span class="label">Panier</span>
            <span class="badge">1</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Menu de Navigation -->
    <div class="navbar-menu" :class="{ active: isMobileMenuOpen }">
      <div class="navbar-container">
        <!-- Catégories -->
        <ul class="categories-list">
          <li 
            v-for="category in categories"
            :key="category.id"
            class="category-item"
          >
            <router-link 
              :to="`/fo/produits?cat=${category.id}`"
              class="category-link"
            >
              {{ category.name }}
            </router-link>
          </li>
        </ul>

        <!-- Contactez-nous -->
        <button 
          class="contact-button"
          @click="handleContact"
        >
          Contactez-nous
        </button>
      </div>
    </div>
  </nav>
</template>


