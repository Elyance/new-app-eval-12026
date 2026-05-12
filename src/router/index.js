import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/FO/HomePage.vue'
import ProductsPage from '../views/FO/ProductsPage.vue'
import ProductDetailPage from '../views/FO/ProductDetailPage.vue'
import CartPage from '../views/FO/CartPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/fo'
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
