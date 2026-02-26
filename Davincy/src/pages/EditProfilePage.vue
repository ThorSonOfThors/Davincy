<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)

const profile = ref<any>(null)
const userId = ref<string | null>(null)

/* ---------------- BRANCH COLOR HELPER ---------------- */
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

/* ---------------- FETCH PROFILE ---------------- */

async function loadProfile() {
  loading.value = true

  const { data: userData } = await supabase.auth.getUser()
  userId.value = userData.user?.id ?? null

  if (!userId.value) return

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId.value)
    .single()

  if (!error) profile.value = data

  loading.value = false
}

/* ---------------- SAVE PROFILE ---------------- */

async function saveProfile() {
  if (!userId.value) return

  saving.value = true

  const updatePayload = {
    first_name: profile.value.first_name,
    second_name: profile.value.second_name,
    phone_number: profile.value.phone_number,
    rank: profile.value.rank,
    country_of_origin: profile.value.country_of_origin,
    current_country: profile.value.current_country,
    current_position: profile.value.current_position,
    bio: profile.value.bio,
    profile_photo: profile.value.profile_photo,
    gallery: profile.value.gallery,
    branch: profile.value.branch,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId.value)

  saving.value = false

  if (error) {
    alert('Failed to save profile')
  } else {
    alert('Profile updated successfully')
    await loadProfile()
  }
}

/* ---------------- UPLOAD PHOTO ---------------- */

async function uploadPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !userId.value) return

  try {
    uploading.value = true

    /* ---------------- VALIDATE FILE ---------------- */

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    /* ---------------- CREATE UNIQUE PATH ---------------- */

    const extension = file.name.split('.').pop()
    const filePath =
      `${userId.value}/profile_${Date.now()}.${extension}`

    /* ---------------- UPLOAD TO SUPABASE STORAGE ---------------- */

    const { error: uploadError } = await supabase.storage
      .from('Images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      alert(uploadError.message)
      return
    }

    /* ---------------- GET PUBLIC URL ---------------- */

    const { data } = supabase.storage
      .from('Images')
      .getPublicUrl(filePath)

    const publicUrl = data.publicUrl

    /* ---------------- SAVE URL TO DATABASE ---------------- */

    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        profile_photo: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId.value)

    if (dbError) {
      console.error('DB update error:', dbError)
      alert('Failed saving profile photo')
      return
    }

    /* ---------------- UPDATE LOCAL STATE ---------------- */

    profile.value.profile_photo = publicUrl

    console.log('✅ Profile photo updated')

  } catch (err) {
    console.error('Unexpected upload error:', err)
    alert('Upload failed')
  } finally {
    uploading.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="edit-profile-page">
    
    <!-- HEADER SECTION -->
    <div class="hero-section">
      <h1 class="page-title">Edit Profile</h1>
      <p class="page-subtitle">Update Your Service Information</p>
    </div>

    <!-- LOADING STATE -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>

    <!-- EDIT PROFILE FORM -->
    <div v-else class="form-wrapper">
      
      <!-- PROFILE CARD WITH BRANCH COLOR -->
      <div 
        class="profile-card" 
        :style="{ '--branch-color': branchColor }"
      >
        
        <!-- PHOTO SECTION -->
        <div class="photo-section">
          <h3 class="section-title">
            <span class="title-decoration"></span>
            Profile Photo
          </h3>
          
          <div class="photo-upload-area">
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

            <div class="upload-controls">
              <label class="upload-label">
                <span class="upload-icon">📸</span>
                Choose Photo
                <input
                  type="file"
                  accept="image/*"
                  @change="uploadPhoto"
                  class="file-input"
                />
              </label>
              <p v-if="uploading" class="upload-status">
                <span class="spinner-small"></span>
                Uploading...
              </p>
              <p v-else class="upload-hint">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        <!-- PERSONAL INFORMATION SECTION -->
        <div class="form-section">
          <h3 class="section-title">
            <span class="title-decoration"></span>
            Personal Information
          </h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="first_name" class="field-label">First Name</label>
              <input
                id="first_name"
                v-model="profile.first_name"
                type="text"
                class="form-input"
                placeholder="Enter your first name"
              />
            </div>

            <div class="form-field">
              <label for="second_name" class="field-label">Last Name</label>
              <input
                id="second_name"
                v-model="profile.second_name"
                type="text"
                class="form-input"
                placeholder="Enter your last name"
              />
            </div>

            <div class="form-field">
              <label for="phone_number" class="field-label">Phone Number</label>
              <input
                id="phone_number"
                v-model="profile.phone_number"
                type="tel"
                class="form-input"
                placeholder="+62 XXX XXXX XXXX"
              />
            </div>

            <div class="form-field">
              <label for="country_of_origin" class="field-label">Country of Origin</label>
              <input
                id="country_of_origin"
                v-model="profile.country_of_origin"
                type="text"
                class="form-input"
                placeholder="e.g., Serbia, Indonesia, USA"
              />
            </div>
          </div>
        </div>

        <!-- SERVICE INFORMATION SECTION -->
        <div class="form-section">
          <h3 class="section-title">
            <span class="title-decoration"></span>
            Service Information
          </h3>
          
          <div class="form-grid">
            <div class="form-field">
              <label for="rank" class="field-label">Rank</label>
              <input
                id="rank"
                v-model="profile.rank"
                type="text"
                class="form-input"
                placeholder="Enter your rank"
              />
            </div>

            <div class="form-field">
              <label for="branch" class="field-label">Branch</label>
              <select
                id="branch"
                v-model="profile.branch"
                class="form-input"
              >
                <option value="" disabled selected>Select your branch</option>
                <option value="Navy">Navy</option>
                <option value="Airforce">Airforce</option>
                <option value="Marines">Marines</option>
                <option value="Field Force">Field Force</option>
              </select>
            </div>

            <div class="form-field">
              <label for="current_position" class="field-label">Current Position</label>
              <input
                id="current_position"
                v-model="profile.current_position"
                type="text"
                class="form-input"
                placeholder="Enter your current position"
              />
            </div>

            <div class="form-field">
              <label for="current_country" class="field-label">Current Country</label>
              <input
                id="current_country"
                v-model="profile.current_country"
                type="text"
                class="form-input"
                placeholder="Country where you're currently stationed"
              />
            </div>
          </div>
        </div>

        <!-- BIOGRAPHY SECTION -->
        <div class="form-section">
          <h3 class="section-title">
            <span class="title-decoration"></span>
            Biography
          </h3>
          
          <div class="form-field">
            <label for="bio" class="field-label">Tell your story</label>
            <textarea
              id="bio"
              v-model="profile.bio"
              class="form-input textarea"
              placeholder="Share your service history, achievements, and personal story..."
              rows="6"
            />
            <p class="field-hint">
              This will be visible to the community. Max 1000 characters.
            </p>
          </div>
        </div>

        <!-- META INFORMATION -->
        <div class="meta-section">
          <div class="meta-item">
            <span class="meta-label">Member since:</span>
            <span class="meta-value">
              {{ profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—' }}
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Last updated:</span>
            <span class="meta-value">
              {{ profile.updated_at ? new Date(profile.updated_at).toLocaleString() : '—' }}
            </span>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="action-buttons">
          <router-link to="/profile" class="cancel-btn">
            Cancel
          </router-link>
          <button
            class="save-btn"
            :disabled="saving"
            @click="saveProfile"
          >
            <span v-if="saving" class="spinner-small"></span>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================
   CSS VARIABLES
========================= */
.edit-profile-page {
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
  --input-bg: rgba(255, 255, 255, 0.1);
  --input-border: rgba(245, 210, 122, 0.3);
  --input-focus: var(--gold);
  
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

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--gold-light);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =========================
   FORM WRAPPER
========================= */
.form-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 25px 50px;
}

/* =========================
   PROFILE CARD
========================= */
.profile-card {
  position: relative;
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 2px solid var(--gold);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 50px var(--shadow-color);
  z-index: 1;
}

/* Branch color overlay */
.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--branch-color, var(--branch-default));
  border-radius: 22px;
  opacity: 0.85;
  z-index: -1;
  transition: background-color 0.3s ease;
}

/* Light branch adjustments */
.profile-card[style*="--branch-airforce"]::before,
.profile-card[style*="--branch-marines"]::before {
  opacity: 0.9;
}

/* =========================
   SECTION TITLES
========================= */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 25px 0;
  font-size: 1.3rem;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.title-decoration {
  width: 4px;
  height: 24px;
  background: var(--gold);
  border-radius: 2px;
}

/* =========================
   PHOTO SECTION
========================= */
.photo-section {
  margin-bottom: 40px;
}

.photo-upload-area {
  display: flex;
  align-items: center;
  gap: 30px;
  flex-wrap: wrap;
}

.avatar-wrapper {
  flex-shrink: 0;
}

.avatar {
  width: 140px;
  height: 140px;
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
  font-size: 3rem;
  font-weight: 600;
  color: var(--gold);
  text-transform: uppercase;
}

.upload-controls {
  flex: 1;
}

.upload-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: var(--gold);
  color: var(--text-dark);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-label:hover {
  background: #e5c06b;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(245, 210, 122, 0.3);
}

.upload-icon {
  font-size: 1.2rem;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.upload-status {
  margin: 10px 0 0;
  color: var(--gold);
  display: flex;
  align-items: center;
}

.upload-hint {
  margin: 10px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* =========================
   FORM SECTIONS
========================= */
.form-section {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--gold-light);
}

.form-section:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  padding: 12px 16px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 1rem;
  transition: all 0.3s ease;
  width: 100%;
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

.form-input.textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}

/* Select dropdown */
select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23f5d27a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
  padding-right: 48px;
}

select.form-input option {
  background: #1a2a3a;
  color: var(--text-light);
}

.field-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Light branch adjustments */
.profile-card[style*="--branch-airforce"] .form-input,
.profile-card[style*="--branch-marines"] .form-input {
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-dark);
}

.profile-card[style*="--branch-airforce"] .field-label,
.profile-card[style*="--branch-marines"] .field-label {
  color: #8b7355; /* Darker gold for contrast */
}

.profile-card[style*="--branch-airforce"] .form-input::placeholder,
.profile-card[style*="--branch-marines"] .form-input::placeholder {
  color: var(--text-muted-dark);
}

/* =========================
   META SECTION
========================= */
.meta-section {
  display: flex;
  justify-content: space-between;
  padding: 20px 0;
  margin: 30px 0 20px;
  border-top: 1px solid var(--gold-light);
  border-bottom: 1px solid var(--gold-light);
  font-size: 0.9rem;
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
   ACTION BUTTONS
========================= */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.save-btn,
.cancel-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.save-btn {
  background: var(--gold);
  color: var(--text-dark);
  min-width: 160px;
}

.save-btn:hover:not(:disabled) {
  background: #e5c06b;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(245, 210, 122, 0.3);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: transparent;
  color: var(--gold);
  border: 1px solid var(--gold);
}

.cancel-btn:hover {
  background: var(--gold-light);
  transform: translateY(-2px);
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

  .form-wrapper {
    padding: 15px;
  }

  .profile-card {
    padding: 25px;
  }

  .photo-upload-area {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .avatar {
    width: 120px;
    height: 120px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .meta-section {
    flex-direction: column;
    gap: 8px;
    align-items: center;
    text-align: center;
  }

  .action-buttons {
    flex-direction: column-reverse;
  }

  .save-btn,
  .cancel-btn {
    width: 100%;
    padding: 12px 20px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }

  .profile-card {
    padding: 20px;
  }

  .avatar {
    width: 100px;
    height: 100px;
    border-width: 3px;
  }

  .avatar.placeholder {
    font-size: 2.5rem;
  }

  .upload-label {
    width: 100%;
    justify-content: center;
  }
}

/* Landscape mode */
@media (max-width: 768px) and (orientation: landscape) {
  .photo-upload-area {
    flex-direction: row;
    text-align: left;
  }

  .meta-section {
    flex-direction: row;
    justify-content: space-between;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .profile-card {
    border: 3px solid var(--gold);
  }
  
  .form-input {
    border: 2px solid currentColor;
  }
  
  .save-btn,
  .cancel-btn {
    border: 2px solid currentColor;
  }
  
  .profile-card::before {
    opacity: 0.7;
  }
}
</style>