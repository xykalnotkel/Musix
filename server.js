/**
 * server.js v2 — REST API Musix + Developer endpoints + YouTube (yt-dlp)
 *
 * ENDPOINTS API (data):
 *   GET  /api/health | /api/songs | /api/songs/random | /api/songs/:id
 *   GET  /api/categories | /api/artists | /api/story
 *
 * ENDPOINTS DEVELOPER:
 *   GET  /api/dev/status                  → status server, ffmpeg, yt-dlp
 *   POST /api/dev/upload                  → upload audio + metadata (multipart)
 *       fields: title, artist, category, badge | files: audio, cover
 *   GET  /api/dev/artists                 → daftar artis (dari lagu + custom)
 *   POST /api/dev/artists                 → tambah artis { name }
 *   GET  /api/yt/search?q=&n=             → cari lagu YouTube (yt-dlp)
 *   POST /api/yt/add                      → { url, title?, artist?, category?, badge? } download audio mp3 + thumbnail
 *
 * Web player & static tetap di root.
 */
const http = require("http")
const fs = require("fs")
const path = require("path")
const { execFile, execSync } = require("child_process")

const ROOT = __dirname
const PORT = process.env.PORT || 8080
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg"
const HAS_TOOLS = fs.existsSync(path.join(ROOT, "tools"))
const MANIFEST = path.join(ROOT, HAS_TOOLS ? "tools" : "", "lagu-dev.json")
const ARTISTS_FILE = path.join(ROOT, HAS_TOOLS ? "tools" : "", "artists.json")
const HAS_YTDLP = (() => { try { execSync("yt-dlp --version", { stdio: "pipe" }); return true } catch { return false } })()

// ── Dataset ──
let DB = { songs: [], categories: [], artists: [] }
function loadDB() {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "songs.json"), "utf8"))
    const songs = raw.songs || []
    const catCount = {}, artCount = {}
    songs.forEach((s) => {
      catCount[s.category] = (catCount[s.category] || 0) + 1
      artCount[s.artist] = (artCount[s.artist] || 0) + 1
    })
    const categories = Object.entries(catCount).map(([id, count]) => ({ id, name: (songs.find((x) => x.category === id) || {}).categoryName || id, count }))
    const artists = Object.entries(artCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    DB = { songs, categories, artists }
  } catch (e) { console.error("⚠️ songs.json:", e.message) }
}
loadDB()

// ── Helpers ──
const MIME = {
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".webm": "audio/webm", ".wav": "audio/wav", ".ogg": "audio/ogg",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
}
function json(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" })
  res.end(JSON.stringify(data))
}
function parseQuery(u) {
  const q = {}
  ;(u.split("?")[1] || "").split("&").forEach((p) => {
    if (!p) return
    const [k, v] = p.split("=")
    q[decodeURIComponent(k)] = decodeURIComponent(v || "")
  })
  return q
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// ── Body parsing ──
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", reject)
  })
}
function parseMultipart(buf, boundary) {
  const result = { fields: {}, files: [] }
  const parts = buf.toString("latin1").split("--" + boundary)
  for (const part of parts) {
    const idx = part.indexOf("\r\n\r\n")
    if (idx === -1) continue
    const head = part.slice(0, idx)
    const body = part.slice(idx + 4)
    const nameM = head.match(/name="([^"]+)"/)
    const fileM = head.match(/filename="([^"]*)"/)
    if (!nameM) continue
    const name = nameM[1]
    if (fileM && fileM[1]) {
      result.files.push({
        field: name,
        filename: fileM[1],
        contentType: (head.match(/Content-Type:\s*([^\r\n]+)/) || [])[1] || "application/octet-stream",
        data: Buffer.from(body, "latin1"),
      })
    } else {
      result.fields[name] = body.replace(/\r\n$/, "")
    }
  }
  return result
}

// ── Rebuild player setelah tambah lagu ──
function rebuildPlayer() {
  try {
    const cmd = HAS_TOOLS
      ? "node tools/build_player.js && node tools/build_api_data.js"
      : "node build_player.js"
    execSync(cmd, { cwd: ROOT, stdio: "pipe" })
    loadDB()
    return true
  } catch (e) { console.error("rebuild gagal:", e.message); return false }
}
function appendManifest(entry) {
  let arr = []
  try { arr = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) } catch {}
  arr.push(entry)
  fs.writeFileSync(MANIFEST, JSON.stringify(arr, null, 1))
}

// ── Serve file + Range ──
function serveFile(res, filePath, rangeHeader) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, { "Access-Control-Allow-Origin": "*" }); res.end("Not found"); return }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    const total = stat.size
    if (rangeHeader && /^bytes=/.test(rangeHeader)) {
      const m = rangeHeader.match(/bytes=(\d*)-(\d*)/)
      let start = m && m[1] !== "" ? parseInt(m[1], 10) : 0
      let end = m && m[2] !== "" ? parseInt(m[2], 10) : total - 1
      if (isNaN(start)) start = 0
      if (isNaN(end) || end >= total) end = total - 1
      if (start > end || start >= total) { res.writeHead(416, { "Content-Range": `bytes */${total}`, "Access-Control-Allow-Origin": "*" }); res.end(); return }
      res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": end - start + 1, "Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=86400" })
      fs.createReadStream(filePath, { start, end }).pipe(res)
    } else {
      res.writeHead(200, { "Content-Type": type, "Content-Length": total, "Accept-Ranges": "bytes", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=86400" })
      fs.createReadStream(filePath).pipe(res)
    }
  })
}

// ── YouTube (yt-dlp) ──
function ytSearch(q, n) {
  return new Promise((resolve) => {
    execFile("yt-dlp", ["--flat-playlist", "--print", "%(id)s|%(title)s|%(duration)s|%(channel)s", `ytsearch${n || 6}:${q}`], { timeout: 45000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err) return resolve({ ok: false, error: String(err.message || err).slice(0, 200) })
      const items = stdout.split("\n").filter(Boolean).map((line) => {
        const [id, title, dur, channel] = line.split("|")
        return { id, title, duration: parseInt(dur || "0", 10) || 0, channel, url: "https://www.youtube.com/watch?v=" + id }
      })
      resolve({ ok: true, items })
    })
  })
}

function ytDownload(url, outBase) {
  return new Promise((resolve) => {
    const args = ["-x", "--audio-format", "mp3", "--audio-quality", "7", "--no-playlist", "--no-warnings", "-o", outBase + ".%(ext)s", url]
    if (FFMPEG !== "ffmpeg") args.push("--ffmpeg-location", FFMPEG)
    execFile("yt-dlp", args, { timeout: 300000, maxBuffer: 8 * 1024 * 1024 }, (err) => {
      resolve({ ok: !err, error: err ? String(err.message || err).slice(0, 200) : "" })
    })
  })
}
function ytThumb(url, outFile) {
  return new Promise((resolve) => {
    execFile("yt-dlp", ["--skip-download", "--write-thumbnail", "--convert-thumbnails", "jpg", "-o", outFile.replace(/\.jpg$/, "") + ".%(ext)s", url], { timeout: 60000, maxBuffer: 4 * 1024 * 1024 }, () => resolve())
  })
}

// ── Story generator ──
const CAPTIONS = [
  (s) => `🎵 ${s.title} — ${s.artist}\nStory sound otomatis • ${s.categoryName}`,
  (s) => `Sound hari ini: ${s.title} 🎧\n${s.artist} • ${s.categoryName} #soundstory`,
  (s) => `💿 ${s.title} — ${s.artist}\nCocok buat story ${String(s.categoryName).toLowerCase()} kamu`,
  (s) => `Dengerin ${s.title} sambil scroll 🎶 #${s.category} #fyp #soundstory`,
  (s) => `~ ${s.title} ~\nby ${s.artist} • auto story`,
]
function makeStory(song) {
  const cap = pickRandom(CAPTIONS)(song)
  const extra = pickRandom([["storywa", "fyp"], ["musikviral", "tiktok"], ["lagu", "viral"]])
  return { song, story: { caption: cap, hashtags: [...new Set([song.category, "soundstory", ...extra])] } }
}

// ── Router ──
const server = http.createServer(async (req, res) => {
  const url = req.url || "/"
  const q = parseQuery(url)
  const pathname = decodeURIComponent(url.split("?")[0])

  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "*", "Access-Control-Max-Age": "86400" })
    res.end(); return
  }

  // ── API data ──
  if (pathname === "/api/health") return json(res, 200, { status: "ok", songs: DB.songs.length, categories: DB.categories.length, ytdlp: HAS_YTDLP, time: new Date().toISOString() })

  if (pathname === "/api/songs") {
    let list = [...DB.songs]
    if (q.category && q.category !== "semua") list = list.filter((s) => s.category === q.category)
    if (q.q) { const k = q.q.toLowerCase(); list = list.filter((s) => (s.title + " " + s.artist + " " + (s.badge || "")).toLowerCase().includes(k)) }
    if (q.sort === "random") list = [...list].sort(() => Math.random() - 0.5)
    const offset = parseInt(q.offset || "0", 10), limit = parseInt(q.limit || "50", 10)
    return json(res, 200, { count: list.length, limit, offset, songs: list.slice(offset, offset + limit) })
  }
  if (pathname === "/api/songs/random") {
    let pool = DB.songs
    if (q.category && q.category !== "semua") pool = pool.filter((s) => s.category === q.category)
    if (!pool.length) return json(res, 404, { error: "Tidak ada lagu" })
    return json(res, 200, pickRandom(pool))
  }
  if (pathname.startsWith("/api/songs/")) {
    const id = decodeURIComponent(pathname.split("/").pop())
    const s = DB.songs.find((x) => x.id === id || x.audio.includes(id))
    if (!s) return json(res, 404, { error: "Lagu tidak ditemukan" })
    return json(res, 200, s)
  }
  if (pathname === "/api/categories") return json(res, 200, { count: DB.categories.length, categories: DB.categories })
  if (pathname === "/api/artists") {
    const limit = parseInt(q.limit || "30", 10)
    return json(res, 200, { count: Math.min(DB.artists.length, limit), artists: DB.artists.slice(0, limit) })
  }
  if (pathname === "/api/story") {
    let pool = DB.songs
    if (q.category && q.category !== "semua") pool = pool.filter((s) => s.category === q.category)
    if (!pool.length) return json(res, 404, { error: "Kategori kosong" })
    return json(res, 200, makeStory(pickRandom(pool)))
  }

  // ── Developer: status ──
  if (pathname === "/api/dev/status") {
    return json(res, 200, {
      songs: DB.songs.length, categories: DB.categories.length, ytdlp: HAS_YTDLP,
      ffmpeg: FFMPEG, manifest: fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")).length : 0,
    })
  }

  // ── Developer: upload audio (multipart) ──
  if (pathname === "/api/dev/upload" && req.method === "POST") {
    try {
      const ctype = req.headers["content-type"] || ""
      const m = ctype.match(/boundary=(.+)$/)
      if (!m) return json(res, 400, { error: "Butuh multipart/form-data" })
      const buf = await readBody(req)
      const { fields, files } = parseMultipart(buf, m[1].replace(/^"|"$/g, ""))
      const title = (fields.title || "").trim()
      const artist = (fields.artist || "Unknown").trim()
      const category = (fields.category || "dev").trim()
      const badge = (fields.badge || "").trim()
      const audioFile = files.find((f) => f.field === "audio")
      if (!audioFile || audioFile.data.length < 1000) return json(res, 400, { error: "File audio kosong/terlalu kecil" })
      if (!title) return json(res, 400, { error: "Judul wajib diisi" })

      const ts = Date.now()
      const ext = path.extname(audioFile.filename).toLowerCase() || ".mp3"
      const audioName = `dev_${ts}${ext}`
      fs.writeFileSync(path.join(ROOT, "hasil", audioName), audioFile.data)

      // cover
      let coverPath = ""
      const covFile = files.find((f) => f.field === "cover")
      if (covFile && covFile.data.length > 500) {
        const cext = path.extname(covFile.filename).toLowerCase() || ".jpg"
        const cname = `dev_${ts}${cext}`
        fs.writeFileSync(path.join(ROOT, "hasil", "covers", cname), covFile.data)
        coverPath = `covers/${cname}`
      }

      const entry = {
        file: audioName, judul: title, artis: artist, cap: badge || "Upload Developer",
        views: 0, videoId: "dev_" + ts, dur: 0, cover: coverPath,
      }
      appendManifest(entry)
      const okRebuild = rebuildPlayer()
      return json(res, 201, { ok: true, entry, rebuilt: okRebuild, total: DB.songs.length })
    } catch (e) { return json(res, 500, { error: e.message }) }
  }

  // ── Developer: artists ──
  if (pathname === "/api/dev/artists") {
    if (req.method === "POST") {
      try {
        const body = JSON.parse((await readBody(req)).toString() || "{}")
        const name = (body.name || "").trim()
        if (!name) return json(res, 400, { error: "Nama artis wajib" })
        let arr = []
        try { arr = JSON.parse(fs.readFileSync(ARTISTS_FILE, "utf8")) } catch {}
        if (!arr.includes(name)) arr.push(name)
        fs.writeFileSync(ARTISTS_FILE, JSON.stringify(arr, null, 1))
        return json(res, 201, { ok: true, artists: arr })
      } catch (e) { return json(res, 500, { error: e.message }) }
    }
    let custom = []
    try { custom = JSON.parse(fs.readFileSync(ARTISTS_FILE, "utf8")) } catch {}
    const all = [...new Set([...DB.artists.map((a) => a.name), ...custom])]
    return json(res, 200, { count: all.length, artists: all })
  }

  // ── Developer: YouTube search ──
  if (pathname === "/api/yt/search" && req.method === "GET") {
    if (!HAS_YTDLP) return json(res, 500, { error: "yt-dlp tidak terpasang" })
    if (!q.q) return json(res, 400, { error: "Parameter q wajib" })
    const r = await ytSearch(q.q, parseInt(q.n || "6", 10))
    return json(res, r.ok ? 200 : 500, r.ok ? { count: r.items.length, items: r.items } : { error: r.error })
  }

  // ── Developer: tambah dari YouTube ──
  if (pathname === "/api/yt/add" && req.method === "POST") {
    try {
      const body = JSON.parse((await readBody(req)).toString() || "{}")
      if (!body.url) return json(res, 400, { error: "URL wajib" })
      const ts = Date.now()
      const outBase = path.join(ROOT, "hasil", `yt_${ts}`)
      const dl = await ytDownload(body.url, outBase)
      if (!dl.ok) return json(res, 500, { error: "Download gagal: " + dl.error })
      const mp3 = fs.existsSync(outBase + ".mp3") ? outBase + ".mp3" : null
      if (!mp3) return json(res, 500, { error: "File MP3 tidak dihasilkan" })

      // thumbnail
      let coverPath = ""
      try {
        const thBase = path.join(ROOT, "hasil", "covers", `yt_${ts}`)
        await ytThumb(body.url, thBase)
        for (const f of fs.readdirSync(path.join(ROOT, "hasil", "covers"))) {
          if (f.startsWith(`yt_${ts}`)) { coverPath = `covers/${f}`; break }
        }
      } catch {}

      const entry = {
        file: `yt_${ts}.mp3`, judul: body.title || `YouTube ${ts}`, artis: body.artist || "YouTube",
        cap: body.badge || "Dari YouTube", views: 0, videoId: "yt_" + ts, dur: 0, cover: coverPath,
      }
      appendManifest(entry)
      const okRebuild = rebuildPlayer()
      return json(res, 201, { ok: true, entry, rebuilt: okRebuild, total: DB.songs.length })
    } catch (e) { return json(res, 500, { error: e.message }) }
  }

  // ── Static ──
  if (pathname.startsWith("/hasil/")) {
    const filePath = path.normalize(path.join(ROOT, pathname))
    if (!filePath.startsWith(ROOT)) return json(res, 403, { error: "Forbidden" })
    return serveFile(res, filePath, req.headers.range)
  }
  if (pathname === "/" || pathname === "/index.html") return serveFile(res, path.join(ROOT, "index.html"), null)
  if (pathname === "/dev.html") return serveFile(res, path.join(ROOT, "dev.html"), null)
  if (pathname === "/styles.css") return serveFile(res, path.join(ROOT, "styles.css"), null)
  if (pathname === "/player.js") return serveFile(res, path.join(ROOT, "player.js"), null)
  if (pathname === "/songs.json") return serveFile(res, path.join(ROOT, "songs.json"), null)

  json(res, 404, { error: "Not found", hint: "Cek /api/health" })
})

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🎧 Musix API v2 → http://0.0.0.0:${PORT}`)
  console.log(`   yt-dlp: ${HAS_YTDLP ? "✅" : "❌"} | ffmpeg: ${FFMPEG}`)
})
