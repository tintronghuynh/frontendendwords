// Audio URLs for sound effects
const CELEBRATION_SOUND_URL = "https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3";
const ERROR_SOUND_URL = "https://assets.mixkit.co/sfx/preview/mixkit-negative-guitar-tone-2324.mp3";

// Preloaded audio elements for better performance
let celebrationAudio: HTMLAudioElement | null = null;
let errorAudio: HTMLAudioElement | null = null;

// Initialize audio elements
function initAudio() {
  if (typeof window !== 'undefined') {
    if (!celebrationAudio) {
      celebrationAudio = new Audio(CELEBRATION_SOUND_URL);
      celebrationAudio.volume = 0.5;
    }
    
    if (!errorAudio) {
      errorAudio = new Audio(ERROR_SOUND_URL);
      errorAudio.volume = 0.3;
    }
  }
}

// Play celebration sound
export function playCelebrationSound() {
  initAudio();
  if (celebrationAudio) {
    celebrationAudio.currentTime = 0;
    celebrationAudio.play().catch(err => {
      console.warn("Could not play celebration sound:", err);
    });
  }
}

// Play error sound
export function playErrorSound() {
  initAudio();
  if (errorAudio) {
    errorAudio.currentTime = 0;
    errorAudio.play().catch(err => {
      console.warn("Could not play error sound:", err);
    });
  }
}
