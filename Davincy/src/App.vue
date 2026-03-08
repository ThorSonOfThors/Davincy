<script setup lang="ts">
import Navbar from './components/Navbar.vue'
</script>

<template>
  <Navbar />

  <main class="page">
    <router-view />
  </main>
</template>

<style>
body {
  margin: 0;
  background: #0b0b0b;
  color: white;
  font-family: system-ui, sans-serif;
}

/* GLOBAL DAGGER CURSOR */
/* normal cursor */
* {
  cursor: url('/Gothic Engraved Swor..._imresizer.png') 8 8, auto !important;
}

/* pointer cursor */
a,
button,
[role="button"] {
  cursor: url('/Gothic Engraved Swor..._imresizer (1).png') 8 8, pointer !important;
}





</style>