# Résumé du projet

Ce projet est une application Vue 3 construite avec Vite, Pinia et Vue Router. Elle simule une boutique PrestaShop avec deux grands espaces:
- Front office pour le parcours client.
- Back office pour la gestion des données, des produits, des commandes et des statistiques.

Le projet manipule principalement des échanges XML avec l'API PrestaShop et une logique d'import de données basée sur 3 fichiers CSV + 1 fichier ZIP d'images.

## 1. Fichiers d'entrée et structure globale

| Fichier | Rôle |
|---|---|
| src/main.js | Point d'entrée Vue. Crée l'application, installe Pinia et le router, puis monte l'app sur #app. |
| src/App.vue | Layout racine. Affiche Sidebar et Navbar selon la route, puis le router-view. |
| src/router/index.js | Déclaration complète des routes front office et back office. Appelle setupRouterGuards(router). |
| src/middleware/authGuard.js | Configure les gardes de navigation via setupRouterGuards(router). |
| src/constants/constant.js | Exporte API_URL et API_KEY pour les appels PrestaShop. |

## 2. Routage applicatif

### Front office

| Route | Composant |
|---|---|
| / | src/views/LandingPage.vue |
| /fo | src/views/FO/HomePage.vue |
| /fo/produits | src/views/FO/ProductsPage.vue |
| /fo/produits/:id | src/views/FO/ProductDetailPage.vue |
| /fo/panier | src/views/FO/CartPage.vue |
| /fo/mes-commandes | src/views/FO/MyOrdersPage.vue |
| /fo/commande | src/views/FO/CheckoutPage.vue |
| /fo/confirmation/:id | src/views/FO/OrderConfirmationPage.vue |
| /fo/connexion | src/views/FO/HomePage.vue |

### Back office

| Route | Composant |
|---|---|
| /backoffice/login | src/components/Auth/Login.vue |
| /backoffice | src/views/BO/Accueil.vue |
| /backoffice/modules | src/views/BO/Modules.vue |
| /backoffice/modules/commandes | src/views/BO/Modules/Commandes.vue |
| /backoffice/modules/tableau-de-bord | src/views/BO/Modules/TableauBord.vue |
| /backoffice/modules/produits | src/views/BO/Modules/Produits.vue |
| /backoffice/modules/statistiques | src/views/BO/Modules/Statistiques.vue |
| /backoffice/modules/commandes/:id_cart/detail | src/views/BO/Modules/CommandeDetail.vue |
| /backoffice/gestion-donnees | src/views/BO/GestionDonnees.vue |
| /backoffice/gestion-donnees/reset | src/views/BO/GestionDonnees/Reset.vue |
| /backoffice/gestion-donnees/importer | src/views/BO/GestionDonnees/ImportStatic.vue |

## 3. Composants Vue principaux

| Fichier | Rôle |
|---|---|
| src/components/Sidebar.vue | Menu latéral global du back office. |
| src/components/FO/Navbar.vue | Barre de navigation du front office. |
| src/components/FO/CartItem.vue | Ligne d'un article du panier. |
| src/components/FO/CartSummary.vue | Résumé et totaux du panier. |
| src/components/FO/ProductCard.vue | Carte produit utilisée dans le catalogue. |
| src/components/Auth/Login.vue | Écran de connexion back office. |

## 4. Stores d'état

| Fichier | Export principal | Rôle |
|---|---|---|
| src/stores/authStore.js | authStore | État d'authentification côté client. |
| src/stores/cartStore.js | cartStore | État du panier courant. |
| src/stores/orderStore.js | useOrderStore | Store Pinia lié aux commandes. |

## 5. Services métier - fonctions exportées

### Cartes / panier / commandes

| Fichier | Fonctions exportées |
|---|---|
| src/services/cartService.js | getCarts, getCart, createCart, addProductToCart, updateCartItemQuantity, removeProductFromCart, getIdCartInSessionStorage, addIdCartInSessionStorage, updateCartCustomer |
| src/services/orderService.js | createGuestCustomer, createAddress, createOrder, addOrderHistory, getOrdersByCustomerId, getOrderStateById |
| src/services/commandePanierService.js | calculateCartTotal, getOrderByIdCart, hasOrder, getCommandeDetail, getFinalList |
| src/services/commandeTBService.js | getOrders, getOrdersByCustomerId, getDataForTB |

### Clients, produits, stocks, catégories, transport

| Fichier | Fonctions exportées |
|---|---|
| src/services/customerService.js | getCustomerByEmail, getCustomerById, getCustomerAddresses, getAllCustomers |
| src/services/productService.js | getProducts, getProductDetail |
| src/services/productOptionService.js | extractProductOptionValueIds, getProductOptionsStructure |
| src/services/combinationService.js | getCombinations |
| src/services/stockService.js | getStockAvailability |
| src/services/stockHelperService.js | computeMatchingCombination, buildStockMovementPayload, buildStockAvailablePayload, generateStockMovementXml, generateStockAvailableXml, createStockMovement, updateStockInPrestashop, getStockAvailables, getStockMovements |
| src/services/CategorieService.js | getCategories |
| src/services/countryService.js | getCountries |
| src/services/carrierService.js | getCarriers, findCarrierById |
| src/services/taxService.js | getProductTaxRate |

### Prix, promotions et statistiques

| Fichier | Fonctions exportées |
|---|---|
| src/services/specificPricesService.js | getSpecificPrices, findBestApplicableReduction, applyReduction, calculateFinalPrice, getProductPricingDisplay |
| src/services/statsService.js | getCategoryStats |

### Import, normalisation et reset

| Fichier | Fonctions exportées |
|---|---|
| src/services/useFileValidator.js | useFileValidator |
| src/services/importService.js | validateImportFiles, parseCsvFile, parseCsvFiles, getImportFileSummary, runFullImportPipeline |
| src/services/traitementCSVService.js | COLUMNS_FICHIER1, COLUMNS_FICHIER2, COLUMNS_FICHIER3, traitementFichier1, traitementFichier2, parseAchat, traitementFichier3 |
| src/services/traitementDonneesService.js | buildFichier1ImportPlan, logFichier1ImportPlan, executeImportPlan, insertProducts, uploadProductImages, executeFichier2Import, executeFichier3Import |
| src/services/ResetService.js | resetData, resetTable |
| src/services/ModulesService.js | getModules, sortModulesByOrder |

### Authentification

| Fichier | Export principal |
|---|---|
| src/services/AuthService.js | AuthService, authService |

### Détail des fonctions métier

#### Panier et commandes

| Fonction | Ce qu'elle fait |
|---|---|
| getCarts | Récupère tous les paniers PrestaShop au format exploitable par l'application. |
| getCart | Charge un panier précis avec ses lignes produits. |
| createCart | Crée un nouveau panier PrestaShop à partir d'un produit initial. |
| addProductToCart | Ajoute un produit à un panier en gérant le cas produit déjà présent ou nouveau produit. |
| updateCartItemQuantity | Met à jour la quantité d'une ligne panier. |
| removeProductFromCart | Supprime une ligne du panier en réécrivant le panier sans cette ligne. |
| updateCartCustomer | Lie un panier à un client avant transformation en commande. |
| createGuestCustomer | Crée un client invité pour un achat sans compte. |
| createAddress | Crée l'adresse de facturation ou de livraison du client. |
| createOrder | Transforme un panier en commande PrestaShop. |
| addOrderHistory | Ajoute un changement d'état à la commande. |
| getOrdersByCustomerId | Liste les commandes d'un client. |
| getOrderStateById | Récupère le libellé d'un état de commande. |

#### Import, validation et préparation des données

| Fonction | Ce qu'elle fait |
|---|---|
| validateImportFiles | Vérifie qu'on a exactement les 3 CSV attendus plus le ZIP d'images. |
| parseCsvFile | Lit un CSV avec PapaParse et renvoie les lignes sous forme d'objets. |
| parseCsvFiles | Parse les 3 CSV en parallèle. |
| getImportFileSummary | Produit un résumé simple des fichiers importés. |
| runFullImportPipeline | Lance le pipeline complet d'import avec validation, parsing, création des données et rollback en cas d'erreur. |
| traitementFichier1 | Normalise le fichier Produits et valide ses colonnes. |
| traitementFichier2 | Normalise le fichier Déclinaisons / Stocks. |
| parseAchat | Convertit la chaîne d'achat du fichier 3 en structure exploitable. |
| traitementFichier3 | Normalise le fichier Commandes / Achats clients. |
| buildFichier1ImportPlan | Construit le plan d'import des catégories, taxes et produits. |
| executeImportPlan | Crée les catégories et taxes dans PrestaShop puis enrichit les produits avec leurs IDs. |
| insertProducts | Crée les produits dans PrestaShop. |
| uploadProductImages | Associe les images du ZIP aux produits importés. |
| executeFichier2Import | Crée les déclinaisons et initialise les stocks du fichier 2. |
| executeFichier3Import | Crée les clients, adresses, paniers et commandes du fichier 3. |

#### Données de référence et calculs

| Fonction | Ce qu'elle fait |
|---|---|
| getProducts | Récupère la liste des produits selon des critères donnés. |
| getProductDetail | Charge le détail complet d'un produit. |
| getProductOptionsStructure | Construit la structure des options d'un produit. |
| getCombinations | Récupère les déclinaisons d'un produit. |
| getStockAvailability | Vérifie la disponibilité d'un produit ou d'une déclinaison. |
| getStockAvailables | Liste les quantités disponibles par produit. |
| getStockMovements | Liste l'historique des mouvements de stock. |
| createStockMovement | Enregistre un mouvement de stock dans PrestaShop. |
| updateStockInPrestashop | Met à jour le stock disponible. |
| getCategories | Liste les catégories PrestaShop. |
| getCountries | Liste les pays disponibles. |
| getCarriers | Liste les transporteurs. |
| findCarrierById | Retrouve un transporteur par identifiant. |
| getProductTaxRate | Déduit le taux de taxe applicable à un produit. |
| getSpecificPrices | Récupère les prix spécifiques appliqués à un produit. |
| findBestApplicableReduction | Sélectionne la meilleure réduction applicable selon le contexte. |
| applyReduction | Applique une remise à un prix donné. |
| calculateFinalPrice | Calcule le prix final TTC à partir du HT, de la taxe et de la réduction. |
| getProductPricingDisplay | Prépare l'affichage métier du prix produit. |
| getCategoryStats | Calcule les statistiques par catégorie. |
| getModules | Liste les modules de données activables dans le back office. |
| sortModulesByOrder | Trie les modules selon leur ordre d'affichage ou d'exécution. |
| resetData | Réinitialise les données des modules sélectionnés. |
| resetTable | Réinitialise une table métier précise. |

## 6. Utilitaires techniques

| Fichier | Fonctions exportées |
|---|---|
| src/utils/xmlParser.js | xmlToJson, jsonToXml |
| src/utils/parsing.js | getXmlValue, getXmlString, parseDate |
| src/utils/importFormatters.js | normalizeText, slugify, toNumber, round2, round6 |

## 7. Logique fonctionnelle du projet

### Front office
- Le fichier src/views/FO/HomePage.vue charge les clients via getAllCustomers, affiche un choix de profil et oriente ensuite vers le catalogue.
- Le catalogue, le détail produit et les variantes reposent sur getProducts, getProductDetail, getProductOptionsStructure et getCombinations pour afficher les bons attributs et les bonnes déclinaisons.
- L'affichage des prix est piloté par getProductTaxRate, getSpecificPrices, findBestApplicableReduction, calculateFinalPrice et getProductPricingDisplay.
- Le panier utilise getCart, createCart, addProductToCart, updateCartItemQuantity et removeProductFromCart pour synchroniser l'état local avec PrestaShop.
- Le tunnel de commande s'appuie sur createGuestCustomer, createAddress, createOrder et addOrderHistory pour créer le client, ses adresses et finaliser la commande.

### Back office
- Le tableau de bord et les vues de gestion utilisent getOrders, getOrdersByCustomerId, getDataForTB, getCategoryStats et getModules pour afficher les données métiers.
- La page Produits s'appuie sur getProducts, getProductDetail, getStockAvailability et getStockMovements pour afficher catalogue, stock et historique.
- La page Commandes exploite getOrdersByCustomerId, getOrderByIdCart, hasOrder, getCommandeDetail et getFinalList pour présenter le suivi client et le détail des commandes.
- La page Statistiques s'appuie sur getCategoryStats et les agrégations d'indicateurs liés aux ventes.
- La section Gestion des données utilise validateImportFiles, parseCsvFiles, runFullImportPipeline, resetData et resetTable pour importer ou réinitialiser la base.

### Import de données
Le pipeline principal est:
1. validateImportFiles
2. parseCsvFiles
3. traitementFichier1 / traitementFichier2 / traitementFichier3
4. buildFichier1ImportPlan
5. executeImportPlan
6. insertProducts
7. uploadProductImages
8. executeFichier2Import
9. executeFichier3Import

Concrètement, ce pipeline fait cela:
- il contrôle que les fichiers fournis respectent la structure attendue;
- il normalise les données CSV pour supprimer les écarts de format;
- il crée d'abord les catégories, taxes et produits;
- il importe ensuite les images du ZIP en les associant aux références produits;
- il ajoute les déclinaisons et le stock du second fichier;
- il termine en créant les clients, paniers et commandes du troisième fichier.

## 8. Résumé ultra-court

Ce projet est une boutique Vue/PrestaShop structurée autour de:
- src/main.js pour le bootstrap,
- src/router/index.js pour les écrans,
- src/services/*.js pour toute la logique métier,
- src/views/BO et src/views/FO pour les parcours back office et front office,
- src/services/importService.js + traitementCSVService.js + traitementDonneesService.js pour la chaîne d'import complète.