# 🅱️ Vue.js + Bootstrap 5 — Composants Prêts à Copier

> Tous les composants utilisent Bootstrap 5 via CDN ou npm.
> Colle le `<script setup>` + `<template>` dans ton fichier `.vue` et c'est prêt.

---

## ⚙️ Setup Bootstrap dans Vue

### Option A — CDN (rapide, pour les projets scolaires)

Dans `index.html` :

```html
<head>
  <!-- Bootstrap CSS -->
  <link rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
</head>
<body>
  <div id="app"></div>
  <!-- Bootstrap JS (pour modals, dropdowns, etc.) -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
```

### Option B — npm (recommandé)

```bash
npm install bootstrap
```

Dans `main.js` :

```js
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
```

---

## Table des matières

1. [Card simple](#1-card-simple)
2. [Card produit e-commerce](#2-card-produit-e-commerce)
3. [Card horizontale (media card)](#3-card-horizontale)
4. [Card profil utilisateur](#4-card-profil-utilisateur)
5. [Grille de cards (liste)](#5-grille-de-cards)
6. [Liste simple (ul/li)](#6-liste-simple)
7. [Liste avec avatars](#7-liste-avec-avatars)
8. [Liste de contacts / utilisateurs](#8-liste-de-contacts--utilisateurs)
9. [Tableau simple](#9-tableau-simple)
10. [Tableau avec tri et recherche](#10-tableau-avec-tri-et-recherche)
11. [Tableau responsive avec actions](#11-tableau-responsive-avec-actions)
12. [Formulaire de connexion](#12-formulaire-de-connexion)
13. [Formulaire d'inscription](#13-formulaire-dinscription)
14. [Formulaire de contact](#14-formulaire-de-contact)
15. [Formulaire de recherche / filtres](#15-formulaire-de-recherche--filtres)
16. [Navbar](#16-navbar)
17. [Sidebar](#17-sidebar)
18. [Modal](#18-modal)
19. [Alert / Toast](#19-alert--toast)
20. [Badge & Tag](#20-badge--tag)
21. [Accordion / FAQ](#21-accordion--faq)
22. [Tabs (onglets)](#22-tabs-onglets)
23. [Breadcrumb](#23-breadcrumb)
24. [Pagination](#24-pagination)
25. [Progress bar](#25-progress-bar)
26. [Spinner / Loading](#26-spinner--loading)
27. [Hero section](#27-hero-section)
28. [Footer](#28-footer)
29. [Dashboard stats cards](#29-dashboard-stats-cards)
30. [Empty state](#30-empty-state)

---

## 1. Card simple

```vue
<template>
  <div class="card shadow-sm" style="max-width: 360px;">
    <img src="https://via.placeholder.com/360x200" class="card-img-top" alt="image" />
    <div class="card-body">
      <h5 class="card-title">Titre de la carte</h5>
      <p class="card-text text-muted">
        Description courte du contenu de cette carte. Peut contenir plusieurs lignes.
      </p>
    </div>
    <div class="card-footer d-flex justify-content-between align-items-center">
      <small class="text-muted">Mis à jour il y a 3 min</small>
      <a href="#" class="btn btn-sm btn-primary">Voir plus</a>
    </div>
  </div>
</template>
```

---

## 2. Card Produit E-commerce

```vue
<script setup>
defineProps({
  product: Object
  // { id, name, price, oldPrice, image, rating, badge }
})
const emit = defineEmits(['add-to-cart'])
</script>

<template>
  <div class="card h-100 shadow-sm border-0">
    <!-- Badge promo -->
    <span v-if="product.badge" class="badge bg-danger position-absolute top-0 start-0 m-2">
      {{ product.badge }}
    </span>

    <img :src="product.image" class="card-img-top" :alt="product.name"
         style="height: 220px; object-fit: cover;" />

    <div class="card-body d-flex flex-column">
      <p class="text-muted small text-uppercase mb-1">{{ product.category }}</p>
      <h6 class="card-title fw-semibold">{{ product.name }}</h6>

      <!-- Étoiles -->
      <div class="mb-2">
        <span v-for="i in 5" :key="i" :class="i <= product.rating ? 'text-warning' : 'text-secondary'">
          ★
        </span>
        <small class="text-muted ms-1">({{ product.rating }}/5)</small>
      </div>

      <!-- Prix -->
      <div class="mt-auto">
        <span class="fs-5 fw-bold text-success me-2">{{ product.price.toFixed(2) }} €</span>
        <span v-if="product.oldPrice" class="text-decoration-line-through text-muted small">
          {{ product.oldPrice.toFixed(2) }} €
        </span>
      </div>
    </div>

    <div class="card-footer bg-white border-0 pb-3 d-grid gap-2">
      <button class="btn btn-primary btn-sm" @click="$emit('add-to-cart', product)">
        🛒 Ajouter au panier
      </button>
      <RouterLink :to="`/products/${product.id}`" class="btn btn-outline-secondary btn-sm">
        Voir le détail
      </RouterLink>
    </div>
  </div>
</template>
```

---

## 3. Card Horizontale

```vue
<template>
  <div class="card mb-3 shadow-sm border-0" style="max-width: 600px;">
    <div class="row g-0">
      <div class="col-4">
        <img src="https://via.placeholder.com/200x150"
             class="img-fluid rounded-start h-100" style="object-fit: cover;" alt="image" />
      </div>
      <div class="col-8">
        <div class="card-body">
          <span class="badge bg-warning text-dark mb-1">Promo</span>
          <h5 class="card-title">Titre du produit</h5>
          <p class="card-text text-muted small">
            Description courte visible en aperçu. Deux ou trois lignes maximum.
          </p>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <strong class="text-success">49.99 €</strong>
            <button class="btn btn-sm btn-primary">Ajouter</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 4. Card Profil Utilisateur

```vue
<script setup>
defineProps({
  user: Object
  // { name, role, avatar, email, joined, stats: { orders, reviews, wishlist } }
})
</script>

<template>
  <div class="card text-center shadow border-0" style="max-width: 300px;">
    <div class="card-body pt-4">
      <img :src="user.avatar" class="rounded-circle mb-3 border border-3 border-primary"
           width="90" height="90" style="object-fit: cover;" :alt="user.name" />
      <h5 class="card-title mb-0">{{ user.name }}</h5>
      <p class="text-muted small mb-2">{{ user.role }}</p>
      <p class="text-muted small mb-3">
        <i class="bi bi-envelope"></i> {{ user.email }}
      </p>

      <!-- Stats -->
      <div class="row g-0 border-top pt-3">
        <div class="col">
          <div class="fw-bold">{{ user.stats.orders }}</div>
          <small class="text-muted">Commandes</small>
        </div>
        <div class="col border-start border-end">
          <div class="fw-bold">{{ user.stats.reviews }}</div>
          <small class="text-muted">Avis</small>
        </div>
        <div class="col">
          <div class="fw-bold">{{ user.stats.wishlist }}</div>
          <small class="text-muted">Favoris</small>
        </div>
      </div>
    </div>

    <div class="card-footer bg-white border-0 pb-3">
      <button class="btn btn-primary btn-sm w-100">Voir le profil</button>
    </div>
  </div>
</template>
```

---

## 5. Grille de Cards

```vue
<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, title: 'Item 1', text: 'Description courte.', img: 'https://via.placeholder.com/300x180' },
  { id: 2, title: 'Item 2', text: 'Description courte.', img: 'https://via.placeholder.com/300x180' },
  { id: 3, title: 'Item 3', text: 'Description courte.', img: 'https://via.placeholder.com/300x180' },
  { id: 4, title: 'Item 4', text: 'Description courte.', img: 'https://via.placeholder.com/300x180' },
  { id: 5, title: 'Item 5', text: 'Description courte.', img: 'https://via.placeholder.com/300x180' },
  { id: 6, title: 'Item 6', text: 'Description courte.', img: 'https://via.placeholder.com/300x180' },
])
</script>

<template>
  <div class="container py-4">
    <h2 class="mb-4">Nos produits</h2>

    <!-- row-cols-* = nb de colonnes selon breakpoint -->
    <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
      <div v-for="item in items" :key="item.id" class="col">
        <div class="card h-100 shadow-sm border-0">
          <img :src="item.img" class="card-img-top" :alt="item.title"
               style="height: 180px; object-fit: cover;" />
          <div class="card-body">
            <h6 class="card-title">{{ item.title }}</h6>
            <p class="card-text text-muted small">{{ item.text }}</p>
          </div>
          <div class="card-footer border-0 bg-white">
            <button class="btn btn-primary btn-sm w-100">Voir</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 6. Liste Simple

```vue
<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, label: 'Élément de liste 1', active: true },
  { id: 2, label: 'Élément de liste 2', active: false },
  { id: 3, label: 'Élément de liste 3', active: false },
  { id: 4, label: 'Élément de liste 4 (désactivé)', disabled: true },
])

const selected = ref(null)
</script>

<template>
  <div style="max-width: 400px;">
    <h5 class="mb-3">Liste d'éléments</h5>

    <!-- Liste Bootstrap -->
    <ul class="list-group shadow-sm">
      <li
        v-for="item in items"
        :key="item.id"
        :class="[
          'list-group-item list-group-item-action d-flex justify-content-between align-items-center',
          { active: selected === item.id, disabled: item.disabled }
        ]"
        @click="!item.disabled && (selected = item.id)"
        style="cursor: pointer;"
      >
        {{ item.label }}
        <span v-if="selected === item.id" class="badge bg-light text-dark">✓</span>
      </li>
    </ul>

    <p v-if="selected" class="mt-2 text-muted small">
      Sélectionné : item {{ selected }}
    </p>
  </div>
</template>
```

---

## 7. Liste avec Avatars

```vue
<script setup>
import { ref } from 'vue'

const contacts = ref([
  { id: 1, name: 'Alice Martin', role: 'Designer', avatar: 'https://i.pravatar.cc/40?img=1', online: true },
  { id: 2, name: 'Bob Dupont', role: 'Développeur', avatar: 'https://i.pravatar.cc/40?img=2', online: false },
  { id: 3, name: 'Clara Petit', role: 'Chef de projet', avatar: 'https://i.pravatar.cc/40?img=3', online: true },
  { id: 4, name: 'David Moreau', role: 'Marketing', avatar: 'https://i.pravatar.cc/40?img=4', online: false },
])
</script>

<template>
  <div class="card shadow-sm border-0" style="max-width: 420px;">
    <div class="card-header bg-white fw-semibold">
      Équipe <span class="badge bg-secondary ms-1">{{ contacts.length }}</span>
    </div>
    <ul class="list-group list-group-flush">
      <li
        v-for="contact in contacts"
        :key="contact.id"
        class="list-group-item d-flex align-items-center gap-3 py-3"
      >
        <!-- Avatar + indicateur online -->
        <div class="position-relative">
          <img :src="contact.avatar" class="rounded-circle" width="42" height="42"
               style="object-fit: cover;" :alt="contact.name" />
          <span
            class="position-absolute bottom-0 end-0 rounded-circle border border-white"
            :class="contact.online ? 'bg-success' : 'bg-secondary'"
            style="width: 12px; height: 12px;"
          ></span>
        </div>

        <!-- Infos -->
        <div class="flex-grow-1">
          <div class="fw-semibold lh-1 mb-1">{{ contact.name }}</div>
          <small class="text-muted">{{ contact.role }}</small>
        </div>

        <span :class="contact.online ? 'text-success' : 'text-muted'" class="small">
          {{ contact.online ? '● En ligne' : 'Hors ligne' }}
        </span>
      </li>
    </ul>
  </div>
</template>
```

---

## 8. Liste de Contacts / Utilisateurs

```vue
<script setup>
import { ref, computed } from 'vue'

const users = ref([
  { id: 1, name: 'Alice Martin', email: 'alice@mail.com', role: 'Admin', status: 'Actif' },
  { id: 2, name: 'Bob Dupont', email: 'bob@mail.com', role: 'User', status: 'Inactif' },
  { id: 3, name: 'Clara Petit', email: 'clara@mail.com', role: 'Editor', status: 'Actif' },
])

const search = ref('')
const filtered = computed(() =>
  users.value.filter(u => u.name.toLowerCase().includes(search.value.toLowerCase()))
)

function deleteUser(id) {
  users.value = users.value.filter(u => u.id !== id)
}
</script>

<template>
  <div>
    <!-- Barre d'outils -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Utilisateurs</h5>
      <div class="d-flex gap-2">
        <input v-model="search" type="text" class="form-control form-control-sm"
               placeholder="Rechercher..." style="width: 200px;" />
        <button class="btn btn-primary btn-sm">+ Ajouter</button>
      </div>
    </div>

    <!-- Liste -->
    <div class="list-group shadow-sm">
      <div
        v-for="user in filtered"
        :key="user.id"
        class="list-group-item d-flex align-items-center justify-content-between py-3"
      >
        <div class="d-flex align-items-center gap-3">
          <!-- Initiales -->
          <div class="rounded-circle bg-primary text-white d-flex align-items-center
                      justify-content-center fw-bold"
               style="width: 42px; height: 42px; font-size: 0.9rem;">
            {{ user.name.split(' ').map(n => n[0]).join('') }}
          </div>

          <div>
            <div class="fw-semibold">{{ user.name }}</div>
            <small class="text-muted">{{ user.email }}</small>
          </div>
        </div>

        <div class="d-flex align-items-center gap-3">
          <span class="badge bg-light text-dark border">{{ user.role }}</span>
          <span :class="['badge', user.status === 'Actif' ? 'bg-success' : 'bg-secondary']">
            {{ user.status }}
          </span>
          <div class="dropdown">
            <button class="btn btn-sm btn-light" data-bs-toggle="dropdown">⋯</button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#">✏️ Modifier</a></li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <button class="dropdown-item text-danger" @click="deleteUser(user.id)">
                  🗑️ Supprimer
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <p v-if="filtered.length === 0" class="text-center text-muted py-4">
      Aucun utilisateur trouvé.
    </p>
  </div>
</template>
```

---

## 9. Tableau Simple

```vue
<script setup>
import { ref } from 'vue'

const products = ref([
  { id: 1, name: 'Casque Audio', category: 'Électronique', price: 89.99, stock: 12, status: 'Actif' },
  { id: 2, name: 'T-Shirt Premium', category: 'Vêtements', price: 29.99, stock: 0, status: 'Rupture' },
  { id: 3, name: 'Lampe LED', category: 'Maison', price: 44.99, stock: 5, status: 'Actif' },
  { id: 4, name: 'Ballon de Foot', category: 'Sport', price: 24.99, stock: 30, status: 'Actif' },
])
</script>

<template>
  <div class="table-responsive">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-dark">
        <tr>
          <th>#</th>
          <th>Produit</th>
          <th>Catégorie</th>
          <th>Prix</th>
          <th>Stock</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td class="text-muted small">{{ product.id }}</td>
          <td class="fw-semibold">{{ product.name }}</td>
          <td>
            <span class="badge bg-light text-dark border">{{ product.category }}</span>
          </td>
          <td class="text-success fw-bold">{{ product.price.toFixed(2) }} €</td>
          <td>
            <span :class="['fw-semibold', product.stock === 0 ? 'text-danger' : 'text-dark']">
              {{ product.stock }}
            </span>
          </td>
          <td>
            <span :class="[
              'badge',
              product.status === 'Actif' ? 'bg-success' : 'bg-danger'
            ]">{{ product.status }}</span>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1">✏️</button>
            <button class="btn btn-sm btn-outline-danger">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

## 10. Tableau avec Tri et Recherche

```vue
<script setup>
import { ref, computed } from 'vue'

const data = ref([
  { id: 1, name: 'Alice Martin', age: 28, city: 'Paris', score: 92 },
  { id: 2, name: 'Bob Dupont', age: 35, city: 'Lyon', score: 75 },
  { id: 3, name: 'Clara Petit', age: 24, city: 'Marseille', score: 88 },
  { id: 4, name: 'David Moreau', age: 41, city: 'Paris', score: 61 },
  { id: 5, name: 'Emma Bernard', age: 30, city: 'Lyon', score: 95 },
])

const search = ref('')
const sortKey = ref('name')
const sortAsc = ref(true)

const columns = [
  { key: 'name', label: 'Nom' },
  { key: 'age', label: 'Âge' },
  { key: 'city', label: 'Ville' },
  { key: 'score', label: 'Score' },
]

const filtered = computed(() => {
  let res = data.value.filter(row =>
    Object.values(row).some(v =>
      String(v).toLowerCase().includes(search.value.toLowerCase())
    )
  )
  res = [...res].sort((a, b) => {
    const va = a[sortKey.value], vb = b[sortKey.value]
    return sortAsc.value
      ? va > vb ? 1 : -1
      : va < vb ? 1 : -1
  })
  return res
})

function toggleSort(key) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else { sortKey.value = key; sortAsc.value = true }
}
</script>

<template>
  <div>
    <!-- Recherche -->
    <div class="mb-3 d-flex justify-content-between align-items-center">
      <h5 class="mb-0">Tableau des membres</h5>
      <input v-model="search" class="form-control w-auto" placeholder="Rechercher..." />
    </div>

    <div class="table-responsive rounded shadow-sm">
      <table class="table table-striped table-hover align-middle mb-0">
        <thead class="table-primary">
          <tr>
            <th v-for="col in columns" :key="col.key"
                @click="toggleSort(col.key)"
                style="cursor: pointer; user-select: none;">
              {{ col.label }}
              <span v-if="sortKey === col.key">
                {{ sortAsc ? ' ↑' : ' ↓' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filtered.length === 0">
            <td colspan="4" class="text-center text-muted py-4">
              Aucun résultat pour "{{ search }}"
            </td>
          </tr>
          <tr v-for="row in filtered" :key="row.id">
            <td class="fw-semibold">{{ row.name }}</td>
            <td>{{ row.age }} ans</td>
            <td>{{ row.city }}</td>
            <td>
              <div class="d-flex align-items-center gap-2">
                <div class="progress flex-grow-1" style="height: 6px;">
                  <div class="progress-bar bg-primary" :style="{ width: row.score + '%' }"></div>
                </div>
                <span class="small fw-semibold">{{ row.score }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <small class="text-muted mt-2 d-block">
      {{ filtered.length }} résultat(s) sur {{ data.length }}
    </small>
  </div>
</template>
```

---

## 11. Tableau Responsive avec Actions

```vue
<script setup>
import { ref } from 'vue'

const orders = ref([
  { id: '#001', customer: 'Alice Martin', date: '2025-03-10', total: 89.97, status: 'Livré' },
  { id: '#002', customer: 'Bob Dupont', date: '2025-03-15', total: 29.99, status: 'En cours' },
  { id: '#003', customer: 'Clara Petit', date: '2025-03-20', total: 154.50, status: 'Expédié' },
  { id: '#004', customer: 'David Moreau', date: '2025-03-22', total: 44.99, status: 'Annulé' },
])

const statusMap = {
  'Livré':    'success',
  'En cours': 'warning',
  'Expédié':  'info',
  'Annulé':   'danger',
}

function deleteOrder(id) {
  orders.value = orders.value.filter(o => o.id !== id)
}
</script>

<template>
  <div class="card shadow-sm border-0">
    <div class="card-header bg-white d-flex justify-content-between align-items-center">
      <h6 class="mb-0">Commandes récentes</h6>
      <button class="btn btn-sm btn-outline-primary">Tout voir</button>
    </div>
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>N°</th>
            <th>Client</th>
            <th>Date</th>
            <th>Total</th>
            <th>Statut</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td><code>{{ order.id }}</code></td>
            <td class="fw-semibold">{{ order.customer }}</td>
            <td class="text-muted small">
              {{ new Date(order.date).toLocaleDateString('fr-FR') }}
            </td>
            <td class="fw-bold">{{ order.total.toFixed(2) }} €</td>
            <td>
              <span :class="`badge text-bg-${statusMap[order.status]}`">
                {{ order.status }}
              </span>
            </td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-secondary me-1">👁️</button>
              <button class="btn btn-sm btn-outline-primary me-1">✏️</button>
              <button class="btn btn-sm btn-outline-danger" @click="deleteOrder(order.id)">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```

---

## 12. Formulaire de Connexion

```vue
<script setup>
import { reactive, ref } from 'vue'

const form = reactive({ email: '', password: '', remember: false })
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  if (!form.email || !form.password) {
    error.value = 'Veuillez remplir tous les champs.'
    return
  }
  loading.value = true
  try {
    await new Promise(r => setTimeout(r, 1000)) // simuler API
    // router.push('/dashboard')
  } catch {
    error.value = 'Email ou mot de passe incorrect.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3">
    <div class="card shadow border-0 w-100" style="max-width: 420px;">
      <div class="card-body p-4 p-md-5">

        <h4 class="card-title text-center mb-1">Connexion</h4>
        <p class="text-center text-muted small mb-4">Accédez à votre compte</p>

        <!-- Alerte erreur -->
        <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

        <form @submit.prevent="handleLogin" novalidate>

          <div class="mb-3">
            <label class="form-label fw-semibold">Adresse email</label>
            <input v-model="form.email" type="email" class="form-control"
                   placeholder="vous@example.com" autocomplete="email" />
          </div>

          <div class="mb-3">
            <div class="d-flex justify-content-between">
              <label class="form-label fw-semibold">Mot de passe</label>
              <a href="#" class="small text-decoration-none">Oublié ?</a>
            </div>
            <input v-model="form.password" type="password" class="form-control"
                   placeholder="••••••••" autocomplete="current-password" />
          </div>

          <div class="mb-4 form-check">
            <input v-model="form.remember" type="checkbox" class="form-check-input" id="remember" />
            <label class="form-check-label small" for="remember">Se souvenir de moi</label>
          </div>

          <button type="submit" class="btn btn-primary w-100" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <hr class="my-4" />
        <p class="text-center small mb-0">
          Pas de compte ?
          <RouterLink to="/register" class="text-decoration-none fw-semibold">S'inscrire</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
```

---

## 13. Formulaire d'Inscription

```vue
<script setup>
import { reactive, ref, computed } from 'vue'

const form = reactive({
  firstName: '', lastName: '', email: '',
  password: '', confirm: '', terms: false
})
const submitted = ref(false)
const loading = ref(false)

// Validation : retourne true si le champ est valide APRÈS soumission tentée
const v = {
  firstName: computed(() => submitted.value && form.firstName.trim().length < 2),
  lastName:  computed(() => submitted.value && form.lastName.trim().length < 2),
  email:     computed(() => submitted.value && !form.email.includes('@')),
  password:  computed(() => submitted.value && form.password.length < 6),
  confirm:   computed(() => submitted.value && form.confirm !== form.password),
  terms:     computed(() => submitted.value && !form.terms),
}

const isValid = computed(() =>
  form.firstName.trim().length >= 2 &&
  form.lastName.trim().length >= 2 &&
  form.email.includes('@') &&
  form.password.length >= 6 &&
  form.confirm === form.password &&
  form.terms
)

async function handleSubmit() {
  submitted.value = true
  if (!isValid.value) return
  loading.value = true
  await new Promise(r => setTimeout(r, 1200))
  loading.value = false
  alert('Compte créé !')
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3">
    <div class="card shadow border-0 w-100" style="max-width: 520px;">
      <div class="card-body p-4 p-md-5">

        <h4 class="text-center mb-1">Créer un compte</h4>
        <p class="text-center text-muted small mb-4">Rejoignez-nous en quelques secondes</p>

        <form @submit.prevent="handleSubmit" novalidate>

          <div class="row g-3 mb-3">
            <div class="col-6">
              <label class="form-label fw-semibold">Prénom</label>
              <input v-model="form.firstName" type="text"
                     :class="['form-control', { 'is-invalid': v.firstName.value }]"
                     placeholder="Alice" />
              <div class="invalid-feedback">Prénom requis (min. 2 car.)</div>
            </div>
            <div class="col-6">
              <label class="form-label fw-semibold">Nom</label>
              <input v-model="form.lastName" type="text"
                     :class="['form-control', { 'is-invalid': v.lastName.value }]"
                     placeholder="Dupont" />
              <div class="invalid-feedback">Nom requis (min. 2 car.)</div>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Email</label>
            <input v-model="form.email" type="email"
                   :class="['form-control', { 'is-invalid': v.email.value }]"
                   placeholder="vous@example.com" />
            <div class="invalid-feedback">Email invalide.</div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Mot de passe</label>
            <input v-model="form.password" type="password"
                   :class="['form-control', { 'is-invalid': v.password.value }]"
                   placeholder="Minimum 6 caractères" />
            <div class="invalid-feedback">Minimum 6 caractères.</div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Confirmer le mot de passe</label>
            <input v-model="form.confirm" type="password"
                   :class="['form-control', { 'is-invalid': v.confirm.value }]"
                   placeholder="Répétez le mot de passe" />
            <div class="invalid-feedback">Les mots de passe ne correspondent pas.</div>
          </div>

          <div class="mb-4 form-check">
            <input v-model="form.terms" type="checkbox"
                   :class="['form-check-input', { 'is-invalid': v.terms.value }]"
                   id="terms" />
            <label class="form-check-label small" for="terms">
              J'accepte les <a href="#">conditions d'utilisation</a>
            </label>
            <div class="invalid-feedback">Vous devez accepter les conditions.</div>
          </div>

          <button type="submit" class="btn btn-primary w-100" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Création...' : 'Créer mon compte' }}
          </button>
        </form>

        <p class="text-center small mt-3 mb-0">
          Déjà inscrit ?
          <RouterLink to="/login" class="text-decoration-none fw-semibold">Se connecter</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
```

---

## 14. Formulaire de Contact

```vue
<script setup>
import { reactive, ref } from 'vue'

const form = reactive({ name: '', email: '', subject: '', message: '' })
const success = ref(false)
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  await new Promise(r => setTimeout(r, 1000))
  loading.value = false
  success.value = true
  Object.keys(form).forEach(k => form[k] = '')
}
</script>

<template>
  <div class="container py-5" style="max-width: 640px;">
    <h2 class="mb-1">Nous contacter</h2>
    <p class="text-muted mb-4">Nous vous répondrons sous 24h.</p>

    <div v-if="success" class="alert alert-success d-flex align-items-center gap-2">
      <span>✅</span> Message envoyé ! Nous vous recontacterons bientôt.
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-4">
        <form @submit.prevent="handleSubmit">

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Votre nom *</label>
              <input v-model="form.name" type="text" class="form-control"
                     placeholder="Alice Dupont" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Votre email *</label>
              <input v-model="form.email" type="email" class="form-control"
                     placeholder="vous@example.com" required />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Sujet *</label>
            <select v-model="form.subject" class="form-select" required>
              <option value="" disabled>Choisir un sujet...</option>
              <option>Question sur une commande</option>
              <option>Problème technique</option>
              <option>Retour / Remboursement</option>
              <option>Autre</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="form-label">Message *</label>
            <textarea v-model="form.message" class="form-control" rows="5"
                      placeholder="Décrivez votre demande..." required></textarea>
            <div class="form-text text-end">{{ form.message.length }} / 1000</div>
          </div>

          <button type="submit" class="btn btn-primary px-4" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Envoi...' : '📨 Envoyer le message' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
```

---

## 15. Formulaire de Recherche / Filtres

```vue
<script setup>
import { reactive, ref } from 'vue'

const filters = reactive({
  keyword: '',
  category: '',
  priceMin: '',
  priceMax: '',
  inStock: false,
  sortBy: 'default'
})

function resetFilters() {
  Object.assign(filters, {
    keyword: '', category: '', priceMin: '',
    priceMax: '', inStock: false, sortBy: 'default'
  })
}

function handleSearch() {
  console.log('Filtres appliqués :', { ...filters })
}
</script>

<template>
  <div class="card shadow-sm border-0 p-4">
    <h5 class="mb-3">🔍 Recherche & Filtres</h5>

    <form @submit.prevent="handleSearch">
      <div class="row g-3">

        <!-- Mot-clé -->
        <div class="col-12 col-md-4">
          <label class="form-label small fw-semibold">Mot-clé</label>
          <div class="input-group">
            <span class="input-group-text">🔍</span>
            <input v-model="filters.keyword" type="text" class="form-control"
                   placeholder="Nom du produit..." />
          </div>
        </div>

        <!-- Catégorie -->
        <div class="col-6 col-md-2">
          <label class="form-label small fw-semibold">Catégorie</label>
          <select v-model="filters.category" class="form-select">
            <option value="">Toutes</option>
            <option>Électronique</option>
            <option>Vêtements</option>
            <option>Maison</option>
            <option>Sport</option>
          </select>
        </div>

        <!-- Prix min/max -->
        <div class="col-3 col-md-2">
          <label class="form-label small fw-semibold">Prix min</label>
          <div class="input-group">
            <input v-model="filters.priceMin" type="number" class="form-control"
                   placeholder="0" min="0" />
            <span class="input-group-text">€</span>
          </div>
        </div>

        <div class="col-3 col-md-2">
          <label class="form-label small fw-semibold">Prix max</label>
          <div class="input-group">
            <input v-model="filters.priceMax" type="number" class="form-control"
                   placeholder="999" min="0" />
            <span class="input-group-text">€</span>
          </div>
        </div>

        <!-- Trier par -->
        <div class="col-12 col-md-2">
          <label class="form-label small fw-semibold">Trier par</label>
          <select v-model="filters.sortBy" class="form-select">
            <option value="default">Par défaut</option>
            <option value="price-asc">Prix ↑</option>
            <option value="price-desc">Prix ↓</option>
            <option value="rating">Note</option>
          </select>
        </div>

        <!-- En stock + Boutons -->
        <div class="col-12 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="form-check">
            <input v-model="filters.inStock" type="checkbox" class="form-check-input" id="stock" />
            <label class="form-check-label" for="stock">En stock uniquement</label>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="resetFilters">
              Réinitialiser
            </button>
            <button type="submit" class="btn btn-primary btn-sm px-4">
              Appliquer les filtres
            </button>
          </div>
        </div>

      </div>
    </form>
  </div>
</template>
```

---

## 16. Navbar

```vue
<script setup>
import { ref } from 'vue'

const isLoggedIn = ref(true)
const cartCount = ref(3)
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow">
    <div class="container">

      <!-- Logo -->
      <RouterLink class="navbar-brand fw-bold" to="/">🛒 ShopVue</RouterLink>

      <!-- Burger mobile -->
      <button class="navbar-toggler" type="button"
              data-bs-toggle="collapse" data-bs-target="#navMenu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Menu -->
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/">Accueil</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/products">Produits</RouterLink>
          </li>
          <!-- Dropdown -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
              Catégories
            </a>
            <ul class="dropdown-menu dropdown-menu-dark">
              <li><a class="dropdown-item" href="#">Électronique</a></li>
              <li><a class="dropdown-item" href="#">Vêtements</a></li>
              <li><hr class="dropdown-divider" /></li>
              <li><a class="dropdown-item" href="#">Tout voir</a></li>
            </ul>
          </li>
        </ul>

        <!-- Recherche rapide -->
        <form class="d-flex me-3">
          <input class="form-control form-control-sm me-2" type="search" placeholder="Rechercher..." />
          <button class="btn btn-outline-light btn-sm" type="submit">🔍</button>
        </form>

        <!-- Actions utilisateur -->
        <div class="d-flex align-items-center gap-2">
          <!-- Panier -->
          <RouterLink to="/cart" class="btn btn-outline-light btn-sm position-relative">
            🛒
            <span v-if="cartCount > 0"
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {{ cartCount }}
            </span>
          </RouterLink>

          <!-- Connecté -->
          <div v-if="isLoggedIn" class="dropdown">
            <button class="btn btn-outline-light btn-sm dropdown-toggle" data-bs-toggle="dropdown">
              👤 Mon compte
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#">Mon profil</a></li>
              <li><a class="dropdown-item" href="#">Mes commandes</a></li>
              <li><hr class="dropdown-divider" /></li>
              <li><button class="dropdown-item text-danger">Déconnexion</button></li>
            </ul>
          </div>

          <!-- Non connecté -->
          <template v-else>
            <RouterLink to="/login" class="btn btn-outline-light btn-sm">Connexion</RouterLink>
            <RouterLink to="/register" class="btn btn-primary btn-sm">S'inscrire</RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>
```

---

## 17. Sidebar

```vue
<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isOpen = ref(true)

const menuItems = [
  { label: 'Dashboard', icon: '📊', to: '/dashboard' },
  { label: 'Produits', icon: '📦', to: '/products' },
  { label: 'Commandes', icon: '🛒', to: '/orders', badge: 5 },
  { label: 'Clients', icon: '👥', to: '/customers' },
  { label: 'Statistiques', icon: '📈', to: '/stats' },
  { label: 'Paramètres', icon: '⚙️', to: '/settings' },
]
</script>

<template>
  <div class="d-flex">

    <!-- Sidebar -->
    <div :class="['sidebar bg-dark text-white', isOpen ? 'sidebar-open' : 'sidebar-closed']">

      <!-- Header sidebar -->
      <div class="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary">
        <span v-if="isOpen" class="fw-bold">🛒 Admin</span>
        <button class="btn btn-sm btn-outline-secondary" @click="isOpen = !isOpen">
          {{ isOpen ? '◀' : '▶' }}
        </button>
      </div>

      <!-- Menu -->
      <ul class="nav flex-column p-2 mt-2">
        <li v-for="item in menuItems" :key="item.to" class="nav-item mb-1">
          <RouterLink
            :to="item.to"
            :class="['nav-link text-white d-flex align-items-center gap-2 rounded',
                     { 'bg-primary': route.path === item.to }]"
          >
            <span>{{ item.icon }}</span>
            <span v-if="isOpen" class="flex-grow-1">{{ item.label }}</span>
            <span v-if="isOpen && item.badge" class="badge bg-danger rounded-pill">
              {{ item.badge }}
            </span>
          </RouterLink>
        </li>
      </ul>

      <!-- Profil bas de sidebar -->
      <div v-if="isOpen" class="mt-auto p-3 border-top border-secondary d-flex align-items-center gap-2">
        <img src="https://i.pravatar.cc/32" class="rounded-circle" width="32" height="32" />
        <div>
          <div class="small fw-semibold">Alice Admin</div>
          <div class="text-muted" style="font-size: 0.7rem;">Super admin</div>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="flex-grow-1 p-4">
      <slot>Contenu de la page ici</slot>
    </div>
  </div>
</template>

<style scoped>
.sidebar { min-height: 100vh; transition: width 0.25s ease; display: flex; flex-direction: column; }
.sidebar-open  { width: 240px; }
.sidebar-closed { width: 64px; }
.nav-link:hover { background: rgba(255,255,255,0.1) !important; }
</style>
```

---

## 18. Modal

```vue
<script setup>
import { ref } from 'vue'

const showModal = ref(false)

function confirmAction() {
  console.log('Action confirmée')
  showModal.value = false
}
</script>

<template>
  <div>
    <!-- Bouton déclencheur -->
    <button class="btn btn-danger" @click="showModal = true">
      Supprimer l'article
    </button>

    <!-- Overlay modal (sans Bootstrap JS — 100% Vue) -->
    <Teleport to="body">
      <div v-if="showModal"
           class="modal-overlay d-flex align-items-center justify-content-center"
           @click.self="showModal = false">
        <div class="modal-dialog modal-dialog-centered w-100 m-3" style="max-width: 480px;">
          <div class="modal-content shadow-lg">

            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title">⚠️ Confirmer la suppression</h5>
              <button type="button" class="btn-close" @click="showModal = false"></button>
            </div>

            <div class="modal-body">
              <p class="text-muted">
                Êtes-vous sûr de vouloir supprimer cet article ?
                Cette action est <strong>irréversible</strong>.
              </p>
            </div>

            <div class="modal-footer border-0 pt-0">
              <button class="btn btn-outline-secondary" @click="showModal = false">
                Annuler
              </button>
              <button class="btn btn-danger" @click="confirmAction">
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.55); z-index: 1050;
}
</style>
```

---

## 19. Alert / Toast

```vue
<script setup>
import { ref } from 'vue'

// Alerts statiques
const alerts = ref([
  { id: 1, type: 'success', message: '✅ Commande passée avec succès !' },
  { id: 2, type: 'warning', message: '⚠️ Stock limité : plus que 2 articles.' },
  { id: 3, type: 'danger',  message: '❌ Erreur de paiement. Réessayez.' },
  { id: 4, type: 'info',    message: 'ℹ️ Livraison estimée : 3-5 jours ouvrés.' },
])

function dismiss(id) {
  alerts.value = alerts.value.filter(a => a.id !== id)
}

// Toasts dynamiques
const toasts = ref([])
let toastId = 0

function showToast(message, type = 'success') {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 4000)
}
</script>

<template>
  <div class="p-4">

    <!-- Alerts Bootstrap dismissibles -->
    <h5 class="mb-3">Alertes</h5>
    <div v-for="alert in alerts" :key="alert.id"
         :class="`alert alert-${alert.type} alert-dismissible d-flex align-items-center`">
      {{ alert.message }}
      <button type="button" class="btn-close ms-auto" @click="dismiss(alert.id)"></button>
    </div>

    <!-- Boutons pour déclencher des toasts -->
    <h5 class="mt-4 mb-3">Toasts dynamiques</h5>
    <div class="d-flex gap-2">
      <button class="btn btn-success btn-sm" @click="showToast('Article ajouté au panier !', 'success')">
        Toast succès
      </button>
      <button class="btn btn-danger btn-sm" @click="showToast('Une erreur est survenue.', 'danger')">
        Toast erreur
      </button>
      <button class="btn btn-info btn-sm" @click="showToast('Mise à jour disponible.', 'info')">
        Toast info
      </button>
    </div>

    <!-- Conteneur toasts (coin bas-droite) -->
    <Teleport to="body">
      <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 9999;">
        <TransitionGroup name="toast">
          <div v-for="toast in toasts" :key="toast.id"
               :class="`toast show align-items-center text-white bg-${toast.type} border-0 mb-2`">
            <div class="d-flex">
              <div class="toast-body">{{ toast.message }}</div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto"
                      @click="toasts = toasts.filter(t => t.id !== toast.id)">
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(60px); }
</style>
```

---

## 20. Badge & Tag

```vue
<template>
  <div class="p-4">

    <!-- Badges couleurs Bootstrap -->
    <h5 class="mb-3">Badges</h5>
    <div class="d-flex flex-wrap gap-2 mb-4">
      <span class="badge text-bg-primary">Primary</span>
      <span class="badge text-bg-secondary">Secondary</span>
      <span class="badge text-bg-success">Actif</span>
      <span class="badge text-bg-danger">Rupture</span>
      <span class="badge text-bg-warning">Promo</span>
      <span class="badge text-bg-info">Nouveau</span>
      <span class="badge text-bg-dark">Premium</span>
      <span class="badge rounded-pill bg-primary">Pill badge</span>
    </div>

    <!-- Badges sur des boutons -->
    <h5 class="mb-3">Badges sur boutons</h5>
    <div class="d-flex gap-2 mb-4">
      <button class="btn btn-primary">
        Notifications <span class="badge bg-danger ms-1">5</span>
      </button>
      <button class="btn btn-outline-dark">
        Panier <span class="badge bg-dark ms-1">3</span>
      </button>
    </div>

    <!-- Tags / chips personnalisés -->
    <h5 class="mb-3">Tags supprimables</h5>
    <TagList />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const tags = ref(['Vue.js', 'Bootstrap', 'JavaScript', 'CSS', 'HTML'])

function removeTag(tag) {
  tags.value = tags.value.filter(t => t !== tag)
}
</script>

<!-- Intègre directement dans le même fichier -->
<template>
  <div class="d-flex flex-wrap gap-2">
    <span
      v-for="tag in tags"
      :key="tag"
      class="badge bg-light text-dark border d-flex align-items-center gap-1 px-2 py-1"
    >
      {{ tag }}
      <button class="btn-close btn-close-sm" style="font-size: 0.55rem;" @click="removeTag(tag)">
      </button>
    </span>
  </div>
</template>
```

---

## 21. Accordion / FAQ

```vue
<script setup>
import { ref } from 'vue'

const faqs = ref([
  {
    id: 'faq1',
    question: 'Quels sont les délais de livraison ?',
    answer: 'La livraison standard prend 3 à 5 jours ouvrés. Express : 24h.'
  },
  {
    id: 'faq2',
    question: 'Comment retourner un article ?',
    answer: 'Vous disposez de 30 jours pour retourner un article. Contactez le service client.'
  },
  {
    id: 'faq3',
    question: 'Les paiements sont-ils sécurisés ?',
    answer: 'Oui, tous les paiements sont chiffrés via SSL et traités par des partenaires certifiés.'
  },
])
</script>

<template>
  <div class="container py-4" style="max-width: 680px;">
    <h2 class="mb-4">Questions fréquentes</h2>

    <div class="accordion shadow-sm" id="faqAccordion">
      <div v-for="(faq, index) in faqs" :key="faq.id" class="accordion-item border-0 mb-2">
        <h2 class="accordion-header">
          <button
            class="accordion-button fw-semibold"
            :class="{ collapsed: index !== 0 }"
            type="button"
            data-bs-toggle="collapse"
            :data-bs-target="`#${faq.id}`"
          >
            {{ faq.question }}
          </button>
        </h2>
        <div
          :id="faq.id"
          class="accordion-collapse collapse"
          :class="{ show: index === 0 }"
          data-bs-parent="#faqAccordion"
        >
          <div class="accordion-body text-muted">{{ faq.answer }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 22. Tabs (Onglets)

```vue
<script setup>
import { ref } from 'vue'

const activeTab = ref('description')

const tabs = [
  { id: 'description', label: '📝 Description' },
  { id: 'specs', label: '⚙️ Caractéristiques' },
  { id: 'reviews', label: '⭐ Avis (24)' },
]
</script>

<template>
  <div>
    <!-- Onglets -->
    <ul class="nav nav-tabs">
      <li v-for="tab in tabs" :key="tab.id" class="nav-item">
        <button
          :class="['nav-link', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </li>
    </ul>

    <!-- Contenu -->
    <div class="tab-content border border-top-0 rounded-bottom p-4">

      <div v-if="activeTab === 'description'">
        <h6>Description du produit</h6>
        <p class="text-muted">
          Description complète ici. Matière, dimensions, utilisation recommandée...
        </p>
      </div>

      <div v-else-if="activeTab === 'specs'">
        <h6>Caractéristiques techniques</h6>
        <table class="table table-sm">
          <tbody>
            <tr><th>Marque</th><td>TechPro</td></tr>
            <tr><th>Couleur</th><td>Noir</td></tr>
            <tr><th>Poids</th><td>250g</td></tr>
            <tr><th>Garantie</th><td>2 ans</td></tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="activeTab === 'reviews'">
        <h6>Avis clients</h6>
        <div v-for="i in 3" :key="i" class="border-bottom pb-3 mb-3">
          <div class="d-flex justify-content-between">
            <strong>Utilisateur {{ i }}</strong>
            <span class="text-warning">★★★★☆</span>
          </div>
          <p class="text-muted small mb-0">Très bon produit, livraison rapide !</p>
        </div>
      </div>

    </div>
  </div>
</template>
```

---

## 23. Breadcrumb

```vue
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Breadcrumb manuel
const crumbs = [
  { label: 'Accueil', to: '/' },
  { label: 'Produits', to: '/products' },
  { label: 'Électronique', to: '/products?cat=electronique' },
  { label: 'Casque Audio Pro' }, // dernier = actif, pas de lien
]
</script>

<template>
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li
        v-for="(crumb, i) in crumbs"
        :key="i"
        :class="['breadcrumb-item', { active: i === crumbs.length - 1 }]"
      >
        <RouterLink v-if="crumb.to" :to="crumb.to">{{ crumb.label }}</RouterLink>
        <span v-else>{{ crumb.label }}</span>
      </li>
    </ol>
  </nav>
</template>
```

---

## 24. Pagination

```vue
<script setup>
import { ref, computed } from 'vue'

const allItems = ref(Array.from({ length: 87 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` })))
const currentPage = ref(1)
const perPage = 10

const totalPages = computed(() => Math.ceil(allItems.value.length / perPage))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return allItems.value.slice(start, start + perPage)
})

const visiblePages = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value ||
        (i >= currentPage.value - 2 && i <= currentPage.value + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
})

function goTo(page) {
  if (typeof page === 'number') currentPage.value = page
}
</script>

<template>
  <div>
    <!-- Liste des items -->
    <ul class="list-group mb-3">
      <li v-for="item in paginatedItems" :key="item.id" class="list-group-item">
        {{ item.name }}
      </li>
    </ul>

    <!-- Pagination Bootstrap -->
    <nav>
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="goTo(currentPage - 1)">«</button>
        </li>

        <li v-for="(page, i) in visiblePages" :key="i"
            :class="['page-item', { active: page === currentPage, disabled: page === '...' }]">
          <button class="page-link" @click="goTo(page)">{{ page }}</button>
        </li>

        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button class="page-link" @click="goTo(currentPage + 1)">»</button>
        </li>
      </ul>
    </nav>

    <p class="text-center text-muted small">
      Page {{ currentPage }} / {{ totalPages }} — {{ allItems.length }} éléments au total
    </p>
  </div>
</template>
```

---

## 25. Progress Bar

```vue
<script setup>
import { ref } from 'vue'

const progress = ref(65)
const skills = ref([
  { name: 'Vue.js', value: 90, color: 'success' },
  { name: 'Bootstrap', value: 75, color: 'primary' },
  { name: 'JavaScript', value: 85, color: 'warning' },
  { name: 'Python', value: 50, color: 'info' },
])
</script>

<template>
  <div class="p-4" style="max-width: 500px;">

    <!-- Barre simple avec contrôle -->
    <h5 class="mb-3">Progression commande</h5>
    <div class="progress mb-2" style="height: 20px;">
      <div
        class="progress-bar progress-bar-striped progress-bar-animated bg-success"
        :style="{ width: progress + '%' }"
      >
        {{ progress }}%
      </div>
    </div>
    <div class="d-flex gap-2 mt-2">
      <button class="btn btn-sm btn-outline-danger" @click="progress = Math.max(0, progress - 10)">−10</button>
      <button class="btn btn-sm btn-outline-success" @click="progress = Math.min(100, progress + 10)">+10</button>
    </div>

    <!-- Barres multiples -->
    <h5 class="mt-4 mb-3">Compétences</h5>
    <div v-for="skill in skills" :key="skill.name" class="mb-3">
      <div class="d-flex justify-content-between mb-1">
        <span class="small fw-semibold">{{ skill.name }}</span>
        <span class="small text-muted">{{ skill.value }}%</span>
      </div>
      <div class="progress" style="height: 8px;">
        <div
          :class="`progress-bar bg-${skill.color}`"
          :style="{ width: skill.value + '%' }"
        ></div>
      </div>
    </div>

  </div>
</template>
```

---

## 26. Spinner / Loading

```vue
<script setup>
import { ref } from 'vue'

const isLoading = ref(false)

async function fetchData() {
  isLoading.value = true
  await new Promise(r => setTimeout(r, 2000))
  isLoading.value = false
}
</script>

<template>
  <div class="p-4">

    <!-- Spinners Bootstrap -->
    <div class="d-flex gap-3 align-items-center mb-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <div class="spinner-border spinner-border-sm text-success" role="status"></div>
      <div class="spinner-grow text-warning" role="status"></div>
      <div class="spinner-grow spinner-grow-sm text-danger" role="status"></div>
    </div>

    <!-- Loading sur un bouton -->
    <button class="btn btn-primary" :disabled="isLoading" @click="fetchData">
      <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
      {{ isLoading ? 'Chargement...' : 'Charger les données' }}
    </button>

    <!-- Overlay de chargement pleine page -->
    <Teleport to="body">
      <div v-if="isLoading"
           class="position-fixed top-0 start-0 w-100 h-100 d-flex
                  align-items-center justify-content-center bg-white bg-opacity-75"
           style="z-index: 9999;">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
          <p class="text-muted">Chargement en cours...</p>
        </div>
      </div>
    </Teleport>

  </div>
</template>
```

---

## 27. Hero Section

```vue
<template>

  <!-- Hero centré simple -->
  <section class="bg-dark text-white py-5 text-center">
    <div class="container py-4">
      <span class="badge bg-primary mb-3">Nouveautés 2025</span>
      <h1 class="display-4 fw-bold mb-3">Bienvenue sur <span class="text-warning">ShopVue</span></h1>
      <p class="lead text-white-50 mb-4 col-md-8 mx-auto">
        Découvrez des milliers de produits livrés en 24h partout en France.
        Qualité garantie, retours gratuits.
      </p>
      <div class="d-flex justify-content-center gap-3 flex-wrap">
        <RouterLink to="/products" class="btn btn-warning btn-lg fw-semibold">
          Voir les produits
        </RouterLink>
        <RouterLink to="/register" class="btn btn-outline-light btn-lg">
          Créer un compte
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- Hero 2 colonnes (texte + image) -->
  <section class="container py-5">
    <div class="row align-items-center g-5">
      <div class="col-lg-6">
        <p class="text-primary fw-semibold text-uppercase small mb-2">Offre limitée</p>
        <h2 class="display-5 fw-bold lh-sm mb-3">
          Jusqu'à <span class="text-danger">-50%</span> sur l'électronique
        </h2>
        <p class="text-muted mb-4">
          Profitez de nos meilleures offres sur une sélection de produits high-tech.
          Stocks limités, dépêchez-vous !
        </p>
        <div class="d-flex gap-3 flex-wrap">
          <a href="#" class="btn btn-primary btn-lg">En profiter →</a>
          <a href="#" class="btn btn-link text-decoration-none">En savoir plus</a>
        </div>
      </div>
      <div class="col-lg-6">
        <img src="https://via.placeholder.com/600x400" class="img-fluid rounded-4 shadow-lg" alt="hero" />
      </div>
    </div>
  </section>

</template>
```

---

## 28. Footer

```vue
<template>
  <footer class="bg-dark text-white pt-5 pb-3 mt-5">
    <div class="container">
      <div class="row g-4 mb-4">

        <!-- Brand -->
        <div class="col-md-4">
          <h5 class="fw-bold mb-3">🛒 ShopVue</h5>
          <p class="text-white-50 small">
            Votre boutique en ligne de confiance. Livraison rapide, retours gratuits, paiement sécurisé.
          </p>
          <div class="d-flex gap-2 mt-3">
            <a href="#" class="btn btn-sm btn-outline-secondary">ig</a>
            <a href="#" class="btn btn-sm btn-outline-secondary">tw</a>
            <a href="#" class="btn btn-sm btn-outline-secondary">fb</a>
          </div>
        </div>

        <!-- Liens -->
        <div class="col-6 col-md-2">
          <h6 class="fw-semibold mb-3">Boutique</h6>
          <ul class="list-unstyled">
            <li class="mb-2"><a href="#" class="text-white-50 text-decoration-none small">Produits</a></li>
            <li class="mb-2"><a href="#" class="text-white-50 text-decoration-none small">Nouveautés</a></li>
            <li class="mb-2"><a href="#" class="text-white-50 text-decoration-none small">Promotions</a></li>
          </ul>
        </div>

        <div class="col-6 col-md-2">
          <h6 class="fw-semibold mb-3">Aide</h6>
          <ul class="list-unstyled">
            <li class="mb-2"><a href="#" class="text-white-50 text-decoration-none small">FAQ</a></li>
            <li class="mb-2"><a href="#" class="text-white-50 text-decoration-none small">Livraison</a></li>
            <li class="mb-2"><a href="#" class="text-white-50 text-decoration-none small">Retours</a></li>
          </ul>
        </div>

        <!-- Newsletter -->
        <div class="col-md-4">
          <h6 class="fw-semibold mb-3">Newsletter</h6>
          <p class="text-white-50 small">Recevez nos offres exclusives.</p>
          <div class="input-group">
            <input type="email" class="form-control form-control-sm bg-secondary border-0 text-white"
                   placeholder="votre@email.com" />
            <button class="btn btn-primary btn-sm">S'abonner</button>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div class="border-top border-secondary pt-3 d-flex justify-content-between
                  flex-wrap gap-2 text-white-50 small">
        <span>© {{ new Date().getFullYear() }} ShopVue. Tous droits réservés.</span>
        <div class="d-flex gap-3">
          <a href="#" class="text-white-50 text-decoration-none">Mentions légales</a>
          <a href="#" class="text-white-50 text-decoration-none">Confidentialité</a>
        </div>
      </div>
    </div>
  </footer>
</template>
```

---

## 29. Dashboard Stats Cards

```vue
<script setup>
import { ref } from 'vue'

const stats = ref([
  { label: 'Commandes totales', value: '1 284', icon: '🛒', change: '+12%', trend: 'up', color: 'primary' },
  { label: 'Chiffre d\'affaires', value: '48 590 €', icon: '💶', change: '+8.5%', trend: 'up', color: 'success' },
  { label: 'Clients actifs', value: '3 421', icon: '👥', change: '+5%', trend: 'up', color: 'info' },
  { label: 'Retours', value: '37', icon: '↩️', change: '-3%', trend: 'down', color: 'danger' },
])
</script>

<template>
  <div class="container py-4">
    <h5 class="mb-4">Vue d'ensemble</h5>

    <div class="row g-3">
      <div v-for="stat in stats" :key="stat.label" class="col-sm-6 col-xl-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <p class="text-muted small mb-1">{{ stat.label }}</p>
                <h4 class="fw-bold mb-0">{{ stat.value }}</h4>
              </div>
              <div :class="`bg-${stat.color} bg-opacity-10 rounded-circle p-2`"
                   style="width: 48px; height: 48px; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
                {{ stat.icon }}
              </div>
            </div>
            <div :class="`text-${stat.trend === 'up' ? 'success' : 'danger'} small fw-semibold`">
              {{ stat.trend === 'up' ? '↑' : '↓' }} {{ stat.change }}
              <span class="text-muted fw-normal ms-1">vs mois dernier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 30. Empty State

```vue
<script setup>
defineProps({
  icon:    { type: String, default: '📭' },
  title:   { type: String, default: 'Aucun résultat' },
  message: { type: String, default: 'Il n\'y a rien à afficher pour le moment.' },
  actionLabel: { type: String, default: null },
})
const emit = defineEmits(['action'])
</script>

<template>
  <div class="text-center py-5 px-3">
    <div style="font-size: 4rem;" class="mb-3">{{ icon }}</div>
    <h5 class="fw-semibold mb-2">{{ title }}</h5>
    <p class="text-muted mb-4" style="max-width: 360px; margin: 0 auto;">{{ message }}</p>
    <button v-if="actionLabel" class="btn btn-primary" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>
```

```vue
<!-- Exemples d'utilisation -->
<EmptyState
  icon="🛒"
  title="Panier vide"
  message="Vous n'avez aucun article dans votre panier."
  action-label="Voir les produits"
  @action="router.push('/products')"
/>

<EmptyState
  icon="📦"
  title="Aucune commande"
  message="Vous n'avez pas encore passé de commande."
/>

<EmptyState
  icon="😕"
  title="Aucun résultat"
  :message="`Aucun produit ne correspond à '${searchQuery}'.`"
  action-label="Réinitialiser"
  @action="resetSearch"
/>
```
