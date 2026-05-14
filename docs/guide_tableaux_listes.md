# Guide Complet : Traitements de Tableaux & Listes en JavaScript

> [!NOTE]
> Ce guide explique **toutes les opérations sur les tableaux** utilisées dans `cartService.js`, avec des exemples concrets tirés de ton code et des explications visuelles.

---

## Table des matières

1. [Array.isArray() — Vérifier si c'est un tableau](#1-arrayisarray)
2. [Ternaire pour normaliser en tableau](#2-ternaire-pour-normaliser)
3. [.map() — Transformer chaque élément](#3-map)
4. [.filter() — Filtrer les éléments](#4-filter)
5. [.findIndex() — Trouver la position d'un élément](#5-findindex)
6. [.find() — Trouver un élément](#6-find)
7. [Spread operator [...] — Copier un tableau](#7-spread-operator)
8. [.push() — Ajouter à la fin](#8-push)
9. [.splice() — Retirer par index](#9-splice)
10. [Chaînage .filter().map()](#10-chainage)
11. [Ternaire sur .length pour XML](#11-ternaire-sur-length)
12. [Promise.all() avec .map()](#12-promiseall)

---

## 1. `Array.isArray()` — Vérifier si c'est un tableau {#1-arrayisarray}

### Dans ton code ([cartService.js:21](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L21))

```javascript
const cartArray = Array.isArray(carts) ? carts : [carts]
```

### Pourquoi ?

PrestaShop retourne des données XML. Quand il y a **un seul panier**, le parser XML retourne un **objet**. Quand il y en a **plusieurs**, il retourne un **tableau**. On doit normaliser ça.

### Exemple visuel

```javascript
// Cas 1 : PrestaShop retourne 1 panier → le parser donne un objet
const carts = { id: 5, id_customer: 1 }
Array.isArray(carts)  // ❌ false
// → On le met dans un tableau : [{ id: 5, id_customer: 1 }]

// Cas 2 : PrestaShop retourne 3 paniers → le parser donne un tableau
const carts = [{ id: 5 }, { id: 6 }, { id: 7 }]
Array.isArray(carts)  // ✅ true
// → On le garde tel quel
```

### Syntaxe générale

```javascript
Array.isArray(valeur)  // retourne true ou false
```

| Entrée | Résultat |
|--------|----------|
| `[1, 2, 3]` | `true` |
| `{ id: 1 }` | `false` |
| `"hello"` | `false` |
| `[]` | `true` |
| `null` | `false` |

---

## 2. Ternaire pour normaliser en tableau {#2-ternaire-pour-normaliser}

### Dans ton code ([cartService.js:21](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L21), [26](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L26), [70](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L70))

```javascript
const rows = Array.isArray(rowSource) ? rowSource : [rowSource]
```

### C'est quoi un ternaire ?

```
condition ? valeurSiVrai : valeurSiFaux
```

C'est un raccourci de `if/else` en une seule ligne :

```javascript
// Avec if/else (3 lignes)
let rows
if (Array.isArray(rowSource)) {
  rows = rowSource
} else {
  rows = [rowSource]
}

// Avec ternaire (1 ligne) — IDENTIQUE
const rows = Array.isArray(rowSource) ? rowSource : [rowSource]
```

### Schéma du flux

```
rowSource reçu de l'API
        │
        ▼
  Est-ce un tableau ?
   ┌──── oui ────┐──── non ────┐
   ▼              ▼             
 On le garde    On l'emballe    
 tel quel       dans [ ]        
   │              │             
   ▼              ▼             
 [row1, row2]   [row1]         
```

---

## 3. `.map()` — Transformer chaque élément {#3-map}

### Dans ton code ([cartService.js:23](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L23), [35](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L35), [210](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L210), [297](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L297), [305](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L305), [386](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L386))

```javascript
// Ligne 210 — Transformer les rows en format XML
const cartRowsXml = updatedRows.map((row) => ({
  id_product: String(row.id_product),
  id_product_attribute: String(row.id_product_attribute),
  id_address_delivery: '0',
  id_customization: '0',
  quantity: String(row.quantity)
}))
```

### Explication

`.map()` crée un **nouveau tableau** en appliquant une fonction à **chaque élément**. Le tableau original n'est **pas modifié**.

```
Entrée:  [ élémentA, élémentB, élémentC ]
                │          │          │
           fonction()  fonction()  fonction()
                │          │          │
Sortie:  [ résultatA, résultatB, résultatC ]
```

### Exemple concret

```javascript
const rows = [
  { id_product: 1, id_product_attribute: 0, quantity: 2 },
  { id_product: 5, id_product_attribute: 3, quantity: 1 }
]

const cartRowsXml = rows.map((row) => ({
  id_product: String(row.id_product),         // Number → String
  id_product_attribute: String(row.id_product_attribute),
  id_address_delivery: '0',                    // Champ ajouté
  id_customization: '0',                       // Champ ajouté
  quantity: String(row.quantity)
}))

// Résultat :
// [
//   { id_product: "1", id_product_attribute: "0", id_address_delivery: "0", id_customization: "0", quantity: "2" },
//   { id_product: "5", id_product_attribute: "3", id_address_delivery: "0", id_customization: "0", quantity: "1" }
// ]
```

### Autre exemple (ligne 297) — map conditionnel

```javascript
// Modifier la quantité d'UN SEUL produit, garder les autres intacts
const updatedRows = currentCart.rows.map((row) => {
  if (row.id_product === 5 && row.id_product_attribute === 3) {
    return { ...row, quantity: 10 }  // ← On modifie celui-ci
  }
  return row  // ← On garde les autres tels quels
})
```

```
Avant :  [{ id: 1, qty: 2 }, { id: 5, qty: 1 }, { id: 8, qty: 3 }]
                 │                    │                    │
             return row        return {...row, qty:10}  return row
                 │                    │                    │
Après :  [{ id: 1, qty: 2 }, { id: 5, qty: 10 }, { id: 8, qty: 3 }]
```

> [!IMPORTANT]
> `.map()` retourne **toujours** un nouveau tableau de la **même taille** que l'original. Il ne supprime ni n'ajoute d'éléments.

---

## 4. `.filter()` — Filtrer les éléments {#4-filter}

### Dans ton code ([cartService.js:34](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L34), [381](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L381))

```javascript
// Ligne 34 — Garder seulement les lignes qui ont un id_product valide
rows.filter((row) => row && (row.id_product || row.id_product === 0))

// Ligne 381 — Retirer un produit spécifique
const updatedRows = currentCart.rows.filter(
  (row) => !(row.id_product === Number(idProduct) && 
             row.id_product_attribute === Number(idProductAttribute))
)
```

### Explication

`.filter()` crée un **nouveau tableau** contenant uniquement les éléments qui passent le test (= la fonction retourne `true`).

```
Entrée:  [ élémentA, élémentB, élémentC, élémentD ]
              │          │          │          │
          test(A)    test(B)    test(C)    test(D)
           true       false      true       false
              │                    │
Sortie:  [ élémentA,          élémentC ]
```

### Exemple concret — Supprimer un produit (ligne 381)

```javascript
const rows = [
  { id_product: 1, id_product_attribute: 0, quantity: 2 },
  { id_product: 5, id_product_attribute: 3, quantity: 1 },  // ← On veut supprimer celui-ci
  { id_product: 8, id_product_attribute: 0, quantity: 3 }
]

// On veut supprimer le produit 5 avec attribut 3
const idProduct = 5
const idProductAttribute = 3

const updatedRows = rows.filter(
  (row) => !(row.id_product === 5 && row.id_product_attribute === 3)
)

// Pour chaque élément :
// row {id:1} → !(false && ...) → !(false) → true   ✅ GARDER
// row {id:5} → !(true && true)  → !(true)  → false  ❌ SUPPRIMER
// row {id:8} → !(false && ...) → !(false) → true   ✅ GARDER

// Résultat :
// [
//   { id_product: 1, id_product_attribute: 0, quantity: 2 },
//   { id_product: 8, id_product_attribute: 0, quantity: 3 }
// ]
```

> [!TIP]
> **`.filter()` vs `.map()`** :
> - `.map()` → même nombre d'éléments, mais **transformés**
> - `.filter()` → même format d'éléments, mais **nombre réduit**

---

## 5. `.findIndex()` — Trouver la position d'un élément {#5-findindex}

### Dans ton code ([cartService.js:186](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L186))

```javascript
const existingRowIndex = currentCart.rows.findIndex(
  (row) =>
    row.id_product === Number(productData.id_product) &&
    row.id_product_attribute === Number(productData.id_product_attribute || 0)
)
```

### Explication

`.findIndex()` parcourt le tableau et retourne l'**index** (position) du **premier** élément qui passe le test. Si aucun ne passe, il retourne **-1**.

```javascript
const rows = [
  { id_product: 1 },   // index 0
  { id_product: 5 },   // index 1  ← Celui qu'on cherche
  { id_product: 8 }    // index 2
]

rows.findIndex(row => row.id_product === 5)
// → 1

rows.findIndex(row => row.id_product === 99)
// → -1  (non trouvé)
```

### Pourquoi l'utiliser ici ?

On veut savoir si le produit **existe déjà** dans le panier pour décider :
- **Si index > -1** → le produit existe → on **incrémente** la quantité
- **Si index === -1** → le produit n'existe pas → on l'**ajoute**

```javascript
if (existingRowIndex > -1) {
  // Le produit est DÉJÀ dans le panier → incrémenter
  updatedRows[existingRowIndex].quantity += 1
} else {
  // Le produit N'EST PAS dans le panier → ajouter
  updatedRows.push({ id_product: 5, quantity: 1 })
}
```

---

## 6. `.find()` — Trouver un élément {#6-find}

### Dans ton code ([CartPage.vue:94](file:///home/elyance/Documents/new-app-eval-12026/src/views/FO/CartPage.vue#L94))

```javascript
const item = cartItems.value.find(i => i.id === itemId)
```

### Différence avec `.findIndex()`

| Méthode | Retourne | Si non trouvé |
|---------|----------|---------------|
| `.find()` | **L'élément lui-même** | `undefined` |
| `.findIndex()` | **La position (index)** | `-1` |

```javascript
const rows = [
  { id_product: 1, quantity: 2 },
  { id_product: 5, quantity: 1 },
  { id_product: 8, quantity: 3 }
]

rows.find(row => row.id_product === 5)
// → { id_product: 5, quantity: 1 }   ← L'objet entier

rows.findIndex(row => row.id_product === 5)
// → 1   ← Juste la position
```

> [!TIP]
> **Quand utiliser quoi ?**
> - `.find()` → Tu as besoin de **lire** les données de l'élément
> - `.findIndex()` → Tu as besoin de **modifier** l'élément à sa position dans le tableau

---

## 7. Spread operator `[...]` — Copier un tableau {#7-spread-operator}

### Dans ton code ([cartService.js:192](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L192))

```javascript
let updatedRows = [...currentCart.rows]
```

### Explication

`...` (trois points) "déplie" un tableau. `[...tableau]` crée une **copie** indépendante.

```javascript
const original = [1, 2, 3]

// ❌ MAUVAIS — les deux variables pointent vers le MÊME tableau
const copie = original
copie.push(4)
console.log(original) // [1, 2, 3, 4] ← L'original est modifié !

// ✅ BON — on crée une COPIE indépendante
const copie = [...original]
copie.push(4)
console.log(original) // [1, 2, 3] ← L'original est intact
console.log(copie)    // [1, 2, 3, 4]
```

### Spread sur les objets (ligne 196-198)

```javascript
updatedRows[existingRowIndex] = {
  ...updatedRows[existingRowIndex],  // Copier toutes les propriétés existantes
  quantity: updatedRows[existingRowIndex].quantity + 1  // Écraser "quantity"
}
```

```
Avant :  { id_product: 5, id_product_attribute: 3, quantity: 1 }
               │                    │                    │
          ...copier           ...copier            remplacer par 2
               │                    │                    │
Après :  { id_product: 5, id_product_attribute: 3, quantity: 2 }
```

> [!WARNING]
> Le spread fait une copie **superficielle** (shallow copy). Si ton tableau contient des objets imbriqués, les objets internes sont toujours des **références**.

---

## 8. `.push()` — Ajouter à la fin {#8-push}

### Dans ton code ([cartService.js:202](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L202))

```javascript
updatedRows.push({
  id_product: Number(productData.id_product),
  id_product_attribute: Number(productData.id_product_attribute || 0),
  quantity: Number(productData.quantity || 1)
})
```

### Explication

`.push()` ajoute un ou plusieurs éléments **à la fin** du tableau. Il **modifie** le tableau original.

```javascript
const fruits = ['pomme', 'banane']

fruits.push('orange')
// fruits = ['pomme', 'banane', 'orange']

fruits.push('kiwi', 'mangue')
// fruits = ['pomme', 'banane', 'orange', 'kiwi', 'mangue']
```

> [!NOTE]
> C'est pour ça qu'on fait `[...currentCart.rows]` (copie) **avant** de faire `.push()` — on ne veut pas modifier le tableau original.

---

## 9. `.splice()` — Retirer par index {#9-splice}

### Dans ton code ([CartPage.vue:100](file:///home/elyance/Documents/new-app-eval-12026/src/views/FO/CartPage.vue#L100))

```javascript
const index = cartItems.value.findIndex(i => i.id === itemId)
if (index > -1) {
  cartItems.value.splice(index, 1)
}
```

### Explication

`.splice(startIndex, deleteCount)` **modifie** le tableau en retirant des éléments à une position donnée.

```javascript
const fruits = ['pomme', 'banane', 'orange', 'kiwi']

// Retirer 1 élément à la position 1
fruits.splice(1, 1)
// fruits = ['pomme', 'orange', 'kiwi']
// (banane supprimée)

// Retirer 2 éléments à la position 0
fruits.splice(0, 2)
// fruits = ['kiwi']
```

### `.splice()` vs `.filter()` pour supprimer

| Critère | `.splice()` | `.filter()` |
|---------|------------|-------------|
| Modifie l'original | ✅ Oui | ❌ Non (nouveau tableau) |
| Besoin de l'index | ✅ Oui | ❌ Non |
| Usage typique | Vue.js `ref` (réactivité) | Données immuables |

---

## 10. Chaînage `.filter().map()` {#10-chainage}

### Dans ton code ([cartService.js:33-39](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L33-L39))

```javascript
rows: rows
  .filter((row) => row && (row.id_product || row.id_product === 0))
  .map((row) => ({
    id_product: Number(row.id_product || 0),
    id_product_attribute: Number(row.id_product_attribute || 0),
    quantity: Number(row.quantity || 0)
  }))
```

### Explication

On peut **enchaîner** les méthodes car `.filter()` et `.map()` retournent tous les deux un **nouveau tableau**.

```
Étape 1 — .filter() : Éliminer les lignes invalides
──────────────────────────────────────────────────

Entrée :  [ {id_product:1}, null, {id_product:5}, undefined ]
                  ✅          ❌        ✅            ❌

Résultat : [ {id_product:1}, {id_product:5} ]


Étape 2 — .map() : Transformer en format propre
──────────────────────────────────────────────────

Entrée :  [ {id_product:1, ...}, {id_product:5, ...} ]
                    │                      │
             transformer              transformer
                    │                      │
Résultat : [ {id_product:1, qty:0}, {id_product:5, qty:0} ]
```

> [!TIP]
> L'ordre est important ! On filtre **d'abord** (pour éviter des erreurs sur `null`), puis on transforme.

---

## 11. Ternaire sur `.length` pour le format XML {#11-ternaire-sur-length}

### Dans ton code ([cartService.js:239](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L239), [334](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L334), [415-419](file:///home/elyance/Documents/new-app-eval-12026/src/services/cartService.js#L415-L419))

```javascript
// Version simple (ligne 239)
cart_row: cartRowsXml.length === 1 ? cartRowsXml[0] : cartRowsXml

// Version complète (ligne 415-419)
cart_row: cartRowsXml.length === 0
  ? ''
  : cartRowsXml.length === 1
    ? cartRowsXml[0]
    : cartRowsXml
```

### Pourquoi ?

PrestaShop attend un format XML précis pour `cart_row` :

```xml
<!-- 0 produit → pas de noeud cart_row -->
<cart_rows/>

<!-- 1 seul produit → cart_row est un noeud UNIQUE (pas un tableau) -->
<cart_rows>
  <cart_row>
    <id_product>5</id_product>
    <quantity>1</quantity>
  </cart_row>
</cart_rows>

<!-- Plusieurs produits → cart_row est RÉPÉTÉ -->
<cart_rows>
  <cart_row>
    <id_product>5</id_product>
    <quantity>1</quantity>
  </cart_row>
  <cart_row>
    <id_product>8</id_product>
    <quantity>2</quantity>
  </cart_row>
</cart_rows>
```

Le `XMLBuilder` de `fast-xml-parser` a besoin de recevoir :
- **0 produit** → une chaîne vide `''`
- **1 produit** → un **objet** `{ id_product: "5", ... }`
- **2+ produits** → un **tableau** `[{ id_product: "5" }, { id_product: "8" }]`

### Schéma de décision

```
cartRowsXml.length ?
        │
   ┌────┼────────────┐
   0    1           2+
   │    │            │
  ''  objet[0]   tableau
   │    │            │
   ▼    ▼            ▼
 vide  <cart_row>   <cart_row>
       </cart_row>  </cart_row>
                    <cart_row>
                    </cart_row>
```

---

## 12. `Promise.all()` avec `.map()` {#12-promiseall}

### Dans ton code ([CartPage.vue:47-74](file:///home/elyance/Documents/new-app-eval-12026/src/views/FO/CartPage.vue#L47-L74))

```javascript
const enrichedItems = await Promise.all(
  cart.rows.map(async (row) => {
    const product = await getProductDetail(row.id_product)
    return {
      id: row.id_product,
      name: product?.name || `Produit #${row.id_product}`,
      price: product?.price || 0,
      quantity: row.quantity,
      image: product?.image || ''
    }
  })
)
```

### Explication

Quand tu utilises `.map()` avec une fonction `async`, chaque élément retourne une **Promise** (une promesse de résultat futur). `Promise.all()` attend que **toutes** les promesses se résolvent.

```
cart.rows = [row1, row2, row3]
       │
  .map(async ...)
       │
  [Promise1, Promise2, Promise3]    ← Tableau de promesses
       │
  Promise.all(...)
       │
  await ← On attend que TOUTES finissent
       │
  [résultat1, résultat2, résultat3]  ← Tableau de résultats
```

### Sans `Promise.all()` (lent ❌)

```javascript
// Séquentiel : produit1 → puis produit2 → puis produit3
// Total : 1s + 1s + 1s = 3 secondes
for (const row of cart.rows) {
  const product = await getProductDetail(row.id_product)
  enrichedItems.push({ ...row, name: product.name })
}
```

### Avec `Promise.all()` (rapide ✅)

```javascript
// Parallèle : produit1, produit2, produit3 en MÊME TEMPS
// Total : max(1s, 1s, 1s) = 1 seconde
const enrichedItems = await Promise.all(
  cart.rows.map(async (row) => {
    const product = await getProductDetail(row.id_product)
    return { ...row, name: product.name }
  })
)
```

---

## Résumé visuel — Toutes les méthodes

| Méthode | Entrée | Sortie | Modifie l'original ? | Usage dans ton code |
|---------|--------|--------|---------------------|---------------------|
| `Array.isArray()` | n'importe quoi | `true` / `false` | Non | Vérifier le format API |
| `.map()` | tableau | nouveau tableau (même taille) | Non | Transformer les données |
| `.filter()` | tableau | nouveau tableau (taille ≤) | Non | Supprimer un produit |
| `.findIndex()` | tableau | nombre (index ou -1) | Non | Chercher si produit existe |
| `.find()` | tableau | élément ou `undefined` | Non | Récupérer un item |
| `[...arr]` | tableau | copie du tableau | Non | Travailler sans modifier |
| `.push()` | élément | modifie le tableau | **Oui** | Ajouter un produit |
| `.splice()` | index, count | modifie le tableau | **Oui** | Retirer visuellement |
| `Promise.all()` | tableau de promesses | tableau de résultats | Non | Appels API en parallèle |

> [!CAUTION]
> `.push()` et `.splice()` **modifient** le tableau original. C'est pour ça qu'on fait toujours une copie avec `[...]` avant de les utiliser sur des données qu'on ne veut pas altérer.
