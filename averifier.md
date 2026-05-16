- les badges comment ca fonctionne



une page liste de commance Vue : ce sera un tableau de commande avec les colonnes suivantes: 
ID, ID panier, Référence, Nouveau client, Livraison, Client, Total, Paiement, État(select: 1->dans le panier,2-> paiment effectue, 3-> annule), Date
- on va maintenant integrer la liste de commande 
- une fonction ou on lui donne un cart(panier) et il repond si ce panier a ete commander ou pas
    comment?
        - api/orders?filter[id_cart]=${id_cart}&display=full
- une fonction getListCommande(boolean) retourne une liste des commandes dans la base de donnees
    comment tu vas chercher les commandes
        - /api/carts?display=full
        - on boucle et on cherche la commande qui correspond s'il y en a -> on prend le current_state de la commande si non le statut sera "dans le panier"
- on cree un objet avec les colonnes necessaires pour l'affichage de la liste de panier
- quand on clique sur detail on atterit dans les details du panier avec informations de la personne qui a commande si c'est un customer qui existe ie id != 0, si id = 0 alors y a pas encore de customer pour ce panier



maintenant on va gerer le changement de statut
dans le panier -> paiement effectue : 
    - le client n'a pas encoe commande, vous ne pouvez pas commander a sa place
paiment effectue -> annule:
    - add in order_histories(id_order_state: 6) appelle addOrderHistory de orderService
le retour ne peut pas se faire comme annule -> paiement effectue, paiement effectue -> dans le panier

        