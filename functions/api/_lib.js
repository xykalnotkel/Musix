/**
 * Cloudflare Pages Functions — REST API Musix
 * (gratis, tanpa kartu kredit; deploy otomatis dari GitHub)
 *
 * Struktur:
 *   functions/api/health.js        → GET /api/health
 *   functions/api/songs.js         → GET /api/songs?category=&q=&limit=&offset=&sort=
 *   functions/api/songs/random.js  → GET /api/songs/random?category=
 *   functions/api/songs/[id].js    → GET /api/songs/:id
 *   functions/api/categories.js    → GET /api/categories
 *   functions/api/artists.js       → GET /api/artists?limit=
 *   functions/api/story.js         → GET /api/story?category=  (sound story otomatis)
 */
import data from "../../songs.json" with { type: "json" }

const songs = data.songs || []

export function cors(res) {
  res.headers.set("Access-Control-Allow-Origin", "*")
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "*")
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" },
  })
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export const CAPTIONS = [
  (s) => `🎵 ${s.title} — ${s.artist}\nStory sound otomatis • ${s.categoryName}`,
  (s) => `Sound hari ini: ${s.title} 🎧\n${s.artist} • ${s.categoryName} #soundstory`,
  (s) => `💿 ${s.title} — ${s.artist}\nCocok buat story ${String(s.categoryName).toLowerCase()} kamu`,
  (s) => `Dengerin ${s.title} sambil scroll 🎶 #${s.category} #fyp #soundstory`,
  (s) => `~ ${s.title} ~\nby ${s.artist} • auto story`,
]

export function makeStory(song) {
  const cap = pickRandom(CAPTIONS)(song)
  const extra = pickRandom([["storywa", "fyp"], ["musikviral", "tiktok"], ["lagu", "viral"]])
  const tags = [...new Set([song.category, "soundstory", ...extra])]
  return { song, story: { caption: cap, hashtags: tags } }
}

export { songs }
