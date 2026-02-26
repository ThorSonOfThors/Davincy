<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const profiles = ref<any[]>([])
const loading = ref(true)
const actionLoading = ref<string | null>(null)
const filterStatus = ref<'all' | 'pending' | 'approved'>('all')
const searchQuery = ref('')
const statsVisible = ref(true)

/* ---------------- FETCH PROFILES (SERVER) ---------------- */

async function fetchProfiles() {
  loading.value = true

  try {
    const res = await fetch('/api/admin-profiles')
    const data = await res.json()

    if (!res.ok) throw new Error(data.error)

    profiles.value = data
  } catch (err) {
    console.error(err)
    alert('Failed loading profiles')
  }

  loading.value = false
}

/* ---------------- FILTERED PROFILES ---------------- */

const filteredProfiles = computed(() => {
  return profiles.value.filter(profile => {
    // Status filter
    if (filterStatus.value !== 'all' && profile.status !== filterStatus.value) {
      return false
    }
    
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      return (
        profile.first_name?.toLowerCase().includes(query) ||
        profile.second_name?.toLowerCase().includes(query) ||
        profile.email?.toLowerCase().includes(query) ||
        profile.current_country?.toLowerCase().includes(query)
      )
    }
    
    return true
  })
})

/* ---------------- STATS ---------------- */

const stats = computed(() => {
  const total = profiles.value.length
  const pending = profiles.value.filter(p => p.status === 'pending').length
  const approved = profiles.value.filter(p => p.status === 'approved').length
  
  return { total, pending, approved }
})

/* ---------------- APPROVE USER ---------------- */

async function approveUser(id: string) {
  actionLoading.value = id

  const session = await supabase.auth.getSession()

  const res = await fetch('/api/approve-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.data.session?.access_token}`,
    },
    body: JSON.stringify({ userId: id }),
  })

  const data = await res.json()

  if (!res.ok) {
    alert(data.error || 'Failed to approve user')
  } else {
    await fetchProfiles()
  }

  actionLoading.value = null
}

/* ---------------- DELETE USER ---------------- */

async function deleteUser(profile: any) {
  const confirmText =
    `Delete ${profile.first_name} ${profile.second_name}\n(${profile.email}) ?`

  if (!confirm(confirmText)) return

  actionLoading.value = profile.id

  try {
    const session = await supabase.auth.getSession()

    const response = await fetch('/api/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.data.session?.access_token}`,
      },
      body: JSON.stringify({ userId: profile.id })
    })

    const result = await response.json()

    if (!response.ok)
      throw new Error(result.error || 'Delete failed')

    await fetchProfiles()

  } catch (err) {
    console.error(err)
    alert('Failed to delete user')
  }

  actionLoading.value = null
}

onMounted(fetchProfiles)
</script>

<template>
  <div class="admin">
    <!-- Giga Chad Header -->
    <div class="header-section">
      <div class="title-container">
        <h1 class="title">
          <span class="title-glow">ADMIN</span>
          <span class="title-accent">_OVERRIDE</span>
        </h1>
        <div class="title-badge">GIGA CHAD MODE</div>
      </div>
      
      <!-- Stats Dashboard -->
      <div class="stats-grid" v-if="statsVisible && !loading">
        <div class="stat-card total" @click="filterStatus = 'all'">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">TOTAL USERS</div>
          <div class="stat-icon">👥</div>
        </div>
        <div class="stat-card pending" @click="filterStatus = 'pending'">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">PENDING</div>
          <div class="stat-icon">⏳</div>
        </div>
        <div class="stat-card approved" @click="filterStatus = 'approved'">
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">APPROVED</div>
          <div class="stat-icon">✅</div>
        </div>
      </div>
    </div>

    <!-- Control Panel -->
    <div class="control-panel">
      <div class="filter-tabs">
        <button 
          class="filter-tab" 
          :class="{ active: filterStatus === 'all' }"
          @click="filterStatus = 'all'"
        >
          ALL SYSTEMS
        </button>
        <button 
          class="filter-tab pending" 
          :class="{ active: filterStatus === 'pending' }"
          @click="filterStatus = 'pending'"
        >
          PENDING ⏳
        </button>
        <button 
          class="filter-tab approved" 
          :class="{ active: filterStatus === 'approved' }"
          @click="filterStatus = 'approved'"
        >
          APPROVED ✅
        </button>
      </div>

      <div class="search-container">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Initialize user search..."
        >
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">ACCESSING MAINFRAME...</div>
    </div>

    <!-- User Grid -->
    <div v-else class="grid">
      <div
        v-for="profile in filteredProfiles"
        :key="profile.id"
        class="card"
        :class="profile.status"
      >
        <div class="card-glow"></div>
        
        <div class="card-header">
          <div class="user-info">
            <h3 class="user-name">
              {{ profile.first_name }} {{ profile.second_name }}
            </h3>
            <div class="user-role">{{ profile.role?.toUpperCase() || 'USER' }}</div>
          </div>

          <div class="status-container">
            <span
              class="status"
              :class="profile.status"
            >
              {{ profile.status }}
            </span>
          </div>
        </div>

        <div class="user-details">
          <div class="detail-item">
            <span class="detail-label">EMAIL</span>
            <span class="detail-value">{{ profile.email }}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">LOCATION</span>
            <span class="detail-value">{{ profile.current_country || 'Unknown' }}</span>
          </div>

          <div class="detail-item" v-if="profile.created_at">
            <span class="detail-label">JOINED</span>
            <span class="detail-value">{{ new Date(profile.created_at).toLocaleDateString() }}</span>
          </div>
        </div>

        <div class="actions">
          <button
            v-if="profile.status === 'pending'"
            :disabled="actionLoading === profile.id"
            class="action-button approve"
            @click="approveUser(profile.id)"
          >
            <span class="button-icon">⚡</span>
            {{ actionLoading === profile.id ? 'AUTHORIZING...' : 'AUTHORIZE ACCESS' }}
          </button>

          <button
            :disabled="actionLoading === profile.id"
            class="action-button delete"
            @click="deleteUser(profile)"
          >
            <span class="button-icon">🗑️</span>
            {{ actionLoading === profile.id ? 'TERMINATING...' : 'TERMINATE' }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredProfiles.length === 0" class="empty-state">
        <div class="empty-icon">🔮</div>
        <div class="empty-text">NO USERS MATCH YOUR CRITERIA</div>
        <button class="empty-reset" @click="filterStatus = 'all'; searchQuery = ''">
          RESET FILTERS
        </button>
      </div>
    </div>

    <!-- Stats Toggle -->
    <button class="stats-toggle" @click="statsVisible = !statsVisible">
      {{ statsVisible ? '📊' : '📈' }}
    </button>
  </div>
</template>

<style scoped>
.admin {
  max-width: none;
  margin: 0 auto;
  padding: 40px 30px;
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #fff;
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
  position: relative;
}

.title-glow {
  background: linear-gradient(45deg, #00ff88, #00ccff);
  -webkit-background-clip: text;
  background-clip:none;
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
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.stat-card.total {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.stat-card.pending {
  background: linear-gradient(135deg, #4a3f1a, #665c00);
}

.stat-card.approved {
  background: linear-gradient(135deg, #1a472a, #0b5e2a);
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

/* Control Panel */
.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 10px;
}

.filter-tab {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 24px;
  border-radius: 30px;
  color: #888;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.filter-tab.active {
  background: linear-gradient(45deg, #00ff88, #00ccff);
  color: #000;
  border-color: transparent;
  box-shadow: 0 0 20px #00ff88;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  opacity: 0.5;
}

.search-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 40px;
  padding: 15px 20px 15px 50px;
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #00ff88;
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.2);
  background: rgba(255, 255, 255, 0.05);
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

/* Grid */
.grid {
  display: grid;
  gap: 25px;
}

/* Card */
.card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 25px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.card.pending {
  border-left: 4px solid #ffaa00;
}

.card.approved {
  border-left: 4px solid #00ff88;
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

.card:hover .card-glow {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 5px 0;
  background: linear-gradient(45deg, #fff, #ccc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: none;
}

.user-role {
  font-size: 12px;
  color: #00ff88;
  letter-spacing: 1px;
  opacity: 0.7;
}

.status-container {
  display: flex;
  align-items: center;
}

.status {
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.status.pending {
  background: rgba(255, 170, 0, 0.2);
  color: #ffaa00;
  border: 1px solid rgba(255, 170, 0, 0.3);
}

.status.approved {
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.2);
}

/* User Details */
.user-details {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #666;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
}

.detail-value {
  color: #fff;
  font-weight: 500;
  word-break: break-all;
  text-align: right;
}

/* Actions */
.actions {
  display: flex;
  gap: 15px;
}

.action-button {
  flex: 1;
  border: none;
  padding: 15px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-transform: uppercase;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.approve {
  background: linear-gradient(45deg, #00ff88, #00ccff);
  color: #000;
  box-shadow: 0 5px 20px rgba(0, 255, 136, 0.3);
}

.action-button.approve:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 255, 136, 0.5);
}

.action-button.delete {
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid #ff3b30;
  color: #ff3b30;
}

.action-button.delete:hover:not(:disabled) {
  background: #ff3b30;
  color: #000;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(255, 59, 48, 0.5);
}

.button-icon {
  font-size: 18px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  letter-spacing: 2px;
  opacity: 0.5;
  margin-bottom: 20px;
}

.empty-reset {
  background: none;
  border: 1px solid #00ff88;
  color: #00ff88;
  padding: 12px 30px;
  border-radius: 30px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-reset:hover {
  background: #00ff88;
  color: #000;
  box-shadow: 0 0 30px #00ff88;
}

/* Stats Toggle */
.stats-toggle {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, #00ff88, #00ccff);
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 5px 30px rgba(0, 255, 136, 0.3);
  transition: all 0.3s ease;
  z-index: 100;
}

.stats-toggle:hover {
  transform: rotate(180deg);
  box-shadow: 0 5px 40px rgba(0, 255, 136, 0.5);
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

/* Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 32px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .control-panel {
    flex-direction: column;
  }
  
  .search-container {
    max-width: 100%;
  }
  
  .actions {
    flex-direction: column;
  }
}


/* Ultra Narrow Screens (below 480px) */
@media (max-width: 480px) {
  .admin {
    padding: 20px 15px;
  }

  .title-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .title {
    font-size: 28px;
    letter-spacing: 2px;
    word-break: break-word;
  }

  .title-badge {
    font-size: 12px;
    padding: 6px 12px;
  }

  .stats-grid {
    gap: 10px;
  }

  .stat-card {
    padding: 15px;
  }

  .stat-value {
    font-size: 32px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-icon {
    font-size: 32px;
    right: 10px;
    bottom: 10px;
  }

  .control-panel {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .filter-tabs {
    flex-wrap: wrap;
    gap: 8px;
  }

  .filter-tab {
    flex: 1 1 auto;
    padding: 10px 16px;
    font-size: 12px;
    text-align: center;
    white-space: nowrap;
  }

  .search-container {
    max-width: 100%;
  }

  .search-input {
    padding: 12px 15px 12px 45px;
    font-size: 14px;
  }

  .search-icon {
    left: 15px;
    font-size: 16px;
  }

  .grid {
    gap: 15px;
  }

  .card {
    padding: 18px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .user-name {
    font-size: 20px;
    word-break: break-word;
  }

  .status {
    align-self: flex-start;
  }

  .user-details {
    padding: 15px;
  }

  .detail-item {
    flex-direction: column;
    gap: 5px;
  }

  .detail-label {
    font-size: 11px;
  }

  .detail-value {
    font-size: 14px;
    text-align: left;
    word-break: break-word;
  }

  .actions {
    flex-direction: column;
    gap: 10px;
  }

  .action-button {
    padding: 12px;
    font-size: 13px;
  }

  .button-icon {
    font-size: 16px;
  }

  .stats-toggle {
    width: 50px;
    height: 50px;
    font-size: 20px;
    bottom: 20px;
    right: 20px;
  }

  .empty-state {
    padding: 40px 15px;
  }

  .empty-icon {
    font-size: 48px;
  }

  .empty-text {
    font-size: 14px;
    word-break: break-word;
  }

  .empty-reset {
    padding: 10px 20px;
    font-size: 13px;
  }
}

/* Super Tiny Screens (below 360px) */
@media (max-width: 360px) {
  .admin {
    padding: 15px 10px;
  }

  .title {
    font-size: 24px;
  }

  .filter-tabs {
    flex-direction: column;
  }

  .filter-tab {
    width: 100%;
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-label {
    font-size: 10px;
  }

  .card {
    padding: 15px;
  }

  .user-name {
    font-size: 18px;
  }

  .meta span {
    font-size: 12px;
  }
}

/* Add horizontal scroll protection for very tiny content */
@media (max-width: 320px) {
  .admin {
    padding: 10px 8px;
  }

  .status {
    padding: 4px 10px;
    font-size: 10px;
  }

  .detail-value {
    font-size: 13px;
  }
}

/* Fix for notched phones */
@supports (padding: max(0px)) {
  .admin {
    padding-left: max(30px, env(safe-area-inset-left));
    padding-right: max(30px, env(safe-area-inset-right));
  }
  
  @media (max-width: 480px) {
    .admin {
      padding-left: max(15px, env(safe-area-inset-left));
      padding-right: max(15px, env(safe-area-inset-right));
    }
  }
}

/* Improve touch targets for mobile */
@media (max-width: 768px) {
  .filter-tab,
  .action-button,
  .stats-toggle,
  .empty-reset {
    min-height: 44px; /* Apple's recommended minimum touch target */
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

/* Landscape mode fixes */
@media (max-height: 500px) and (orientation: landscape) {
  .admin {
    padding-top: 15px;
    padding-bottom: 15px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stat-card {
    padding: 12px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stats-toggle {
    bottom: 10px;
    right: 10px;
  }
}

/* Ensure content doesn't overflow */
* {
  max-width: 100%;
  box-sizing: border-box;
}

img, svg, video, canvas, audio, iframe, embed, object {
  max-width: 100%;
  height: auto;
}

/* Prevent horizontal scroll */
body {
  overflow-x: hidden;
  width: 100%;
  position: relative;
}

/* Improve readability on very small screens */
@media (max-width: 480px) {
  .card p {
    font-size: 14px;
    line-height: 1.5;
  }

  .loading-text {
    font-size: 14px;
    text-align: center;
    padding: 0 10px;
  }
}
</style>