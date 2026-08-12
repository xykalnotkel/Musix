/**
 * fetch_spotify_covers.mjs — ambil cover art lagu dari Spotify (gratis, tanpa kartu kredit)
 *
 * CARA DAPAT CLIENT ID/SECRET (2 menit, pakai akun Spotify free):
 *   1. Buka https://developer.spotify.com/dashboard → Login pakai akun Spotify kamu
 *   2. Create app (nama bebas) → salin Client ID & Client Secret
 *   3. Jalankan:  SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node fetch_spotify_covers.mjs
 *
 * ALTERNATIF TANPA LOGIN SAMA SEKALI:
 *   Script ini juga punya mode "itunes" — pakai iTunes Search API (tanpa auth):
 *   node fetch_spotify_covers.mjs --itunes
 *
 * Hasil: tools/spotify_covers.json — mapping judul lagu → URL cover besar (640x640)
 * Lalu rebuild: node build_player.js (secara manual merge ke covers-map)
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mode = process.argv.includes("--itunes") ? "itunes" : "spotify"

// Judul lagu yang mau dicari (yang berjudul lagu asli, bukan "original sound")
const TITLES = [
  "Satu Bulan Bernadya",
  "Runtuh Feby Putri Fiersa Besari",
  "Niscaya Bilal Indrajaya",
  "Semua Lagu Cinta Sal Priadi",
  "月亮代表我的心 Teresa Teng",
  "Proyek Gede Remixer Amburadul",
  "Buka Hatimu DJ Anggara",
  "GALAU PLAT JMK",
  "Last Summer Tele Music",
  "New Sun Chihei Hatakeyama",
  "Sedia Aku Sebelum Hujan Idgitaf",
  "Berakhir di Aku Idgitaf",
  "Loving You Sal Priadi",
]

async function spotifyToken(id, secret) {
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64"),
    },
    body: "grant_type=client_credentials",
  })
  const j = await r.json()
  if (!j.access_token) throw new Error("Token gagal: " + JSON.stringify(j))
  return j.access_token
}

async function itunesSearch(q) {
  const r = await fetch("https://itunes.apple.com/search?media=music&limit=3&term=" + encodeURIComponent(q))
  const j = await r.json()
  return j.results?.[0] || null
}

async function main() {
  const out = {}
  let ok = 0

  if (mode === "spotify") {
    const id = process.env.SPOTIFY_CLIENT_ID
    const secret = process.env.SPOTIFY_CLIENT_SECRET
    if (!id || !secret) {
      console.error("❌ Set dulu SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET (lihat header file ini).")
      console.error("   Atau pakai mode gratis tanpa login: node fetch_spotify_covers.mjs --itunes")
      process.exit(1)
    }
    const token = await spotifyToken(id, secret)
    for (const t of TITLES) {
      try {
        const r = await fetch("https://api.spotify.com/v1/search?type=track&limit=1&q=" + encodeURIComponent(t), {
          headers: { Authorization: "Bearer " + token },
        })
        const j = await r.json()
        const tr = j.tracks?.items?.[0]
        if (tr) {
          out[t] = tr.album.images?.[0]?.url || ""
          console.log("✅", t, "→", out[t].slice(0, 60))
          ok++
        } else console.log("—", t, "tidak ketemu")
      } catch (e) { console.log("✗", t, e.message) }
    }
  } else {
    console.log("🎵 Mode iTunes (tanpa login)...")
    for (const t of TITLES) {
      try {
        const res = await itunesSearch(t)
        if (res) {
          out[t] = res.artworkUrl100.replace("100x100", "600x600")
          console.log("✅", t, "→", out[t])
          ok++
        } else console.log("—", t, "tidak ketemu")
      } catch (e) { console.log("✗", t, e.message) }
    }
  }

  fs.writeFileSync(path.join(__dirname, "spotify_covers.json"), JSON.stringify(out, null, 2))
  console.log(`\nSelesai: ${ok}/${TITLES.length} → tools/spotify_covers.json`)
}

main()
