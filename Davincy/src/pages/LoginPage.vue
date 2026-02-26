<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const auth = useAuthStore()
const router = useRouter();

// Alert state
const alertMessage = ref('')
const alertType = ref<'success' | 'error' | ''>('')
const showAlert = ref(false)

// Forgot password modal state
const showForgotModal = ref(false)

function showAlertMessage(message: string, type: 'success' | 'error') {
  alertMessage.value = message
  alertType.value = type
  showAlert.value = true
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    showAlert.value = false
  }, 3000)
}

async function login() {
  try {
    await auth.login(email.value, password.value)
    showAlertMessage('Logged in successfully!', 'success')
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (e: any) {
    showAlertMessage(e.message, 'error')
  }
}

function handleForgotPassword() {
  showForgotModal.value = true
}
</script>

<template>
  <div class="login-page">
    
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

    <!-- Forgot Password Modal -->
    <transition name="fade">
      <div v-if="showForgotModal" class="modal-overlay" @click="showForgotModal = false">
        <div class="modal-card" @click.stop>
          <button class="modal-close" @click="showForgotModal = false">✕</button>
          
          <div class="modal-icon">🔒</div>
          <h2 class="modal-title">Contact Administrator</h2>
          
          <div class="modal-content">
            <p class="modal-text">
              For security reasons, password resets must be handled by an administrator.
            </p>
            
            <div class="admin-contact">
              <div class="contact-item">
                <span class="contact-label">Email:</span>
                <a href="mailto:admin@example.com" class="contact-value">admin@example.com</a>
              </div>
              <div class="contact-item">
                <span class="contact-label">Phone:</span>
                <span class="contact-value">+1 (555) 123-4567</span>
              </div>
            </div>
            
            <p class="modal-note">
              Please provide your full name and email address when contacting the administrator.
            </p>
          </div>
          
          <button class="btn btn-primary modal-btn" @click="showForgotModal = false">
            Understood
          </button>
        </div>
      </div>
    </transition>

    <div class="hero-section">
      <h1 class="page-title">Welcome Back</h1>
      <p class="page-subtitle">Log in to your account to continue</p>
    </div>

    <div class="container">
      <div class="login-card">
        
        <!-- Military Insignia Decoration -->
        <div class="insignia">
          <span class="star">⭐</span>
          <span class="star">⭐</span>
          <span class="star">⭐</span>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="login" class="login-form">
          
          <!-- Email Field -->
          <div class="input-wrapper">
            <label for="email" class="field-label">
              <span class="label-icon">📧</span>
              Email Address
            </label>
            <div class="input-field">
              <input
                id="email"
                type="email"
                v-model="email"
                placeholder="Enter your email address"
                class="form-input"
                required
              />
            </div>
          </div>

          <!-- Password Field with Eye -->
          <div class="input-wrapper">
            <label for="password" class="field-label">
              <span class="label-icon">🔒</span>
              Password
            </label>
            <div class="password-field">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="Enter your password"
                class="form-input"
                required
              />
              <button 
                class="eye-btn" 
                @click="showPassword = !showPassword"
                type="button"
                :title="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="showPassword" class="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
                </svg>
                <svg v-else class="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 7c2.8 0 5 2.2 5 5 0 .9-.2 1.7-.7 2.5l3.5 3.5c1.5-1.5 2.7-3.3 3.5-5.5-1.7-4.4-6-7.5-11-7.5-1.4 0-2.7.3-4 .7l2.1 2.1c.6-.2 1.2-.3 1.9-.3zm-8.5-.5l2.6 2.6c-.1.3-.1.6-.1.9 0 2.8 2.2 5 5 5 .3 0 .6 0 .9-.1l2.6 2.6c-.9.3-1.9.5-3 .5-5 0-9.3-3.1-11-7.5.8-1.9 2-3.6 3.5-5zM4.2 3.5L3.5 4.2 19.8 20.5l.7-.7L4.2 3.5z"/>
                </svg>
              </button>
            </div>
            <p class="field-hint">Minimum 6 characters</p>
          </div>

          <!-- Forgot Password Link -->
          <div class="forgot-password">
            <button 
              type="button"
              class="forgot-link" 
              @click="handleForgotPassword"
            >
              Forgot password?
            </button>
          </div>

          <!-- Login Button -->
          <button 
            type="submit" 
            class="btn btn-primary login-btn"
            :disabled="!email || !password"
          >
            <span class="btn-icon">→</span>
            <span class="btn-text">Log In</span>
          </button>

          <!-- Sign Up Link -->
          <div class="signup-link">
            <span class="text">Don't have an account?</span>
            <router-link to="/register" class="link">Register here</router-link>
          </div>

          <!-- Security Notice -->
          <div class="security-notice">
            <span class="notice-icon">🛡️</span>
            <span class="notice-text">Authorized personnel only</span>
          </div>

        </form>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================
   CSS VARIABLES
========================= */
.login-page {
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
  
  min-height: 100vh;
  background: radial-gradient(circle at top,
    rgba(10, 35, 70, 0.98),
    rgba(5, 15, 30, 1)
  );
  color: var(--text-light);
}

/* =========================
   HERO SECTION
========================= */
.hero-section {
  text-align: center;
  padding: 60px 20px 20px;
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
  max-width: 500px;
  margin: 0 auto;
  padding: 20px 25px 50px;
}

/* =========================
   LOGIN CARD
========================= */
.login-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 2px solid var(--gold);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 50px var(--shadow-color);
  position: relative;
  overflow: hidden;
}

/* Military insignia decoration */
.insignia {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.star {
  font-size: 1.5rem;
  opacity: 0.5;
  animation: twinkle 2s infinite;
}

.star:nth-child(2) {
  animation-delay: 0.3s;
}

.star:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
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
  border-color: #ff6b6b;
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
   MODAL
========================= */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 2px solid var(--gold);
  border-radius: 24px;
  padding: 40px;
  max-width: 450px;
  width: 100%;
  position: relative;
  box-shadow: 0 30px 60px var(--shadow-color);
  animation: modalPop 0.3s ease;
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: var(--gold);
  font-size: 1.2rem;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: var(--gold-light);
  transform: scale(1.1);
}

.modal-icon {
  font-size: 4rem;
  text-align: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 1.8rem;
  color: var(--gold);
  text-align: center;
  margin: 0 0 20px;
  letter-spacing: 1px;
}

.modal-content {
  margin-bottom: 30px;
}

.modal-text {
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 25px;
  line-height: 1.6;
}

.admin-contact {
  background: var(--card-bg-dark);
  border: 1px solid var(--gold);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.contact-item:first-child {
  border-bottom: 1px solid var(--gold-light);
}

.contact-label {
  min-width: 50px;
  color: var(--gold);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.contact-value {
  color: var(--text-light);
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-value:hover {
  color: var(--gold);
}

.modal-note {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  margin: 0;
  padding: 0 10px;
}

.modal-btn {
  width: 100%;
  padding: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* =========================
   FORM ELEMENTS
========================= */
.login-form {
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
  padding: 14px 16px;
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

/* Forgot password */
.forgot-password {
  text-align: right;
  margin-top: -10px;
}

.forgot-link {
  background: none;
  border: none;
  color: var(--gold);
  text-decoration: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 5px;
}

.forgot-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}

/* =========================
   BUTTONS
========================= */
.btn {
  padding: 16px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
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

.btn-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.btn-primary:hover .btn-icon {
  transform: translateX(5px);
}

/* =========================
   SIGN UP LINK
========================= */
.signup-link {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.link {
  color: var(--gold);
  text-decoration: none;
  font-weight: 600;
  margin-left: 5px;
  transition: all 0.3s ease;
}

.link:hover {
  text-decoration: underline;
  opacity: 0.8;
}

/* =========================
   SECURITY NOTICE
========================= */
.security-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px;
  background: var(--card-bg-dark);
  border: 1px solid var(--gold-light);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.notice-icon {
  font-size: 1.1rem;
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

  .login-card {
    padding: 30px 25px;
  }

  .custom-alert {
    top: 20px;
    right: 20px;
    left: 20px;
    max-width: none;
    min-width: auto;
  }

  .modal-card {
    padding: 30px 25px;
  }

  .modal-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }

  .login-card {
    padding: 25px 20px;
  }

  .btn {
    padding: 14px 20px;
    font-size: 1rem;
  }

  .modal-card {
    padding: 25px 20px;
  }

  .contact-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .contact-item:first-child {
    padding-bottom: 15px;
  }
}

/* Landscape mode */
@media (max-width: 768px) and (orientation: landscape) {
  .container {
    padding: 10px;
  }

  .login-card {
    padding: 20px;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .login-card {
    border: 3px solid var(--gold);
  }
  
  .form-input {
    border: 2px solid currentColor;
  }
  
  .btn {
    border: 2px solid currentColor;
  }
  
  .modal-card {
    border: 3px solid var(--gold);
  }
  
  .admin-contact {
    border: 2px solid currentColor;
  }
}
</style>