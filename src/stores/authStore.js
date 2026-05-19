import { reactive } from 'vue'
import { getCustomerById } from '../services/customerService'

/**
 * Store réactif global pour l'état d'authentification.
 * Persiste le client connecté dans sessionStorage.
 */
export const authStore = reactive({
  /** Client connecté ou null */
  customer: null,

  /** Indique si l'utilisateur est connecté */
  get isLoggedIn() {
    return this.customer !== null
  },

  /**
   * Connecte un client et persiste dans sessionStorage
   * @param {Object} customer - { id, firstname, lastname, email, secure_key }
   */
  login(customer) {
    this.customer = customer
    sessionStorage.setItem('customer', JSON.stringify(customer))
  },

  /**
   * Déconnecte le client et supprime de sessionStorage
   */
  logout() {
    this.customer = null
    sessionStorage.removeItem('id_cart') // Nettoie aussi le panier lié à la session
    sessionStorage.removeItem('customer')
  },

  /**
   * Restaure la session du client depuis sessionStorage
   * Appelé au montage de l'app
   */
  async restoreSession() {
    const stored = sessionStorage.getItem('customer')
    if (!stored) {
      this.customer = null
      return
    }

    try {
      const parsed = JSON.parse(stored)
      if (parsed && parsed.id) {
        // Vérifier que le client existe toujours
        const customer = await getCustomerById(parsed.id)
        if (customer) {
          this.customer = customer
        } else {
          this.logout()
        }
      }
    } catch (err) {
      console.error('authStore: erreur lors de la restauration de session', err)
      this.logout()
    }
  }
})
