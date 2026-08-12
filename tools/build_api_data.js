/**
 * build_api_data.js — generate songs.json (dataset API) dari index.html (single source of truth)
 * Jalankan: node build_api_data.js   →  songs.json
 */
const fs = require("fs")
const path = require("path")

const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8")
const m = html.match(/window\.__SONGS = (\[.*?\]);\nwindow\.__CATS = (\[.*?\]);/s)
if (!m) { console.error("Gagal parse index.html"); process.exit(1) }

const songs = JSON.parse(m[1])
const cats = JSON.parse(m[2])

const CAT_NAME = {}
cats.forEach((c) => { CAT_NAME[c.id] = c.nama })

const clean = songs.map((s) => {
  const file = s.p.replace(/^hasil\//, "")
  let id = file.replace(/\.mp3$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
  // kalau filename diakhiri angka (videoId), pakai itu sebagai id numerik
  const vid = (file.match(/(\d{10,})$/) || [])[1]
  return {
    id: vid || id,
    title: s.t,
    artist: s.a,
    category: s.c,
    categoryName: CAT_NAME[s.c] || s.c,
    badge: s.b || "",
    duration: s.du || 0,
    cover: s.cv || "",
    audio: s.p,
    audioRemote: s.u || "",
  }
})

const out = {
  generated: new Date().toISOString().slice(0, 10),
  count: clean.length,
  songs: clean,
}

fs.writeFileSync(path.join(__dirname, "../songs.json"), JSON.stringify(out, null, 1))
console.log("✅ songs.json —", clean.length, "lagu")
