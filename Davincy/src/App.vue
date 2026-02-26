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

.page {
  padding-top: 0px; /* navbar height */
}
</style>