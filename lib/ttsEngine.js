// ──────────────────────────────────────────────
// TTS Engine - Text-to-Speech + Pseudo-Viseme Lip Sync
// ──────────────────────────────────────────────
// Uses Web Speech API for audio and cycles through vowel shapes
// (aa, ih, ou, ee, oh) with randomized timing for natural mouth movement.

const VOWEL_SEQUENCE = ["aa", "ee", "ih", "oh", "ou"];

class TTSEngine {
  constructor() {
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.onVisemeUpdate = null;   // (weights) => void
    this.onSpeakStart = null;    // () => void
    this.onSpeakEnd = null;      // () => void
    this.animationFrameId = null;
    this.vowelIndex = 0;
    this.lastVowelSwitch = 0;
    this.vowelSwitchInterval = 120;
  }

  /** Initialize - must be called after a user gesture. */
  init() {
    if (typeof window === "undefined") return;
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }

  /**
   * Speak text and drive lip-sync animation.
   * @param {string} text
   * @param {Object} options
   */
  speak(text, options = {}) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("[TTS] Speech synthesis not available");
      return;
    }

    this.stop();

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // Clean text for speech: omit roleplay action asterisks (*actions*) for natural dialogue audio
    let spokenText = text.replace(/\*[^*]*\*/g, "").trim();
    if (!spokenText) {
      spokenText = text.replace(/\*/g, "").trim();
    }
    if (!spokenText) return;

    const isMale = options.gender === "male";
    const defaultPitch = isMale ? 0.88 : 1.15;
    const defaultRate = isMale ? 0.98 : 1.02;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = options.rate || defaultRate;
    utterance.pitch = options.pitch !== undefined ? options.pitch : defaultPitch;
    utterance.volume = options.volume !== undefined ? options.volume : 1;

    // Pick a natural voice matching gender and language
    const voices = window.speechSynthesis.getVoices();
    if (options.voiceURI) {
      const preferred = voices.find((v) => v.voiceURI === options.voiceURI);
      if (preferred) utterance.voice = preferred;
    } else {
      let matchedVoice = null;
      if (isMale) {
        matchedVoice =
          voices.find(
            (v) =>
              (v.lang.startsWith("id") || v.lang.startsWith("in")) &&
              (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("pria"))
          ) ||
          voices.find(
            (v) =>
              v.name.toLowerCase().includes("david") ||
              v.name.toLowerCase().includes("george") ||
              v.name.toLowerCase().includes("guy") ||
              v.name.toLowerCase().includes("mark") ||
              (v.name.toLowerCase().includes("male") && !v.name.toLowerCase().includes("female"))
          );
      } else {
        matchedVoice =
          voices.find(
            (v) =>
              (v.lang.startsWith("id") || v.lang.startsWith("in")) &&
              (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("wanita") || v.name.includes("Google"))
          ) ||
          voices.find(
            (v) =>
              v.name.toLowerCase().includes("zira") ||
              v.name.toLowerCase().includes("samantha") ||
              v.name.toLowerCase().includes("jenny") ||
              v.name.toLowerCase().includes("female")
          );
      }

      const fallback =
        voices.find((v) => v.lang.startsWith("id") || v.lang.startsWith("in")) ||
        voices[0];

      utterance.voice = matchedVoice || fallback;
    }

    this.currentUtterance = utterance;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.vowelIndex = 0;
      this.lastVowelSwitch = performance.now();
      this.onSpeakStart?.();
      this._startLipSyncAnimation();
    };

    utterance.onend = () => {
      this._stopLipSyncAnimation();
      this.isSpeaking = false;
      this.onSpeakEnd?.();
    };

    utterance.onerror = (event) => {
      if (event.error !== "canceled") {
        console.error("[TTS] Speech error:", event.error);
      }
      this._stopLipSyncAnimation();
      this.isSpeaking = false;
      this.onSpeakEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  /** Stop any ongoing speech. */
  stop() {
    if (typeof window === "undefined") return;
    this._stopLipSyncAnimation();
    window.speechSynthesis?.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  /** Animate lip-sync by cycling through vowel shapes. */
  _startLipSyncAnimation() {
    const animate = (timestamp) => {
      if (!this.isSpeaking) return;

      if (timestamp - this.lastVowelSwitch > this.vowelSwitchInterval) {
        this.vowelIndex = (this.vowelIndex + 1) % VOWEL_SEQUENCE.length;
        this.lastVowelSwitch = timestamp;
        this.vowelSwitchInterval = 80 + Math.random() * 100;
      }

      const weights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
      const activeVowel = VOWEL_SEQUENCE[this.vowelIndex];
      weights[activeVowel] = 0.4 + Math.random() * 0.5;

      // Blend adjacent vowel for smoother transitions
      const prevIndex = (this.vowelIndex - 1 + VOWEL_SEQUENCE.length) % VOWEL_SEQUENCE.length;
      weights[VOWEL_SEQUENCE[prevIndex]] = Math.random() * 0.15;

      this.onVisemeUpdate?.(weights);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /** Stop animation and close mouth. */
  _stopLipSyncAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onVisemeUpdate?.({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 });
  }

  /** @returns {SpeechSynthesisVoice[]} */
  getVoices() {
    if (typeof window === "undefined") return [];
    return window.speechSynthesis?.getVoices() || [];
  }
}

// Singleton
let ttsInstance = null;

/** @returns {TTSEngine} */
export function getTTSEngine() {
  if (!ttsInstance) {
    ttsInstance = new TTSEngine();
  }
  return ttsInstance;
}

export default TTSEngine;
