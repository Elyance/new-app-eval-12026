<template>
    <div>
        <label for="delta">Entrer vous voulez multiplier les produit pas combien</label>
        <input for="delta" type="number" id="delta">

        <button @click="handleSubmit" type="button">Valider</button>
    </div>
</template>
<script>
export default {
    methods: {
        handleSubmit() {
            const delta = document.getElementById(delta)
            if (delta && delta.value) {
                console.log("teste",delta)
            }
        }
    }
}
</script>