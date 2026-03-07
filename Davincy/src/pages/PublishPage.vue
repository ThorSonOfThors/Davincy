<template>
  <div class="announcements-page">
    
    <!-- HEADER SECTION -->
    <div class="hero-section">
      <h1 class="page-title">Announcements</h1>
      <p class="page-subtitle">Share News & Events with the Community</p>
    </div>

    <div class="container">
      
      <!-- CREATE/EDIT FORM CARD -->
      <div class="form-card">
        <h2 class="form-title">
          <span class="title-decoration"></span>
          {{ editingId ? "Edit Announcement" : "Create New Announcement" }}
        </h2>

        <form @submit.prevent="handleSubmit" class="announcement-form">
          
          <!-- Title Field -->
          <div class="form-group">
            <label class="field-label">
              <span class="label-icon">📢</span>
              Title *
            </label>
            <input 
              v-model="form.title" 
              required 
              placeholder="Enter announcement title"
              class="form-input"
            />
          </div>

          <!-- Description Field -->
          <div class="form-group">
            <label class="field-label">
              <span class="label-icon">📝</span>
              Description *
            </label>
            <textarea 
              v-model="form.description" 
              required 
              placeholder="Describe your announcement..."
              class="form-input textarea"
              rows="4"
            />
          </div>

          <!-- Address Field -->
          <div class="form-group">
            <label class="field-label">
              <span class="label-icon">📍</span>
              Address
            </label>
            <input 
              v-model="form.address" 
              placeholder="Event location or address"
              class="form-input"
            />
          </div>

          <!-- Event Date & Time -->
          <div class="form-group">
            <label class="field-label">
              <span class="label-icon">⏰</span>
              Event Date & Time
            </label>
            <input 
              type="datetime-local" 
              v-model="form.event_datetime" 
              class="form-input"
            />
          </div>

          <!-- Image Upload -->
          <div class="form-group">
            <label class="field-label">
              <span class="label-icon">🖼️</span>
              Images
            </label>
            
            <div class="upload-area">
              <input 
                type="file" 
                multiple 
                @change="handleFileChange" 
                accept="image/*"
                class="file-input"
                id="file-upload"
              />
              <label for="file-upload" class="upload-label">
                <span class="upload-icon">📸</span>
                Choose Images
              </label>
              <span v-if="selectedFiles.length" class="file-count">
                {{ selectedFiles.length }} file(s) selected
              </span>
            </div>

            <!-- Image Previews -->
            <div v-if="imagePreviews.length" class="image-previews">
              <div 
                v-for="(preview, index) in imagePreviews" 
                :key="index" 
                class="preview-item"
              >
                <img :src="preview" class="preview-image" />
                <button 
                  type="button" 
                  class="remove-image" 
                  @click="removeImage(index)"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Existing Images in Edit Mode -->
            <div v-if="editingId && existingGallery.length" class="existing-images">
              <p class="existing-label">Current Images:</p>
              <div class="existing-grid">
                <div 
                  v-for="(img, index) in existingGallery" 
                  :key="index" 
                  class="existing-item"
                >
                  <img :src="getImageUrl(img)" class="existing-image" />
                  <button 
                    type="button" 
                    class="remove-existing" 
                    @click="removeExistingImage(index)"
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <span class="btn-spinner" v-if="isSubmitting"></span>
              <span v-else class="btn-icon">{{ editingId ? "✏️" : "➕" }}</span>
              {{ editingId ? "Update Announcement" : "Create Announcement" }}
            </button>

            <button 
              v-if="editingId" 
              type="button" 
              class="btn btn-secondary"
              @click="cancelEdit"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- MY ANNOUNCEMENTS SECTION -->
      <div class="announcements-section">
        <h2 class="section-title">
          <span class="title-decoration"></span>
          My Announcements
        </h2>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading your announcements...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="announcements.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3 class="empty-title">No Announcements Yet</h3>
          <p class="empty-text">Create your first announcement using the form above.</p>
        </div>

        <!-- Announcements List -->
        <div v-else class="announcements-list">
          <div
            v-for="ann in announcements"
            :key="ann.id"
            class="announcement-card"
          >
            <!-- Card Header -->
            <div class="card-header">
              <h3 class="announcement-title">{{ ann.title }}</h3>
              <div class="card-actions">
                <button 
                  class="icon-btn edit" 
                  @click="startEdit(ann)"
                  title="Edit announcement"
                >
                  ✏️
                </button>
                <button 
                  class="icon-btn delete" 
                  @click="deleteAnnouncement(ann.id)"
                  title="Delete announcement"
                >
                  🗑️
                </button>
              </div>
            </div>

            <!-- Description -->
            <p class="announcement-description">{{ ann.description }}</p>

            <!-- Details Grid -->
            <div class="details-grid">
              <div v-if="ann.address" class="detail-item">
                <span class="detail-icon">📍</span>
                <span class="detail-label">Address:</span>
                <span class="detail-value">{{ ann.address }}</span>
              </div>

              <div v-if="ann.event_datetime" class="detail-item">
                <span class="detail-icon">⏰</span>
                <span class="detail-label">Event:</span>
                <span class="detail-value">{{ formatDate(ann.event_datetime) }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-icon">📅</span>
                <span class="detail-label">Created:</span>
                <span class="detail-value">{{ formatDate(ann.created_at) }}</span>
              </div>
            </div>

            <!-- Gallery -->
            <div v-if="ann.gallery && ann.gallery.length" class="announcement-gallery">
              <p class="gallery-label">Gallery:</p>
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

            <!-- Meta Footer -->
            <div class="card-footer">
              <span class="timestamp">
                Last updated: {{ formatDate(ann.updated_at || ann.created_at) }}
              </span>
            </div>
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

interface Announcement {
  id: string
  profile_id: string
  title: string
  description: string
  address?: string
  event_datetime?: string
  gallery?: string[]
  created_at: string
  updated_at?: string
}

const user = ref<any>(null)
const announcements = ref<Announcement[]>([])
const selectedFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const editingId = ref<string | null>(null)
const loading = ref(true)
const isSubmitting = ref(false)
const existingGallery = ref<string[]>([])

// Image modal
const showImageModal = ref(false)
const selectedImage = ref("")

const form = ref({
  title: "",
  description: "",
  address: "",
  event_datetime: ""
})

/* ========================
   LOAD USER + ANNOUNCEMENTS
======================== */

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  user.value = data.user

  if (user.value) {
    await fetchAnnouncements()
  } else {
    loading.value = false
  }
})

async function fetchAnnouncements() {
  loading.value = true
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("profile_id", user.value.id)
    .order("created_at", { ascending: false })

  announcements.value = data || []
  loading.value = false
}

/* ========================
   IMAGE HANDLING
======================== */

function handleFileChange(event: any) {
  const files = Array.from(event.target.files) as File[]
  selectedFiles.value = files
  
  // Create image previews
  imagePreviews.value = []
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreviews.value.push(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
}

function removeImage(index: number) {
  imagePreviews.value.splice(index, 1)
  selectedFiles.value.splice(index, 1)
}

async function removeExistingImage(index: number) {
  if (!editingId.value) return
  
  const imageToRemove = existingGallery.value[index] || ''
  existingGallery.value.splice(index, 1)
  
  // Update gallery in database
  await supabase
    .from("announcements")
    .update({ gallery: existingGallery.value })
    .eq("id", editingId.value)
  
  // Remove from storage
  await supabase.storage
    .from("announcements")
    .remove([imageToRemove])
}

/* ========================
   FORM HANDLING
======================== */

async function handleSubmit() {
  if (!user.value) return
  isSubmitting.value = true

  try {
    if (editingId.value) {
      await updateAnnouncement()
    } else {
      await createAnnouncement()
    }

    resetForm()
    await fetchAnnouncements()
  } catch (error) {
    console.error("Error submitting form:", error)
  } finally {
    isSubmitting.value = false
  }
}

async function createAnnouncement() {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      profile_id: user.value.id,
      title: form.value.title,
      description: form.value.description,
      address: form.value.address || null,
      event_datetime: form.value.event_datetime
        ? new Date(form.value.event_datetime).toISOString()
        : null
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return
  }

  if (selectedFiles.value.length) {
    const paths = await uploadImages(data.id)
    await supabase
      .from("announcements")
      .update({ gallery: paths })
      .eq("id", data.id)
  }
}

async function updateAnnouncement() {
  await supabase
    .from("announcements")
    .update({
      title: form.value.title,
      description: form.value.description,
      address: form.value.address || null,
      event_datetime: form.value.event_datetime
        ? new Date(form.value.event_datetime).toISOString()
        : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", editingId.value)

  if (selectedFiles.value.length) {
    const newPaths = await uploadImages(editingId.value!)
    const existing = announcements.value.find(a => a.id === editingId.value)
    const updatedGallery = [...(existing?.gallery || []), ...newPaths]

    await supabase
      .from("announcements")
      .update({ gallery: updatedGallery })
      .eq("id", editingId.value)
  }
}

async function uploadImages(announcementId: string) {
  const paths: string[] = []

  for (const file of selectedFiles.value) {
    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
    const path = `${user.value.id}/${announcementId}/${timestamp}_${safeFileName}`

    const { error } = await supabase.storage
      .from("announcements")
      .upload(path, file)

    if (!error) {
      paths.push(path)
    }
  }

  return paths
}

/* ========================
   DELETE
======================== */

async function deleteAnnouncement(id: string) {
  if (!confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) {
    return
  }

  const { data } = await supabase
    .from("announcements")
    .select("gallery")
    .eq("id", id)
    .single()

  if (data?.gallery?.length) {
    await supabase.storage
      .from("announcements")
      .remove(data.gallery)
  }

  await supabase
    .from("announcements")
    .delete()
    .eq("id", id)

  await fetchAnnouncements()
}

/* ========================
   EDIT MODE
======================== */

function startEdit(ann: Announcement) {
  editingId.value = ann.id
  existingGallery.value = ann.gallery || []

  form.value.title = ann.title
  form.value.description = ann.description
  form.value.address = ann.address || ""

  if (ann.event_datetime) {
    const d = new Date(ann.event_datetime)
    form.value.event_datetime = d.toISOString().slice(0, 16)
  } else {
    form.value.event_datetime = ""
  }

  selectedFiles.value = []
  imagePreviews.value = []
}

function cancelEdit() {
  resetForm()
}

function resetForm() {
  editingId.value = null
  selectedFiles.value = []
  imagePreviews.value = []
  existingGallery.value = []

  form.value = {
    title: "",
    description: "",
    address: "",
    event_datetime: ""
  }
}

/* ========================
   GALLERY MODAL
======================== */

function openGalleryImage(url: string) {
  selectedImage.value = getImageUrl(url)
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
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
/* =========================
   CSS VARIABLES
========================= */
.announcements-page {
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
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 25px 50px;
}

/* =========================
   FORM CARD
========================= */
.form-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 2px solid var(--gold);
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: 0 20px 50px var(--shadow-color);
}

.form-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 25px 0;
  font-size: 1.5rem;
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

/* Form Groups */
.announcement-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
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
  min-height: 100px;
  line-height: 1.6;
}

/* File Upload */
.upload-area {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.file-input {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  position: absolute;
  z-index: -1;
}

.upload-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--gold-light);
  border: 1px solid var(--gold);
  border-radius: 8px;
  color: var(--gold);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.upload-label:hover {
  background: var(--gold-medium);
  color: var(--text-dark);
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 1.2rem;
}

.file-count {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Image Previews */
.image-previews {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--gold);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.9);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s ease;
}

.remove-image:hover {
  background: #ff6b6b;
  transform: scale(1.1);
}

/* Existing Images */
.existing-images {
  margin-top: 20px;
}

.existing-label {
  color: var(--gold);
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.existing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
}

.existing-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--gold);
}

.existing-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-existing {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 107, 107, 0.9);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s ease;
}

.remove-existing:hover {
  background: #ff6b6b;
  transform: scale(1.1);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
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

.btn-secondary {
  background: transparent;
  color: var(--gold);
  border: 1px solid var(--gold);
}

.btn-secondary:hover {
  background: var(--gold-light);
  transform: translateY(-2px);
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =========================
   ANNOUNCEMENTS SECTION
========================= */
.announcements-section {
  margin-top: 40px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 25px 0;
  font-size: 1.5rem;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gold-light);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--card-bg);
  border-radius: 16px;
  border: 1px solid var(--gold-light);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.5rem;
  color: var(--gold);
  margin: 0 0 10px;
  font-weight: 500;
}

.empty-text {
  color: var(--text-muted);
  margin: 0;
  font-size: 1rem;
}

/* Announcements List */
.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.announcement-card {
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--gold-light);
  border-radius: 16px;
  padding: 25px;
  transition: all 0.3s ease;
}

.announcement-card:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px var(--shadow-color);
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.announcement-title {
  font-size: 1.3rem;
  color: var(--gold);
  margin: 0;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--card-bg-dark);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.icon-btn.edit:hover {
  border-color: var(--gold);
  background: var(--gold-light);
  transform: scale(1.1);
}

.icon-btn.delete:hover {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
  transform: scale(1.1);
}

/* Description */
.announcement-description {
  color: var(--text-light);
  line-height: 1.6;
  margin: 0 0 20px;
  font-size: 0.95rem;
}

/* Details Grid */
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 15px;
  background: var(--card-bg-dark);
  border-radius: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.detail-icon {
  font-size: 1rem;
}

.detail-label {
  font-weight: 600;
  color: var(--gold);
}

.detail-value {
  color: var(--text-light);
}

/* Gallery */
.announcement-gallery {
  margin-bottom: 20px;
}

.gallery-label {
  color: var(--gold);
  font-size: 0.9rem;
  margin: 0 0 10px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.gallery-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.gallery-item:hover {
  border-color: var(--gold);
  transform: scale(1.05);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Card Footer */
.card-footer {
  padding-top: 15px;
  border-top: 1px solid var(--gold-light);
}

.timestamp {
  color: var(--text-muted);
  font-size: 0.8rem;
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
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(5px);
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
}

.modal-close:hover {
  transform: scale(1.1);
  background: #e5c06b;
}

.modal-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  border: 3px solid var(--gold);
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
  }

  .container {
    padding: 15px;
  }

  .form-card {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
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

  .form-title {
    font-size: 1.2rem;
  }

  .announcement-card {
    padding: 20px;
  }

  .card-header {
    flex-direction: column;
    gap: 10px;
  }

  .card-actions {
    align-self: flex-end;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  .form-card,
  .announcement-card {
    border: 2px solid var(--gold);
  }

  .btn {
    border: 2px solid currentColor;
  }

  .modal-content {
    border: 3px solid var(--gold);
  }
}
</style>