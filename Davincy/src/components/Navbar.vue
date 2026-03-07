<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import UserDropdown from '../components/UserDropdown.vue'
import router from '../router'

const auth = useAuthStore()

onMounted(async () => {
  await auth.fetchUser()
})

const isLoggedIn = computed(() => !!auth.user)
const isAdmin = computed(() => auth.profile?.role === 'admin')

/* ✅ Mobile menu state */
const mobileOpen = ref(false)

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

function closeMobile() {
  mobileOpen.value = false
}

async function handleDropdownNavigation(path: string) {
  mobileOpen.value = false  
  await router.push(path)
}


</script>

<template>
  <header class="navbar">
    <!-- LEFT SIDE -->
    <div class="nav-left">
      <router-link to="/" class="brand" @click="closeMobile">
        <img
          src="/DavincyLogo.png"
          alt="Davincy Logo"
          class="logo-img"
        />
        <span class="brand-text">DAVINCY</span>
      </router-link>
    </div>

    <!-- MOBILE MENU BUTTON -->
    <button class="hamburger" @click="toggleMobile" :aria-label="mobileOpen ? 'Close menu' : 'Open menu'">
      <span class="hamburger-icon" :class="{ 'open': mobileOpen }">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>

    <!-- NAV LINKS -->
    <nav :class="['nav-links', { 'mobile-open': mobileOpen }]">
      <div class="nav-links-container">
        <router-link to="/" @click="closeMobile">
          Home
        </router-link>

        <router-link
          v-if="!isLoggedIn"
          to="/login"
          @click="closeMobile"
        >
          Login
        </router-link>

        <router-link
          v-if="!isLoggedIn"
          to="/register"
          @click="closeMobile"
        >
          Register
        </router-link>

        <router-link
          v-if="isLoggedIn"
          to="/community"
          @click="closeMobile"
        >
          Community
        </router-link>


        <router-link
          v-if="isLoggedIn"
          to="/events"
          @click="closeMobile"
        >
          Events
        </router-link>

        <router-link
          v-if="isLoggedIn"
          to="/announcments"
          @click="closeMobile"
        >
          Announcements
        </router-link>


        <router-link
          v-if="isAdmin"
          to="/admin"
          @click="closeMobile"
        >
          Admin
        </router-link>

        <router-link
          v-if="isAdmin"
          to="/admin-events"
          @click="closeMobile"
        >
          Manage Events
        </router-link>

        <!-- USER DROPDOWN -->
        <div
          class="dropdown-container"
          v-if="isLoggedIn"
        >
          <UserDropdown @navigate="handleDropdownNavigation" />
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
/* =========================
   NAVBAR BASE
========================= */
.navbar {
  height: 74px;
  padding: 0 24px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background:
    linear-gradient(
      135deg,
      #0a1b2b,
      #102a42 40%,
      #081521
    );

  border-bottom: 2px solid #c6a65b;

  box-shadow: 0 4px 18px rgba(0,0,0,0.45);
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* =========================
   BRAND / LOGO
========================= */
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.logo-img {
  height: 56px;
  width: auto;
  flex-shrink: 0;
  filter: drop-shadow(0 0 6px rgba(198,166,91,0.4));
}

.brand-text {
  font-family: "Cinzel", serif;
  font-size: 22px;
  letter-spacing: 2px;
  color: #e7d2a0;
  white-space: nowrap;
}

/* =========================
   NAV LINKS (DESKTOP)
========================= */
.nav-links {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.nav-links-container {
  display: flex;
  align-items: center;
  gap: 30px;
}

.nav-links a {
  text-decoration: none;
  color: #e6edf5;
  font-size: 16px;
  letter-spacing: 1px;
  position: relative;
  padding: 6px 0;
  transition: 0.25s ease;
}

/* gold underline */
.nav-links a::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 0%;
  height: 2px;
  background: linear-gradient(90deg,#c6a65b,#FFD700);
  transition: width 0.25s ease;
}

.nav-links a:hover {
  color: #FFD700;
}

.nav-links a:hover::after {
  width: 100%;
}

/* dropdown spacing */
.dropdown-container {
  margin-left: 8px;
  
}

/* =========================
   HAMBURGER MENU ICON
========================= */
.hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  z-index: 1001;
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 30px;
}

.hamburger-icon span {
  display: block;
  height: 3px;
  width: 100%;
  background-color: #f0d58a;
  border-radius: 3px;
  transition: all 0.3s ease;
}

/* Animated hamburger to X */
.hamburger-icon.open span:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.hamburger-icon.open span:nth-child(2) {
  opacity: 0;
}

.hamburger-icon.open span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

/* =========================
   MOBILE RESPONSIVE
========================= */
@media (max-width: 900px) {
  .hamburger {
    display: block;
  }

  .nav-links {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: 
      linear-gradient(
        135deg,
        #0a1b2b,
        #102a42 40%,
        #081521
      );
    
    display: flex;
    align-items: center;
    justify-content: center;
    
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    
    z-index: 1000;
  }

  .nav-links.mobile-open {
    opacity: 1;
    visibility: visible;
  }

  .nav-links-container {
    flex-direction: column;
    gap: 32px;
    padding: 20px;
    width: 100%;
    max-width: 300px;
  }

  .nav-links a {
    font-size: 20px;
    width: 100%;
    text-align: center;
    padding: 12px 0;
  }

  .dropdown-container {
    margin-left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .brand-text {
    font-size: 18px;
  }

  .logo-img {
    height: 50px;
  }

  /* Prevent body scroll when menu is open */
  body:has(.nav-links.mobile-open) {
    overflow: hidden;
  }


  .dropdown-container {
    margin-left: 8px;
    position: absolute;
    /** top: 90%;*/
    top: 15%;

    max-height: calc(100vh - 80px);
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
  }
}

/* Small screens adjustment */
@media (max-width: 480px) {
  .navbar {
    padding: 0 16px;
  }
  
  .brand-text {
    font-size: 16px;
  }
  
  .logo-img {
    height: 44px;
  }
}
</style>