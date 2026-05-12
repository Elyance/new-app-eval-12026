<template>
  <div class="home-page">
    <div class="container">
      <h1>Bienvenue sur EvaluationShop</h1>
      <p>Découvrez nos produits sélectionnés avec soin</p>
      <router-link to="/fo/produits" class="btn-primary">
        Voir nos produits
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, #f3f4f6, #ffffff);
}

.container {
  max-width: 600px;
  padding: 40px 20px;
}

h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 10px;
}

p {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 30px;
}

.btn-primary {
  display: inline-block;
  padding: 12px 24px;
  background: #6b7280;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary:hover {
  background: #4b5563;
  transform: translateY(-2px);
}
</style>
