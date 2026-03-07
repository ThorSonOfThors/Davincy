<template>
  <div class="all-announcements-page">
    
    <!-- HEADER SECTION -->
    <div class="hero-section">
      <h1 class="page-title">Community Announcements</h1>
      <p class="page-subtitle">Stay Informed with Latest Updates from Fellow Members</p>
    </div>

    <div class="container">
      
      <!-- LOADING STATE -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading announcements...</p>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="announcements.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="empty-title">No Announcements Yet</h3>
        <p class="empty-text">Check back later for community updates and announcements.</p>
      </div>

      <!-- ANNOUNCEMENTS LIST -->
      <div v-else class="announcements-list">
        <div
          v-for="ann in announcements"
          :key="ann.id"
          class="announcement-card"
        >
          <!-- Card Header with Author and Date -->
          <div class="card-header">
            <div class="author-info">
              <span class="author-avatar">
                {{ getInitials(ann.profiles?.first_name, ann.profiles?.second_name) }}
              </span>
              <span class="author-name">
                {{ ann.profiles?.first_name }} {{ ann.profiles?.second_name }}
              </span>
            </div>
            <div class="date-info">
              <span class="date-icon">📅</span>
              <span class="date-text">{{ formatDate(ann.created_at) }}</span>
            </div>
          </div>

          <!-- Title -->
          <h2 class="announcement-title">{{ ann.title }}</h2>

          <!-- Description -->
          <p class="announcement-description">{{ ann.description }}</p>

          <!-- Details Grid (only if fields exist) -->
          <div v-if="ann.address || ann.event_datetime" class="details-grid">
            <div v-if="ann.address" class="detail-item">
              <span class="detail-icon">📍</span>
              <span class="detail-label">Address:</span>
              <span class="detail-value">{{ ann.address }}</span>
            </div>

            <div v-if="ann.event_datetime" class="detail-item">
              <span class="detail-icon">⏰</span>
              <span class="detail-label">Date&Time:</span>
              <span class="detail-value">{{ formatDateTime(ann.event_datetime) }}</span>
            </div>
          </div>

          <!-- Gallery (only if exists) -->
          <div v-if="ann.gallery && ann.gallery.length" class="gallery-section">
            <p class="gallery-label">Images:</p>
            <div class="gallery-grid">
              <div
                v-for="(img, index) in ann.gallery"
                :key="index"
                class="gallery-item"
                @click="openGalleryImage(img)"
              >
                <img :src="getImageUrl(img)" class="gallery-image" />
              </div>
            </div>
          </div>

          <!-- Card Footer with Meta Info -->
          <div class="card-footer">
            
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeImageModal">✕</button>
        <img :src="selectedImage" class="modal-image" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { supabase } from "../lib/supabase"

interface Profile {
  first_name: string
  second_name: string
}

interface Announcement {
  id: string
  profile_id: string
  title: string
  description: string
  address?: string
  event_datetime?: string
  gallery?: string[]
  created_at: string
  profiles?: Profile
}

const announcements = ref<Announcement[]>([])
const loading = ref(true)

// Image modal
const showImageModal = ref(false)
const selectedImage = ref("")

/* ========================
   FETCH ALL ANNOUNCEMENTS
======================== */

onMounted(async () => {
  loading.value = true
  
  const { data, error } = await supabase
    .from("announcements")
    .select(`
      *,
      profiles (
        first_name,
        second_name
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(error)
  } else {
    announcements.value = data || []
  }

  loading.value = false
})

/* ========================
   GALLERY MODAL
======================== */

function openGalleryImage(path: string) {
  selectedImage.value = getImageUrl(path)
  showImageModal.value = true
}

function closeImageModal() {
  showImageModal.value = false
  selectedImage.value = ""
}

/* ========================
   UTIL
======================== */

function getImageUrl(path: string) {
  return supabase
    .storage
    .from("announcements")
    .getPublicUrl(path).data.publicUrl
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getInitials(firstName?: string, lastName?: string) {
  if (!firstName && !lastName) return "👤"
  return (firstName?.[0] || '') + (lastName?.[0] || '')
}
</script>

<style scoped>
/* =========================
   CSS VARIABLES
========================= */
.all-announcements-page {
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
  font-family: "Cinzel", serif;
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
  max-width: 900px;
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
   EMPTY STATE
========================= */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 2px solid var(--gold-light);
  border-radius: 24px;
  box-shadow: 0 20px 50px var(--shadow-color);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.7;
  animation: gentleFloat 3s ease-in-out infinite;
}

@keyframes gentleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-title {
  font-size: 2rem;
  color: var(--gold);
  margin: 0 0 15px;
  font-weight: 500;
}

.empty-text {
  color: var(--text-muted);
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.6;
}

/* =========================
   ANNOUNCEMENTS LIST
========================= */
.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* =========================
   ANNOUNCEMENT CARD
========================= */
.announcement-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--gold-light);
  border-radius: 20px;
  padding: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px var(--shadow-color);
}

.announcement-card:hover {
  border-color: var(--gold);
  transform: translateY(-3px);
  box-shadow: 0 20px 40px var(--shadow-color);
}

/* =========================
   CARD HEADER
========================= */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--gold-light);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), #b38b5a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-dark);
  text-transform: uppercase;
  box-shadow: 0 4px 10px rgba(245, 210, 122, 0.3);
}

.author-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: 0.5px;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: 5px 12px;
  background: var(--card-bg-dark);
  border-radius: 30px;
  border: 1px solid var(--gold-light);
}

.date-icon {
  font-size: 0.9rem;
}

.date-text {
  font-style: italic;
}

/* =========================
   TITLE & DESCRIPTION
========================= */
.announcement-title {
  font-size: 1.8rem;
  color: var(--gold);
  margin: 0 0 15px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.5px;
}

.announcement-description {
  color: var(--text-light);
  line-height: 1.8;
  margin: 0 0 25px;
  font-size: 1rem;
  white-space: pre-wrap;
}

/* =========================
   DETAILS GRID
========================= */
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
  padding: 20px;
  background: var(--card-bg-dark);
  border-radius: 12px;
  border: 1px solid var(--gold-light);
}

.detail-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

.detail-icon {
  font-size: 1.1rem;
  min-width: 24px;
}

.detail-label {
  font-weight: 600;
  color: var(--gold);
  min-width: 70px;
}

.detail-value {
  color: var(--text-light);
  flex: 1;
  word-break: break-word;
}

/* =========================
   GALLERY SECTION
========================= */
.gallery-section {
  margin-bottom: 25px;
}

.gallery-label {
  color: var(--gold);
  font-size: 0.9rem;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.gallery-item {
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px var(--shadow-color);
}

.gallery-item:hover {
  border-color: var(--gold);
  transform: scale(1.05);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.1);
}

/* =========================
   CARD FOOTER
========================= */
.card-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--gold-light);
  display: flex;
  justify-content: flex-end;
}

.announcement-id {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-family: monospace;
  opacity: 0.5;
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
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.modal-close {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gold);
  border: none;
  color: var(--text-dark);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal-close:hover {
  transform: scale(1.1);
  background: #e5c06b;
}

.modal-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
  border: 3px solid var(--gold);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
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

  .announcement-card {
    padding: 20px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .date-info {
    align-self: flex-start;
  }

  .announcement-title {
    font-size: 1.5rem;
  }

  .detail-item {
    flex-wrap: wrap;
    gap: 5px;
  }

  .detail-label {
    min-width: auto;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }

  .modal-close {
    top: 10px;
    right: 10px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }

  .announcement-card {
    padding: 15px;
  }

  .announcement-title {
    font-size: 1.3rem;
  }

  .author-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .author-name {
    font-size: 0.9rem;
  }

  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Landscape mode */
@media (max-width: 768px) and (orientation: landscape) {
  .announcement-card {
    padding: 20px;
  }

  .gallery-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .announcement-card {
    border: 2px solid var(--gold);
  }

  .author-avatar {
    border: 2px solid currentColor;
  }

  .modal-content {
    border: 3px solid var(--gold);
  }
}

/* Print styles */
@media print {
  .all-announcements-page {
    background: white;
    color: black;
  }

  .announcement-card {
    break-inside: avoid;
    border: 1px solid #ccc;
    box-shadow: none;
    background: white;
  }

  .modal-overlay {
    display: none;
  }
}
</style>