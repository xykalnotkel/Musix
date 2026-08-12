/* ============================================================
   player.js v5 — TikTok Sounds Player
   - Halaman Player (now playing) dengan cover abstrak + waveform besar
   - Floating player bar
   - Icons: Lucide CDN (fallback inline)
   ============================================================ */

const SONGS = window.__SONGS || []
const CATS = window.__CATS || []

/* ─────────── STATE ─────────── */
let audio = new Audio()
let cur = -1
let shuffled = false
let repeat = false
let cat = "semua"
let query = ""
let view = "browse" // browse | artist | playlist | now
let viewArtist = ""
let viewPlaylist = ""
let prevView = { v: "browse", cat: "semua", artist: "", pl: "" }

/* ─────────── ICON ─────────── */
function refreshIcons() {
  if (window.lucide) { try { lucide.createIcons() } catch (e) {} }
}
function ic(name, size) {
  size = size || 16
  if (window.lucide) return '<i data-lucide="' + name + '" width="' + size + '" height="' + size + '"></i>'
  const F = {
    play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
    pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>',
    "music-2": '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    "list-music": '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  }
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (F[name] || F["music-2"]) + "</svg>"
}

/* ─────────── WAVEFORM MORPHING (3 gaya) ─────────── */
let actx = null
let analyser = null
let waveData = null
let rafId = null
let silentFrames = 0
let vizStyle = 0 // 0=bars 1=morph 2=ring
try { vizStyle = parseInt(localStorage.getItem("ts_viz") || "0", 10) || 0 } catch {}

// buffer lerp buat efek morph halus
const morphBuf = { w: {}, wp: {} }

function initAudioCtx() {
  if (actx) return
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    actx = new AC()
    const src = actx.createMediaElementSource(audio)
    analyser = actx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.8
    src.connect(analyser)
    analyser.connect(actx.destination)
    waveData = new Uint8Array(analyser.frequencyBinCount)
  } catch (e) { analyser = null }
}
function isLocalSrc() {
  return audio.src.indexOf("/hasil/") !== -1 || audio.src.indexOf("file://") === 0
}

function getVals(bars) {
  const vals = new Float32Array(bars)
  if (!analyser || !waveData) return vals
  analyser.getByteFrequencyData(waveData)
  let sum = 0
  for (let i = 0; i < bars; i++) {
    const idx = Math.floor(Math.pow(i / bars, 0.85) * (waveData.length * 0.7))
    vals[i] = (waveData[idx] / 255)
    sum += vals[i]
  }
  if (sum < 0.01) {
    silentFrames++
    if (silentFrames > 50) {
      ;["wave", "wavePage"].forEach((id) => { const el = document.getElementById(id); if (el) el.style.display = "none" })
      stopWave()
    }
  } else silentFrames = 0
  return vals
}

// lerp → efek morph (pergerakan halus antar frame)
function smooth(id, vals, factor) {
  const buf = morphBuf[id] || (morphBuf[id] = new Float32Array(vals.length))
  for (let i = 0; i < vals.length; i++) {
    buf[i] += (vals[i] - buf[i]) * factor
  }
  return buf
}

function drawWave(canvas, bars, big) {
  if (!canvas) return
  const c = canvas.getContext("2d")
  const W = canvas.width, H = canvas.height
  c.clearRect(0, 0, W, H)
  const raw = getVals(bars)
  const v = smooth(canvas.id, raw, 0.28) // morph smoothing

  if (vizStyle === 1) {
    // ── MORPH: gelombang cair (bezier) ──
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) / 2 - 8
    c.beginPath()
    const N = v.length
    for (let i = 0; i <= N; i++) {
      const k = i / N
      const ang = Math.PI * 2 * k - Math.PI / 2
      const r = R * (0.35 + 0.65 * v[i % N])
      const x = cx + Math.cos(ang) * r
      const y = cy + Math.sin(ang) * r
      if (i === 0) c.moveTo(x, y)
      else {
        const pk = (i - 0.5) / N
        const pang = Math.PI * 2 * pk - Math.PI / 2
        const pr = R * (0.35 + 0.65 * v[(i - 1) % N])
        const px = cx + Math.cos(pang) * pr
        const py = cy + Math.sin(pang) * pr
        c.quadraticCurveTo(px, py, x, y)
      }
    }
    c.closePath()
    const g = c.createRadialGradient(cx, cy, 4, cx, cy, R + 10)
    g.addColorStop(0, "rgba(255,255,255,.95)")
    g.addColorStop(0.6, "rgba(255,255,255,.5)")
    g.addColorStop(1, "rgba(255,255,255,.12)")
    c.fillStyle = g
    c.fill()
    c.strokeStyle = "rgba(255,255,255,.7)"
    c.lineWidth = big ? 2.5 : 1.5
    c.stroke()
    // titik tengah berdenyut
    const pulse = 6 + v[0] * 14
    c.beginPath(); c.arc(cx, cy, pulse, 0, Math.PI * 2)
    c.fillStyle = "rgba(255,255,255,.9)"; c.fill()
    return
  }

  if (vizStyle === 2) {
    // ── RING: bar melingkar ──
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) / 2 - 10
    const N = v.length
    const gap = Math.PI * 2 / N
    for (let i = 0; i < N; i++) {
      const ang = i * gap - Math.PI / 2
      const h = Math.max(2, v[i] * (big ? 34 : 18))
      const x0 = cx + Math.cos(ang) * R
      const y0 = cy + Math.sin(ang) * R
      const x1 = cx + Math.cos(ang) * (R + h)
      const y1 = cy + Math.sin(ang) * (R + h)
      c.strokeStyle = i % 3 === 0 ? "#ffffff" : "#8a8a8a"
      c.lineWidth = big ? 2.6 : 1.8
      c.lineCap = "round"
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke()
    }
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2)
    c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 1; c.stroke()
    return
  }

  // ── BARS: morphing bars (lerp + cap membulat + gradien) ──
  const gap = 2
  const bw = (W - gap * (bars - 1)) / bars
  const g2 = c.createLinearGradient(0, 0, 0, H)
  g2.addColorStop(0, "#ffffff")
  g2.addColorStop(0.6, "#cfcfcf")
  g2.addColorStop(1, "#777777")
  for (let i = 0; i < bars; i++) {
    const h = Math.max(2, v[i] * (H - 6))
    const x = i * (bw + gap)
    const y = (H - h) / 2
    c.fillStyle = g2
    c.beginPath()
    if (c.roundRect) c.roundRect(x, y, bw, h, Math.min(bw / 2, h / 2)); else c.rect(x, y, bw, h)
    c.fill()
  }
}

function waveLoop() {
  drawWave(document.getElementById("wave"), 56, false)
  drawWave(document.getElementById("wavePage"), 96, true)
  rafId = requestAnimationFrame(waveLoop)
}
function stopWave() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
}
function updateWaveMode() {
  ;["wave", "wavePage"].forEach((id) => { const el = document.getElementById(id); if (el) el.style.display = "block" })
  initAudioCtx()
  if (analyser && !rafId) { silentFrames = 0; waveLoop() }
}
function cycleViz() {
  vizStyle = (vizStyle + 1) % 3
  try { localStorage.setItem("ts_viz", String(vizStyle)) } catch {}
  const names = ["Bars", "Morph", "Ring"]
  const btn = document.getElementById("btnViz")
  if (btn) btn.title = "Visualizer: " + names[vizStyle]
  updateWaveMode()
}

/* ─────────── ABSTRAK COVER (warna dari hash id) ─────────── */
function hashHue(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return h
}
function setNowArt(s) {
  const art = document.getElementById("npArt")
  const glow = document.getElementById("npGlow")
  const fallback = document.getElementById("npFallback")
  if (s.cv) {
    art.innerHTML = '<img class="cimg" src="' + s.cv + '" alt="" loading="lazy" decoding="async">'
    fallback.style.display = "none"
  } else {
    const h1 = hashHue(s.id || s.t)
    const h2 = (h1 + 50) % 360
    art.style.background = "linear-gradient(135deg, hsl(" + h1 + ",70%,55%), hsl(" + h2 + ",75%,35%))"
    art.innerHTML = ""
    fallback.style.display = "block"
  }
  // glow mengikuti hue → abstrak
  const h1 = hashHue((s.cv ? "cover" : "abst") + (s.id || s.t))
  glow.style.background = "radial-gradient(circle, hsl(" + h1 + ",85%,60%) 0%, hsl(" + ((h1 + 70) % 360) + ",80%,45%) 45%, transparent 70%)"
}

/* ─────────── PLAYBACK ─────────── */
function startPlay() {
  const p = audio.play()
  if (p && typeof p.then === "function") {
    p.catch(() => {
      audio.addEventListener("canplay", () => { audio.play().catch(() => {}) }, { once: true })
    })
  }
}
function setSrcUrl(u) {
  audio.pause()
  audio.removeAttribute("crossorigin")
  audio.src = u
  audio.load()
}
function playIdx(i) {
  const s = SONGS[i]
  if (!s) return
  cur = i
  setSrcUrl(s.p) // local-first
  updateWaveMode()
  if (actx && actx.state === "suspended") actx.resume().catch(() => {})
  startPlay()
  updateNowUI(s)
  renderGrid()
}
// fallback lokal gagal → remote
audio.addEventListener("error", () => {
  const s = SONGS[cur]
  if (!s) return
  const isLocal = !audio.src || audio.src.indexOf("/hasil/") !== -1
  if (isLocal && s.u) {
    setSrcUrl(s.u)
    updateWaveMode()
    startPlay()
    document.getElementById("npArtist").textContent = s.a + " • remote"
    document.getElementById("npArtist2").textContent = s.a + " • remote"
  } else {
    document.getElementById("npTitle").textContent = "⚠️ Gagal diputar"
    document.getElementById("npTitle2").textContent = "⚠️ Gagal diputar"
  }
})

function updateNowUI(s) {
  // player bar
  document.getElementById("npTitle").textContent = s.t
  document.getElementById("npArtist").textContent = s.a
  document.getElementById("npCover").innerHTML = s.cv
    ? '<img class="cimg" src="' + s.cv + '" alt="" loading="lazy" decoding="async">'
    : ic("music-2", 22)
  // halaman player
  document.getElementById("npTitle2").textContent = s.t
  document.getElementById("npArtist2").textContent = s.a
  const k = CATS.find((x) => x.id === s.c)
  document.getElementById("npCat").textContent = (k ? k.nama : s.c).toUpperCase()
  document.getElementById("npDur2").textContent = s.du ? "⏱ " + fmtDur(s.du) : ""
  document.getElementById("npBadge2").textContent = s.b || ""
  setNowArt(s)
  refreshIcons()
}

function togPlay() {
  if (cur < 0) {
    const l = daftarTampil()
    if (l.length) { playIdx(l[0].i); if (view === "browse" || view === "artist" || view === "playlist") openNowPage() }
    return
  }
  if (audio.paused) {
    if (actx && actx.state === "suspended") actx.resume().catch(() => {})
    audio.play().catch(() => {})
  } else audio.pause()
}
function nextSong() {
  const l = daftarTampil()
  if (!l.length) return
  let j = l.findIndex((s) => s.i === cur)
  if (shuffled) j = Math.floor(Math.random() * l.length)
  else j = (j + 1) % l.length
  playIdx(l[j].i)
}
function prevSong() {
  const l = daftarTampil()
  if (!l.length) return
  let j = l.findIndex((s) => s.i === cur)
  if (audio.currentTime > 3) { audio.currentTime = 0; return }
  j = (j - 1 + l.length) % l.length
  playIdx(l[j].i)
}
function togShuffle() {
  shuffled = !shuffled
  ;["btnShuffle", "btnShuffle3"].forEach((id) => document.getElementById(id).classList.toggle("on", shuffled))
}
function togRepeat() {
  repeat = !repeat
  ;["btnRepeat", "btnRepeat3"].forEach((id) => document.getElementById(id).classList.toggle("on", repeat))
}
function seekFrom(e, id) {
  const r = document.getElementById(id).getBoundingClientRect()
  const p = (e.clientX - r.left) / r.width
  if (audio.duration) audio.currentTime = p * audio.duration
}
function dlNow() {
  const s = SONGS[cur]
  if (!s) return
  const a = document.createElement("a")
  a.href = s.u || s.p
  a.download = s.t.replace(/[^\w\s-]/g, "").trim() + ".mp3"
  document.body.appendChild(a); a.click(); a.remove()
}

/* ─────────── AUDIO EVENTS ─────────── */
audio.addEventListener("play", () => {
  ;["btnPlay", "btnPlay3"].forEach((id) => { document.getElementById(id).innerHTML = ic("pause", id === "btnPlay3" ? 28 : 18) })
  document.getElementById("npRing").classList.remove("paused")
  refreshIcons()
  renderGrid()
})
audio.addEventListener("pause", () => {
  ;["btnPlay", "btnPlay3"].forEach((id) => { document.getElementById(id).innerHTML = ic("play", id === "btnPlay3" ? 28 : 18) })
  document.getElementById("npRing").classList.add("paused")
  refreshIcons()
  renderGrid()
})
audio.addEventListener("ended", () => {
  if (repeat) { audio.currentTime = 0; audio.play().catch(() => {}) }
  else nextSong()
})
audio.addEventListener("timeupdate", () => {
  const t = audio.currentTime, d = audio.duration || 0
  const tc = fmt(t), td = fmt(d)
  ;["tCur", "tCur2", "tCur3"].forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = tc })
  ;["tDur", "tDur2", "tDur3"].forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = td })
  const p = d ? (t / d) * 100 : 0
  ;["fill", "fillBig", "fillPage"].forEach((id) => { const el = document.getElementById(id); if (el) el.style.width = p + "%" })
  ;["dot", "dotBig", "dotPage"].forEach((id) => { const el = document.getElementById(id); if (el) el.style.left = p + "%" })
})

/* ─────────── RENDER ─────────── */
function daftarTampil() {
  if (view === "artist") {
    return SONGS.filter((s) => s.a === viewArtist && (!query || (s.t + " " + s.a).toLowerCase().includes(query.toLowerCase())))
  }
  if (view === "playlist") {
    const pl = getPlaylist(viewPlaylist)
    if (!pl) return []
    return pl.items.map((i) => SONGS[i]).filter(Boolean)
  }
  const q = query.toLowerCase()
  return SONGS.filter((s) => (cat === "semua" || s.c === cat) && (!q || (s.t + " " + s.a).toLowerCase().includes(q)))
}

function renderGrid() {
  // toggle browse vs now page
  const isNow = view === "now"
  document.getElementById("browse").classList.toggle("hidden", isNow)
  document.getElementById("nowPage").classList.toggle("hidden", !isNow)

  const list = daftarTampil()
  document.querySelectorAll(".card").forEach((c) => {
    const s = SONGS[+c.dataset.idx]
    const show = list.includes(s)
    c.style.display = show ? "" : "none"
    c.classList.toggle("playing", cur === s.i && !audio.paused)
  })
  const n = list.length
  const st = document.getElementById("stats")
  if (st) st.innerHTML = n + " lagu"
  const emp = document.getElementById("empty")
  if (emp) emp.classList.toggle("hidden", n > 0)

  const hTitle = document.getElementById("hero-title")
  const hSub = document.getElementById("hero-sub")
  const banner = document.getElementById("banner")
  if (!isNow && hTitle) {
    if (view === "artist") {
      hTitle.textContent = viewArtist
      hSub.textContent = n + " lagu dari artis ini"
      if (banner) banner.style.display = "none"
    } else if (view === "playlist") {
      const pl = getPlaylist(viewPlaylist)
      hTitle.textContent = pl ? pl.name : "Playlist"
      hSub.textContent = n + " lagu"
      if (banner) banner.style.display = "none"
    } else {
      const k = CATS.find((x) => x.id === cat)
      hTitle.textContent = k ? k.nama : "Semua Lagu"
      hSub.textContent = "Sound trending TikTok Indonesia — " + n + " lagu tersedia"
      if (banner) banner.style.display = "block"
    }
  }
  // nav active
  document.querySelectorAll(".nav-item").forEach((n2) => {
    n2.classList.toggle("active", view !== "now" && view !== "artist" && view !== "playlist" && n2.dataset.cat === cat)
  })
  document.querySelectorAll(".pl-item").forEach((p) => {
    p.classList.toggle("active", view === "playlist" && p.dataset.pl === viewPlaylist)
  })
}

function renderArtistSidebar() {
  const counts = {}
  SONGS.forEach((s) => { counts[s.a] = (counts[s.a] || 0) + 1 })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 14)
  document.getElementById("artistList").innerHTML = top
    .map(([n, c]) =>
      '<button class="nav-item" onclick="pilihArtist(\'' + escAttr(n) + '\')"><span class="art-dot">' + (n || "?").charAt(0).toUpperCase() + '</span><span class="nav-nama">' + esc(n) + '</span><span class="nav-cnt">' + c + "</span></button>"
    )
    .join("")
  refreshIcons()
}

/* ─────────── NAVIGASI ─────────── */
function savePrev() { prevView = { v: view, cat, artist: viewArtist, pl: viewPlaylist } }
function pilihArtist(nama) {
  savePrev(); view = "artist"; viewArtist = nama; viewPlaylist = ""
  renderGrid(); document.querySelector(".content").scrollTop = 0
}
function pilihKategori(id) {
  savePrev(); view = "browse"; cat = id; viewArtist = ""; viewPlaylist = ""
  renderGrid(); document.querySelector(".content").scrollTop = 0
}
function cari() { query = document.getElementById("q").value; renderGrid() }
function mainClick(e, i) {
  if (e.target.closest(".dlbtn") || e.target.closest(".addbtn") || e.target.closest(".ca")) return
  playIdx(i)
  openNowPage()
}
function openNowPage() {
  if (cur < 0) return
  savePrev()
  view = "now"
  renderQueue()
  renderGrid()
  document.querySelector(".content").scrollTop = 0
}
function backBrowse() {
  view = prevView.v
  cat = prevView.cat
  viewArtist = prevView.artist
  viewPlaylist = prevView.pl
  renderGrid()
  document.querySelector(".content").scrollTop = 0
}
function goHome() { pilihKategori("semua") }

function renderQueue() {
  const l = daftarTampil()
  const box = document.getElementById("npQueue")
  if (!box) return
  box.innerHTML = l.slice(0, 30)
    .map((s, k) =>
      '<div class="np-qitem' + (s.i === cur ? " active" : "") + '" onclick="playIdx(' + s.i + ')"><span class="qnum">' + (k + 1) + '</span><span class="qname">' + esc(s.t) + '</span><span class="qart">' + esc(s.a) + "</span></div>"
    )
    .join("")
  refreshIcons()
}

/* ─────────── PLAYLIST ─────────── */
function getPlaylists() {
  try { return JSON.parse(localStorage.getItem("ts_playlists") || "[]") } catch { return [] }
}
function savePlaylists(pls) { localStorage.setItem("ts_playlists", JSON.stringify(pls)); renderPlaylistSidebar() }
function getPlaylist(name) { return getPlaylists().find((p) => p.name === name) }
function renderPlaylistSidebar() {
  const pls = getPlaylists()
  document.getElementById("plList").innerHTML = pls.length
    ? pls.map((p) =>
        '<button class="nav-item pl-item" data-pl="' + escAttr(p.name) + '" onclick="bukaPlaylist(\'' + escAttr(p.name) + '\')">' +
        ic("list-music", 16) + '<span class="nav-nama">' + esc(p.name) + '</span><span class="nav-cnt">' + p.items.length + "</span></button>"
      ).join("")
    : '<div class="side-hint">Belum ada playlist.<br>Klik ➕ buat bikin.</div>'
  refreshIcons()
}
function buatPlaylist() {
  const nama = prompt("Nama playlist baru:")
  if (!nama) return
  const pls = getPlaylists()
  if (pls.find((p) => p.name === nama)) { alert("Playlist udah ada!"); return }
  pls.push({ name: nama, items: [] })
  savePlaylists(pls)
}
function addToPlaylist(i) {
  const pls = getPlaylists()
  if (pls.length === 0) { buatPlaylist(); return }
  const nama = prompt("Masuk ke playlist mana?\n" + pls.map((p, k) => k + 1 + ". " + p.name).join("\n") + "\n\nKetik nomornya, atau nama baru:")
  if (!nama) return
  const num = parseInt(nama, 10)
  let pl
  if (!isNaN(num) && num >= 1 && num <= pls.length) pl = pls[num - 1]
  else { pl = { name: nama.trim(), items: [] }; pls.push(pl) }
  if (!pl.items.includes(i)) pl.items.push(i)
  savePlaylists(pls)
  alert('✅ Masuk ke playlist "' + pl.name + '"')
}
function bukaPlaylist(nama) {
  savePrev(); view = "playlist"; viewPlaylist = nama; viewArtist = ""
  renderGrid(); document.querySelector(".content").scrollTop = 0
}

/* ─────────── UTIL ─────────── */
function fmt(sec) {
  if (!isFinite(sec)) return "0:00"
  sec = Math.floor(sec)
  return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0")
}
function fmtDur(d) {
  if (!d) return ""
  d = Math.round(d)
  return Math.floor(d / 60) + ":" + String(d % 60).padStart(2, "0")
}
function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
function escAttr(s) {
  return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

/* ─────────── KEYBOARD ─────────── */
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.target.closest("input")) { e.preventDefault(); togPlay() }
  if (e.code === "ArrowRight" && e.shiftKey) nextSong()
  if (e.code === "ArrowLeft" && e.shiftKey) prevSong()
  if (e.code === "Escape" && view === "now") backBrowse()
})

/* ─────────── INIT ─────────── */
renderPlaylistSidebar()
renderArtistSidebar()
renderGrid()
refreshIcons()
