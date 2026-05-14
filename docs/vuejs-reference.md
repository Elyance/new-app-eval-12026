# 📘 Vue.js — Référence Complète (Vue 3 · Composition API)

> Doc de référence personnelle avec explications et cas d'usage concrets.

---

## Table des matières

1. [Création d'une application](#1-création-dune-application)
2. [Anatomie d'un composant](#2-anatomie-dun-composant-vue)
3. [Réactivité — ref, reactive, computed, watch](#3-réactivité)
4. [Directives dans le template](#4-directives-dans-le-template)
5. [Props & Événements](#5-props--événements-parent--enfant)
6. [Cycle de vie](#6-cycle-de-vie)
7. [Vue Router](#7-vue-router)
8. [Pinia — State Management](#8-pinia--state-management)
9. [Composables](#9-composables--logique-réutilisable)
10. [Slots](#10-slots)
11. [Provide / Inject](#11-provide--inject)
12. [Synchrone & Asynchrone](#12-synchrone--asynchrone)
13. [Aide-mémoire décisionnel](#13-aide-mémoire-décisionnel)

---

## 1. Création d'une application

```bash
npm create vue@latest mon-projet
cd mon-projet
npm install
npm run dev
```

Lors de la création, Vue te propose plusieurs options. Voici quand les choisir :

| Option | Quand l'activer |
|--------|----------------|
| **TypeScript** | Projet sérieux, équipe, besoin d'autocomplétion forte |
| **Vue Router** | Dès que ton app a plusieurs "pages" |
| **Pinia** | Dès que plusieurs composants partagent des données |
| **ESLint/Prettier** | Toujours — ça évite les bugs bêtes |

### Structure du projet

```
mon-projet/
├── public/           # Fichiers servis tels quels (favicon, robots.txt)
├── src/
│   ├── assets/       # Images, CSS globaux
│   ├── components/   # Petits blocs réutilisables (bouton, carte, modal)
│   ├── views/        # Pages entières (une par route)
│   ├── router/       # Définition des routes
│   ├── stores/       # Données globales (Pinia)
│   ├── composables/  # Logique réutilisable (useFetch, useAuth...)
│   ├── App.vue       # Composant racine (contient <RouterView />)
│   └── main.js       # Point d'entrée — monte l'app
├── index.html
└── vite.config.js
```

> **Règle simple :** `components/` = morceaux d'interface. `views/` = pages complètes liées à une URL.

---

## 2. Anatomie d'un composant `.vue`

Un fichier `.vue` contient toujours 3 blocs :

```vue
<template>
  <!-- Ce que l'utilisateur voit — du HTML enrichi -->
  <div class="card">
    <h2>{{ title }}</h2>
    <button @click="increment">Cliqué {{ count }} fois</button>
  </div>
</template>

<script setup>
// La logique du composant
import { ref } from 'vue'

const title = 'Mon composant'
const count = ref(0)

function increment() {
  count.value++
}
</script>

<style scoped>
/* CSS qui s'applique UNIQUEMENT à ce composant */
.card { padding: 1rem; border: 1px solid #ccc; }
</style>
```

- **`<template>`** : le HTML. Les variables JS sont accessibles directement avec `{{ }}`.
- **`<script setup>`** : tout ce que tu déclares ici est automatiquement disponible dans le template.
- **`<style scoped>`** : le mot clé `scoped` empêche tes styles de fuiter dans d'autres composants. Sans `scoped`, le CSS est global.

---

## 3. Réactivité

La réactivité, c'est le cœur de Vue : quand une donnée change, le DOM se met à jour automatiquement. Vue propose plusieurs outils selon la situation.

---

### `ref` — pour une valeur simple

**Quand l'utiliser :** pour un compteur, un booléen, une chaîne de texte, un nombre — n'importe quelle valeur primitive. Aussi utilisable pour les tableaux et objets quand tu veux pouvoir les réassigner complètement.

```js
import { ref } from 'vue'

const count = ref(0)        // nombre
const isOpen = ref(false)   // booléen
const username = ref('')    // texte
const items = ref([])       // tableau
```

> ⚠️ En JavaScript (dans `<script>`), tu dois toujours accéder à la valeur via `.value`. Dans le `<template>`, Vue le fait automatiquement — pas besoin de `.value`.

```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)

function add() {
  count.value++   // .value obligatoire ici
}
</script>

<template>
  <p>{{ count }}</p>   <!-- pas de .value ici -->
  <button @click="add">+</button>
</template>
```

**Cas concrets :**
- Ouvrir/fermer une modale → `const isModalOpen = ref(false)`
- Stocker la valeur d'un input → `const email = ref('')`
- Compteur de likes → `const likes = ref(0)`

---

### `reactive` — pour un objet groupé

**Quand l'utiliser :** quand tu as plusieurs données liées qui forment un groupe logique (un formulaire, un profil utilisateur, une config). Évite de l'utiliser pour une valeur seule.

```js
import { reactive } from 'vue'

// ✅ Bon usage — données qui vont ensemble
const form = reactive({
  name: '',
  email: '',
  password: '',
  acceptedTerms: false
})

// Mise à jour directe, sans .value
function submitForm() {
  console.log(form.name, form.email)
  form.name = ''  // réinitialise
}
```

> ⚠️ **Piège :** si tu réassignes l'objet entier (`form = { ... }`), tu perds la réactivité. Modifie toujours les propriétés une par une.

```js
// ❌ Casse la réactivité
form = { name: 'Alice', email: '' }

// ✅ Correct
form.name = 'Alice'
form.email = ''

// ✅ Pour réinitialiser tout d'un coup
Object.assign(form, { name: '', email: '', password: '' })
```

**`ref` vs `reactive` — tableau de décision :**

| Situation | Utilise |
|-----------|---------|
| Une seule valeur (nombre, booléen, texte) | `ref` |
| Plusieurs valeurs liées (formulaire, profil) | `reactive` |
| Un tableau que tu vas peut-être réassigner | `ref` |
| Tu veux accéder sans `.value` partout | `reactive` |
| En cas de doute | `ref` (c'est le standard de la communauté) |

---

### `computed` — pour une valeur calculée

**Quand l'utiliser :** quand une valeur se *déduit* d'une autre. Au lieu de recalculer dans le template ou à la main à chaque fois, `computed` le fait automatiquement et **met le résultat en cache** — il ne recalcule que si une dépendance change.

```js
import { ref, computed } from 'vue'

const price = ref(100)
const quantity = ref(3)

// Se recalcule automatiquement si price ou quantity change
const total = computed(() => price.value * quantity.value)
const totalWithTax = computed(() => total.value * 1.2)
```

**Ne fais PAS ça dans le template :**
```vue
<!-- ❌ Recalculé à chaque rendu, illisible, impossible à réutiliser -->
<p>{{ price * quantity * 1.2 }}</p>

<!-- ✅ Clair, mis en cache, réutilisable -->
<p>{{ totalWithTax }}</p>
```

**Cas concrets :**
```js
// Filtrer une liste en temps réel
const searchQuery = ref('')
const allUsers = ref([{ name: 'Alice' }, { name: 'Bob' }, { name: 'Albert' }])

const filteredUsers = computed(() =>
  allUsers.value.filter(u =>
    u.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

// Vérifier si un formulaire est valide
const isFormValid = computed(() =>
  form.email.includes('@') && form.password.length >= 8
)

// Formater une donnée affichée
const fullName = computed(() => `${user.firstName} ${user.lastName}`)
```

> `computed` est en **lecture seule** par défaut. Si tu veux pouvoir aussi écrire, utilise `get` + `set` :

```js
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (val) => {
    [firstName.value, lastName.value] = val.split(' ')
  }
})
```

---

### `watch` — réagir à un changement spécifique

**Quand l'utiliser :** quand tu veux **déclencher un effet de bord** (appel API, sauvegarde, log, redirection) en réponse au changement d'une valeur précise. Tu connais exactement quelle variable surveiller, et tu veux souvent l'ancienne ET la nouvelle valeur.

```js
import { ref, watch } from 'vue'

const userId = ref(1)

// Quand userId change → recharge les données
watch(userId, async (newId, oldId) => {
  console.log(`Changement de ${oldId} vers ${newId}`)
  userData.value = await fetchUser(newId)
})
```

**Options utiles :**

```js
// immediate: true → s'exécute aussi au démarrage (pas seulement au 1er changement)
watch(userId, fetchUser, { immediate: true })

// deep: true → surveille les changements profonds dans un objet/tableau
watch(form, saveToLocalStorage, { deep: true })

// Surveiller plusieurs sources à la fois
watch([firstName, lastName], ([newFirst, newLast]) => {
  console.log('Nom complet :', newFirst, newLast)
})
```

**Cas concrets :**
```js
// Sauvegarder automatiquement dans localStorage
watch(form, (newForm) => {
  localStorage.setItem('draft', JSON.stringify(newForm))
}, { deep: true })

// Recharger des données quand l'ID dans l'URL change
const route = useRoute()
watch(() => route.params.id, (newId) => {
  loadProduct(newId)
}, { immediate: true })

// Gérer un event listener selon l'état
watch(isMenuOpen, (open) => {
  if (open) document.addEventListener('click', closeMenu)
  else document.removeEventListener('click', closeMenu)
})
```

---

### `watchEffect` — effet automatique sans cibler une variable

**Quand l'utiliser :** quand tu veux exécuter un bloc de code qui dépend de plusieurs réactives, sans avoir à les lister toi-même. Vue détecte automatiquement les dépendances utilisées dans le bloc. Il s'exécute aussi immédiatement au démarrage.

```js
import { ref, watchEffect } from 'vue'

const page = ref(1)
const search = ref('')

// S'exécute immédiatement, puis à chaque fois que page ou search change
watchEffect(async () => {
  const results = await fetchProducts({
    page: page.value,
    q: search.value
  })
  products.value = results
})
```

**`watch` vs `watchEffect` — quand choisir :**

| Situation | Utilise |
|-----------|---------|
| Tu sais exactement quelle variable surveiller | `watch` |
| Tu veux l'ancienne ET la nouvelle valeur | `watch` |
| Tu veux éviter une exécution au démarrage | `watch` (sans `immediate`) |
| Le bloc dépend de plusieurs variables, tu veux éviter de les lister | `watchEffect` |
| Tu veux que ça s'exécute dès le montage | `watchEffect` (ou `watch` + `immediate`) |

---

## 4. Directives dans le template

Les directives sont des attributs spéciaux Vue qui commencent par `v-`.

### `:bind` — lier un attribut HTML à une variable

```vue
<script setup>
const imageUrl = ref('https://example.com/photo.jpg')
const isDisabled = ref(true)
const isActive = ref(true)
const hasError = ref(false)
</script>

<template>
  <!-- Sans bind : valeur statique -->
  <img src="photo.jpg" />

  <!-- Avec bind : valeur dynamique depuis une variable -->
  <img :src="imageUrl" />
  <button :disabled="isDisabled">Envoyer</button>

  <!-- Classes conditionnelles -->
  <div :class="{ active: isActive, 'text-red': hasError }">Texte</div>

  <!-- Styles inline dynamiques -->
  <p :style="{ color: textColor, fontSize: fontSize + 'px' }">Texte</p>
</template>
```

---

### `@event` — écouter un événement

```vue
<template>
  <button @click="handleClick">Clic</button>
  <input @input="handleInput" @keyup.enter="submitForm" />
  <form @submit.prevent="onSubmit">...</form>
  <!-- .prevent = appelle event.preventDefault() automatiquement -->
</template>
```

**Modificateurs courants :**

| Modificateur | Effet |
|---|---|
| `@click.prevent` | `event.preventDefault()` — utile sur les `<form>` |
| `@click.stop` | `event.stopPropagation()` — stoppe la propagation |
| `@click.once` | Ne se déclenche qu'une seule fois |
| `@keyup.enter` | Seulement si la touche Enter est pressée |
| `@click.self` | Seulement si le clic est sur l'élément lui-même (pas un enfant) |

---

### `v-model` — liaison bidirectionnelle

**Quand l'utiliser :** pour lier un `<input>` à une variable. Quand l'utilisateur tape → la variable est mise à jour. Quand la variable change → l'input est mis à jour. C'est un raccourci de `:value` + `@input`.

```vue
<script setup>
import { ref } from 'vue'
const email = ref('')
const role = ref('user')
const isChecked = ref(false)
const selectedFruits = ref([])
</script>

<template>
  <!-- Input texte -->
  <input v-model="email" type="email" placeholder="Email" />
  <p>Tu tapes : {{ email }}</p>

  <!-- Select -->
  <select v-model="role">
    <option value="user">Utilisateur</option>
    <option value="admin">Admin</option>
  </select>

  <!-- Checkbox simple -->
  <input v-model="isChecked" type="checkbox" />

  <!-- Checkboxes multiples → stockées dans un tableau -->
  <input v-model="selectedFruits" value="pomme" type="checkbox" /> Pomme
  <input v-model="selectedFruits" value="banane" type="checkbox" /> Banane
</template>
```

---

### `v-if` / `v-show` — affichage conditionnel

```vue
<template>
  <!-- v-if : retire physiquement l'élément du DOM si false -->
  <div v-if="isLoggedIn">Bienvenue !</div>
  <div v-else-if="isLoading">Chargement...</div>
  <div v-else>Veuillez vous connecter</div>

  <!-- v-show : garde dans le DOM mais met display:none si false -->
  <Spinner v-show="isLoading" />
</template>
```

**`v-if` vs `v-show` — quand choisir :**

| Situation | Utilise |
|-----------|---------|
| L'élément toggle souvent (menu burger, accordion) | `v-show` (plus performant) |
| L'élément a peu de chances d'apparaître | `v-if` |
| L'élément est lourd à initialiser | `v-if` (ne le crée que si nécessaire) |
| Tu as besoin de `v-else` | `v-if` obligatoirement |

---

### `v-for` — boucles

```vue
<script setup>
import { ref } from 'vue'
const users = ref([
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
])
</script>

<template>
  <!-- Toujours ajouter :key avec une valeur unique ! -->
  <ul>
    <li v-for="user in users" :key="user.id">
      {{ user.name }} — {{ user.role }}
    </li>
  </ul>

  <!-- Avec l'index -->
  <div v-for="(user, index) in users" :key="user.id">
    {{ index + 1 }}. {{ user.name }}
  </div>

  <!-- Boucle sur un objet -->
  <div v-for="(value, key) in config" :key="key">
    {{ key }} : {{ value }}
  </div>
</template>
```

> ⚠️ Le `:key` est **obligatoire**. Vue l'utilise pour identifier chaque élément et optimiser les mises à jour du DOM. Utilise toujours un identifiant unique (id), jamais l'index si la liste peut être réordonnée ou filtrée.

---

## 5. Props & Événements (parent ↔ enfant)

Les composants communiquent via **props** (données du parent vers l'enfant) et **emit** (événements de l'enfant vers le parent).

### Exemple complet — composant `UserCard`

```vue
<!-- Parent : App.vue ou une View -->
<script setup>
import UserCard from './components/UserCard.vue'
import { ref } from 'vue'

const users = ref([
  { id: 1, name: 'Alice', isAdmin: true },
  { id: 2, name: 'Bob', isAdmin: false },
])

function handleDelete(userId) {
  users.value = users.value.filter(u => u.id !== userId)
}
</script>

<template>
  <UserCard
    v-for="user in users"
    :key="user.id"
    :name="user.name"
    :is-admin="user.isAdmin"
    @delete="handleDelete(user.id)"
  />
</template>
```

```vue
<!-- Enfant : UserCard.vue -->
<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true          // warning dans la console si absent
  },
  isAdmin: {
    type: Boolean,
    default: false          // valeur par défaut si non fournie
  }
})

const emit = defineEmits(['delete'])

function confirmDelete() {
  if (confirm(`Supprimer ${props.name} ?`)) {
    emit('delete')  // remonte l'événement au parent
  }
}
</script>

<template>
  <div class="card">
    <h3>{{ name }}</h3>
    <span v-if="isAdmin">⭐ Admin</span>
    <button @click="confirmDelete">Supprimer</button>
  </div>
</template>
```

> **Règle fondamentale :** les props sont **en lecture seule** dans l'enfant. Tu ne modifies jamais directement une prop. Si tu veux modifier, émets un événement et laisse le parent modifier.

---

## 6. Cycle de vie

Chaque composant Vue passe par des étapes. Tu peux y accrocher du code avec des hooks.

```
Création du composant
       ↓
   setup() exécuté  ← variables, refs, computed déclarés ici
       ↓
  [onBeforeMount]   ← avant insertion dans le DOM
       ↓
   onMounted()      ← DOM disponible ✅ appels API, listeners
       ↓
   (changements de données)
       ↓
  [onBeforeUpdate]
       ↓
   onUpdated()      ← après chaque re-rendu
       ↓
  onUnmounted()     ← composant retiré du DOM → nettoyage
```

### Exemples concrets de chaque hook

```js
import { onMounted, onUpdated, onUnmounted } from 'vue'

// onMounted → le DOM est prêt, c'est ici qu'on fait les appels API
onMounted(async () => {
  users.value = await fetchUsers()
  // Ou : initialiser une librairie JS tierce (chart, map, player...)
  chart = new Chart(document.getElementById('myChart'), config)
  // Ou : ajouter un event listener global
  window.addEventListener('resize', onResize)
})

// onUnmounted → nettoyage pour éviter les fuites mémoire
onUnmounted(() => {
  clearInterval(timer)                              // stopper un timer
  window.removeEventListener('resize', onResize)   // retirer un listener
  chart.destroy()                                   // détruire une instance JS tierce
})

// onUpdated → après chaque mise à jour (utiliser avec prudence)
onUpdated(() => {
  // Cas rare : faire défiler vers le bas d'une liste de messages
  chatBox.scrollTop = chatBox.scrollHeight
})
```

**Quand utiliser quel hook :**

| Hook | Utilise pour |
|------|-------------|
| `onMounted` | Appels API initiaux, init de libraries tierces, event listeners globaux |
| `onUnmounted` | Nettoyer timers, listeners, instances externes |
| `onUpdated` | Manipulations DOM après chaque rendu (rare — préférer `watch`) |
| `onBeforeUnmount` | Sauvegarder l'état juste avant la destruction |

---

## 7. Vue Router

Vue Router gère la navigation entre "pages" dans une Single Page Application (SPA) — sans rechargement du navigateur.

### Configuration

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/HomeView.vue')   // lazy loading
  },
  {
    path: '/products',
    component: () => import('../views/ProductsView.vue')
  },
  {
    path: '/products/:id',   // :id = paramètre dynamique
    component: () => import('../views/ProductDetailView.vue')
  },
  {
    path: '/admin',
    component: () => import('../views/AdminView.vue'),
    meta: { requiresAuth: true }   // données custom attachées à la route
  },
  {
    path: '/:pathMatch(.*)*',   // catch-all → page 404
    component: () => import('../views/NotFoundView.vue')
  }
]

export default createRouter({
  history: createWebHistory(),   // URLs propres (/about) vs hash (#/about)
  routes
})
```

> **Lazy loading** (`() => import(...)`) : le fichier du composant n'est chargé que quand on visite la route. Recommandé pour les pages — ça accélère le chargement initial de l'app.

### Navigation dans les composants

```vue
<template>
  <!-- RouterLink = <a> intelligent, ajoute la classe "router-link-active" automatiquement -->
  <nav>
    <RouterLink to="/">Accueil</RouterLink>
    <RouterLink to="/products">Produits</RouterLink>
    <RouterLink :to="`/products/${productId}`">Détail produit</RouterLink>
  </nav>

  <!-- Là où le composant de la route active s'affiche -->
  <RouterView />
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()   // pour naviguer par le code
const route = useRoute()     // pour lire l'URL courante

// Lire les paramètres de l'URL
console.log(route.params.id)        // /products/42 → "42"
console.log(route.query.search)     // /products?search=vue → "vue"

// Naviguer depuis le code
router.push('/products')            // aller à une page (avec historique)
router.push({ path: '/products', query: { search: 'vue' } })
router.replace('/login')            // sans historique (bouton retour ne fonctionne pas)
router.back()                       // retour arrière
</script>
```

### Guard de navigation — protéger des routes

```js
// Vérifier avant chaque navigation si l'utilisateur est autorisé
router.beforeEach((to, from) => {
  const isLoggedIn = !!localStorage.getItem('token')

  if (to.meta.requiresAuth && !isLoggedIn) {
    return '/login'   // redirige si non connecté
  }
})
```

---

## 8. Pinia — State Management

**Quand utiliser Pinia ?** Quand plusieurs composants **sans lien parent-enfant direct** ont besoin de partager ou modifier les mêmes données. Exemple classique : l'utilisateur connecté, le panier d'achats, les notifications.

> Sans Pinia, tu ferais passer des props sur 3-4 niveaux de composants ("prop drilling") — très vite ingérable.

### Créer un store

```js
// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // STATE — les données
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  // GETTERS — valeurs dérivées (comme computed)
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // ACTIONS — fonctions qui modifient l'état
  async function login(email, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    user.value = data.user
    token.value = data.token
    localStorage.setItem('token', data.token)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isLoggedIn, isAdmin, login, logout }
})
```

### Utiliser le store dans n'importe quel composant

```vue
<!-- Header.vue — affiche le nom de l'utilisateur connecté -->
<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div v-if="auth.isLoggedIn">
    Bonjour, {{ auth.user.name }}
    <button @click="auth.logout">Déconnexion</button>
  </div>
  <RouterLink v-else to="/login">Connexion</RouterLink>
</template>
```

```vue
<!-- LoginForm.vue — composant totalement séparé, accède au même store -->
<script setup>
import { useAuthStore } from '@/stores/auth'
import { reactive } from 'vue'

const auth = useAuthStore()
const form = reactive({ email: '', password: '' })

async function submit() {
  await auth.login(form.email, form.password)
}
</script>
```

---

## 9. Composables — Logique réutilisable

**Quand créer un composable ?** Quand tu te retrouves à copier-coller la même logique réactive dans plusieurs composants. Un composable extrait cette logique dans une fonction réutilisable.

> Convention de nommage : le nom commence toujours par `use`.

### Exemple 1 — `useFetch` (appel API générique)

```js
// src/composables/useFetch.js
import { ref } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      data.value = await res.json()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  execute()   // exécute dès le montage du composant
  return { data, error, loading, refetch: execute }
}
```

```vue
<script setup>
import { useFetch } from '@/composables/useFetch'

const { data: users, loading, error } = useFetch('/api/users')
</script>

<template>
  <div v-if="loading">Chargement...</div>
  <div v-else-if="error">Erreur : {{ error }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

### Exemple 2 — `useLocalStorage` (persistance automatique)

```js
// src/composables/useLocalStorage.js
import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue) {
  const stored = localStorage.getItem(key)
  const data = ref(stored ? JSON.parse(stored) : defaultValue)

  // Sauvegarde automatiquement à chaque changement
  watch(data, (newVal) => {
    localStorage.setItem(key, JSON.stringify(newVal))
  }, { deep: true })

  return data
}
```

```vue
<script setup>
import { useLocalStorage } from '@/composables/useLocalStorage'

// Se souvient des préférences même après rechargement de la page
const theme = useLocalStorage('theme', 'light')
const favorites = useLocalStorage('favorites', [])
</script>
```

### Exemple 3 — `useDebounce` (retarder une action)

Utile pour éviter d'appeler une API à chaque frappe clavier.

```js
// src/composables/useDebounce.js
import { ref, watch } from 'vue'

export function useDebounce(value, delay = 300) {
  const debouncedValue = ref(value.value)
  let timer

  watch(value, (newVal) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedValue.value = newVal
    }, delay)
  })

  return debouncedValue
}
```

```vue
<script setup>
import { ref, watch } from 'vue'
import { useDebounce } from '@/composables/useDebounce'

const searchInput = ref('')
const debouncedSearch = useDebounce(searchInput, 400)

// L'API n'est appelée que 400ms après que l'utilisateur arrête de taper
watch(debouncedSearch, (val) => {
  if (val) fetchResults(val)
})
</script>

<template>
  <input v-model="searchInput" placeholder="Rechercher..." />
</template>
```

---

## 10. Slots

**Quand utiliser les slots ?** Quand tu crées un composant "conteneur" dont le contenu interne doit être flexible et défini par le parent. Exemples typiques : `<Modal>`, `<Card>`, `<Dropdown>`, `<PageLayout>`, `<Tooltip>`.

### Slot par défaut — contenu libre injecté par le parent

```vue
<!-- Modal.vue -->
<template>
  <div class="overlay">
    <div class="modal">
      <button class="close" @click="$emit('close')">✕</button>
      <slot />  <!-- le parent met ce qu'il veut ici -->
    </div>
  </div>
</template>
```

```vue
<!-- Usage dans le parent — la Modal ne sait pas ce qu'elle va contenir -->
<Modal @close="isOpen = false">
  <h2>Confirmation</h2>
  <p>Êtes-vous sûr de vouloir supprimer cet élément ?</p>
  <button @click="confirmDelete">Oui, supprimer</button>
</Modal>
```

### Slots nommés — plusieurs zones injectables

```vue
<!-- PageLayout.vue -->
<template>
  <div class="page">
    <aside class="sidebar">
      <slot name="sidebar" />
    </aside>
    <main>
      <header><slot name="header" /></header>
      <slot />   <!-- slot par défaut = contenu principal -->
      <footer><slot name="footer" /></footer>
    </main>
  </div>
</template>
```

```vue
<!-- Utilisation — #nomDuSlot est un raccourci pour v-slot:nomDuSlot -->
<PageLayout>
  <template #sidebar>
    <NavMenu />
  </template>

  <template #header>
    <h1>Tableau de bord</h1>
  </template>

  <!-- Contenu principal (slot par défaut, pas besoin de #default) -->
  <DashboardContent />

  <template #footer>
    <p>© 2025 MonApp</p>
  </template>
</PageLayout>
```

### Scoped slot — le composant expose ses données au parent

```vue
<!-- Liste.vue — liste générique qui expose chaque item -->
<script setup>
defineProps(['items'])
</script>
<template>
  <ul>
    <li v-for="(item, index) in items" :key="item.id">
      <slot :item="item" :index="index" />
      <!-- Le parent décide comment afficher chaque item -->
    </li>
  </ul>
</template>
```

```vue
<!-- Le parent contrôle le rendu de chaque item -->
<Liste :items="products">
  <template #default="{ item, index }">
    <strong>{{ index + 1 }}. {{ item.name }}</strong> — {{ item.price }}€
  </template>
</Liste>
```

---

## 11. Provide / Inject

**Quand utiliser ?** Quand une donnée doit être accessible à des composants profondément imbriqués, sans passer des props à chaque niveau intermédiaire. C'est l'alternative légère à Pinia pour des données locales à une sous-arborescence.

```
App.vue  →  provide('user', user)
  └── Layout.vue          (ne reçoit rien, pas besoin)
        └── Sidebar.vue   (ne reçoit rien, pas besoin)
              └── UserAvatar.vue  →  inject('user')  ✅ accès direct
```

```vue
<!-- App.vue ou un composant ancêtre -->
<script setup>
import { provide, ref } from 'vue'

const currentUser = ref({ name: 'Alice', avatar: '/alice.jpg' })
const theme = ref('dark')

provide('currentUser', currentUser)   // injecte la ref (réactive)
provide('theme', theme)
</script>
```

```vue
<!-- UserAvatar.vue — descendant à n'importe quelle profondeur -->
<script setup>
import { inject } from 'vue'

const user = inject('currentUser')          // reçoit la même ref réactive
const theme = inject('theme', 'light')      // 'light' = valeur par défaut si clé absente
</script>

<template>
  <img :src="user.avatar" :alt="user.name" />
</template>
```

**`provide/inject` vs Pinia :**

| Situation | Utilise |
|-----------|---------|
| Données locales à une section de l'app (thème, config de formulaire) | `provide/inject` |
| Données globales à toute l'app (user connecté, panier, notifs) | `Pinia` |
| Tu as besoin de DevTools pour déboguer | `Pinia` (meilleur support) |

---

## 12. Synchrone & Asynchrone

Comprendre ce concept est **indispensable** en Vue.js, car dès que tu fais un appel API, lis un fichier, ou attends une réponse externe, tu entres dans le monde de l'asynchrone.

---

### Le concept en clair

**Synchrone** = le code s'exécute ligne par ligne, dans l'ordre. Chaque ligne attend que la précédente soit terminée avant de s'exécuter.

**Asynchrone** = certaines opérations prennent du temps (appel réseau, lecture de fichier, timer). Au lieu de bloquer tout le programme en attendant, JavaScript continue d'exécuter la suite, puis revient traiter le résultat quand il est prêt.

```
SYNCHRONE                          ASYNCHRONE
─────────────────────────          ─────────────────────────
ligne 1 ✅                         ligne 1 ✅
ligne 2 ✅                         ligne 2 → lance une opération longue...
ligne 3 (attend ligne 2)           ligne 3 ✅ (s'exécute sans attendre !)
ligne 4 ✅                         ligne 4 ✅
                                   ... résultat de ligne 2 arrive → traité
```

**Exemple concret :**
```js
// SYNCHRONE — tout s'exécute dans l'ordre immédiatement
console.log('1 - Début')
const x = 2 + 2          // calcul instantané
console.log('2 - x =', x)
console.log('3 - Fin')
// Affiche : 1 - Début / 2 - x = 4 / 3 - Fin  (dans cet ordre garanti)

// ASYNCHRONE — l'appel réseau prend du temps
console.log('1 - Début')
fetch('/api/users')       // prend 200ms, 500ms, on ne sait pas...
  .then(data => console.log('3 - Données reçues'))
console.log('2 - Après le fetch')
// Affiche : 1 - Début / 2 - Après le fetch / 3 - Données reçues
// "2" s'affiche AVANT "3" même si fetch est écrit avant !
```

> JavaScript est **mono-thread** : il ne peut faire qu'une chose à la fois. L'asynchrone n'est pas du vrai parallélisme — c'est une façon de dire "préviens-moi quand c'est prêt, je continue en attendant".

---

### Les 3 syntaxes de l'asynchrone

#### 1. Callbacks — l'ancienne façon (à éviter aujourd'hui)

```js
// Le résultat est traité dans une fonction passée en argument
setTimeout(() => {
  console.log('Exécuté après 2 secondes')
}, 2000)

// Problème : le "callback hell" quand on enchaîne
fetchUser(id, (user) => {
  fetchPosts(user.id, (posts) => {
    fetchComments(posts[0].id, (comments) => {
      // 😵 Difficile à lire, à maintenir, à gérer les erreurs
    })
  })
})
```

#### 2. Promises — la transition

Une Promise est un objet qui représente une valeur **future** : elle sera soit résolue (succès) soit rejetée (erreur).

```js
// Créer une Promise
const maPromesse = new Promise((resolve, reject) => {
  setTimeout(() => {
    const succes = true
    if (succes) resolve('Données reçues !')
    else reject(new Error('Quelque chose a raté'))
  }, 1000)
})

// Consommer une Promise avec .then() / .catch() / .finally()
maPromesse
  .then((resultat) => {
    console.log(resultat)   // 'Données reçues !'
  })
  .catch((erreur) => {
    console.error(erreur)   // si reject() a été appelé
  })
  .finally(() => {
    console.log('Toujours exécuté, succès ou échec')
  })

// fetch() retourne une Promise
fetch('/api/users')
  .then(response => response.json())   // .json() retourne aussi une Promise
  .then(data => console.log(data))
  .catch(err => console.error(err))
```

#### 3. async / await — la syntaxe moderne (recommandée)

`async/await` est du sucre syntaxique sur les Promises. Ça rend le code asynchrone **lisible comme du code synchrone**.

```js
// "async" devant une fonction = elle retourne toujours une Promise
async function chargerUtilisateur(id) {
  // "await" = attendre que la Promise soit résolue avant de continuer
  const response = await fetch(`/api/users/${id}`)
  const user = await response.json()
  return user   // automatiquement emballé dans une Promise
}

// Équivalent exact avec .then() — mais bien plus lisible
function chargerUtilisateurAvecThen(id) {
  return fetch(`/api/users/${id}`)
    .then(response => response.json())
    .then(user => user)
}
```

> ⚠️ `await` ne peut s'utiliser qu'**à l'intérieur** d'une fonction `async`. Impossible de l'utiliser au niveau global (sauf dans les modules ES2022+).

---

### Gestion des erreurs avec async/await

Sans gestion d'erreur, un `await` qui échoue plante silencieusement. Toujours utiliser `try/catch` :

```js
async function chargerDonnees() {
  try {
    const response = await fetch('/api/users')

    // Fetch ne rejette pas sur les erreurs HTTP (404, 500)
    // il faut vérifier manuellement !
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`)
    }

    const data = await response.json()
    return data

  } catch (error) {
    // Capte : erreur réseau, JSON invalide, erreur HTTP lancée manuellement
    console.error('Échec du chargement :', error.message)
    throw error   // re-lancer si tu veux que l'appelant le sache aussi
  } finally {
    // S'exécute toujours — idéal pour arrêter un spinner
    isLoading.value = false
  }
}
```

---

### Async/Await dans Vue.js — cas d'usage concrets

#### Dans `onMounted` — charger des données au démarrage

```vue
<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])
const loading = ref(false)
const error = ref(null)

onMounted(async () => {       // onMounted accepte une fonction async
  loading.value = true
  try {
    const res = await fetch('/api/users')
    users.value = await res.json()
  } catch (err) {
    error.value = 'Impossible de charger les utilisateurs'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading">Chargement...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

#### Dans un handler d'événement — soumettre un formulaire

```vue
<script setup>
import { reactive, ref } from 'vue'

const form = reactive({ email: '', password: '' })
const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    if (!res.ok) throw new Error('Identifiants incorrects')

    const { token } = await res.json()
    localStorage.setItem('token', token)
    router.push('/dashboard')

  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.email" type="email" />
    <input v-model="form.password" type="password" />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <button :disabled="isSubmitting">
      {{ isSubmitting ? 'Connexion...' : 'Se connecter' }}
    </button>
  </form>
</template>
```

#### Dans un `watch` — recharger quand une valeur change

```vue
<script setup>
import { ref, watch } from 'vue'

const productId = ref(1)
const product = ref(null)

watch(productId, async (newId) => {
  product.value = null   // reset pendant le chargement
  try {
    const res = await fetch(`/api/products/${newId}`)
    product.value = await res.json()
  } catch (err) {
    console.error(err)
  }
}, { immediate: true })
</script>
```

#### Dans un store Pinia — actions asynchrones

```js
// src/stores/products.js
export const useProductStore = defineStore('products', () => {
  const items = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const res = await fetch('/api/products')
      items.value = await res.json()
    } finally {
      loading.value = false
    }
  }

  async function createProduct(data) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const newProduct = await res.json()
    items.value.push(newProduct)   // mise à jour locale immédiate
    return newProduct
  }

  return { items, loading, fetchAll, createProduct }
})
```

---

### Exécuter plusieurs appels en parallèle

Par défaut, des `await` enchaînés s'exécutent **en séquence** — chaque appel attend le précédent. Si les appels sont indépendants, utilise `Promise.all` pour les lancer **en parallèle** et diviser le temps d'attente.

```js
// ❌ Séquentiel — 300ms + 200ms = 500ms total
const users = await fetch('/api/users').then(r => r.json())
const products = await fetch('/api/products').then(r => r.json())

// ✅ Parallèle — max(300ms, 200ms) = 300ms total
const [users, products] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/products').then(r => r.json())
])
```

```js
// Promise.allSettled — attend tous les résultats même si certains échouent
const results = await Promise.allSettled([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/products').then(r => r.json()),
  fetch('/api/orders').then(r => r.json())
])

results.forEach(result => {
  if (result.status === 'fulfilled') {
    console.log('Succès :', result.value)
  } else {
    console.warn('Échec :', result.reason)
  }
})
```

---

### Pièges courants

#### 1. Oublier `await` — la valeur est une Promise, pas le résultat

```js
// ❌ users est une Promise non résolue, pas un tableau
const users = fetch('/api/users').then(r => r.json())
console.log(users)   // Promise { <pending> }

// ✅ users est le tableau de données
const users = await fetch('/api/users').then(r => r.json())
console.log(users)   // [{ id: 1, name: 'Alice' }, ...]
```

#### 2. `await` dans une boucle `forEach` — ça ne marche pas

```js
// ❌ forEach n'attend pas les async callbacks
const ids = [1, 2, 3]
ids.forEach(async (id) => {
  await deleteUser(id)   // les suppressions se lancent toutes en même temps
})
console.log('Tous supprimés ?')   // s'affiche AVANT la fin des suppressions !

// ✅ for...of attend correctement chaque itération
for (const id of ids) {
  await deleteUser(id)   // attend vraiment chaque suppression
}
console.log('Tous supprimés ✅')

// ✅ Ou en parallèle avec Promise.all si l'ordre n'a pas d'importance
await Promise.all(ids.map(id => deleteUser(id)))
```

#### 3. Pas de `try/catch` — les erreurs disparaissent silencieusement

```js
// ❌ Si fetch échoue, rien ne se passe, l'utilisateur ne sait pas
async function loadData() {
  const data = await fetch('/api/data').then(r => r.json())
  items.value = data
}

// ✅ Toujours gérer les erreurs
async function loadData() {
  try {
    const data = await fetch('/api/data').then(r => r.json())
    items.value = data
  } catch (err) {
    errorMessage.value = 'Chargement impossible, réessaie.'
  }
}
```

---

### Résumé visuel

```
Code synchrone          Code asynchrone (async/await)
──────────────          ─────────────────────────────
const a = 1 + 1         const res = await fetch(url)
                        ↑ attend ici jusqu'à la réponse

Instantané              Peut prendre du temps (réseau, I/O)
Pas de try/catch        Toujours entourer d'un try/catch
Résultat immédiat       Résultat dans le futur (Promise)
```

---

## 13. Aide-mémoire décisionnel

### "J'ai une donnée, comment la déclarer ?"

```
C'est une valeur simple (nombre, texte, booléen, tableau) ?
  → ref()

C'est un groupe de valeurs liées (formulaire, profil utilisateur) ?
  → reactive()

Ça se calcule/dérive à partir d'autres données ?
  → computed()
```

### "Je veux réagir à un changement, comment ?"

```
Je sais exactement quelle variable surveiller
ET je veux l'ancienne/nouvelle valeur OU déclencher un appel API ?
  → watch()

Le bloc dépend de plusieurs variables et je veux éviter de les lister
OU je veux que ça s'exécute dès le montage ?
  → watchEffect()
```

### "Je veux afficher/cacher un élément ?"

```
L'élément toggle souvent (menu, accordion, tabs) ?
  → v-show (reste dans le DOM, plus rapide)

L'élément est conditionnel rare ou lourd à initialiser ?
  → v-if (retiré du DOM)

J'ai besoin de v-else ?
  → v-if obligatoirement
```

### "Mes composants doivent partager des données ?"

```
Parent → Enfant direct ?
  → props

Enfant → Parent direct ?
  → emit

Composant profond, données locales à une section ?
  → provide / inject

N'importe quel composant, données globales à toute l'app ?
  → Pinia store
```

### "Je répète la même logique dans plusieurs composants ?"

```
→ Composable (src/composables/useMonLogique.js)
```

### "Mon composant doit avoir un contenu flexible ?"

```
→ Slots
  - Contenu unique → slot par défaut
  - Plusieurs zones distinctes → slots nommés
  - Le composant doit exposer ses données → scoped slots
```

---

## Commandes utiles

```bash
npm run dev       # Serveur de développement avec hot-reload
npm run build     # Build de production optimisé (→ dist/)
npm run preview   # Tester le build de production en local
npm run lint      # Linter le code (ESLint)
```
