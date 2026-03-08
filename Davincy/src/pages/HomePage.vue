<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import IndonesianFlag from "../components/IndonesianFlag.vue"

const flags = [
  { country: "Poland", code: "pl", size: "tiny" }, // Indonesia emphasized
  { country: "USA", code: "us" },
  { country: "UK", code: "gb" },
  { country: "France", code: "fr" },
  { country: "Germany", code: "de" },
  { country: "Italy", code: "it" },
  { country: "Spain", code: "es" },
  { country: "Japan", code: "jp" },
  { country: "Australia", code: "au" },
  { country: "Brazil", code: "br" },
  { country: "Canada", code: "ca" },
  { country: "South Africa", code: "za" },
  { country: "Serbia", code: "rs" }
]

// ============================================
// ADJUSTABLE DIMENSIONS - MODIFY THESE VALUES
// ============================================

// Main ring size - increase for larger ring (was 600)
const size = 700 // <-- ADJUST: Main container size (increase for larger ring)

// Ring radii - adjust for thicker/thinner ring
const outerRadius = 320 // <-- ADJUST: Outer ring radius (was 260)
const innerRadius = 220 // <-- ADJUST: Inner ring radius (was 180)

// Logo size - adjust for larger/smaller center logo
const logoSize = 260 // <-- ADJUST: Logo wrapper size (was 200)
const logoImageSize = 450 // <-- ADJUST: Actual logo image size (was 140)

// Flag pattern size - adjust for larger/smaller flags
const patternSize = 160 // <-- ADJUST: Base flag pattern size (was 140)
const indonesiaScale = 1.4 // <-- ADJUST: Indonesia flag scale multiplier (was 1.3)

// Animation speeds
const pulseSpeed = 4 // <-- ADJUST: Ring pulse animation speed in seconds
const rotateSpeed = 20 // <-- ADJUST: Logo ring rotation speed in seconds

// ============================================
// PHYSICS-BASED SPINNING STATE
// ============================================
const rotationAngle = ref(0)
const currentSpeed = ref(30) // Current speed in seconds per rotation
let animationFrame: number | null = null
let lastTimestamp: number | null = null

// Physics constants - adjust these to change the feel
const CLICK_BOOST = 50 // How much speed increases per click (lower = faster)
const MAX_SPEED = 0.3 // Fastest possible rotation (seconds per rotation)
const FRICTION = 0.99   // Friction coefficient (0.98 = slow decay)
const MIN_SPEED = 30 // Default/minimum speed (seconds per rotation)

// Start the spinning animation with physics
const startSpinning = () => {
  const animate = (timestamp: number) => {
    if (lastTimestamp === null) {
      lastTimestamp = timestamp
    }
    
    // Calculate time difference in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000
    
    // Apply physics: gradually return to min speed using friction
    if (currentSpeed.value < MIN_SPEED) {
      // Speed up (lower number = faster rotation)
      currentSpeed.value = Math.min(
        MIN_SPEED,
        currentSpeed.value + (MIN_SPEED - currentSpeed.value) * (1 - FRICTION) * deltaTime * 10
      )
    } else if (currentSpeed.value > MIN_SPEED) {
      // Slow down (higher number = slower rotation)
      currentSpeed.value = Math.max(
        MIN_SPEED,
        currentSpeed.value - (currentSpeed.value - MIN_SPEED) * (1 - FRICTION) * deltaTime * 10
      )
    }
    
    // Calculate velocity from current speed (convert seconds per rotation to degrees per second)
    const angularVelocity = 360 / currentSpeed.value
    
    // Update rotation angle
    rotationAngle.value += angularVelocity * deltaTime
    rotationAngle.value = rotationAngle.value % 360
    
    lastTimestamp = timestamp
    animationFrame = requestAnimationFrame(animate)
  }
  
  animationFrame = requestAnimationFrame(animate)
}

// Stop the spinning animation
const stopSpinning = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
    lastTimestamp = null
  }
}

// Handle click on wheel to increase speed
const handleWheelClick = (event: MouseEvent) => {
  // Prevent click from propagating if clicking on logo or other elements
  const target = event.target as HTMLElement
  if (target.closest('.logo-wrapper')) {
    return // Don't boost if clicking on center logo
  }
  
  // Boost the speed (lower number = faster)
  currentSpeed.value = Math.max(
    MAX_SPEED,
    currentSpeed.value - CLICK_BOOST
  )
  
  // Optional: Add haptic feedback if on mobile
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(20) // Short vibration on click
  }
  
  // Optional: Add visual feedback
  const ring = document.querySelector('.flag-ring')
  ring?.classList.add('ring-clicked')
  setTimeout(() => {
    ring?.classList.remove('ring-clicked')
  }, 200)
}

// Lifecycle hooks
onMounted(() => {
  startSpinning()
})

onBeforeUnmount(() => {
  stopSpinning()
})

// ============================================
// CALCULATED DIMENSIONS (don't modify unless needed)
// ============================================

const center = size / 2

// Calculate angles in radians
const totalSegments = flags.length
const baseAnglePerSegment = (2 * Math.PI) / totalSegments

// Adjust Indonesia's segment to be larger
function getSegmentSize(index: number) {
  if (flags[index]?.country === "Indonesia") {
    return baseAnglePerSegment * 1 // 50% larger for Indonesia
  }
  return baseAnglePerSegment
}

function getStartAngle(index: number) {
  let angle = 0
  for (let i = 0; i < index; i++) {
    angle += getSegmentSize(i)
  }
  return angle
}

// Helper function to convert polar to cartesian coordinates (using radians)
function polarToCartesian(radius: number, angle: number) {
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle)
  }
}

// Create arc path for flag segments - now accounting for rotation
function createSegmentPath(index: number): string {
  const startAngle = getStartAngle(index) + (rotationAngle.value * Math.PI / 180)
  const segmentSize = getSegmentSize(index)
  const endAngle = startAngle + segmentSize

  const outerStart = polarToCartesian(outerRadius, startAngle)
  const outerEnd = polarToCartesian(outerRadius, endAngle)

  const innerStart = polarToCartesian(innerRadius, startAngle)
  const innerEnd = polarToCartesian(innerRadius, endAngle)

  const largeArc = segmentSize > Math.PI ? 1 : 0

  return `
    M ${outerStart.x} ${outerStart.y}
    A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
    Z
  `
}

// Calculate pattern transform for flag placement - now accounting for rotation
function getPatternTransform(index: number) {
  const startAngle = getStartAngle(index) + (rotationAngle.value * Math.PI / 180)
  const segmentSize = getSegmentSize(index)
  const midAngle = startAngle + segmentSize / 2
  
  // Calculate position at midpoint between inner and outer radius
  const radius = (outerRadius + innerRadius) / 2
  const pos = polarToCartesian(radius, midAngle)
  
  // Convert to degrees for rotation
  const deg = (midAngle * 180) / Math.PI
  
  // Adjust for Indonesia to make it larger/more prominent
  if (flags[index]?.country === "Indonesia") {
    const scale = indonesiaScale
    return `
      translate(${pos.x - (patternSize * scale)/2}, ${pos.y - (patternSize * scale)/2})
      rotate(${deg}, ${(patternSize * scale)/2}, ${(patternSize * scale)/2})
      scale(${scale})
    `
  }
  
  return `
    translate(${pos.x - patternSize/2}, ${pos.y - patternSize/2})
    rotate(${deg}, ${patternSize/2}, ${patternSize/2})
  `
}

// Get pattern size for Indonesia
function getPatternSize(index: number) {
  return flags[index]?.country === "Indonesia" ? patternSize * indonesiaScale : patternSize
}
</script>

<template>
  <IndonesianFlag />
  <main class="home">

    <!-- HERO SECTION WITH RING -->
    <section class="hero">
      
      <!-- Title - Now above the wheel -->
      <h1 class="title">DAVINCY</h1>

      <h2 class="subtitle">
        (Defence Attaché Wine Community)
      </h2>
      
      <!-- Flag Ring with Logo in Center -->
      <div class="ring-container" :style="{ width: size + 'px', height: size + 'px' }">
        
        <svg
          :width="size"
          :height="size"
          :viewBox="`0 0 ${size} ${size}`"
          class="flag-ring"
          :style="{ animationDuration: pulseSpeed + 's' }"
          @click="handleWheelClick"
        >
          <defs>
            <template v-for="(flag, index) in flags" :key="index">
              <pattern
                :id="`flag-pattern-${index}`"
                patternUnits="userSpaceOnUse"
                :width="getPatternSize(index)"
                :height="getPatternSize(index)"
                :patternTransform="getPatternTransform(index)"
              >
                <image
                  :href="`https://flagcdn.com/w640/${flag.code}.png`"
                  :width="getPatternSize(index)"
                  :height="getPatternSize(index)"
                  preserveAspectRatio="xMidYMid slice"
                  :transform="`rotate(90, ${getPatternSize(index)/2}, ${getPatternSize(index)/2})`"
                  class="flag-image"
                  :class="{ 'flag-image-large': flag.country === 'Indonesia' }"
                />
              </pattern>
              
              <!-- Gradient for Indonesia's segment highlight -->
              <linearGradient 
                v-if="flag.country === 'Indonesia'" 
                :id="`gradient-${index}`" 
                x1="0%" 
                y1="0%" 
                x2="100%" 
                y2="100%"
              >
                <stop offset="0%" stop-color="rgba(255,215,0,0.3)" />
                <stop offset="100%" stop-color="rgba(255,215,0,0)" />
              </linearGradient>
            </template>
          </defs>

          <!-- Background ring (dashed) - Stationary -->
          <circle
            :cx="center"
            :cy="center"
            :r="outerRadius"
            fill="none"
            stroke="rgba(245,210,122,0.3)"
            stroke-width="2"
            stroke-dasharray="5,5"
          />
          
          <circle
            :cx="center"
            :cy="center"
            :r="innerRadius"
            fill="none"
            stroke="rgba(245,210,122,0.3)"
            stroke-width="2"
            stroke-dasharray="5,5"
          />

          <!-- Flag segments with proper pattern fills - These will spin -->
          <template v-for="(flag, index) in flags" :key="index">
            <path
              :d="createSegmentPath(index)"
              :fill="`url(#flag-pattern-${index})`"
              stroke="white"
              :stroke-width="size > 600 ? 4 : 3"
              stroke-opacity="0.3"
            />
            <!-- ADJUST: Border width around segments - modify the values 4 and 3 above -->
            
            <!-- Highlight for Indonesia's segment -->
            <path
              v-if="flag.country === 'Indonesia'"
              :d="createSegmentPath(index)"
              :fill="`url(#gradient-${index})`"
              opacity="0.3"
              stroke="none"
            />
          </template>

          <!-- Inner decorative ring - Stationary -->
          <!-- ADJUST: Gap from inner ring to logo - modify the value 8 below -->
          <!-- ADJUST: Decorative ring thickness - modify the values 4 and 3 below -->
          <circle
            :cx="center"
            :cy="center"
            :r="innerRadius - 8"
            fill="none"
            stroke="#f5d27a"
            :stroke-width="size > 600 ? 4 : 3"
            
          />

          <!-- Outer decorative ring - Stationary -->
          <!-- ADJUST: Outer ring extension - modify the value 8 below -->
          <!-- ADJUST: Outer ring thickness - modify the values 3 and 2 below -->
          <circle
            :cx="center"
            :cy="center"
            :r="outerRadius + 8"
            fill="none"
            stroke="#f5d27a"
            :stroke-width="size > 600 ? 3 : 2"
            opacity="0.5"
          />

          <!-- Radial lines for decoration - Stationary -->
          <line
            v-for="i in 12"
            :key="i"
            :x1="center"
            :y1="center"
            :x2="center + outerRadius * Math.cos((i * 30 - 90) * Math.PI / 180)"
            :y2="center + outerRadius * Math.sin((i * 30 - 90) * Math.PI / 180)"
            stroke="rgba(245,210,122,0.1)"
            stroke-width="1"
          />
        </svg>

        <!-- CENTER LOGO with ceremonial background - Stationary -->
        <div class="logo-wrapper" :style="{ width: logoSize + 'px', height: logoSize + 'px' }">
          <div class="logo-background" :style="{ width: logoSize - 20 + 'px', height: logoSize - 20 + 'px' }"></div>
          <img 
            src="/DavincyLogo.png" 
            alt="Davincy Logo" 
            class="center-logo" 
            :style="{ width: logoImageSize + 'px', height: logoImageSize + 'px' }"
          />
          <div class="logo-ring" :style="{ width: logoSize + 20 + 'px', height: logoSize + 20 + 'px', animationDuration: rotateSpeed + 's' }"></div>
        </div>

      </div>

      <!-- Description - Now below the wheel -->
      <p class="description">
        Davincy is dedicated to strengthening partnerships among defence
        attachés and fostering new international friendships through shared
        culture, dialogue, and community engagement. Our organization brings
        together professionals in an atmosphere of mutual respect,
        cooperation, and tradition — building lasting connections that
        transcend borders.
      </p>

    </section>

    <!-- BOTTOM CEREMONIAL IMAGE -->
    <section class="bottom-image-section">
      <img
        src="/military_cooperation.png"
        alt="International Defence Cooperation"
        class="bottom-image"
      />
    </section>

  </main>
</template>

<style scoped>

/* =========================
   PAGE BACKGROUND
========================= */

.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  background:
    radial-gradient(circle at top,
      rgba(10, 35, 70, 0.95),
      rgba(5, 15, 30, 1)
    );

  color: white;
  text-align: center;

  padding-top: 20px;
  overflow-x: hidden;
  -webkit-tap-highlight-color: transparent;
}


/* =========================
   HERO SECTION
========================= */

.hero {
  width: 100%;
  max-width: 1100px;

  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 12px;   /* controls spacing between ALL hero elements */

  
}


/* =========================
   RING CONTAINER
========================= */

.ring-container {
  position: relative;
  position: relative;
  line-height: 0;
  
}

.flag-ring {
  filter: drop-shadow(0 10px 30px rgba(0,0,0,0.5));
  animation: gentlePulse v-bind(pulseSpeed + 's') ease-in-out infinite;
  cursor: pointer;
  transition: filter 0.2s ease;
}

.flag-ring.ring-clicked {
  filter: drop-shadow(0 0 20px rgba(245,210,122,0.8));
}

/* Optional: Add a subtle pulse on click */
@keyframes clickPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.ring-clicked {
  animation: clickPulse 0.2s ease;
}

@keyframes gentlePulse {
  0%, 100% { filter: drop-shadow(0 10px 30px rgba(0,0,0,0.5)); }
  50% { filter: drop-shadow(0 15px 40px rgba(245,210,122,0.3)); }
}

.flag-image {
  transition: all 0.3s ease;
  opacity: 0.9;
}

.flag-image:hover {
  opacity: 1;
  transform: scale(1.05);
}

.flag-image-large {
  filter: drop-shadow(0 0 15px rgba(255,215,0,0.5));
}


/* =========================
   CENTER LOGO
========================= */

.logo-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* Prevents clicks from being blocked by logo */
}

.logo-background {
  position: absolute;
  background: rgba(10,35,70,0.7);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  border: 3px solid #f5d27a;
  box-shadow: 0 0 30px rgba(245,210,122,0.3);
}

.logo-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px dashed rgba(245,210,122,0.3);
  animation: rotate v-bind(rotateSpeed + 's') linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.center-logo {
  position: relative;
  object-fit: contain;
  filter: drop-shadow(0 10px 25px rgba(0,0,0,0.6));
  transition: transform 0.3s ease;
  z-index: 2;
}

.center-logo:hover {
  transform: scale(1.08);
}


/* =========================
   TITLES
========================= */

.title {
  font-size: 5rem;
  letter-spacing: 6px;
  font-weight: 700;
  font-family: "Cinzel", serif;

  color: #f5d27a;

  text-shadow:
    0 0 12px rgba(245,210,122,0.4),
    0 4px 18px rgba(0,0,0,0.7);

  margin: 0;
}

.subtitle {
  font-size: 1.2rem;
  margin: 0;
  color: #d6e3ff;
  letter-spacing: 1px;
}


/* =========================
   DESCRIPTION
========================= */

.description {
  width: 91%;
  max-width: 720px;

  line-height: 1.8;
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: 0.3px;

  color: rgba(255, 255, 255, 0.9);

  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05) 0%, 
    rgba(245, 210, 122, 0.03) 100%
  );
  backdrop-filter: blur(8px);

  padding: 32px 40px;
  padding-bottom: 100px;
  border-radius: 24px;

  border: 1px solid rgba(245, 210, 122, 0.2);
  border-bottom: 2px solid rgba(245, 210, 122, 0.3);

  box-shadow: 
    0 20px 40px -10px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(245, 210, 122, 0.1) inset;

  position: relative;
  overflow: hidden;
}

/* Subtle decorative elements */
.description::before {
  content: '✯✯✯';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(245, 210, 122, 0.3), 
    rgba(245, 210, 122, 0.5), 
    rgba(245, 210, 122, 0.3), 
    transparent
  );
}
.description:hover::before {
  color: rgba(245, 210, 122, 0.9); /* golden */
  transform: scale(1.05);
}

.description::after {
  content: "🗺";
  position: absolute;

  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);

  font-size: 6rem;
  font-family: Georgia, serif;

  color: rgba(245, 210, 122, 0.12);
  line-height: 1;

  pointer-events: none;
  transition: color 0.3s ease, transform 0.3s ease;
}

/* Hover effect for the map */
.description:hover::after {
  color: rgba(245, 210, 122, 0.9); /* golden */
  transform: translateX(-50%) scale(1.05);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .description {
    font-size: 1rem;
    padding: 24px 28px;
    padding-bottom: 50px;
    border-radius: 20px;
  }
  
  .description::after {
    font-size: 4rem;
    bottom: -9px;
    
  }
}

@media (max-width: 480px) {
  .description {
    padding: 20px 24px;
    padding-bottom: 50px;
    line-height: 1.7;
  }
}

/* Optional: Add a subtle hover effect */
.description:hover {
  border-color: rgba(245, 210, 122, 0.3);
  box-shadow: 
    0 25px 45px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(245, 210, 122, 0.15) inset;
  transform: translateY(-2px);
  transition: all 0.3s ease;
}


/* =========================
   BOTTOM IMAGE
========================= */
.bottom-image-section {
  width: 100%;
  overflow: hidden;
  margin-top: 60px; /* Increased margin for better separation */


  border-top: 1px solid rgba(255,255,255,0.1); /* Clean visual separation line */
}

.bottom-image {
  width: 100%;
  
  height: 480px; /* Better proportion for desktop */
  object-fit: cover;
  object-position: center ;

  opacity: 0.9;

  filter:
    contrast(1.05)
    saturate(1.1);

  transition: transform 0.6s ease;
}

.bottom-image:hover {
  transform: scale(1.03);
}

/* =========================
   MOBILE
========================= */

@media (max-width: 768px) {
  .hero {
    gap: 8px;
  }

  .title {
    font-size: 3.4rem;
    letter-spacing: 3px;
    margin-bottom: 5px;
  }

  .subtitle {
    font-size: 1rem;
    margin-bottom: 5px;
  }


   .center-logo {
    transform: scale(0.7);
  }
  
  .ring-container {
    transform: none;
    width: 500px !important; /* Increased from 400px */
    height: 500px !important; /* Increased from 400px */
    margin: 10px auto;
  }  

  .bottom-image {
    height: 260px; /* Better proportion for mobile */
  }
}

@media (max-width: 480px) {
  .ring-container {
    width: 380px !important; /* Increased from 300px */
    height: 380px !important; /* Increased from 300px */
  }
}

/* Optional: Add a breakpoint for very small phones */
@media (max-width: 400px) {
  .ring-container {
    margin: 10px auto;
    transform: none;  
    width: 320px !important;
    height: 320px !important;
  }
  
  .logo-wrapper {
    transform: translate(-50%, -50%) scale(0.7);
  }

}

</style>