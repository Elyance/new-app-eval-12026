<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  getCart,
  getIdCartInSessionStorage,
  updateCartCustomer
} from '../../services/cartService'
import { getProductDetail } from '../../services/productService'
import { getProductPricingDisplay } from '../../services/specificPricesService'
import { getCountries } from '../../services/countryService'
import { getCarriers } from '../../services/carrierService'
import { createGuestCustomer, createAddress, createOrder } from '../../services/orderService'
import { cartStore } from '../../stores/cartStore'
import { useOrderStore } from '../../stores/orderStore'
import { authStore } from '../../stores/authStore'
import { getCustomerAddresses, getAllCustomers } from '../../services/customerService'
import { getXmlString } from '../../utils/parsing'
import { API_URL } from '../../constants/constant'
import '../../styles/checkout.css'

const router = useRouter()
const orderStore = useOrderStore()

// State
const isLoading = ref(true)
const isSubmitting = ref(false)
const cartItems = ref([])
const countries = ref([])
const carriers = ref([])

// Form data
const form = reactive({
  firstname: '',
  lastname: '',
  address1: '',
  postcode: '',
  city: '',
  id_country: '',
  id_carrier: 1,
  module: 'ps_cashondelivery',
  payment: 'Paiement à la livraison'
})

// Form validation errors
const errors = reactive({
  firstname: '',
  lastname: '',
  address1: '',
  postcode: '',
  city: '',
  id_country: ''
})

// Computed totals
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const shipping = computed(() => 0)

const total = computed(() => subtotal.value + shipping.value)

// Charger la listes des clients pour la selection de profil
const customers = ref([])
const selectedCustomerId = ref(null)
 
onMounted(async () => {
  try {
    customers.value = await getAllCustomers()
  } catch (err) {
    console.error('Erreur de chargement des clients', err)
  }
})

/**
 * Gère la sélection d'un client
 */
const handleSelect = (customer) => {
  // Connecter localement le client sélectionné
  authStore.logout()
  authStore.login(customer)
  selectedCustomerId.value = customer.id

  // Préremplir le formulaire immédiatement
  form.firstname = getXmlString(customer.firstname || '')
  form.lastname = getXmlString(customer.lastname || '')
  form.email = getXmlString(customer.email || '')

  // Charger les adresses du client et préremplir si disponible
  getCustomerAddresses(customer.id).then(addresses => {
    if (addresses && addresses.length > 0) {
      const addr = addresses[0]
      form.address1 = getXmlString(addr.address1)
      form.postcode = getXmlString(addr.postcode)
      form.city = getXmlString(addr.city)
      form.id_country = addr.id_country ? Number(addr.id_country) : form.id_country
    }
  }).catch(err => {
    console.error('Erreur chargement adresses client sélectionné', err)
  })
}

/**
 * Charge le panier, les pays et les transporteurs
 */
const loadCheckoutData = async () => {
  isLoading.value = true

  try {
    const cartId = getIdCartInSessionStorage()

    if (!cartId) {
      router.push('/fo/panier')
      return
    }

    // Charger en parallèle : panier, pays, transporteurs
    const [cart, countriesList, carriersList] = await Promise.all([
      getCart(cartId),
      getCountries(),
      getCarriers()
    ])

    if (!cart || !cart.rows || cart.rows.length === 0) {
      router.push('/fo/panier')
      return
    }

    // Enrichir les items du panier
    const enrichedItems = await Promise.all(
      cart.rows.map(async (row) => {
        try {
          const product = await getProductDetail(row.id_product)
          const pricing = getProductPricingDisplay(product)

          return {
            id: row.id_product,
            id_product_attribute: row.id_product_attribute,
            name: product?.name || `Produit #${row.id_product}`,
            price: pricing.finalPrice,
            quantity: row.quantity,
            image: product?.image || '',
            reference: product?.reference || ''
          }
        } catch (err) {
          console.error(`Erreur chargement produit ${row.id_product}:`, err)
          return {
            id: row.id_product,
            id_product_attribute: row.id_product_attribute,
            name: `Produit #${row.id_product}`,
            price: 0,
            quantity: row.quantity,
            image: '',
            reference: ''
          }
        }
      })
    )

    cartItems.value = enrichedItems
    countries.value = countriesList
    carriers.value = carriersList

    // Sélectionner le premier transporteur actif par défaut
    if (carriersList.length > 0) {
      const defaultCarrier = carriersList.find(c => c.id === 1) || carriersList[0]
      form.id_carrier = defaultCarrier.id
    }

    // Préremplir avec les informations du client connecté
    if (authStore.isLoggedIn && authStore.customer) {
      form.firstname = getXmlString(authStore.customer.firstname)
      form.lastname = getXmlString(authStore.customer.lastname)
      form.email = getXmlString(authStore.customer.email)

      const addresses = await getCustomerAddresses(authStore.customer.id)
      if (addresses && addresses.length > 0) {
        const addr = addresses[0]
        form.address1 = getXmlString(addr.address1)
        form.postcode = getXmlString(addr.postcode)
        form.city = getXmlString(addr.city)
        form.id_country = addr.id_country ? Number(addr.id_country) : form.id_country
      }
    }
  } catch (err) {
    console.error('Erreur chargement checkout:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadCheckoutData()
})

/**
 * Valide le formulaire
 */
const validateForm = () => {
  let isValid = true

  // Reset errors
  Object.keys(errors).forEach(key => { errors[key] = '' })

  if (!form.firstname.trim()) {
    errors.firstname = 'Le prénom est requis'
    isValid = false
  }

  if (!form.lastname.trim()) {
    errors.lastname = 'Le nom est requis'
    isValid = false
  }

  if (!form.address1.trim()) {
    errors.address1 = "L'adresse est requise"
    isValid = false
  }

  if (!form.postcode.trim()) {
    errors.postcode = 'Le code postal est requis'
    isValid = false
  } else if (!/^\d{5}$/.test(form.postcode.trim())) {
    errors.postcode = 'Le code postal doit être au format 99999'
    isValid = false
  }

  if (!form.city.trim()) {
    errors.city = 'La ville est requise'
    isValid = false
  }

  if (!form.id_country) {
    errors.id_country = 'Le pays est requis'
    isValid = false
  }

  if (!form.email.trim()) {
    errors.email = 'Email est requis'
    isValid = false
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email.trim())) {
    errors.email = 'Email invalide'
    isValid = false
  }

  return isValid
}

/**
 * Soumet la commande
 * Flow: POST /api/customers (guest) → POST /api/addresses → POST /api/orders
 */
const handleSubmitOrder = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    const cartId = getIdCartInSessionStorage()
    if (!cartId) {
      throw new Error('Panier introuvable')
    }

    let customer = null;

    // 1. Utiliser le client connecté ou créer un client guest
    if (authStore.isLoggedIn && authStore.customer) {
      customer = authStore.customer;
      console.log('Utilisation du client connecté:', customer);
    } else {
      customer = await createGuestCustomer({
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        email: form.email.trim(),
      })

      if (!customer) {
        throw new Error('Erreur lors de la création du client')
      }
      console.log('Client guest créé:', customer)
    }

    // 2. Mettre à jour le panier avec le id_customer du guest
    const updatedCart = await updateCartCustomer(cartId, customer.id)
    if (!updatedCart) {
      console.warn('Impossible de mettre à jour le customer du panier, tentative de continuer...')
    }

    console.log('Panier mis à jour avec id_customer:', customer.id)

    // 3. Créer l'adresse
    const address = await createAddress({
      id_customer: customer.id,
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      address1: form.address1.trim(),
      postcode: form.postcode.trim(),
      city: form.city.trim(),
      id_country: Number(form.id_country),
      alias: 'Mon adresse'
    })

    if (!address) {
      throw new Error("Erreur lors de la création de l'adresse")
    }

    console.log('Adresse créée:', address)

    // 4. Construire les order_rows et calculer les totaux de manière stricte
    const orderRows = cartItems.value.map(item => {
      const qty = Number(item.quantity || 0)
      const unitIncl = Number(Number(item.price || 0).toFixed(2))
      const unitExcl = Number(unitIncl.toFixed(2)) // si vous avez la valeur HT, remplacez ici
      return {
        product_id: item.id,
        product_attribute_id: item.id_product_attribute || 0,
        product_quantity: qty,
        product_name: item.name,
        product_reference: item.reference || '',
        product_price: unitIncl,
        unit_price_tax_incl: unitIncl,
        unit_price_tax_excl: unitExcl
      }
    })

    // Calculer les totaux à partir des orderRows pour éviter toute divergence
    const totalProductsCalc = orderRows.reduce((sum, r) => sum + Number(r.unit_price_tax_incl) * Number(r.product_quantity), 0)
    const totalProductsFixed = Number(totalProductsCalc.toFixed(2))
    const shippingFixed = Number(Number(shipping.value || 0).toFixed(2))
    const totalPaidFixed = Number((totalProductsFixed + shippingFixed).toFixed(2))

    // 5. Créer la commande en envoyant des montants formatés (2 décimales)
    const order = await createOrder({
      id_address_delivery: address.id,
      id_address_invoice: address.id,
      id_cart: cartId,
      id_customer: customer.id,
      id_carrier: form.id_carrier,
      id_currency: 1,
      id_lang: 1,
      module: form.module,
      payment: form.payment,
      total_paid: totalPaidFixed,
      total_paid_tax_incl: totalPaidFixed,
      total_paid_tax_excl: Number((totalProductsFixed).toFixed(2)),
      total_products: totalProductsFixed,
      total_products_wt: totalProductsFixed,
      total_shipping: shippingFixed,
      secure_key: customer.secure_key || '',
      order_rows: orderRows
    })

    if (!order) {
      throw new Error('Erreur lors de la création de la commande')
    }

    console.log('Commande créée:', order)

    // Vider le sessionStorage du cart
    sessionStorage.removeItem('id_cart')
    await cartStore.refreshCount()

    // Stocker les données de confirmation dans le store Pinia
    const selectedCountry = countries.value.find(c => c.id === Number(form.id_country))
    const selectedCarrier = carriers.value.find(c => c.id === form.id_carrier)

    orderStore.setConfirmation({
      id: order.id,
      reference: order.reference,
      customer: {
        firstname: form.firstname,
        lastname: form.lastname
      },
      address: {
        address1: form.address1,
        postcode: form.postcode,
        city: form.city,
        country: selectedCountry?.name || ''
      },
      carrier: selectedCarrier?.name || 'Click and collect',
      carrierDelay: selectedCarrier?.delay || '',
      payment: form.payment,
      state: order.status || 'Etat inconnu', 
      items: cartItems.value,
      subtotal: subtotal.value,
      shipping: shipping.value,
      total: total.value
    })

    // Naviguer vers la confirmation
    router.push({ name: 'OrderConfirmation', params: { id: order.id } })
  } catch (err) {
    console.error('Erreur lors de la soumission de la commande:', err)
    alert('Une erreur est survenue lors de la création de la commande. Veuillez réessayer.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="checkout-page">
    <div class="breadcrumb">
      <router-link to="/fo">Accueil</router-link>
      <span>/</span>
      <router-link to="/fo/panier">Panier</router-link>
      <span>/</span>
      <span>Commande</span>
    </div>

    <div class="checkout-container">
      <h1>Passer la commande</h1>

      <!-- Stepper -->
      <div class="checkout-stepper">
        <div class="step completed">
          <span class="step-number">✓</span>
          <span class="step-label">Panier</span>
        </div>
        <div class="step-line active"></div>
        <div class="step active">
          <span class="step-number">2</span>
          <span class="step-label">Informations</span>
        </div>
        <div class="step-line"></div>
        <div class="step">
          <span class="step-number">3</span>
          <span class="step-label">Confirmation</span>
        </div>
      </div>

      <!-- Chargement -->
      <div v-if="isLoading" class="checkout-loading">
        <div class="spinner"></div>
        <p>Chargement de la commande...</p>
      </div>

      <!-- Contenu -->
      <div v-else class="checkout-content">
        <!-- Colonne Gauche: Formulaire -->
        <div>
          <div class="selection-container">
            <h2>Se connecter en tant que : </h2>
            <div class="customer-list">
              <div 
                v-for="customer in customers" 
                :key="customer.id" 
                class="customer-card"
                :class="{ selected: selectedCustomerId === customer.id }"
                @click="handleSelect(customer)"
                role="button"
                tabindex="0"
              >
                <div class="avatar">{{ customer.firstname.charAt(0) }}{{ customer.lastname.charAt(0) }}</div>
                <div class="customer-info">
                  <h3>{{ customer.firstname }} {{ customer.lastname }}</h3>
                  <p>{{ customer.email }}</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Informations personnelles -->
          <div class="checkout-form-section">
            <h2 class="form-section-title">
              <span class="icon">👤</span>
              Informations personnelles
            </h2>

            <div class="form-row">
              <div class="form-group">
                <label for="firstname">Prénom <span class="required">*</span></label>
                <input
                  id="firstname"
                  v-model="form.firstname"
                  type="text"
                  placeholder="Votre prénom"
                  :class="{ error: errors.firstname }"
                  :disabled="authStore.isLoggedIn"
                />
                <p v-if="errors.firstname" class="error-message">{{ errors.firstname }}</p>
              </div>

              <div class="form-group">
                <label for="lastname">Nom <span class="required">*</span></label>
                <input
                  id="lastname"
                  v-model="form.lastname"
                  type="text"
                  placeholder="Votre nom"
                  :class="{ error: errors.lastname }"
                  :disabled="authStore.isLoggedIn"
                />
                <p v-if="errors.lastname" class="error-message">{{ errors.lastname }}</p>
              </div>
            </div>

            <div class="form-group">
              <label for="address1">Adresse <span class="required">*</span></label>
              <input
                id="address1"
                v-model="form.address1"
                type="text"
                placeholder="Numéro et nom de rue"
                :class="{ error: errors.address1 }"
              />
              <p v-if="errors.address1" class="error-message">{{ errors.address1 }}</p>
            </div>

            <div class="form-group">
              <label for="email">Email <span class="required">*</span></label>
              <input id="email" v-model="form.email" type="text" placeholder="Votre email" :class="{error: errors.email}" :disabled="authStore.isLoggedIn">
              <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="postcode">Code postal <span class="required">*</span></label>
                <input
                  id="postcode"
                  v-model="form.postcode"
                  type="text"
                  placeholder="99999"
                  maxlength="5"
                  :class="{ error: errors.postcode }"
                />
                <p v-if="errors.postcode" class="error-message">{{ errors.postcode }}</p>
              </div>

              <div class="form-group">
                <label for="city">Ville <span class="required">*</span></label>
                <input
                  id="city"
                  v-model="form.city"
                  type="text"
                  placeholder="Votre ville"
                  :class="{ error: errors.city }"
                />
                <p v-if="errors.city" class="error-message">{{ errors.city }}</p>
              </div>
            </div>

            <div class="form-group">
              <label for="country">Pays <span class="required">*</span></label>
              <select
                id="country"
                v-model="form.id_country"
                :class="{ error: errors.id_country }"
              >
                <option value="" disabled>Sélectionner un pays</option>
                <option
                  v-for="country in countries"
                  :key="country.id"
                  :value="country.id"
                >
                  {{ country.name }}
                </option>
              </select>
              <p v-if="errors.id_country" class="error-message">{{ errors.id_country }}</p>
            </div>
          </div>

          <!-- Livraison & Paiement -->
          <div class="delivery-payment-section">
            <h2 class="form-section-title">
              <span class="icon">🚚</span>
              Mode de livraison
            </h2>

            <div
              v-for="carrier in carriers"
              :key="carrier.id"
              class="option-card"
              :class="{ selected: form.id_carrier === carrier.id }"
              @click="form.id_carrier = carrier.id"
            >
              <div class="option-radio">
                <div class="option-radio-inner"></div>
              </div>
              <div class="option-info">
                <span class="option-name">{{ carrier.name }}</span>
                <span class="option-desc">{{ carrier.delay }}</span>
              </div>
              <span v-if="carrier.id === 1" class="default-badge">Par défaut</span>
            </div>

            <h2 class="form-section-title" style="margin-top: 28px;">
              <span class="icon">💳</span>
              Mode de paiement
            </h2>

            <div
              class="option-card selected"
            >
              <div class="option-radio">
                <div class="option-radio-inner"></div>
              </div>
              <div class="option-info">
                <span class="option-name">{{ form.payment }}</span>
                <span class="option-desc">Module : {{ form.module }}</span>
              </div>
              <span class="default-badge">Par défaut</span>
            </div>
          </div>
        </div>

        <!-- Colonne Droite: Récapitulatif -->
        <div class="checkout-summary-section">
          <div class="checkout-summary">
            <h2>Récapitulatif</h2>

            <div class="summary-items">
              <div
                v-for="item in cartItems"
                :key="`${item.id}-${item.id_product_attribute}`"
                class="summary-item"
              >
                <div class="summary-item-image">
                  <img :src="item.image" :alt="item.name" />
                </div>
                <div class="summary-item-info">
                  <div class="summary-item-name">{{ item.name }}</div>
                  <div class="summary-item-qty">Qté : {{ item.quantity }}</div>
                </div>
                <div class="summary-item-price">{{ (item.price * item.quantity).toFixed(2) }} €</div>
              </div>
            </div>

            <div class="summary-totals">
              <div class="summary-row">
                <span>Sous-total</span>
                <strong>{{ subtotal.toFixed(2) }} €</strong>
              </div>
              <div class="summary-row">
                <span>Livraison</span>
                <strong>{{ shipping === 0 ? 'Gratuit' : shipping.toFixed(2) + ' €' }}</strong>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <strong>{{ total.toFixed(2) }} €</strong>
              </div>
            </div>

            <button
              class="btn-submit-order"
              :disabled="isSubmitting"
              @click="handleSubmitOrder"
            >
              <span v-if="isSubmitting" class="btn-spinner"></span>
              {{ isSubmitting ? 'Traitement en cours...' : 'Confirmer la commande' }}
            </button>

            <router-link to="/fo/panier" class="btn-back-cart">
              ← Retour au panier
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, #f3f4f6, #ffffff);
}

.container {
  width: 100%;
  max-width: 1000px;
  padding: 40px 20px;
}

h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 10px;
}

p {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 30px;
}

.selection-container {
  width: 100%;
}

.customer-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  width: 100%;
}

.customer-card {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.customer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
}

.customer-card.selected {
  border-color: #2563eb;
  background: linear-gradient(90deg, rgba(37,99,235,0.06), rgba(37,99,235,0.02));
  box-shadow: 0 6px 18px rgba(37,99,235,0.06);
}

.anonymous-card {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}

.anonymous-card:hover {
  border-style: solid;
  border-color: #94a3b8;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: #475569;
  margin-right: 15px;
  flex-shrink: 0;
}

.customer-info {
  text-align: left;
}

.customer-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #1e293b;
}

.customer-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.loading {
  font-size: 1.2rem;
  color: #6b7280;
}

.customer-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
</style>
