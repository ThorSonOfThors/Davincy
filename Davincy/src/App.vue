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

/*
* {
  cursor: url('/Gothic Engraved Swor..._imresizer.png') 8 8, auto;
}

a,
button,
[role="button"],
[role="link"],
[role="tab"],
[role="menuitem"],
[role="option"],
[role="checkbox"],
[role="radio"],
[role="switch"],
.flag-ring, 
.flag-image {
  cursor: url('/Gothic Engraved Swor..._imresizer (1).png') 8 8, pointer !important;
}


*/


</style>