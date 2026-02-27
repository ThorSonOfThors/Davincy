<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '../stores/auth'
//import { useRouter } from 'vue-router'

const auth = useAuthStore()
//const router = useRouter()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const emit = defineEmits(['navigate'])

function toggle() {
  open.value = !open.value
}

async function logout() {
  await auth.logout()
  open.value = false
  emit('navigate', '/')
}

function goToProfile() {
  open.value = false
  emit('navigate', '/edit-profile')
}

function goToAccountSettings() {
  open.value = false
  emit('navigate', '/account-settings')
}

function handleClickOutside(e: MouseEvent) {
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(e.target as Node)
  ) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="dropdown" ref="dropdownRef">
    <button class="dropdown-trigger" @click="toggle" :class="{ 'active': open }">
      <!-- Desktop version -->
      <span class="desktop-trigger">
        <span class="email">{{ auth.user?.email }}</span>
        <span class="arrow" :class="{ 'open': open }">▼</span>
      </span>

      <!-- Mobile version -->
      <span class="mobile-trigger">
        <span class="hamburger" :class="{ 'active': open }">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </span>
    </button>

    <transition name="dropdown">
      <div v-if="open" class="dropdown-menu">
        <div class="menu-header">
          <div class="user-email">{{ auth.user?.email }}</div>
          <div class="user-role" v-if="auth.user?.role">Member</div>
        </div>

        <div class="menu-items">
          <button @click="goToProfile" class="menu-item">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <span>Edit Profile</span>
          </button>

          <button @click="goToAccountSettings" class="menu-item">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
            <span>Account Settings</span>
          </button>

          <div class="menu-divider"></div>

          <button class="menu-item danger" @click="logout">
            <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* =========================
   DROPDOWN CONTAINER
========================= */
.dropdown {
  position: relative;
}

/* =========================
   TRIGGER BUTTON
========================= */
.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(10, 35, 70, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(245, 210, 122, 0.3);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  color: #f5d27a;
  transition: all 0.2s ease;
}

.dropdown-trigger:hover {
  background: rgba(15, 40, 75, 0.8);
  border-color: #f5d27a;
  box-shadow: 0 0 15px rgba(245, 210, 122, 0.2);
}

.dropdown-trigger.active {
  background: rgba(15, 40, 75, 0.9);
  border-color: #f5d27a;
}

.arrow {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.arrow.open {
  transform: rotate(180deg);
}

/* =========================
   DESKTOP TRIGGER
========================= */
.desktop-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
}

.email {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =========================
   MOBILE HAMBURGER
========================= */
.mobile-trigger {
  display: none;
}

.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 22px;
  height: 18px;
}

.hamburger span {
  display: block;
  height: 2px;
  width: 100%;
  background-color: #f5d27a;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger.active span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* =========================
   DROPDOWN MENU
========================= */
.dropdown-menu {
  position: absolute;
  right: 0;
  top: 110%;
  min-width: 240px;
  background: rgba(5, 15, 30, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(245, 210, 122, 0.2);
  border: 1px solid rgba(245, 210, 122, 0.3);
  overflow: hidden;
  z-index: 100;

  
}

/* Menu Header */
.menu-header {
  padding: 16px;
  border-bottom: 1px solid rgba(245, 210, 122, 0.2);
  background: rgba(10, 35, 70, 0.6);
}

.user-email {
  color: #f5d27a;
  font-weight: 600;
  font-size: 0.9rem;
  word-break: break-all;
}

.user-role {
  color: #d6e3ff;
  font-size: 0.8rem;
  margin-top: 4px;
  opacity: 0.8;
}

/* Menu Items */
.menu-items {
  padding: 8px;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: 8px;
  color: #d6e3ff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.menu-item:hover {
  background: rgba(245, 210, 122, 0.15);
  color: #f5d27a;
  transform: translateX(4px);
}

.menu-item .icon {
  width: 18px;
  height: 18px;
  color: #f5d27a;
  opacity: 0.8;
}

.menu-item:hover .icon {
  opacity: 1;
}

.menu-item.danger {
  color: #ff6b6b;
}

.menu-item.danger .icon {
  color: #ff6b6b;
}

.menu-item.danger:hover {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}

.menu-divider {
  height: 1px;
  background: rgba(245, 210, 122, 0.2);
  margin: 8px 0;
}

/* =========================
   ANIMATIONS
========================= */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* =========================
   MOBILE STYLES
========================= */


/* Small phones */
@media (max-width: 360px) {
  .dropdown-menu {
    right: 12px;
    left: 12px;
  }
}
</style>