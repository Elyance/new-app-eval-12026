import { reactive } from 'vue'
import { getCart, getIdCartInSessionStorage } from '../services/cartService'

/**
 * Store réactif global pour l'état du panier.
 * Utilisé principalement pour le badge dans la Navbar,
 * mais peut être étendu à d'autres besoins.
 */
export const cartStore = reactive({
  /** Nombre total d'articles (somme des quantités) */
  itemCount: 0,

  /**
   * Charge le compteur depuis l'API PrestaShop en se basant
   * sur l'id_cart stocké en sessionStorage.
   */
  async refreshCount() {
    const cartId = getIdCartInSessionStorage()
    if (!cartId) {
      this.itemCount = 0
      return
    }

    try {
      const cart = await getCart(cartId)
      if (!cart || !cart.rows || cart.rows.length === 0) {
        this.itemCount = 0
        return
      }

      // Somme de toutes les quantités (ignore les lignes avec id_product === 0)
      this.itemCount = cart.rows
        .filter((row) => row.id_product > 0)
        .reduce((sum, row) => sum + row.quantity, 0)
    } catch (err) {
      console.error('cartStore: erreur lors du refresh du compteur', err)
      this.itemCount = 0
    }
  }
})
