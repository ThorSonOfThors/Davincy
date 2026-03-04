<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

const loading = ref(true)

type Profile = {
  id: string
  first_name?: string
  second_name?: string
  country_of_origin?: string
  current_position?: string
  profile_photo?: string
  rank?: string
  branch?: string
}

const profiles = ref<Profile[]>([])

/* ---------------- FETCH COMMUNITY ---------------- */

async function fetchCommunity() {
  loading.value = true

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      second_name,
      country_of_origin,
      current_position,
      profile_photo,
      rank,
      branch
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Community fetch error:', error)
  } else {
    // Filter out profiles missing essential information
    const rawProfiles = (data as Profile[]) || []
    profiles.value = rawProfiles.filter(profile => {
      // Check if profile has essential fields filled
      return (
        profile.first_name &&
        profile.first_name.trim() !== '' &&
        profile.second_name &&
        profile.second_name.trim() !== '' &&
        profile.rank &&
        profile.rank.trim() !== '' &&
        profile.branch &&
        profile.branch.trim() !== '' &&
        profile.current_position &&
        profile.current_position.trim() !== '' &&
        profile.country_of_origin &&
        profile.country_of_origin.trim() !== ''
      )
    })
  }

  loading.value = false
}

/* ---------------- NAVIGATE TO PROFILE ---------------- */

function openProfile(userId: string) {
  router.push(`/profile/${userId}`)
}

/* ---------------- BRANCH COLOR HELPER ---------------- */

function getBranchColor(branch?: string): string {
  const colors: Record<string, string> = {
    'Navy': 'var(--branch-navy)',
    'Airforce': 'var(--branch-airforce)',
    'Marines': 'var(--branch-marines)',
    'Field Force': 'var(--branch-field-force)'
  }
  
  return colors[branch || ''] || 'var(--branch-default)'
}

/* ---------------- COUNTRY FLAG HELPERS ---------------- */

function getCountryCode(country?: string): string | undefined {
  if (!country) return undefined

  const map: Record<string, string> = {
    // Europe
    Albania: 'AL',
    Andorra: 'AD',
    Austria: 'AT',
    Belarus: 'BY',
    Belgium: 'BE',
    'Bosnia and Herzegovina': 'BA',
    Bulgaria: 'BG',
    Croatia: 'HR',
    Cyprus: 'CY',
    'Czech Republic': 'CZ',
    Denmark: 'DK',
    Estonia: 'EE',
    Finland: 'FI',
    France: 'FR',
    Germany: 'DE',
    Greece: 'GR',
    Hungary: 'HU',
    Iceland: 'IS',
    Ireland: 'IE',
    Italy: 'IT',
    Kosovo: 'RS',
    Latvia: 'LV',
    Liechtenstein: 'LI',
    Lithuania: 'LT',
    Luxembourg: 'LU',
    Malta: 'MT',
    Moldova: 'MD',
    Monaco: 'MC',
    Montenegro: 'ME',
    Netherlands: 'NL',
    'North Macedonia': 'MK',
    Norway: 'NO',
    Poland: 'PL',
    Portugal: 'PT',
    Romania: 'RO',
    Russia: 'RU',
    Serbia: 'RS',
    Slovakia: 'SK',
    Slovenia: 'SI',
    Spain: 'ES',
    Sweden: 'SE',
    Switzerland: 'CH',
    Ukraine: 'UA',
    'United Kingdom': 'GB',

    // North America
    Canada: 'CA',
    USA: 'US',
    Mexico: 'MX',
    Guatemala: 'GT',
    Cuba: 'CU',
    Jamaica: 'JM',
    Panama: 'PA',

    // South America
    Argentina: 'AR',
    Bolivia: 'BO',
    Brazil: 'BR',
    Chile: 'CL',
    Colombia: 'CO',
    Ecuador: 'EC',
    Paraguay: 'PY',
    Peru: 'PE',
    Uruguay: 'UY',
    Venezuela: 'VE',

    // Asia
    Afghanistan: 'AF',
    Armenia: 'AM',
    Azerbaijan: 'AZ',
    Bahrain: 'BH',
    Bangladesh: 'BD',
    Bhutan: 'BT',
    Brunei: 'BN',
    Cambodia: 'KH',
    China: 'CN',
    Georgia: 'GE',
    India: 'IN',
    Indonesia: 'ID',
    Iran: 'IR',
    Iraq: 'IQ',
    Israel: 'IL',
    Japan: 'JP',
    Jordan: 'JO',
    Kazakhstan: 'KZ',
    Kuwait: 'KW',
    Kyrgyzstan: 'KG',
    Laos: 'LA',
    Lebanon: 'LB',
    Malaysia: 'MY',
    Maldives: 'MV',
    Mongolia: 'MN',
    Myanmar: 'MM',
    Nepal: 'NP',
    'North Korea': 'KP',
    Oman: 'OM',
    Pakistan: 'PK',
    Philippines: 'PH',
    Qatar: 'QA',
    'Saudi Arabia': 'SA',
    Singapore: 'SG',
    'South Korea': 'KR',
    'Sri Lanka': 'LK',
    Syria: 'SY',
    Taiwan: 'TW',
    Tajikistan: 'TJ',
    Thailand: 'TH',
    Turkey: 'TR',
    Turkmenistan: 'TM',
    'United Arab Emirates': 'AE',
    Uzbekistan: 'UZ',
    Vietnam: 'VN',
    Yemen: 'YE',

    // Africa
    Algeria: 'DZ',
    Angola: 'AO',
    Benin: 'BJ',
    Botswana: 'BW',
    Cameroon: 'CM',
    Egypt: 'EG',
    Ethiopia: 'ET',
    Ghana: 'GH',
    Kenya: 'KE',
    Morocco: 'MA',
    Mozambique: 'MZ',
    Namibia: 'NA',
    Nigeria: 'NG',
    Rwanda: 'RW',
    Senegal: 'SN',
    'South Africa': 'ZA',
    Sudan: 'SD',
    Tanzania: 'TZ',
    Tunisia: 'TN',
    Uganda: 'UG',
    Zambia: 'ZM',
    Zimbabwe: 'ZW',

    // Oceania
    Australia: 'AU',
    Fiji: 'FJ',
    'New Zealand': 'NZ',
    'Papua New Guinea': 'PG',
    Samoa: 'WS',
    Tonga: 'TO'
  }

  return map[country]
}

function getFlagUrl(country?: string): string | undefined {
  const code = getCountryCode(country)
  if (!code) return undefined

  return `https://flagsapi.com/${code}/flat/24.png`
}

onMounted(fetchCommunity)
</script>

<template>
  <div class="community-page">
    <div class="hero-section">
      <h1 class="page-title">Community</h1>
      <p class="page-subtitle">Members of our comunity:</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading community...</p>
    </div>

    <div v-else class="community-grid">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="user-card"
        :style="{ backgroundColor: getBranchColor(profile.branch) }"
        @click="openProfile(profile.id)"
      >
        <!-- PHOTO - Square with rounded corners -->
        <div class="photo-wrapper">
          <img
            v-if="profile.profile_photo"
            :src="profile.profile_photo"
            class="profile-photo"
            :alt="`${profile.first_name} ${profile.second_name}`"
          />
          <div v-else class="profile-photo placeholder">
            {{ profile.first_name?.[0] }}{{ profile.second_name?.[0] }}
          </div>
        </div>

        <!-- INFO -->
        <div class="user-info">
          <h3 class="user-name">
            {{ profile.first_name }}
            {{ profile.second_name }}
          </h3>

          <div class="user-details">
            <div class="detail-item rank-badge">
              <span class="detail-label">Rank</span>
              <span class="detail-value">{{ profile.rank }}</span>
            </div>

            <div class="detail-item branch-badge">
              <span class="detail-label">Branch</span>
              <span class="detail-value">{{ profile.branch }}</span>
            </div>

            <div class="detail-item position-badge">
              <span class="detail-label">Position</span>
              <span class="detail-value">{{ profile.current_position }}</span>
            </div>

            <div class="detail-item country-badge">
              <span class="detail-label">Country</span>
              <span class="detail-value country-value">
                <img
                  v-if="getFlagUrl(profile.country_of_origin)"
                  :src="getFlagUrl(profile.country_of_origin)"
                  class="flag"
                  :alt="profile.country_of_origin"
                />
                {{ profile.country_of_origin }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="profiles.length === 0" class="empty-state">
        <p>No community members available at this time.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================
   CSS VARIABLES - BRANCH COLORS
========================= */
.community-page {
  --branch-navy: #0a2342; /* Dark blue */
  --branch-airforce: #87CEEB; /* Sky blue */
  --branch-marines: #ffffff; /* White */
  --branch-field-force: #4a5d23; /* Army green */
  --branch-default: #2c3e50; /* Default dark blue-gray */
  
  --gold: #f5d27a;
  --text-light: #ffffff;
  --text-dark: #1a1a1a;
  --shadow-color: rgba(0, 0, 0, 0.3);
  
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
  padding: 60px 20px 40px;
}

.page-title {
  font-size: 3.5rem;
  letter-spacing: 6px;
  font-family: "Cinzel", serif;
  font-weight: 700;
  color: var(--gold);
  text-shadow: 0 0 12px rgba(245, 210, 122, 0.4),
               0 4px 18px rgba(0, 0, 0, 0.7);
  margin: 0 0 10px;
}

.page-subtitle {
  font-size: 1.2rem;
  color: #d6e3ff;
  font-weight: 400;
  letter-spacing: 2px;
  opacity: 0.9;
}

/* =========================
   LOADING STATE
========================= */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(245, 210, 122, 0.3);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =========================
   COMMUNITY GRID
========================= */
.community-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  padding: 20px 25px 50px;
  max-width: 1600px;
  margin: 0 auto;
}

/* =========================
   USER CARD
========================= */
.user-card {
  border-radius: 16px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 10px 30px var(--shadow-color);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
}

.user-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(245, 210, 122, 0.3);
}

/* Branch-specific text colors */
.user-card[style*="--branch-airforce"],
.user-card[style*="--branch-marines"] {
  color: var(--text-dark);
}

.user-card[style*="--branch-marines"] {
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* =========================
   PROFILE PHOTO - Square with rounded corners
========================= */
.photo-wrapper {
  margin-bottom: 20px;
}

.profile-photo {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border: 4px solid var(--gold);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  border-radius: 12px; /* Square with rounded corners */
}

.profile-photo.placeholder {
  background: linear-gradient(135deg, #2c3e50, #1a2a3a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  font-weight: 600;
  color: var(--gold);
  text-transform: uppercase;
  border-radius: 12px; /* Square with rounded corners */
}

/* =========================
   USER INFO
========================= */
.user-info {
  width: 100%;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 600;
  font-family: "Cinzel", serif;
  margin: 0 0 20px;
  color: inherit;
  letter-spacing: 1px;
  border-bottom: 2px solid rgba(245, 210, 122, 0.3);
  padding-bottom: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

/* Adjust background for light cards */
.user-card[style*="--branch-airforce"] .detail-item,
.user-card[style*="--branch-marines"] .detail-item {
  background: rgba(0, 0, 0, 0.05);
}

.detail-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
}

.country-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.flag {
  width: 20px;
  height: 15px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* =========================
   EMPTY STATE
========================= */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  backdrop-filter: blur(5px);
  color: #d6e3ff;
  font-size: 1.2rem;
}

/* =========================
   RESPONSIVE DESIGN
========================= */
@media (max-width: 768px) {
  .hero-section {
    padding: 40px 15px 30px;
  }

  .page-title {
    font-size: 2.4rem;
    letter-spacing: 4px;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .community-grid {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 15px 15px 30px;
  }

  .user-card {
    padding: 25px 15px;
  }

  .profile-photo {
    width: 140px;
    height: 140px;
    border-radius: 10px; /* Slightly smaller radius on mobile */
  }

  .profile-photo.placeholder {
    font-size: 3rem;
    border-radius: 10px;
  }

  .user-name {
    font-size: 1.3rem;
    margin-bottom: 15px;
  }

  .detail-item {
    padding: 6px 10px;
  }
}

/* Small phones */
@media (max-width: 480px) {
  .page-title {
    font-size: 2rem;
  }

  .community-grid {
    padding: 10px 10px 20px;
  }

  .profile-photo {
    width: 120px;
    height: 120px;
    border-width: 3px;
    border-radius: 8px;
  }

  .profile-photo.placeholder {
    font-size: 2.5rem;
    border-radius: 8px;
  }
}

/* Landscape mode on phones */
@media (max-width: 768px) and (orientation: landscape) {
  .community-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* High contrast / accessibility */
@media (prefers-contrast: high) {
  .user-card {
    border: 2px solid currentColor;
  }
  
  .detail-item {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid currentColor;
  }
}
</style>