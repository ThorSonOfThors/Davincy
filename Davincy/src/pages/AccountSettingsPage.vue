<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

/* ---------------- STATE ---------------- */

const userId = ref<string | null>(null)
const email = ref<string | null>(null)

const loading = ref(true)
const savingPassword = ref(false)
const deleting = ref(false)

/* PASSWORD FIELDS */

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

// Alert state
const alertMessage = ref('')
const alertType = ref<'success' | 'error' | ''>('')
const showAlert = ref(false)

/* ---------------- LOAD USER ---------------- */

onMounted(async () => {
  const { data } = await supabase.auth.getUser()

  userId.value = data.user?.id ?? null
  email.value = data.user?.email ?? null

  loading.value = false
})

/* ---------------- HELPER FUNCTIONS ---------------- */

function showAlertMessage(message: string, type: 'success' | 'error') {
  alertMessage.value = message
  alertType.value = type
  showAlert.value = true
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    showAlert.value = false
  }, 3000)
}

/* ---------------- CHANGE PASSWORD ---------------- */

async function changePassword() {
  if (!email.value) return

  if (!currentPassword.value ||
      !newPassword.value ||
      !confirmPassword.value) {
    showAlertMessage('Please fill all fields', 'error')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    showAlertMessage('New passwords do not match', 'error')
    return
  }

  if (newPassword.value.length < 6) {
    showAlertMessage('Password must be at least 6 characters', 'error')
    return
  }

  savingPassword.value = true

  try {
    /* STEP 1 — REAUTHENTICATE USER */
    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.value,
        password: currentPassword.value
      })

    if (loginError) {
      showAlertMessage('Current password is incorrect', 'error')
      return
    }

    /* STEP 2 — UPDATE PASSWORD */
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (error) {
      showAlertMessage(error.message, 'error')
      return
    }

    showAlertMessage('Password updated successfully', 'success')

    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

  } finally {
    savingPassword.value = false
  }
}

/* ---------------- DELETE ACCOUNT ---------------- */

async function deleteAccount() {
  const confirmed = window.confirm(
    `⚠️ PERMANENT ACTION ⚠️\n\n` +
    `This will permanently delete:\n` +
    `• Your profile information\n` +
    `• Your photos and gallery\n` +
    `• All your data\n\n` +
    `This action CANNOT be undone.\n\n` +
    `Are you absolutely sure you want to delete your account?`
  )

  if (!confirmed || !userId.value) return

  deleting.value = true

  try {
    /* delete profile row (RLS protected) */
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId.value)

    if (error) {
      showAlertMessage(error.message, 'error')
      return
    }

    /* sign out user */
    await supabase.auth.signOut()

    showAlertMessage('Account deleted successfully', 'success')

    setTimeout(() => {
      router.push('/')
    }, 1500)

  } catch (error) {
    showAlertMessage('Failed to delete account', 'error')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="account-settings-page">
    
    <!-- HEADER SECTION -->
    <div class="hero-section">
      <h1 class="page-title">Account Settings</h1>
      <p class="page-subtitle">Manage Your Security and Account Preferences</p>
    </div>

    <!-- Custom Alert -->
    <transition name="slide-fade">
      <div v-if="showAlert" :class="['custom-alert', alertType]">
        <span class="alert-icon">
          <span v-if="alertType === 'success'">✓</span>
          <span v-if="alertType === 'error'">⚠</span>
        </span>
        {{ alertMessage }}
      </div>
    </transition>

    <div class="container">
      
      <!-- LOADING STATE -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your account...</p>
      </div>

      <!-- SETTINGS CARD -->
      <div v-else class="settings-card">

        <!-- ACCOUNT INFO BADGE -->
        <div class="account-info-badge">
          
          <div class="info-details">
            <span class="info-label">Logged in as:</span>
            <span class="email-value">{{ email }}</span>
          </div>
        </div>

        <!-- ================= PASSWORD CHANGE ================= -->
        <div class="section">
          <h2 class="section-title">
            <span class="title-decoration"></span>
            Change Password
          </h2>
          <p class="section-subtitle">Update your password to keep your account secure</p>

          <div class="password-group">

            <!-- CURRENT -->
            <div class="input-wrapper">
              <label class="field-label">
                <span class="label-icon">🔒</span>
                Current Password
              </label>
              <div class="password-field">
                <input
                  :type="showCurrent ? 'text' : 'password'"
                  v-model="currentPassword"
                  placeholder="Enter your current password"
                  class="form-input"
                />
                <button 
                  class="eye-btn" 
                  @click="showCurrent = !showCurrent"
                  type="button"
                  :title="showCurrent ? 'Hide password' : 'Show password'"
                >
                  <svg v-if="showCurrent" class="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
                  </svg>
                  <svg v-else class="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 7c2.8 0 5 2.2 5 5 0 .9-.2 1.7-.7 2.5l3.5 3.5c1.5-1.5 2.7-3.3 3.5-5.5-1.7-4.4-6-7.5-11-7.5-1.4 0-2.7.3-4 .7l2.1 2.1c.6-.2 1.2-.3 1.9-.3zm-8.5-.5l2.6 2.6c-.1.3-.1.6-.1.9 0 2.8 2.2 5 5 5 .3 0 .6 0 .9-.1l2.6 2.6c-.9.3-1.9.5-3 .5-5 0-9.3-3.1-11-7.5.8-1.9 2-3.6 3.5-5zM4.2 3.5L3.5 4.2 19.8 20.5l.7-.7L4.2 3.5z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- NEW -->
            <div class="input-wrapper">
              <label class="field-label">
                <span class="label-icon">🆕</span>
                New Password
              </label>
              <div class="password-field">
                <input
                  :type="showNew ? 'text' : 'password'"
                  v-model="newPassword"
                  placeholder="Enter your new password"
                  class="form-input"
                />
                <button 
                  class="eye-btn" 
                  @click="showNew = !showNew"
                  type="button"
                  :title="showNew ? 'Hide password' : 'Show password'"
                >
                  <svg v-if="showNew" class="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
                  </svg>
                  <svg v-else class="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 7c2.8 0 5 2.2 5 5 0 .9-.2 1.7-.7 2.5l3.5 3.5c1.5-1.5 2.7-3.3 3.5-5.5-1.7-4.4-6-7.5-11-7.5-1.4 0-2.7.3-4 .7l2.1 2.1c.6-.2 1.2-.3 1.9-.3zm-8.5-.5l2.6 2.6c-.1.3-.1.6-.1.9 0 2.8 2.2 5 5 5 .3 0 .6 0 .9-.1l2.6 2.6c-.9.3-1.9.5-3 .5-5 0-9.3-3.1-11-7.5.8-1.9 2-3.6 3.5-5zM4.2 3.5L3.5 4.2 19.8 20.5l.7-.7L4.2 3.5z"/>
                  </svg>
                </button>
              </div>
              <p class="field-hint">Minimum 6 characters</p>
            </div>

            <!-- CONFIRM -->
            <div class="input-wrapper">
              <label class="field-label">
                <span class="label-icon">✓</span>
                Confirm New Password
              </label>
              <div class="password-field">
                <input
                  :type="showConfirm ? 'text' : 'password'"
                  v-model="confirmPassword"
                  placeholder="Confirm your new password"
                  class="form-input"
                />
                <button 
                  class="eye-btn" 
                  @click="showConfirm = !showConfirm"
                  type="button"
                  :title="showConfirm ? 'Hide password' : 'Show password'"
                >
                  <svg v-if="showConfirm" class="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
                  </svg>
                  <svg v-else class="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 7c2.8 0 5 2.2 5 5 0 .9-.2 1.7-.7 2.5l3.5 3.5c1.5-1.5 2.7-3.3 3.5-5.5-1.7-4.4-6-7.5-11-7.5-1.4 0-2.7.3-4 .7l2.1 2.1c.6-.2 1.2-.3 1.9-.3zm-8.5-.5l2.6 2.6c-.1.3-.1.6-.1.9 0 2.8 2.2 5 5 5 .3 0 .6 0 .9-.1l2.6 2.6c-.9.3-1.9.5-3 .5-5 0-9.3-3.1-11-7.5.8-1.9 2-3.6 3.5-5zM4.2 3.5L3.5 4.2 19.8 20.5l.7-.7L4.2 3.5z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="button-wrapper">
              <button
                class="btn btn-primary save-btn"
                :disabled="savingPassword"
                @click="changePassword"
              >
                <span class="btn-spinner" v-if="savingPassword"></span>
                <span v-else class="btn-icon">🔐</span>
                {{ savingPassword ? 'Updating Password...' : 'Update Password' }}
              </button>
            </div>

            <!-- Password strength indicator (optional enhancement) -->
            <div v-if="newPassword" class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :style="{ 
                    width: Math.min(100, newPassword.length * 16.6) + '%',
                    backgroundColor: newPassword.length < 6 ? '#ff6b6b' : newPassword.length < 8 ? '#f5d27a' : '#4caf50'
                  }"
                ></div>
              </div>
              <span class="strength-text">
                {{ newPassword.length < 6 ? 'Too weak' : newPassword.length < 8 ? 'Good' : 'Strong' }}
              </span>
            </div>

          </div>
        </div>

        <!-- ================= DELETE ACCOUNT ================= -->
        <div class="section danger-zone">
          <h2 class="section-title danger">
            <span class="title-decoration danger"></span>
            Delete Account
          </h2>
          
          <div class="warning-card">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <p class="warning-title">This action is permanent</p>
              <p class="warning-text">
                Once you delete your account, all of your data will be permanently removed:
              </p>
              <ul class="warning-list">
                <li>Profile information and photos</li>
                <li>Gallery images</li>
                <li>All personal data</li>
              </ul>
              <p class="warning-text"><strong>This cannot be undone.</strong></p>
            </div>
          </div>

          <div class="button-wrapper delete-wrapper">
            <button
              class="btn btn-danger delete-btn"
              :disabled="deleting"
              @click="deleteAccount"
            >
              <span class="btn-spinner" v-if="deleting"></span>
              <span v-else class="btn-icon"></span>
              {{ deleting ? 'Deleting Account...' : 'Delete My Account' }}
            </button>
          </div>
        </div>

        <!-- Back to Profile Link -->
        <div class="back-section">
          <router-link to="/profile" class="back-link">
            <span class="back-icon">←</span>
            Back to Profile
          </router-link>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================
   CSS VARIABLES
========================= */
.account-settings-page {
  --gold: #f5d27a;
  --gold-light: rgba(245, 210, 122, 0.2);
  --gold-medium: rgba(245, 210, 122, 0.5);
  
  --text-light: #ffffff;
  --text-dark: #1a1a1a;
  --text-muted: rgba(255, 255, 255, 0.7);
  
  --shadow-color: rgba(0, 0, 0, 0.3);
  --card-bg: rgba(255, 255, 255, 0.08);
  --card-bg-dark: rgba(0, 0, 0, 0.2);
  --input-bg: rgba(255, 255, 255, 0.1);
  --input-border: rgba(245, 210, 122, 0.3);
  --input-focus: var(--gold);
  
  --danger: #ff6b6b;
  --danger-light: rgba(255, 107, 107, 0.2);
  
  min-height: 100vh;
  background: #0a1a2f; /* Solid dark blue background */
  color: var(--text-light);
}

/* =========================
   HERO SECTION
========================= */
.hero-section {
  text-align: center;
  padding: 60px 20px 30px;
}

.page-title {
  font-size: 3rem;
  letter-spacing: 4px;
  font-weight: 700;
  color: var(--gold);
  text-shadow: 0 0 12px rgba(245, 210, 122, 0.4),
               0 4px 18px rgba(0, 0, 0, 0.7);
  margin: 0 0 10px;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #d6e3ff;
  font-weight: 400;
  letter-spacing: 1px;
  opacity: 0.9;
}

/* =========================
   CONTAINER
========================= */
.container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px 25px 50px;
}

/* =========================
   LOADING STATE
========================= */
.loading-state {
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid var(--gold-light);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =========================
   CUSTOM ALERT
========================= */
.custom-alert {
  position: fixed;
  top: 30px;
  right: 30px;
  padding: 16px 24px;
  border-radius: 8px;
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid;
  box-shadow: 0 10px 30px var(--shadow-color);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  max-width: 400px;
}

.custom-alert.success {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.2);
}

.custom-alert.error {
  border-color: var(--danger);
  background: rgba(255, 107, 107, 0.2);
}

.alert-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

/* Alert animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

/* =========================
   SETTINGS CARD
========================= */
.settings-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 2px solid var(--gold);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 50px var(--shadow-color);
}

/* =========================
   ACCOUNT INFO BADGE
========================= */
.account-info-badge {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: var(--card-bg-dark);
  border: 1px solid var(--gold);
  border-radius: 12px;
  margin-bottom: 30px;
}

.info-icon {
  font-size: 2rem;
}

.info-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--gold);
  opacity: 0.8;
}

.email-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-light);
  word-break: break-all;
}

/* =========================
   SECTIONS
========================= */
.section {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--gold-light);
}

.section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section.danger-zone {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid var(--danger-light);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px 0;
  font-size: 1.4rem;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.section-title.danger {
  color: var(--danger);
}

.title-decoration {
  width: 4px;
  height: 24px;
  background: var(--gold);
  border-radius: 2px;
}

.title-decoration.danger {
  background: var(--danger);
}

.section-subtitle {
  color: var(--text-muted);
  margin: 0 0 25px 14px;
  font-size: 0.95rem;
}

/* =========================
   FORM ELEMENTS
========================= */
.password-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.label-icon {
  font-size: 1rem;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:hover {
  border-color: var(--gold-medium);
}

.form-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 2px rgba(245, 210, 122, 0.2);
}

.form-input::placeholder {
  color: var(--text-muted);
  opacity: 0.5;
}

.field-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-left: 30px;
}

/* Password field with eye button */
.password-field {
  position: relative;
  display: flex;
  align-items: center;
}

.password-field .form-input {
  padding-right: 50px;
}

.eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: var(--gold);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.eye-btn:hover {
  opacity: 0.8;
  transform: scale(1.1);
}

.eye-icon {
  width: 20px;
  height: 20px;
}

/* Password strength indicator */
.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--card-bg-dark);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.strength-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  min-width: 70px;
  text-align: right;
}

/* =========================
   BUTTONS
========================= */
.button-wrapper {
  margin-top: 10px;
}

.btn {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--gold);
  color: var(--text-dark);
}

.btn-primary:hover:not(:disabled) {
  background: #e5c06b;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(245, 210, 122, 0.3);
}

.btn-danger {
  background: transparent;
  color: var(--danger);
  border: 2px solid var(--danger);
}

.btn-danger:hover:not(:disabled) {
  background: var(--danger);
  color: var(--text-light);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-icon {
  font-size: 1.1rem;
}

/* Delete button specific */
.delete-wrapper {
  margin-top: 25px;
}

/* =========================
   WARNING CARD
========================= */
.warning-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: var(--danger-light);
  border: 1px solid var(--danger);
  border-radius: 12px;
  margin: 20px 0;
}

.warning-icon {
  font-size: 2rem;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--danger);
  margin: 0 0 8px 0;
}

.warning-text {
  color: var(--text-muted);
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.warning-list {
  margin: 8px 0;
  padding-left: 20px;
  color: var(--text-muted);
}

.warning-list li {
  margin: 4px 0;
}

/* =========================
   BACK LINK
========================= */
.back-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--gold-light);
  text-align: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--gold);
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.3s ease;
  padding: 8px 16px;
  border-radius: 8px;
}

.back-link:hover {
  background: var(--gold-light);
  transform: translateX(-5px);
}

.back-icon {
  font-size: 1.2rem;
}

/* =========================
   RESPONSIVE DESIGN
========================= */
@media (max-width: 768px) {
  .hero-section {
    padding: 40px 15px 20px;
  }

  .page-title {
    font-size: 2.2rem;
    letter-spacing: 3px;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .container {
    padding: 15px;
  }

  .settings-card {
    padding: 25px;
  }

  .custom-alert {
    top: 20px;
    right: 20px;
    left: 20px;
    max-width: none;
    min-width: auto;
  }

  .warning-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }

  .warning-list {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }

  .settings-card {
    padding: 20px;
  }

  .account-info-badge {
    flex-direction: column;
    text-align: center;
  }

  .info-details {
    align-items: center;
  }

  .btn {
    padding: 12px 20px;
  }
}

/* Landscape mode */
@media (max-width: 768px) and (orientation: landscape) {
  .warning-card {
    flex-direction: row;
    text-align: left;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .settings-card {
    border: 3px solid var(--gold);
  }
  
  .form-input {
    border: 2px solid currentColor;
  }
  
  .btn {
    border: 2px solid currentColor;
  }
  
  .warning-card {
    border: 2px solid currentColor;
  }
}
</style>