<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'

/* ----------------------------------
   Types
---------------------------------- */
interface MeetingEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  organizer: string
  gallery: string[]
}

/* ----------------------------------
   State
---------------------------------- */
const events = ref<MeetingEvent[]>([])
const editingId = ref<string | null>(null)
const loading = ref(false)
const formExpanded = ref(true)
const deleteConfirm = ref<string | null>(null)

const previews = ref<string[]>([]) // preview URLs
const galleryPaths = ref<string[]>([]) // stored DB paths

const form = ref({
  title: '',
  description: '',
  event_date: '',
  organizer: ''
})

/* ----------------------------------
   Computed
---------------------------------- */
const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => {
    return new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  })
})

const upcomingEvents = computed(() => {
  const now = new Date()
  return events.value.filter(ev => new Date(ev.event_date) >= now)
})

const pastEvents = computed(() => {
  const now = new Date()
  return events.value.filter(ev => new Date(ev.event_date) < now)
})

/* ----------------------------------
   Fetch Events
---------------------------------- */
async function fetchEvents() {
  loading.value = true

  const { data, error } = await supabase
    .from('meeting_events')
    .select('*')
    .order('event_date', { ascending: false })

  if (!error) events.value = data as MeetingEvent[]

  loading.value = false
}

onMounted(fetchEvents)

/* ----------------------------------
   Helpers
---------------------------------- */

function getPublicUrl(path: string) {
  const { data } = supabase.storage
    .from('event-images')
    .getPublicUrl(path)

  return data.publicUrl
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function isUpcoming(date: string) {
  return new Date(date) >= new Date()
}

/* ----------------------------------
   Upload Images
---------------------------------- */
async function handleUpload(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return

  for (const file of input.files) {
    const filePath =
      `events/${editingId.value ?? 'temp'}/${crypto.randomUUID()}-${file.name}`

    const { error } = await supabase.storage
      .from('event-images')
      .upload(filePath, file)

    if (error) {
      console.error(error)
      alert('Upload failed')
      continue
    }

    galleryPaths.value.push(filePath)
    previews.value.push(getPublicUrl(filePath))
  }

  input.value = ''
}

/* ----------------------------------
   Remove Image
---------------------------------- */
async function removeImage(index: number) {
  const path = galleryPaths.value[index] || ''

  // delete from storage
  await supabase.storage
    .from('event-images')
    .remove([path])

  galleryPaths.value.splice(index, 1)
  previews.value.splice(index, 1)
}

/* ----------------------------------
   Reset Form
---------------------------------- */
function resetForm() {
  editingId.value = null
  previews.value = []
  galleryPaths.value = []
  formExpanded.value = true

  form.value = {
    title: '',
    description: '',
    event_date: '',
    organizer: ''
  }
}

/* ----------------------------------
   Edit Event
---------------------------------- */
function editEvent(ev: MeetingEvent) {
  editingId.value = ev.id
  formExpanded.value = true

  form.value = {
    title: ev.title,
    description: ev.description ?? '',
    event_date: ev.event_date,
    organizer: ev.organizer
  }

  galleryPaths.value = [...ev.gallery]
  previews.value = ev.gallery.map(getPublicUrl)
  
  // Smooth scroll to form
  document.querySelector('.command-center')?.scrollIntoView({ behavior: 'smooth' })
}

/* ----------------------------------
   Save (Create / Update)
---------------------------------- */
async function saveEvent() {
  const payload = {
    ...form.value,
    gallery: galleryPaths.value
  }

  let error

  if (editingId.value) {
    ({ error } = await supabase
      .from('meeting_events')
      .update(payload)
      .eq('id', editingId.value))
  } else {
    const { data, error: insertError } = await supabase
      .from('meeting_events')
      .insert(payload)
      .select()
      .single()

    error = insertError

    // move temp images into real event folder
    if (!error && data) {
      const newPaths: string[] = []

      for (const oldPath of galleryPaths.value) {
        if (!oldPath.includes('/temp/')) {
          newPaths.push(oldPath)
          continue
        }

        const newPath =
          `events/${data.id}/${oldPath.split('/').pop()}`

        await supabase.storage
          .from('event-images')
          .move(oldPath, newPath)

        newPaths.push(newPath)
      }

      await supabase
        .from('meeting_events')
        .update({ gallery: newPaths })
        .eq('id', data.id)
    }
  }

  if (error) {
    console.error(error)
    alert('Save failed')
    return
  }

  await fetchEvents()
  resetForm()
}

/* ----------------------------------
   Delete Event
---------------------------------- */
async function deleteEvent(ev: MeetingEvent) {
  deleteConfirm.value = ev.id
}

async function confirmDelete(ev: MeetingEvent) {
  // delete images from storage
  if (ev.gallery.length) {
    await supabase.storage
      .from('event-images')
      .remove(ev.gallery)
  }

  await supabase
    .from('meeting_events')
    .delete()
    .eq('id', ev.id)

  deleteConfirm.value = null
  await fetchEvents()
}

function cancelDelete() {
  deleteConfirm.value = null
}
</script>

<template>
  <div class="event-admin">
    <!-- GIGA CHAD HEADER -->
    <div class="header-section">
      <div class="title-container">
        <h1 class="title">
          <span class="title-glow">EVENT</span>
          <span class="title-accent">_COMMAND</span>
        </h1>
        <div class="title-badge">MASTER OF CEREMONIES</div>
      </div>

      <!-- STATS DASHBOARD -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-value">{{ events.length }}</div>
          <div class="stat-label">TOTAL EVENTS</div>
          <div class="stat-icon">📅</div>
        </div>
        <div class="stat-card upcoming">
          <div class="stat-value">{{ upcomingEvents.length }}</div>
          <div class="stat-label">UPCOMING</div>
          <div class="stat-icon">🚀</div>
        </div>
        <div class="stat-card past">
          <div class="stat-value">{{ pastEvents.length }}</div>
          <div class="stat-label">PAST</div>
          <div class="stat-icon">📜</div>
        </div>
      </div>
    </div>

    <!-- COMMAND CENTER (FORM) -->
    <div class="command-center" :class="{ expanded: formExpanded }">
      <div class="command-header" @click="formExpanded = !formExpanded">
        <h2>
          <span class="command-icon">⚡</span>
          {{ editingId ? 'OVERRIDE EVENT' : 'CREATE EVENT' }}
        </h2>
        <button class="expand-btn">
          {{ formExpanded ? '▼' : '▶' }}
        </button>
      </div>

      <div class="command-body" v-show="formExpanded">
        <div class="form-grid">
          <div class="input-group">
            <label>EVENT TITLE</label>
            <input v-model="form.title" placeholder="Enter mission name..." />
          </div>

          <div class="input-group">
            <label>ORGANIZER</label>
            <input v-model="form.organizer" placeholder="Who's in charge?" />
          </div>

          <div class="input-group">
            <label>EVENT DATE</label>
            <input type="date" v-model="form.event_date" class="military-datepicker"/>
          </div>

          <div class="input-group full-width">
            <label>MISSION BRIEFING</label>
            <textarea 
              v-model="form.description" 
              placeholder="Describe the epicness..."
              rows="4"
            />
          </div>

          <div class="input-group full-width">
            <label>GALLERY ASSETS</label>
            <div class="upload-zone">
              <input 
                type="file" 
                multiple 
                @change="handleUpload" 
                id="file-upload"
                hidden
              />
              <label for="file-upload" class="upload-label">
                <span class="upload-icon">📸</span>
                <span>DROP IMAGES HERE OR CLICK TO UPLOAD</span>
              </label>
            </div>

            <!-- IMAGE PREVIEWS -->
            <div class="preview-grid" v-if="previews.length">
              <div
                v-for="(img, i) in previews"
                :key="img"
                class="preview-card"
              >
                <img :src="img" />
                <button class="remove-btn" @click="removeImage(i)">
                  <span>✕</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="command-actions">
          <button 
            class="action-button primary" 
            @click="saveEvent"
            :disabled="!form.title || !form.event_date"
          >
            <span class="button-icon">{{ editingId ? '🔄' : '✨' }}</span>
            {{ editingId ? 'EXECUTE OVERRIDE' : 'LAUNCH EVENT' }}
          </button>

          <button 
            v-if="editingId" 
            class="action-button secondary" 
            @click="resetForm"
          >
            <span class="button-icon">✖</span>
            ABORT MISSION
          </button>
        </div>
      </div>
    </div>

    <!-- EVENTS DASHBOARD -->
    <div class="events-dashboard">
      <div class="dashboard-header">
        <h2 class="dashboard-title">
          <span class="title-icon">📋</span>
          ACTIVE MISSIONS
        </h2>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">ACCESSING EVENT DATABASE...</div>
      </div>

      <!-- Events Grid -->
      <div v-else class="events-grid">
        <div
          v-for="ev in sortedEvents"
          :key="ev.id"
          class="event-card"
          :class="{ 'upcoming': isUpcoming(ev.event_date) }"
        >
          <div class="card-glow"></div>
          
          <div class="event-header">
            <div class="event-badge" :class="{ 'upcoming-badge': isUpcoming(ev.event_date) }">
              {{ isUpcoming(ev.event_date) ? 'UPCOMING' : 'PAST' }}
            </div>
            <h3 class="event-title">{{ ev.title }}</h3>
          </div>

          <div class="event-meta">
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <span class="meta-text">{{ formatDate(ev.event_date) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">👤</span>
              <span class="meta-text">{{ ev.organizer }}</span>
            </div>
          </div>

          <p class="event-description" v-if="ev.description">
            {{ ev.description }}
          </p>

          <!-- Gallery Thumbnails -->
          <div class="gallery-strip" v-if="ev.gallery.length">
            <div
              v-for="img in ev.gallery.slice(0, 4)"
              :key="img"
              class="gallery-thumb"
            >
              <img :src="getPublicUrl(img)" />
            </div>
            <div v-if="ev.gallery.length > 4" class="gallery-more">
              +{{ ev.gallery.length - 4 }}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="event-actions">
            <button class="action-btn edit" @click="editEvent(ev)">
              <span class="btn-icon">✏️</span>
              MODIFY
            </button>
            
            <!-- Delete with confirmation -->
            <template v-if="deleteConfirm !== ev.id">
              <button class="action-btn delete" @click="deleteEvent(ev)">
                <span class="btn-icon">🗑️</span>
                TERMINATE
              </button>
            </template>
            
            <div v-else class="confirm-delete">
              <span>CONFIRM?</span>
              <button class="confirm-yes" @click="confirmDelete(ev)">✓</button>
              <button class="confirm-no" @click="cancelDelete">✗</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-admin {
  max-width: none;
  margin: 0 auto;
  padding: 40px 30px;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #fff;
  min-height: 100vh;
}

/* Header Section */
.header-section {
  margin-bottom: 40px;
}

.title-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.title {
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 4px;
  margin: 0;
  text-transform: uppercase;
}

.title-glow {
  background: linear-gradient(45deg, #00ff88, #00ccff);
  -webkit-background-clip: text;
  background-clip: none;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 20px #00ff8844);
}

.title-accent {
  color: #666;
  font-weight: 300;
}

.title-badge {
  background: linear-gradient(45deg, #ffd700, #ffaa00);
  color: #000;
  padding: 8px 16px;
  border-radius: 30px;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 1px;
  box-shadow: 0 0 30px #ffaa00;
  animation: pulse 2s infinite;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 25px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.stat-card.total {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.stat-card.upcoming {
  background: linear-gradient(135deg, #1a472a, #0b5e2a);
}

.stat-card.past {
  background: linear-gradient(135deg, #4a3f1a, #665c00);
}

.stat-value {
  font-size: 48px;
  font-weight: 900;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.7;
  letter-spacing: 1px;
}

.stat-icon {
  position: absolute;
  right: 20px;
  bottom: 20px;
  font-size: 48px;
  opacity: 0.2;
}

/* Command Center */
.command-center {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  margin-bottom: 40px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.command-header {
  padding: 20px 25px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
}

.command-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.command-header h2 {
  margin: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #00ff88;
}

.command-icon {
  font-size: 24px;
  
}

.expand-btn {
  background: none;
  border: none;
  color: #00ff88;
  font-size: 20px;
  cursor: pointer;
  padding: 5px 10px;
}

.command-body {
  padding: 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group.full-width {
  grid-column: 1 / -1;
}

.input-group label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #00ff88;
  opacity: 0.7;
}

.input-group input,
.input-group textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;
}

.input-group input:focus,
.input-group textarea:focus {
  outline: none;
  border-color: #00ff88;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
  background: rgba(0, 0, 0, 0.5);
}

.input-group input::placeholder,
.input-group textarea::placeholder {
  color: #666;
}

/* Upload Zone */
.upload-zone {
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px;
}

.upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-label:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #00ff88;
}

.upload-icon {
  font-size: 24px;
}

/* Preview Grid */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.preview-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.preview-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff3b30;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preview-card:hover .remove-btn {
  opacity: 1;
}

/* Command Actions */
.command-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.action-button {
  padding: 15px 30px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-button.primary {
  background: linear-gradient(45deg, #00ff88, #00ccff);
  color: #000;
  box-shadow: 0 5px 20px rgba(0, 255, 136, 0.3);
}

.action-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 255, 136, 0.5);
}

.action-button.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}

.action-button.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Events Dashboard */
.dashboard-header {
  margin-bottom: 25px;
}

.dashboard-title {
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #00ff88;
}

.title-icon {
  font-size: 28px;
}

/* Events Grid */
.events-grid {
  display: grid;
  gap: 25px;
}

.event-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 25px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.event-card.upcoming {
  border-left: 4px solid #00ff88;
}

.event-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.event-card:hover .card-glow {
  opacity: 1;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.event-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.1);
  color: #999;
}

.event-badge.upcoming-badge {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

.event-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  flex: 1;
  background: linear-gradient(45deg, #fff, #ccc);
  -webkit-background-clip: text;
  background-clip: none;
  -webkit-text-fill-color: transparent;
}

.event-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #aaa;
}

.meta-icon {
  font-size: 16px;
}

.event-description {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Gallery Strip */
.gallery-strip {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.gallery-thumb {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-more {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #00ff88;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

/* Event Actions */
.event-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn.edit {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid #00ff88;
  color: #00ff88;
}

.action-btn.edit:hover {
  background: #00ff88;
  color: #000;
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 255, 136, 0.3);
}

.action-btn.delete {
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid #ff3b30;
  color: #ff3b30;
}

.action-btn.delete:hover {
  background: #ff3b30;
  color: #000;
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 59, 48, 0.3);
}

.btn-icon {
  font-size: 16px;
}

/* Delete Confirmation */
.confirm-delete {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 59, 48, 0.2);
  padding: 5px 10px;
  border-radius: 10px;
  border: 1px solid #ff3b30;
}

.confirm-delete span {
  font-size: 12px;
  font-weight: 700;
  color: #ff3b30;
  margin-right: 5px;
}

.confirm-yes,
.confirm-no {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-yes {
  background: #00ff88;
  color: #000;
}

.confirm-yes:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px #00ff88;
}

.confirm-no {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.confirm-no:hover {
  background: #ff3b30;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(0, 255, 136, 0.1);
  border-top: 3px solid #00ff88;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-text {
  font-size: 18px;
  letter-spacing: 2px;
  opacity: 0.5;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 30px #ffaa00;
  }
  50% {
    box-shadow: 0 0 50px #ffaa00;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .event-admin {
    padding: 30px 20px;
  }

  .title {
    font-size: 36px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .command-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .event-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .event-meta {
    flex-direction: column;
    gap: 10px;
  }

  .event-actions {
    flex-direction: column;
    width: 100%;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .event-admin {
    padding: 20px 15px;
  }

  .title {
    font-size: 28px;
  }

  .title-badge {
    font-size: 12px;
    padding: 6px 12px;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-value {
    font-size: 36px;
  }

  .command-body {
    padding: 20px;
  }

  .event-card {
    padding: 20px;
  }

  .event-title {
    font-size: 20px;
  }

  .preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}

/* Ultra Narrow Screens */
@media (max-width: 360px) {
  .title {
    font-size: 24px;
    letter-spacing: 2px;
  }

  .title-container {
    gap: 10px;
  }

  .input-group input,
  .input-group textarea {
    padding: 10px 12px;
    font-size: 14px;
  }

  .upload-label {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }

  .preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 10px;
  }

  .gallery-thumb {
    width: 50px;
    height: 50px;
  }

  .gallery-more {
    width: 50px;
    height: 50px;
  }
}

/* Fix for notched phones */
@supports (padding: max(0px)) {
  .event-admin {
    padding-left: max(30px, env(safe-area-inset-left));
    padding-right: max(30px, env(safe-area-inset-right));
  }
  
  @media (max-width: 480px) {
    .event-admin {
      padding-left: max(15px, env(safe-area-inset-left));
      padding-right: max(15px, env(safe-area-inset-right));
    }
  }
}

/* Improve touch targets */
@media (max-width: 768px) {
  .action-button,
  .action-btn,
  .expand-btn,
  .upload-label,
  .confirm-yes,
  .confirm-no {
    min-height: 44px;
  }

  .stat-card {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .stat-card:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}











.military-datepicker {
  width: 100%;
  padding: 14px 16px;
  background: var(--input-bg, rgba(255, 255, 255, 0.1));
  border: 2px solid var(--gold, #f5d27a);
  border-radius: 8px;
  color: var(--text-light, #ffffff);
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
  color-scheme: dark;
}

.military-datepicker:hover {
  border-color: var(--gold-medium, rgba(245, 210, 122, 0.5));
  background: rgba(245, 210, 122, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(245, 210, 122, 0.2);
}

.military-datepicker:focus {
  outline: none;
  border-color: var(--gold, #f5d27a);
  box-shadow: 0 0 0 2px rgba(245, 210, 122, 0.2);
  background: rgba(245, 210, 122, 0.2);
}

/* Style the calendar icon */
.military-datepicker::-webkit-calendar-picker-indicator {
  filter: invert(0.8) sepia(1) hue-rotate(320deg) saturate(5);
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s ease;
  padding: 4px;
}

.military-datepicker::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* Style the date text */
.military-datepicker::-webkit-datetime-edit {
  color: var(--text-light, #ffffff);
}

.military-datepicker::-webkit-datetime-edit-fields-wrapper {
  color: var(--text-light, #ffffff);
}

.military-datepicker::-webkit-datetime-edit-text {
  color: var(--gold, #f5d27a);
  padding: 0 2px;
}

.military-datepicker::-webkit-datetime-edit-month-field,
.military-datepicker::-webkit-datetime-edit-day-field,
.military-datepicker::-webkit-datetime-edit-year-field {
  color: var(--text-light, #ffffff);
}

.military-datepicker::-webkit-datetime-edit-month-field:focus,
.military-datepicker::-webkit-datetime-edit-day-field:focus,
.military-datepicker::-webkit-datetime-edit-year-field:focus {
  background-color: var(--gold-light, rgba(245, 210, 122, 0.2));
  color: var(--gold, #f5d27a);
}

/* For Firefox */
.military-datepicker::-moz-calendar-picker-indicator {
  filter: invert(0.8) sepia(1) hue-rotate(320deg) saturate(5);
  cursor: pointer;
}

/* Placeholder styling when no date is selected */
.military-datepicker:invalid {
  color: var(--text-muted, rgba(255, 255, 255, 0.7));
}

/* Disabled state */
.military-datepicker:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}



</style>