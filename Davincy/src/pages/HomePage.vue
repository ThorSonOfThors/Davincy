<script setup lang="ts">
</script>

<template>
  <main class="home">

    <!-- HERO SECTION -->
    <section class="hero">

      <!-- Logo -->
      <img
        src="/DavincyLogo.png"
        alt="Davincy Logo"
        class="hero-logo"
      />

      <!-- Title -->
      <h1 class="title">DAVINCY</h1>

      <h2 class="subtitle">
        (Defence Attaché Wine Community)
      </h2>

      <!-- Description -->
      <p class="description">
        Davincy is dedicated to strengthening partnerships among defence
        attachés and fostering new international friendships through shared
        culture, dialogue, and community engagement. Our organization brings
        together professionals in an atmosphere of mutual respect,
        cooperation, and tradition — building lasting connections that
        transcend borders.
      </p>

    </section>

    <!-- BOTTOM CEREMONIAL IMAGE -->
    <section class="bottom-image-section">
      <img
        src="..//../public/military_cooperation.png"
        alt="International Defence Cooperation"
        class="bottom-image"
      />
    </section>

  </main>
</template>

<style scoped>

/* =========================
   PAGE BACKGROUND
   Inspired by first image:
   deep military blue + gold
========================= */

.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  background:
    radial-gradient(circle at top,
      rgba(10, 35, 70, 0.95),
      rgba(5, 15, 30, 1)
    );

  color: white;
  text-align: center;
}


/* =========================
   HERO SECTION
========================= */

.hero {
  flex: 1;
  padding: 80px 20px 40px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}


/* =========================
   LOGO
========================= */

.hero-logo {
  width: 220px;
  max-width: 60vw;
  margin-bottom: 25px;

  filter:
    drop-shadow(0 10px 25px rgba(0,0,0,0.6));

  transition: transform 0.3s ease;
}

.hero-logo:hover {
  transform: scale(1.05);
}


/* =========================
   TITLES
========================= */

.title {
  font-size: 3.5rem;
  letter-spacing: 6px;
  font-weight: 700;
  font-family: "Cinzel", serif;

  color: #f5d27a; /* ceremonial gold */

  text-shadow:
    0 0 12px rgba(245,210,122,0.4),
    0 4px 18px rgba(0,0,0,0.7);

  margin: 0;
}

.subtitle {
  font-size: 1.3rem;
  margin-top: 10px;
  margin-bottom: 30px;

  color: #d6e3ff;
  font-weight: 400;
  letter-spacing: 1px;
}


/* =========================
   DESCRIPTION TEXT
========================= */

.description {
  max-width: 750px;
  line-height: 1.8;
  font-size: 1.1rem;

  color: rgba(255,255,255,0.85);

  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(6px);

  padding: 28px 32px;
  border-radius: 14px;

  border: 1px solid rgba(255,255,255,0.08);

  box-shadow:
    0 15px 40px rgba(0,0,0,0.35);
}


/* =========================
   BOTTOM IMAGE SECTION
========================= */

.bottom-image-section {
  width: 100%;
  overflow: hidden;
  margin-top: 60px;

  border-top: 1px solid rgba(255,255,255,0.1);
}

.bottom-image {
  width: 100%;
  
  height: 480px;
  object-fit: cover;

  opacity: 0.9;

  filter:
    contrast(1.05)
    saturate(1.1);

  transition: transform 0.6s ease;
}

.bottom-image:hover {
  transform: scale(1.03);
}


/* =========================
   MOBILE OPTIMIZATION
========================= */

@media (max-width: 768px) {

  .hero {
    padding-top: 60px;
  }

  .title {
    font-size: 2.4rem;
    letter-spacing: 4px;
  }

  .subtitle {
    font-size: 1.05rem;
  }

  .description {
    font-size: 1rem;
    padding: 22px;
  }

  .bottom-image {
    height: 260px;
  }

  .hero-logo {
    width: 195px;
  }
}

</style>