import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/FO/HomePage.vue'
import ProductsPage from '../views/FO/ProductsPage.vue'
import ProductDetailPage from '../views/FO/ProductDetailPage.vue'
import CartPage from '../views/FO/CartPage.vue'
import LoginPage from '../views/FO/LoginPage.vue'
import CheckoutPage from '../views/FO/CheckoutPage.vue'
import OrderConfirmationPage from '../views/FO/OrderConfirmationPage.vue'
import LandingPage from '../views/LandingPage.vue'
import BackOfficePlaceholder from '../views/BackOfficePlaceholder.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage
  },
  {
    path: '/fo',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/fo/produits',
    name: 'Products',
    component: ProductsPage
  },
  {
    path: '/fo/produits/:id',
    name: 'ProductDetail',
    component: ProductDetailPage
  },
  {
    path: '/fo/panier',
    name: 'Cart',
    component: CartPage
  },
  // {
  //   path: '/fo/connexion',
  //   name: 'Login',
  //   component: LoginPage
  // },
  {
    path: '/fo/connexion',
    name: 'Login',
    component: HomePage
  },
  {
    path: '/backoffice',
    name: 'BackOffice',
    component: BackOfficePlaceholder
  },
  {
    path: '/fo/commande',
    name: 'Checkout',
    component: CheckoutPage
  },
  {
    path: '/fo/confirmation/:id',
    name: 'OrderConfirmation',
    component: OrderConfirmationPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
