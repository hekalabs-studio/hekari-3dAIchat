// ──────────────────────────────────────────────
// Emotion Parser - Extracts emotion and roleplay from AI text
// ──────────────────────────────────────────────

/**
 * Standard emotions supported across 3D models:
 * - 'joy': Happy, smiling, laughing, cheerful
 * - 'blush': Shy, flattered, flustered, sweet
 * - 'angry': Pouty, tsundere annoyance, irritated
 * - 'sorrow': Sad, apologetic, worried, sympathetic
 * - 'surprised': Shocked, wide-eyed, gasping
 * - 'thinking': Pondering, curious, inquisitive
 * - 'neutral': Default resting expression
 */

const EMOTION_KEYWORDS = {
  joy: [
    "senyum", "tersenyum", "tawa", "tertawa", "senang", "gembira", "ceria",
    "lucu", "bahagia", "hehe", "haha", "yay", "suka", "love", "smile", "laugh",
    "happy", "joy", "giggle", "bip-boop", "bip boop"
  ],
  blush: [
    "malu", "tersipu", "merona", "pipi", "b-bukan", "gengsi", "blush", "shy",
    "flustered", "manja", "sayang", "peluk"
  ],
  angry: [
    "marah", "kesal", "cemberut", "ngambek", "pout", "sebal", "benci",
    "angry", "mad", "annoyed", "grr", "humpf"
  ],
  sorrow: [
    "sedih", "menangis", "kecewa", "maaf", "kasihan", "murung", "hiks",
    "sad", "cry", "sorry", "gloomy", "sigh", "menghela"
  ],
  surprised: [
    "kaget", "terkejut", "wah", "astaga", "eh", "woah", "wow", "surprised",
    "shock", "gasp", "apa?!"
  ],
  thinking: [
    "pikir", "berpikir", "bingung", "hmm", "penasaran", "mungkin", "thinking",
    "wonder", "curious"
  ]
};

/**
 * Parse the emotion and actions from message text.
 * @param {string} text - Raw AI message text
 * @returns {{ emotion: string, actionText: string, cleanDialogue: string }}
 */
export function parseEmotion(text) {
  if (!text || typeof text !== "string") {
    return { emotion: "neutral", actionText: "", cleanDialogue: "" };
  }

  // 1. Check for explicit bracket tag like [happy], [joy], [angry], [blush], etc.
  const bracketMatch = text.match(/\[(joy|happy|smile|blush|shy|angry|pout|sad|sorrow|surprised|thinking|neutral)\]/i);
  let detectedEmotion = null;

  if (bracketMatch) {
    const rawTag = bracketMatch[1].toLowerCase();
    if (rawTag === "happy" || rawTag === "smile") detectedEmotion = "joy";
    else if (rawTag === "shy") detectedEmotion = "blush";
    else if (rawTag === "pout") detectedEmotion = "angry";
    else if (rawTag === "sad") detectedEmotion = "sorrow";
    else detectedEmotion = rawTag;
  }

  // 2. Extract roleplay actions between asterisks (*...*)
  const actionMatches = [...text.matchAll(/\*([^*]+)\*/g)].map(m => m[1].trim());
  const actionText = actionMatches.length > 0 ? actionMatches[0] : "";

  // 3. If no explicit tag, analyze action text and content for keywords
  if (!detectedEmotion) {
    const searchTarget = (actionText + " " + text.slice(0, 120)).toLowerCase();

    for (const [emotionKey, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      if (keywords.some(k => searchTarget.includes(k))) {
        detectedEmotion = emotionKey;
        break;
      }
    }
  }

  // Clean dialogue without bracket tags and asterisks
  const cleanDialogue = text
    .replace(/\[(joy|happy|smile|blush|shy|angry|pout|sad|sorrow|surprised|thinking|neutral)\]/gi, "")
    .replace(/\*[^*]*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    emotion: detectedEmotion || "neutral",
    actionText,
    cleanDialogue: cleanDialogue || text.replace(/\[.*?\]/g, "").trim()
  };
}
