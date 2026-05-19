import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/FO/HomePage.vue'
import ProductsPage from '../views/FO/ProductsPage.vue'
import ProductDetailPage from '../views/FO/ProductDetailPage.vue'
import CartPage from '../views/FO/CartPage.vue'
import CheckoutPage from '../views/FO/CheckoutPage.vue'
import OrderConfirmationPage from '../views/FO/OrderConfirmationPage.vue'
import LandingPage from '../views/LandingPage.vue'
import MyOrdersPage from '../views/FO/MyOrdersPage.vue'
import Accueil from '../views/BO/Accueil.vue'
import Modules from '../views/BO/Modules.vue'
import GestionDonnees from '../views/BO/GestionDonnees.vue'
import SectionView from '../views/BO/SectionView.vue'
import ResetComponent from '@/views/BO/GestionDonnees/Reset.vue'
import ImportStatic from '@/views/BO/GestionDonnees/ImportStatic.vue'
import Commandes from '@/views/BO/Modules/Commandes.vue'
import CommandeDetail from '@/views/BO/Modules/CommandeDetail.vue'
import TableauBord from '@/views/BO/Modules/TableauBord.vue'
import Produits from '@/views/BO/Modules/Produits.vue'
import Statistiques from '@/views/BO/Modules/Statistiques.vue'
import StatistiquesProduits from '@/views/BO/Modules/StatistiquesProduits.vue'
import Login from '@/components/Auth/Login.vue'
import { setupRouterGuards } from '@/middleware/authGuard'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    meta: { hideSidebar: true }
  },
  {
    path: '/backoffice/login',
    name: 'BackOfficeLogin',
    component: Login,
    meta: { hideSidebar: true }
  },
  {
    path: '/backoffice',
    name: 'Accueil',
    component: Accueil
  },
  {
    path: '/backoffice/modules',
    name: 'Modules',
    component: Modules,
    children: [
      {
        path: 'commandes',
        name: 'Commandes',
        component: Commandes,
        meta: {
          title: 'Commandes',
          description: 'Gérez les commandes et leur statut.'
        }
      },
      {
        path: 'tableau-de-bord',
        name: 'TableauBord',
        component: TableauBord,
        meta: {
          title: 'Tableau de bord',
          description: 'Aperçu statique des commandes par jour.'
        }
      },
      {
        path: 'produits',
        name: 'Produits',
        component: Produits,
        meta: {
          title: 'Produits',
          description: 'Liste statique des produits avec action de stock.'
        }
      },
      {
        path: 'statistiques',
        name: 'Statistiques',
        component: Statistiques,
        meta: {
          title: 'Statistiques',
          description: 'Consultez les statistiques des ventes et bénéfices.'
        }
      },
      {
        path: 'statistiques-produits',
        name: 'StatistiquesProduits',
        component: StatistiquesProduits,
        meta: {
          title: 'Statistiques Produits',
          description: 'Consultez les statistiques détaillées des ventes et bénéfices par produit.'
        }
      },
      {
        path: 'commandes/:id_cart/detail',
        name: 'CommandeDetail',
        component: CommandeDetail,
        meta: {
          title: 'Détail commande',
          description: 'Consultez le détail statique d’une commande.'
        }
      }
    ]
  },
  {
    path: '/backoffice/gestion-donnees',
    name: 'GestionDonnees',
    component: GestionDonnees,
    children: [
      {
        path: 'reset',
        name: 'Reset',
        component: ResetComponent,
        meta: {
          title: 'Reset',
          description: 'Section de maintenance et de remise à zéro.'
        }
      },
      {
        path: 'importer',
        name: 'ImportDonnees',
        component: ImportStatic,
        meta: {
          title: 'Importation des données',
          description: 'Importez vos fichiers de données depuis cette page.'
        }
      }
    ]
  },
  {
    path: '/fo',
    name: 'Home',
    component: HomePage,
    meta: { hideSidebar: true }
  },
  {
    path: '/fo/produits',
    name: 'Products',
    component: ProductsPage,
    meta: { hideSidebar: true }
  },
  {
    path: '/fo/produits/:id',
    name: 'ProductDetail',
    component: ProductDetailPage,
    meta: { hideSidebar: true }
  },
  {
    path: '/fo/panier',
    name: 'Cart',
    component: CartPage,
    meta: { hideSidebar: true }
  },
  {
    path: '/fo/mes-commandes',
    name: 'MyOrders',
    component: MyOrdersPage,
    meta: { hideSidebar: true }
  },
  {
    path: '/fo/connexion',
    name: 'LoginFO',
    component: HomePage,
    meta: { hideSidebar: true }
  },
  {
    path: '/fo/commande',
    name: 'Checkout',
    component: CheckoutPage,
    meta: { hideSidebar: true }
  },
  {
    path: '/fo/confirmation/:id',
    name: 'OrderConfirmation',
    component: OrderConfirmationPage,
    meta: { hideSidebar: true }
  },
  {
    path: '/landing',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

setupRouterGuards(router)

export default router
