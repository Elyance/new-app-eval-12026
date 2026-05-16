<template>
  <div class="p-4" style="margin-left: 250px;">
    <div class="container-fluid">
      <div class="mb-4">
        <h2 class="fw-bold">Modules</h2>
        <div class="mt-2">
          <router-link to="/backoffice/modules/tableau-de-bord" class="btn btn-outline-primary btn-sm">
            Tableau de bord
          </router-link>
        </div>
      </div>
      <div class="card border-0 shadow-sm">
        <div class="card-body p-4">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modules'
}
</script>
