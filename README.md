# 🎧 Musix — TikTok Sound Player (Black & White)

Web player Spotify-style berisi **140 lagu sound trending TikTok Indonesia**:
Sasak, Lombok/Della Musik, Sound Kane, RMX, Kata-kata, Galau, Quotes, Preset AM, dll.

## 🚀 Deploy ke Netlify

**Cara 1 — Hubungkan ke GitHub (recommended):**
1. Buka https://app.netlify.com → **Add new site → Import an existing project**
2. Pilih GitHub → pilih repo **Musix**
3. Build command: **kosongkan** • Publish directory: **/** (root)
4. Klik **Deploy site** → selesai, dapat URL gratis `https://xxx.netlify.app`

**Cara 2 — Drag & drop:**
1. Buka https://app.netlify.com/drop
2. Tarik folder ini (yang berisi `index.html`) ke browser
3. Langsung online

> Setiap push ke GitHub otomatis redeploy (CI Netlify).

## 🗂️ Struktur
```
├── index.html      # struktur halaman (tanpa CSS inline)
├── styles.css      # semua styling (terpisah biar ringan)
├── player.js       # logika player (terpisah)
├── hasil/          # 140 MP3 + cover (dikompres 160px, loading lazy)
└── tools/          # script build & data manifest (buat regenerate)
```

## 🔧 Regenerate player
```bash
cd tools
node build_player.js   # baca manifest JSON → tulis index.html + styles.css baru
```

## 🔊 Audio
- **Local-first**: file MP3 di `hasil/` (same-origin → selalu bunyi + waveform jalan)
- Fallback otomatis ke URL remote (uguu.se) kalau file lokal gagal

## ⚠️ Catatan
- Sound diambil dari video TikTok (sumber: kreator masing-masing) — untuk keperluan pribadi.
- Library: `@tobyg74/tiktok-api-dl` (unofficial).

---

# 🧪 REST API (untuk Flutter / app apa pun)

Server Node.js **zero-dependency** yang melayani:
- **REST API** — lagu, kategori, artis, lagu acak, & **`/api/story`** (sound story otomatis: lagu + caption + hashtags)
- **Streaming audio** MP3 (HTTP Range → seek lancar di Flutter/just_audio)
- **Web player** (index.html) — satu server, dua fungsi

## Run lokal
```bash
node server.js            # → http://localhost:8080
```
## Deploy gratis
- **Render**: hubungkan repo ini → Render detect `render.yaml` → langsung jalan (`node server.js`)
- **Railway / VPS**: `npm start`

## Docs
- Endpoint lengkap: lihat komentar di `server.js`
- **Contoh Flutter (sound story otomatis): [`FLUTTER.md`](FLUTTER.md)**

---

# ☁️ Deploy ke CLOUDFLARE PAGES (GRATIS, TANPA KARTU KREDIT) ✅

Cloudflare Pages = hosting statis + **Functions (REST API)** — semua gratis, tanpa kartu kredit.

## Cara deploy (3 menit)
1. Buka **https://dash.cloudflare.com** → daftar (email + password saja, TANPA kartu kredit)
2. Menu kiri: **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Pilih repo **Musix** (authorize GitHub)
4. Build settings:
   - **Build command:** (kosongkan)
   - **Build output directory:** `/`
5. **Save and Deploy** → otomatis dapat URL `https://musix.pages.dev`

> Setiap push ke GitHub → auto redeploy. API Functions jalan otomatis dari folder `functions/`.

## 🧪 Endpoint API setelah deploy (Cloudflare)
| Endpoint | Fungsi |
|---|---|
| `https://musix.pages.dev/api/health` | Status server |
| `https://musix.pages.dev/api/songs?category=sasak&limit=20` | Daftar lagu (filter & pagination) |
| `https://musix.pages.dev/api/songs/random?category=kane` | 1 lagu acak |
| `https://musix.pages.dev/api/songs/:id` | Detail lagu |
| `https://musix.pages.dev/api/categories` | Kategori + jumlah |
| `https://musix.pages.dev/api/artists` | Artis + jumlah |
| `https://musix.pages.dev/api/story?category=` | **Sound story otomatis** (lagu+caption+hashtags) |
| `https://musix.pages.dev/hasil/xxx.mp3` | Streaming audio (CDN Cloudflare, support Range) |

CORS sudah dibuka (`*`) → langsung bisa dipanggil Flutter. Pakai di Flutter: `baseUrl = 'https://musix.pages.dev'`.

## 🎨 Cover dari Spotify / iTunes
- Cover original album (Satu Bulan, Runtuh, Niscaya, Semua Lagu Cinta, The Moon Represents My Heart, Last Summer, New Sun) sudah diambil dari **iTunes API (tanpa login)** → `tools/spotify_covers/`
- Mau ambil cover dari **Spotify** juga? Bikin app gratis di developer.spotify.com (pakai akun Spotify free, tanpa kartu kredit), lalu:
  ```bash
  SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node tools/fetch_spotify_covers.mjs
  ```
  (atau `node tools/fetch_spotify_covers.mjs --itunes` untuk mode tanpa login)

## 🖼️ Optimasi aset
- Semua cover sudah **WebP 160px** → total cuma 0.58MB (dari 8.9MB JPG = hemat 93%)
- `loading="lazy"` + `decoding="async"` di semua gambar

## 🎮 Fitur player terbaru
- **Halaman Player**: klik lagu → halaman penuh (cover abstrak dengan glow+ring berputar, waveform besar, progress, antrian, tombol **← Kembali**)
- **Floating player bar** (Apple Music style): rounded, blur, shadow — klik cover → buka halaman player

---

# 🆕 v6 — Visualizer Morphing + Developer Console + YouTube (yt-dlp)

## 🎨 Visualizer Morphing (3 gaya)
Tombol baru di player bar & halaman player (ikon 🔊) — klik buat ganti gaya:
1. **Bars** — bar gradien dengan lerp smoothing (morph halus antar frame)
2. **Morph** — gelombang cair bezier melingkar yang menari + titik tengah berdenyut
3. **Ring** — bar melingkar berputar
Pilihan tersimpan (localStorage). Pergerakan di-lerp 28% tiap frame → efek morphing yang cair, bukan lompat-lompat.

## 🧑💻 Developer Console (`/dev.html`)
Halaman dev dengan style hitam-putih:
- **Upload Audio** — pilih file audio + cover + metadata (judul/artis/kategori/badge) → langsung masuk player
- **Tambah Artis** — simpan ke `tools/artists.json`
- **Tambah dari YouTube** — cari lagu (yt-dlp) → klik ➕ → download MP3 + thumbnail → masuk player kategori **YouTube / Populer**
- **Quick chips** — "lagu viral 2026", "lagu sasak viral", "dj remix", dll
- Link "DEV CONSOLE" di sidebar player

## 📺 YouTube (yt-dlp)
| Endpoint | Fungsi |
|---|---|
| `GET /api/yt/search?q=&n=` | Cari lagu YouTube (judul, durasi, channel, url) |
| `POST /api/yt/add` | Download audio MP3 (via yt-dlp + ffmpeg) + thumbnail → masuk player |

## 🧑💻 Endpoint Developer
| Endpoint | Fungsi |
|---|---|
| `GET /api/dev/status` | Status server (yt-dlp, ffmpeg, jumlah lagu) |
| `POST /api/dev/upload` | Upload audio (multipart: audio, cover, title, artist, category, badge) |
| `GET/POST /api/dev/artists` | List / tambah artis |

## 🚀 Deploy (Cloudflare Pages)
> ⚠️ Catatan: upload & yt-dlp butuh **runtime Node** (VPS/Render/Railway). Cloudflare Pages statis jalan untuk player + API data; untuk upload & YouTube pakai **Render** (`render.yaml`) — gratis juga, tanpa kartu kredit. Render: buat Web Service → connect repo → `node server.js` → install yt-dlp/ffmpeg di build: 
> `buildCommand: pip install -q yt-dlp imageio-ffmpeg`
