/**
 * Route Guard pour protéger les pages
 */

import { authService } from '@/services/AuthService'
import { authStore } from '@/stores/authStore'

export function setupRouterGuards(router) {
  router.beforeEach((to) => {
    const isAuthenticated = authService.isAuthenticated()
    const isBackOfficeRoute = to.path.startsWith('/backoffice')
    const isRemovePage = to.path === '/fo/remove'
    const isLogin = to.path === '/backoffice/login'

    // Protéger la route /fo/remove - nécessite une authentification client
    if (isRemovePage && !isAuthenticated) {
      console.warn(`⛔ Accès refusé à ${to.path} - Client non connecté - Redirection vers /fo`)
      return '/backoffice/login'
    }

    if (!isBackOfficeRoute) {
      return true
    }

    // Si pas authentifié et pas sur /backoffice/login → aller sur /backoffice/login
    if (!isAuthenticated && !isLogin) {
      console.warn(`⛔ Accès refusé à ${to.path} - Redirection vers /backoffice/login`)
      return '/backoffice/login'
    }

    // Si authentifié et veut aller sur /backoffice/login → redirection backoffice
    if (isAuthenticated && isLogin) {
      console.log('✅ Déjà connecté - Redirection vers /backoffice')
      return '/backoffice'
    }

    // Permettre la navigation
    return true
  })
}
