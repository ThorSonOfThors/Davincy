<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'

const route = useRoute()

const loading = ref(true)
const errorMessage = ref('')
const profile = ref<any>(null)
const userEmail = ref<string | null>(null)

/* ---------------------------------------------
   BRANCH COLOR HELPER
--------------------------------------------- */
const branchColor = computed(() => {
  if (!profile.value?.branch) return 'var(--branch-default)'
  
  const colors: Record<string, string> = {
    'Navy': 'var(--branch-navy)',
    'Airforce': 'var(--branch-airforce)',
    'Marines': 'var(--branch-marines)',
    'Field Force': 'var(--branch-field-force)'
  }
  
  return colors[profile.value.branch] || 'var(--branch-default)'
})

/* ---------------------------------------------
   COUNTRY FLAG HELPER
--------------------------------------------- */
const flagUrl = computed(() => {
  if (!profile.value?.country_of_origin) return null
  return `https://flagsapi.com/${countryCode.value}/flat/32.png`
})

const countryCode = computed(() => {
  if (!profile.value?.country_of_origin) return ''

  const map: Record<string, string> = {
    Serbia: 'RS',
    Indonesia: 'ID',
    Germany: 'DE',
    France: 'FR',
    USA: 'US',
    Croatia: 'HR',
    Italy: 'IT',
    'United Kingdom': 'GB',
    Spain: 'ES',
    Canada: 'CA',
    Australia: 'AU',
    Japan: 'JP',
    China: 'CN',
    Russia: 'RU',
    Brazil: 'BR',
    Argentina: 'AR',
    Mexico: 'MX',
    Egypt: 'EG',
    'South Africa': 'ZA',
    Nigeria: 'NG',
    Kenya: 'KE',
    India: 'IN',
    Pakistan: 'PK',
    'South Korea': 'KR',
    Vietnam: 'VN',
    Thailand: 'TH',
    Philippines: 'PH',
    Malaysia: 'MY',
    Singapore: 'SG',
    'New Zealand': 'NZ'
  }

  return map[profile.value.country_of_origin] || ''
})

/* ---------------------------------------------
   FORMAT DATE
--------------------------------------------- */
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/* ---------------------------------------------
   FETCH PROFILE & USER EMAIL
--------------------------------------------- */
async function loadProfile() {
  loading.value = true
  errorMessage.value = ''

  const profileId = route.params.id as string

  if (!profileId) {
    errorMessage.value = 'Invalid profile'
    loading.value = false
    return
  }

  // Fetch profile data
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (profileError || !profileData) {
    console.error(profileError)
    errorMessage.value = 'Profile not found or not accessible.'
    loading.value = false
    return
  }

  profile.value = profileData

  // Fetch user email from auth.users (requires admin access or custom function)
  // This is a common pattern - you might need to create a database function for this
  try {
    const { data: authData, error: authError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', profileId)
      .single()
    
    if (!authError && authData) {
      // Note: This assumes you have an 'email' field in profiles or a view that joins with auth.users
      // If not, you may need to create a database function to safely expose emails
      userEmail.value = authData.email
    }
  } catch (error) {
    console.error('Could not fetch email:', error)
    // Don't show error to user, just don't display email
  }

  loading.value = false
}

onMounted(loadProfile)
</script>

<template>
  <div class="profile-view">
    <!-- LOADING -->
    <div v-if="loading" class="state loading-state">
      <div class="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>

    <!-- ERROR -->
    <div v-else-if="errorMessage" class="state error-state">
      <p>{{ errorMessage }}</p>
      <router-link to="/community" class="back-link">Return to Community</router-link>
    </div>

    <!-- PROFILE -->
    <div v-else class="profile-wrapper" >
      <div class="profile-container" >
        
        <!-- PROFILE CARD -->
        <div class="profile-card" :style="{ backgroundColor: branchColor }">
          
          <!-- HEADER SECTION -->
          <div class="profile-header">
            <div class="avatar-wrapper">
              <img
                v-if="profile.profile_photo"
                :src="profile.profile_photo"
                class="avatar"
                :alt="`${profile.first_name} ${profile.second_name}`"
              />
              <div v-else class="avatar placeholder">
                {{ profile.first_name?.[0] }}{{ profile.second_name?.[0] }}
              </div>
            </div>

            <div class="header-info">
              <h1 class="full-name">
                {{ profile.first_name }}
                {{ profile.second_name }}
              </h1>

              <div class="badge-container">
                <div v-if="profile.rank" class="badge rank-badge">
                  <span class="badge-label">Rank</span>
                  <span class="badge-value">{{ profile.rank }}</span>
                </div>
                
                <div v-if="profile.branch" class="badge branch-badge">
                  <span class="badge-label">Branch</span>
                  <span class="badge-value">{{ profile.branch }}</span>
                </div>
              </div>

              <p v-if="profile.current_position" class="position">
                {{ profile.current_position }}
              </p>

              <div v-if="profile.country_of_origin" class="country-info">
                <img
                  v-if="flagUrl"
                  :src="flagUrl"
                  class="flag"
                  :alt="profile.country_of_origin"
                />
                <span class="country-name">{{ profile.country_of_origin }}</span>
              </div>
            </div>
          </div>

          <!-- DETAILS SECTION -->
          <div class="details-section">
            
            <!-- Current Location -->
            <div v-if="profile.current_country" class="info-row">
              <span class="info-label">Current Location</span>
              <span class="info-value">{{ profile.current_country }}</span>
            </div>

            <!-- Phone Number -->
            <div v-if="profile.phone_number" class="info-row">
              <span class="info-label">Phone</span>
              <span class="info-value">{{ profile.phone_number }}</span>
            </div>

            <!-- Email (if available) -->
            <div v-if="userEmail" class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">{{ userEmail }}</span>
            </div>

          </div>

          <!-- BIOGRAPHY SECTION -->
          <div v-if="profile.bio" class="bio-section">
            <h3 class="section-title">
              <span class="title-decoration"></span>
              Biography
            </h3>
            <div class="bio-content">
              <p>{{ profile.bio }}</p>
            </div>
          </div>

          <!-- META INFORMATION -->
          <div class="meta-section">
            <div v-if="profile.created_at" class="meta-item">
              <span class="meta-label">Member since:</span>
              <span class="meta-value">{{ formatDate(profile.created_at) }}</span>
            </div>
            <div v-if="profile.updated_at && profile.updated_at !== profile.created_at" class="meta-item">
              <span class="meta-label">Last updated:</span>
              <span class="meta-value">{{ formatDate(profile.updated_at) }}</span>
            </div>
          </div>

          <!-- Back to Community Link -->
          <div class="back-to-community">
            <router-link to="/community" class="back-link">
              ← Back to Community
            </router-link>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================
   CSS VARIABLES
========================= */
.profile-view {
  --branch-navy: #0a2342; /* Dark blue */
  --branch-airforce: #87CEEB; /* Sky blue */
  --branch-marines: #ffffff; /* White */
  --branch-field-force: #4a5d23; /* Army green */
  --branch-default: #2c3e50; /* Default dark blue-gray */
  
  --gold: #f5d27a;
  --gold-light: rgba(245, 210, 122, 0.2);
  --gold-medium: rgba(245, 210, 122, 0.5);
  
  --text-light: #ffffff;
  --text-dark: #1a1a1a;
  --text-muted: rgba(255, 255, 255, 0.7);
  --text-muted-dark: rgba(0, 0, 0, 0.6);
  
  --shadow-color: rgba(0, 0, 0, 0.3);
  --card-bg: rgba(255, 255, 255, 0.08);
  --card-bg-dark: rgba(0, 0, 0, 0.2);
  
  min-height: 100vh;
  background: radial-gradient(circle at top,
    rgba(10, 35, 70, 0.98),
    rgba(5, 15, 30, 1)
  );
}

/* =========================
   LOADING & ERROR STATES
========================= */
.state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
}

.loading-state {
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

.error-state {
  color: #ff6b6b;
  font-size: 1.2rem;
  text-align: center;
  padding: 20px;
  gap: 20px;
}

/* =========================
   PROFILE WRAPPER
========================= */
.profile-wrapper {
  min-height: 100vh;
  transition: background-color 0.3s ease;
}

/* Branch-specific text colors */
.profile-wrapper[style*="--branch-airforce"],
.profile-wrapper[style*="--branch-marines"] {
  --text-light: var(--text-dark);
  --text-muted: var(--text-muted-dark);
}

.profile-wrapper[style*="--branch-marines"] {
  --card-bg: rgba(0, 0, 0, 0.03);
}

/* =========================
   PROFILE CONTAINER
========================= */
.profile-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* =========================
   PROFILE CARD
========================= */
.profile-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 2px solid var(--gold);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 50px var(--shadow-color);
}

/* =========================
   PROFILE HEADER
========================= */
.profile-header {
  display: flex;
  gap: 40px;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 2px solid var(--gold);
}

/* Avatar */
.avatar-wrapper {
  flex-shrink: 0;
}

.avatar {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border: 4px solid var(--gold);
  border-radius: 16px;
  box-shadow: 0 10px 25px var(--shadow-color);
}

.avatar.placeholder {
  background: linear-gradient(135deg, #2c3e50, #1a2a3a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  font-weight: 600;
  color: var(--gold);
  text-transform: uppercase;
}

/* Header Info */
.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.full-name {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--gold);
  margin: 0;
  text-shadow: 0 2px 10px rgba(245, 210, 122, 0.3);
  letter-spacing: 1px;
}

/* Badges */
.badge-container {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.badge {
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  background: var(--card-bg-dark);
  border: 1px solid var(--gold);
  border-radius: 8px;
  min-width: 120px;
}

.profile-wrapper[style*="--branch-airforce"] .badge,
.profile-wrapper[style*="--branch-marines"] .badge {
  background: rgba(255, 255, 255, 0.9);
}

.badge-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--gold);
  margin-bottom: 4px;
}

.badge-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-light);
}

/* Position */
.position {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin: 0;
  font-style: italic;
}

/* Country */
.country-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}

.flag {
  width: 32px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.country-name {
  font-size: 1.1rem;
  color: var(--text-light);
  font-weight: 500;
}

/* =========================
   DETAILS SECTION
========================= */
.details-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px;
  background: var(--card-bg-dark);
  border: 1px solid var(--gold);
  border-radius: 16px;
}

.info-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--gold-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  min-width: 120px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--gold);
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: var(--text-light);
  flex: 1;
}

/* =========================
   BIOGRAPHY SECTION
========================= */
.bio-section {
  margin-bottom: 30px;
  padding: 20px;
  background: var(--card-bg-dark);
  border: 1px solid var(--gold);
  border-radius: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.title-decoration {
  width: 4px;
  height: 20px;
  background: var(--gold);
  border-radius: 2px;
}

.bio-content {
  color: var(--text-light);
  line-height: 1.8;
  font-size: 1rem;
}

.bio-content p {
  margin: 0;
  white-space: pre-wrap;
}

/* =========================
   META SECTION
========================= */
.meta-section {
  display: flex;
  justify-content: space-between;
  padding: 20px 0 10px;
  border-top: 1px solid var(--gold-light);
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  gap: 8px;
}

.meta-label {
  font-weight: 600;
  color: var(--gold);
}

.meta-value {
  color: var(--text-muted);
}

/* =========================
   BACK LINK
========================= */
.back-to-community {
  text-align: center;
  margin-top: 20px;
}

.back-link {
  display: inline-block;
  padding: 10px 20px;
  color: var(--gold);
  text-decoration: none;
  border: 1px solid var(--gold);
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.back-link:hover {
  background: var(--gold);
  color: var(--text-dark);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(245, 210, 122, 0.3);
}

/* =========================
   RESPONSIVE DESIGN
========================= */
@media (max-width: 768px) {
  .profile-container {
    padding: 20px 15px;
  }

  .profile-card {
    padding: 25px;
  }

  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
  }

  .avatar {
    width: 140px;
    height: 140px;
  }

  .avatar.placeholder {
    font-size: 3rem;
  }

  .full-name {
    font-size: 2rem;
  }

  .badge-container {
    justify-content: center;
  }

  .badge {
    min-width: 100px;
  }

  .country-info {
    justify-content: center;
  }

  .info-row {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .info-label {
    min-width: auto;
  }

  .meta-section {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .meta-item {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .profile-card {
    padding: 20px;
  }

  .avatar {
    width: 120px;
    height: 120px;
    border-width: 3px;
  }

  .full-name {
    font-size: 1.6rem;
  }

  .badge {
    min-width: 80px;
    padding: 6px 12px;
  }

  .badge-value {
    font-size: 1rem;
  }
}

/* Landscape mode */
@media (max-width: 768px) and (orientation: landscape) {
  .profile-header {
    flex-direction: row;
    text-align: left;
  }

  .badge-container {
    justify-content: flex-start;
  }

  .country-info {
    justify-content: flex-start;
  }

  .info-row {
    flex-direction: row;
    align-items: baseline;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .profile-card {
    border: 3px solid var(--gold);
  }
  
  .badge,
  .details-section,
  .bio-section {
    border: 2px solid currentColor;
  }
  
  .back-link {
    border: 2px solid currentColor;
  }
}


</style>