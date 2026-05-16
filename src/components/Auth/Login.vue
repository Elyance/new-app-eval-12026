<template>
  <div class="login-component">
    <form class="login-form" @submit.prevent="handleLogin">
      <h2>Connexion BackOffice</h2>

      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

      <label for="username">Identifiant</label>
      <input
        id="username"
        v-model="username"
        type="text"
        autocomplete="username"
        @keyup.enter="handleLogin"
      />

      <label for="password">Mot de passe</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        @keyup.enter="handleLogin"
      />

      <button type="submit" class="btn">Se connecter</button>

      <p class="hint">Pour l'évaluation : <strong>ITU</strong> / <strong>eval2026</strong></p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/AuthService'

const username = ref('ITU')
const password = ref('eval2026')
const errorMessage = ref('')
const router = useRouter()

async function handleLogin() {
  errorMessage.value = ''

  // Validation basique
  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Veuillez remplir tous les champs.'
    return
  }

  // Utiliser le service d'auth
  const result = authService.login(username.value, password.value)

  if (result.success) {
    // Redirection vers le backoffice
    await router.push('/backoffice')
  } else {
    // Afficher l'erreur
    errorMessage.value = result.error
    password.value = ''
  }
}
</script>

<style scoped>
.login-component {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.login-form {
  width: 100%;
  max-width: 420px;
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-form h2 {
  margin: 0 0 4px 0;
  text-align: center;
}

.login-form label {
  font-size: 13px;
  color: #333;
}

.login-form input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn {
  margin-top: 8px;
  padding: 10px 14px;
  background-color: #0d6efd;
  color: #fff;
  border: 1px solid #0d6efd;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.error {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
}

.hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>
