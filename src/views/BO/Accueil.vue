<template>
  <div class="row justify-content-center" style="margin-left: 250px;">
    <div class="container row justify-content-center">
      <div class="text-center mb-5">
        <h1 class="display-4 fw-bold">Bienvenue dans l'Application de Gestion PrestaShop</h1>
        <p class="lead fs-5 text-muted">Gérez facilement vos produits, clients et données</p>
      </div>

      <div class="row">
        <!-- Card Modules -->
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0">
            <div class="card-body text-center p-5">
              <h3 class="card-title text-primary fw-bold mb-3">Modules</h3>
              <p class="card-text text-muted mb-4">Gestion complète des commandes</p>
              <router-link to="/backoffice/modules/commandes" class="btn btn-primary btn-lg">
                Accéder
              </router-link>
            </div>
          </div>
        </div>

        <!-- Card Gestion de Données -->
        <div class="col-md-6">
          <div class="card h-100 shadow-sm border-0">
            <div class="card-body text-center p-5">
              <h3 class="card-title text-danger fw-bold mb-3">Gestion de Données</h3>
              <p class="card-text text-muted mb-4">Reset et maintenance de votre base de données</p>
              <router-link to="/gestion-donnees/reset" class="btn btn-outline-danger btn-lg">
                Accéder
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Accueil'
}
</script>
