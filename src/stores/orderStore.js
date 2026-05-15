import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store Pinia pour les données de confirmation de commande.
 * Utilisé pour passer les données entre CheckoutPage et OrderConfirmationPage.
 */
export const useOrderStore = defineStore('order', () => {
  /** Données de confirmation (null si aucune commande en attente) */
  const confirmation = ref(null)

  /**
   * Enregistre les données de confirmation après la création d'une commande.
   * @param {Object} data - Données de la commande confirmée
   */
  function setConfirmation(data) {
    confirmation.value = data
  }

  /**
   * Nettoie les données de confirmation après lecture
   * pour éviter de les réafficher par erreur.
   */
  function clearConfirmation() {
    confirmation.value = null
  }

  return {
    confirmation,
    setConfirmation,
    clearConfirmation
  }
})
