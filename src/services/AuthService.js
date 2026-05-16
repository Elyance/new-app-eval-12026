/**
 * Service d'authentification pour le BackOffice
 */

export class AuthService {
  USER_KEY = 'backoffice_user'
  VALID_LOGIN = 'ITU'
  VALID_PASSWORD = 'eval2026'

  /**
   * Authentifier avec login/mdp
   */
  login(username, password) {
    if (username === this.VALID_LOGIN && password === this.VALID_PASSWORD) {
      const user = { username, role: 'admin', loginTime: new Date().toLocaleString() }

      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user))

      console.log('✅ Login réussi pour:', username)
      return { success: true, user }
    }

    console.warn('❌ Tentative de login échouée')
    return { success: false, error: 'Identifiants invalides — utilisez ITU / eval2026.' }
  }

  /**
   * Déconnexion
   */
  logout() {
    sessionStorage.removeItem(this.USER_KEY)

    // Nettoie aussi une ancienne clé token si elle existe d'une précédente version.
    sessionStorage.removeItem('backoffice_token')

    console.log('✅ Logout réussi')
  }

  /**
   * Vérifier si authentifié
   */
  isAuthenticated() {
    return !!this.getUser()
  }

  /**
   * Récupérer l'utilisateur
   */
  getUser() {
    const user = sessionStorage.getItem(this.USER_KEY)
    return user ? JSON.parse(user) : null
  }

  /**
   * Récupérer le nom d'utilisateur
   */
  getCurrentUsername() {
    const user = this.getUser()
    return user ? user.username : null
  }
}

export const authService = new AuthService()
