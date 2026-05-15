<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getCustomerByEmail } from '../../services/customerService'
import { authStore } from '../../stores/authStore'
import '../../styles/login.css'

const router = useRouter()

// State
const isSubmitting = ref(false)
const showPassword = ref(false)
const alertMessage = ref('')
const alertType = ref('')

// Form data
const form = reactive({
  email: '',
  password: ''
})

// Form validation errors
const errors = reactive({
  email: '',
  password: ''
})

/**
 * Valide le formulaire
 */
const validateForm = () => {
  let isValid = true

  // Reset errors
  Object.keys(errors).forEach(key => { errors[key] = '' })
  alertMessage.value = ''

  if (!form.email.trim()) {
    errors.email = "L'email est requis"
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "L'email n'est pas valide"
    isValid = false
  }

  if (!form.password.trim()) {
    errors.password = 'Le mot de passe est requis'
    isValid = false
  }

  return isValid
}

/**
 * Soumet le formulaire de connexion
 * Recherche le client par email dans PrestaShop
 */
const handleLogin = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  alertMessage.value = ''

  try {
    const customer = await getCustomerByEmail(form.email.trim())

    if (!customer) {
      alertType.value = 'error'
      alertMessage.value = 'Aucun compte trouvé avec cet email'
      return
    }

    if (customer.is_guest) {
      alertType.value = 'error'
      alertMessage.value = 'Ce compte est un compte invité. Veuillez utiliser un compte client.'
      return
    }

    // Connexion réussie
    authStore.login(customer)

    alertType.value = 'success'
    alertMessage.value = `Bienvenue ${customer.firstname} !`

    // Rediriger après un court délai
    setTimeout(() => {
      router.push('/fo')
    }, 800)
  } catch (err) {
    console.error('Erreur lors de la connexion:', err)
    alertType.value = 'error'
    alertMessage.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="breadcrumb">
      <router-link to="/fo">Accueil</router-link>
      <span>/</span>
      <span>Connexion</span>
    </div>

    <div class="login-card">
      <!-- Header -->
      <div class="login-header">
        <div class="login-icon">👤</div>
        <h1>Connexion</h1>
        <p>Connectez-vous à votre compte</p>
      </div>

      <!-- Alert -->
      <div v-if="alertMessage" class="login-alert" :class="alertType">
        <span>{{ alertType === 'error' ? '⚠️' : '✓' }}</span>
        {{ alertMessage }}
      </div>

      <!-- Form -->
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="login-email">Email <span class="required">*</span></label>
          <input
            id="login-email"
            v-model="form.email"
            type="email"
            placeholder="votre@email.com"
            :class="{ error: errors.email }"
            autocomplete="email"
          />
          <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
        </div>

        <div class="form-group">
          <label for="login-password">Mot de passe <span class="required">*</span></label>
          <div class="password-wrapper">
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Votre mot de passe"
              :class="{ error: errors.password }"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :title="showPassword ? 'Masquer' : 'Afficher'"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="btn-spinner"></span>
          {{ isSubmitting ? 'Connexion en cours...' : 'Se connecter' }}
        </button>
      </form>

      <!-- Separator -->
      <div class="login-separator">
        <div class="line"></div>
        <span>ou</span>
        <div class="line"></div>
      </div>

      <!-- Guest link -->
      <div class="login-guest-link">
        <router-link to="/fo/produits">Continuer en tant qu'invité →</router-link>
      </div>
    </div>
  </div>
</template>
