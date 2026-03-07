import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import AdminPage from '../pages/AdminPage.vue'
import { useAuthStore } from '../stores/auth'
import EditProfilePage from '../pages/EditProfilePage.vue'
import AccountSettingsPage from '../pages/AccountSettingsPage.vue'
import ComunityPage from '../pages/ComunityPage.vue'
import ProfileViewPage from '../pages/ProfileViewPage.vue'
import AdminEvents from '../pages/AdminEvents.vue'
import EventsPage from '../pages/EventsPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import PublishPage from '../pages/PublishPage.vue'
import AnnouncmentsPage from '../pages/AnnouncmentsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/register', component: RegisterPage, meta: {reguiresAuth: false} },
    { path: '/login', component: LoginPage },

    {path: '/admin',component: AdminPage,meta: { requiresAdmin: true }},
    {path: '/admin-events',component: AdminEvents,meta: { requiresAdmin: true }},

    { path: '/edit-profile', component: EditProfilePage, meta: { requiresAuth: true }},
    { path: '/events', component: EventsPage, meta: { requiresAuth: true }},
    { path: '/account-settings', component: AccountSettingsPage, meta: { requiresAuth: true }},
    { path: '/community', component: ComunityPage, meta: { requiresAuth: true }},
    { path: '/profile/:id', component: ProfileViewPage, meta: { requiresAuth: true }},
    { path: '/publish', component: PublishPage, meta: { requiresAuth: true }},
    { path: '/announcments', component: AnnouncmentsPage, meta: { requiresAuth: true }}

  ]
})

/* ================= ROUTE GUARD ================= */

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // ensure user + profile loaded
  if (!auth.user) {
    await auth.fetchUser()
  }

  if (to.meta.requiresAdmin) {
    if (!auth.user) {
      return '/login'
    }

    if (auth.profile?.role !== 'admin') {
      return '/'
    }
  }
})

export default router