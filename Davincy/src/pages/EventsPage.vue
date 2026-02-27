<template>
  <div class="events-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <h1 class="page-title">Meeting Events</h1>
      <p class="page-subtitle">Thank you for being with us!</p>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading events...</p>
    </div>

    <!-- Events List -->
    <section v-else class="events-list">
      <input 
        type="text" 
        v-model="searchQuery" 
        class="search-bar" 
        placeholder="Search events by title or organizer..."
        @input="filterEvents"
      />

      <div 
        v-for="event in filteredEvents" 
        :key="event.id" 
        class="event-card"
      >
        <!-- Event Title - Top -->
        <h2 class="event-title">{{ event.title }}</h2>

        <!-- Gallery Section -->
        <div class="gallery-section" v-if="event.gallery && event.gallery.length > 0">
          <!-- Main Large Image -->
          <div class="main-image-container">
            <img 
              :src="getImageUrl(selectedImages[event.id] || event.gallery[0])" 
              :alt="event.title"
              class="main-image"
            />
          </div>

          <!-- Thumbnails Strip -->
          <div class="thumbnails-strip">
            <img 
              v-for="(image, index) in event.gallery" 
              :key="index"
              :src="getImageUrl(image)"
              :alt="`${event.title} thumbnail ${index + 1}`"
              class="thumbnail"
              :class="{ 'active': (selectedImages[event.id] || event.gallery[0]) === image }"
              @click="selectImage(event.id, image)"
            />
          </div>
        </div>

        <!-- No Image Placeholder -->
        <div class="gallery-section no-image" v-else>
          <div class="main-image-container">
            <div class="no-image-placeholder">
              <span>📅</span>
            </div>
          </div>
        </div>

        <!-- Description Box (always under images) -->
        <div class="description-box">
          <p class="description-text">{{ event.description || 'No description available' }}</p>
        </div>

        <!-- Footer with Organizer and Date -->
        <div class="event-footer">
          <span class="organizer">👥 {{ event.organizer }}</span>
          <span class="date">📅 {{ formatDate(event.event_date) }}</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredEvents.length === 0" class="empty-state">
        <p>✨ No events found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Check back later for upcoming events</p>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default {
  name: 'EventsPage',
  
  setup() {
    const events = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const filteredEvents = ref([]);
    const selectedImages = reactive({});

    // Fetch events from database
    const fetchEvents = async () => {
      try {
        loading.value = true;
        
        const { data, error } = await supabase
          .from('meeting_events')
          .select('id, title, description, event_date, gallery, organizer')
          .order('event_date', { ascending: true });

        if (error) throw error;
        
        events.value = data || [];
        
        // Initialize selected images for each event
        events.value.forEach(event => {
          if (event.gallery && event.gallery.length > 0) {
            selectedImages[event.id] = event.gallery[0];
          }
        });
        
        filterEvents();
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        loading.value = false;
      }
    };

    // Filter events based on search query (title and organizer only)
    const filterEvents = () => {
      if (!searchQuery.value.trim()) {
        filteredEvents.value = events.value;
        return;
      }

      const query = searchQuery.value.toLowerCase().trim();
      filteredEvents.value = events.value.filter(event => {
        return (
          event.title.toLowerCase().includes(query) ||
          event.organizer.toLowerCase().includes(query)
        );
      });
    };

    // Format date to dd/mm/yyyy
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Get image URL from Supabase storage
    const getImageUrl = (imagePath) => {
      if (!imagePath) return '';
      
      const { data } = supabase
        .storage
        .from('event-images')
        .getPublicUrl(imagePath);
      
      return data.publicUrl;
    };

    // Select image for an event
    const selectImage = (eventId, imagePath) => {
      selectedImages[eventId] = imagePath;
    };

    // Lifecycle hooks
    onMounted(() => {
      fetchEvents();
    });

    return {
      events,
      loading,
      searchQuery,
      filteredEvents,
      selectedImages,
      formatDate,
      getImageUrl,
      selectImage,
      filterEvents
    };
  }
};
</script>

<style scoped>
/* =========================
   CSS VARIABLES - EVENT COLORS
========================= */
.events-page {
  --branch-navy: #0a2342;
  --branch-airforce: #87CEEB;
  --branch-marines: #ffffff;
  --branch-field-force: #4a5d23;
  --branch-default: #2c3e50;
  
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
  font-family: "Cinzel", serif;
  letter-spacing: 6px;
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
   FILTER SECTION
========================= */
.filter-section {
  max-width: 1400px;
  margin: 0 auto 30px;
  padding: 0 25px;
}

.search-bar {
  width: 100%;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(245, 210, 122, 0.3);
  border-radius: 12px;
  color: var(--text-light);
  font-size: 1rem;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.search-bar::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-bar:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 15px rgba(245, 210, 122, 0.3);
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
   EVENTS LIST
========================= */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 20px 25px 50px;
  max-width: 1200px;
  margin: 0 auto;
}

/* =========================
   EVENT CARD
========================= */
.event-card {
  border-radius: 20px;
  padding: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px var(--shadow-color);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  background: rgba(255, 255, 255, 0.05);
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(245, 210, 122, 0.3);
  background: rgba(255, 255, 255, 0.08);
}

/* =========================
   EVENT TITLE
========================= */
.event-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 25px;
  font-family: "Cinzel", serif;
  color: var(--gold);
  letter-spacing: 1px;
  border-bottom: 2px solid rgba(245, 210, 122, 0.3);
  padding-bottom: 15px;
  line-height: 1.3;
}

/* =========================
   GALLERY SECTION
========================= */
.gallery-section {
  margin-bottom: 25px;
}

.main-image-container {
  width: 100%;
  height: 400px;
  border-radius: 16px;
  overflow: hidden;
  border: 3px solid var(--gold);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
  margin-bottom: 15px;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
}

.main-image:hover {
  transform: scale(1.02);
}

.thumbnails-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 5px 0 10px;
  scrollbar-width: thin;
  scrollbar-color: var(--gold) rgba(255, 255, 255, 0.1);
}

.thumbnails-strip::-webkit-scrollbar {
  height: 6px;
}

.thumbnails-strip::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.thumbnails-strip::-webkit-scrollbar-thumb {
  background: var(--gold);
  border-radius: 3px;
}

.thumbnail {
  flex: 0 0 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid transparent;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
}

.thumbnail:hover {
  transform: translateY(-2px);
  border-color: var(--gold);
}

.thumbnail.active {
  border-color: var(--gold);
  box-shadow: 0 0 15px rgba(245, 210, 122, 0.5);
}

/* No image placeholder */
.gallery-section.no-image .main-image-container {
  border: 3px dashed var(--gold);
  height: 200px;
}

.no-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2c3e50, #1a2a3a);
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-image-placeholder span {
  font-size: 5rem;
  opacity: 0.7;
}

/* =========================
   DESCRIPTION BOX
========================= */
.description-box {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid rgba(245, 210, 122, 0.2);
  backdrop-filter: blur(4px);
  margin-bottom: 25px;
  min-height: 120px;
  max-height: 200px;
  overflow-y: auto;
}

.description-text {
  font-size: 1.05rem;
  line-height: 1.7;
  color: #d6e3ff;
  margin: 0;
  white-space: pre-wrap;
}

/* Scrollbar styling */
.description-box::-webkit-scrollbar {
  width: 8px;
}

.description-box::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.description-box::-webkit-scrollbar-thumb {
  background: var(--gold);
  border-radius: 4px;
}

/* =========================
   EVENT FOOTER
========================= */
.event-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid rgba(245, 210, 122, 0.2);
  font-size: 0.95rem;
  opacity: 0.8;
}

.organizer {
  color: #d6e3ff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.date {
  color: #d6e3ff;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* =========================
   EMPTY STATE
========================= */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  backdrop-filter: blur(5px);
  color: #d6e3ff;
  font-size: 1.2rem;
}

.empty-state p:first-child {
  font-size: 2rem;
  margin-bottom: 15px;
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

  .events-list {
    padding: 15px 15px 30px;
    gap: 25px;
  }

  .event-card {
    padding: 20px;
  }

  .event-title {
    font-size: 1.6rem;
    margin-bottom: 20px;
  }

  .main-image-container {
    height: 300px;
  }

  .thumbnail {
    flex: 0 0 70px;
    height: 50px;
  }

  .description-box {
    padding: 20px;
    min-height: 100px;
    max-height: 180px;
  }

  .description-text {
    font-size: 0.95rem;
  }
  
  .event-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .date {
    align-self: flex-end;
  }
}

/* Small phones */
@media (max-width: 480px) {
  .page-title {
    font-size: 2rem;
  }

  .event-title {
    font-size: 1.4rem;
  }
  
  .main-image-container {
    height: 250px;
  }
  
  .thumbnail {
    flex: 0 0 60px;
    height: 45px;
  }
  
  .description-box {
    padding: 15px;
    min-height: 80px;
    max-height: 150px;
  }
  
  .description-text {
    font-size: 0.9rem;
    line-height: 1.5;
  }
  
  .no-image-placeholder span {
    font-size: 3rem;
  }
}

/* High contrast / accessibility */
@media (prefers-contrast: high) {
  .event-card {
    border: 2px solid var(--gold);
  }
  
  .thumbnail.active {
    border: 3px solid var(--gold);
  }
  
  .main-image-container {
    border: 3px solid var(--gold);
  }
}
</style>