/**
 * build_player.js v5 — generate index.html
 * - Halaman Player ("now playing") saat klik lagu: cover abstrak, waveform besar, queue, tombol kembali
 * - Player bar floating (Apple Music style)
 * - Cover WebP (ringan)
 * Jalankan: node build_player.js
 */
const fs = require("fs")
const path = require("path")

const DIR = path.join(__dirname, "hasil")

const LAGU = [
  { file: "kata-kata-galau_Satu_Bulan.mp3", judul: "Satu Bulan", artis: "Bernadya", cat: "galau", badge: "Lagu Asli" },
  { file: "kata-kata-galau_original_sound_-_fiersabesari.mp3", judul: "Runtuh (Live)", artis: "Feby Putri ft. Fiersa Besari", cat: "galau", badge: "Live" },
  { file: "kata-kata-galau_original_sound_-_musikstoryid.mp3", judul: "Runtuh (Story WA)", artis: "Musik.Story.Id", cat: "galau", badge: "Story" },
  { file: "kata-kata-motivasi_original_sound_-_adenn481.mp3", judul: "Kata-Kata Motivasi 2026", artis: "adenn481", cat: "motivasi", badge: "2026" },
  { file: "katakata-kece_Proyek_Gede.mp3", judul: "Proyek Gede", artis: "Remixer Amburadul", cat: "kece", badge: "Remix Viral" },
  { file: "katakata-kece_original_sound_-_devanogantengea.mp3", judul: "Kata-Kata Kece", artis: "Devano!?", cat: "kece", badge: "JJ" },
  { file: "presetam-kece_original_sound_-_vall_prisetxml.mp3", judul: "JJ Seram Kece Softspoken", artis: "Vallz [XG]", cat: "presetam", badge: "53K likes" },
  { file: "presetam-kece_original_sound_-_znlmjd3.mp3", judul: "Preset AM Kece", artis: "zinul", cat: "presetam", badge: "AM" },
  { file: "presetam-kece_original_sound_-_elangprastyoptro_.mp3", judul: "Preset AM 16:9", artis: "langg", cat: "presetam", badge: "AM" },
  { file: "presetam-kece_original_sound_-_yuningsihaam698.mp3", judul: "Preset AM", artis: "yun_whangshu", cat: "presetam", badge: "AM" },
  { file: "quotes_original_sound_-_yurapejeje.mp3", judul: "Sound Quotes", artis: "Yurap", cat: "quotes", badge: "Quotes" },
  { file: "sesi-potre_Semua_lagu_cinta.mp3", judul: "Semua Lagu Cinta", artis: "Sal Priadi", cat: "potre", badge: "Lagu Asli" },
  { file: "sesi-potre_Teresa_Teng_Moon_Represents_My_Heart.mp3", judul: "The Moon Represents My Heart", artis: "Teresa Teng", cat: "potre", badge: "Klasik" },
  { file: "sound-kece_original_sound_-_toyapreset.mp3", judul: "DJ Karera No Tochi", artis: "Toya preset", cat: "kane", badge: "Jedag-jedug" },
  { file: "sound-kece_original_sound_-_guracreator.mp3", judul: "JJ Karera No Tochi", artis: "Gura", cat: "kane", badge: "Jedag-jedug" },
  { file: "audio_original_sound_-_prstmanzy.mp3", judul: "Sound Kane (Preset Kane)", artis: "prstmankids", cat: "kane", badge: "Kane" },
  { file: "audio_original_sound_-_prstanyaa_.mp3", judul: "Soft Spoken Kane", artis: "AnyaKyoken", cat: "kane", badge: "Kane" },
  { file: "trending-tiktok_Niscaya.mp3", judul: "Niscaya", artis: "Bilal Indrajaya", cat: "trending", badge: "Viral" },
  { file: "trending-tiktok_original_sound_-_lirikmusiklogikadanhati.mp3", judul: "Niscaya (Lyric)", artis: "lirikmusik_logikadanhati", cat: "trending", badge: "Lyric" },
  { file: "xyzbca_original_sound_-_buttersandkenny2.mp3", judul: "Sound #xyzbca", artis: "Butters", cat: "xyzbca", badge: "FYP" },
]

const fmtDur = (d) => {
  if (!d) return ""
  d = Math.round(d)
  return Math.floor(d / 60) + ":" + String(d % 60).padStart(2, "0")
}

let COVERMAP = {}
try { COVERMAP = JSON.parse(fs.readFileSync(path.join(__dirname, "covers-map.json"), "utf8")) } catch {}

const muat = (nama, catFn, artisExtra) => {
  try {
    const arr = JSON.parse(fs.readFileSync(path.join(__dirname, nama), "utf8"))
    arr.forEach((l) => {
      LAGU.push({
        file: l.file.replace(/^hasil\//, ""),
        judul: l.judul,
        artis: l.artis + (artisExtra && l.cap ? " • " + l.cap : ""),
        cat: catFn(l),
        badge: l.cap || "",
      })
      if (l.cover || l.dur) {
        const key = l.file.replace(/^hasil\//, "")
        if (!COVERMAP[key]) COVERMAP[key] = {}
        if (l.cover) COVERMAP[key].cover = l.cover
        if (l.dur) COVERMAP[key].dur = l.dur
      }
    })
  } catch (e) { console.warn(nama, "tidak ada:", e.message) }
}
muat("lagu-xyy.json", () => "xyyk4l", true)
muat("lagu-kane-sasak.json", (l) => l.file.startsWith("sasak_") ? "sasak" : l.file.startsWith("kane_") ? "kane" : "gaul", true)
muat("lagu-baru.json", (l) => l.file.startsWith("kane_") ? "kane" : l.file.startsWith("sasak_") ? "sasak" : "lombok", true)
muat("lagu-lombok2.json", (l) => l.file.startsWith("sasak_") ? "sasak" : "lombok", true)
muat("lagu-baru2.json", (l) => l.file.startsWith("rmx_") ? "rmx" : l.file.startsWith("katakata_") ? "katakata" : "sasak", true)
muat("lagu-repost.json", () => "repost", true)
muat("lagu-dev.json", (l) => l.file.startsWith("yt_") ? "youtube" : "dev", true)

let URLS = {}
try { URLS = JSON.parse(fs.readFileSync(path.join(__dirname, "audio_urls.json"), "utf8")) } catch {}

const KATEGORI = [
  { id: "semua", nama: "Semua Lagu", icon: "home" },
  { id: "xyyk4l", nama: "Favorit @xyy.k4l", icon: "star" },
  { id: "sasak", nama: "Lagu Sasak", icon: "leaf" },
  { id: "lombok", nama: "Lombok / Della Musik", icon: "drum" },
  { id: "kane", nama: "Sound Kane", icon: "zap" },
  { id: "rmx", nama: "Sound RMX", icon: "flame" },
  { id: "katakata", nama: "Kata Kata", icon: "message-square" },
  { id: "galau", nama: "Kata Kata Galau", icon: "cloud-rain" },
  { id: "kece", nama: "Kata Kata Kece", icon: "sparkles" },
  { id: "motivasi", nama: "Kata Kata Motivasi", icon: "dumbbell" },
  { id: "quotes", nama: "Quotes", icon: "quote" },
  { id: "trending", nama: "Trending TikTok", icon: "trending-up" },
  { id: "potre", nama: "Sesi Potre", icon: "camera" },
  { id: "presetam", nama: "Preset AM Kece", icon: "clapperboard" },
  { id: "xyzbca", nama: "#xyzbca", icon: "hash" },
  { id: "gaul", nama: "Lagu Gaul", icon: "flame" },
  { id: "repost", nama: "Repost", icon: "repeat" },
  { id: "youtube", nama: "YouTube / Populer", icon: "youtube" },
  { id: "dev", nama: "Upload Baru", icon: "upload" },
]

const songs = LAGU.map((l, i) => {
  const cm = COVERMAP[l.file] || {}
  return {
    i, t: l.judul, a: l.artis, c: l.cat, b: l.badge || "",
    u: URLS[l.file] || "", p: "hasil/" + l.file,
    cv: cm.cover ? "hasil/" + cm.cover : "", du: cm.dur || 0,
  }
})

const li = (name, size) => '<i data-lucide="' + name + '" width="' + size + '" height="' + size + '"></i>'

const cnt = (id) => (id === "semua" ? songs.length : songs.filter((s) => s.c === id).length)

const navItems = KATEGORI.map((k) =>
  '<button class="nav-item' + (k.id === "semua" ? " active" : "") + '" data-cat="' + k.id + '" onclick="pilihKategori(\'' + k.id + '\')">' +
  li(k.icon, 17) + '<span class="nav-nama">' + k.nama + '</span><span class="nav-cnt">' + cnt(k.id) + "</span></button>"
).join("\n")

const cards = songs.map((s) => {
  const coverHtml = s.cv
    ? '<img class="cimg" src="' + s.cv + '" alt="" loading="lazy" decoding="async">'
    : '<i data-lucide="music-2" width="24" height="24"></i>'
  return (
    '<div class="card" data-cat="' + s.c + '" data-idx="' + s.i + '" onclick="mainClick(event, ' + s.i + ')">' +
    '<div class="cover">' + coverHtml + '<span class="eq"><span></span><span></span><span></span><span></span></span></div>' +
    '<div class="card-body">' +
    '<div class="ct" title="' + s.t.replace(/"/g, "&quot;") + '">' + (s.b ? '<span class="bdg">' + s.b + "</span>" : "") + s.t + "</div>" +
    '<div class="ca" onclick="event.stopPropagation();pilihArtist(\'' + s.a.replace(/'/g, "&#39;") + '\')" title="Lihat artis">' + s.a + "</div>" +
    '<div class="cdur">' + (s.du ? "⏱ " + fmtDur(s.du) : "") + "</div>" +
    "</div>" +
    '<button class="addbtn" title="Tambah ke playlist" onclick="event.stopPropagation();addToPlaylist(' + s.i + ')">' + li("plus", 14) + "</button>" +
    '<button class="playbtn" title="Play">' + li("play", 15) + "</button>" +
    '<a class="dlbtn" href="' + (s.u || s.p) + '" download title="Download" onclick="event.stopPropagation()">' + li("download", 15) + "</a>" +
    "</div>"
  )
}).join("\n")

const css = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#000;--panel:#121212;--card:#181818;--card-h:#232323;--line:#282828;--tx:#fff;--tx2:#b3b3b3;--tx3:#7a7a7a}
html,body{height:100%}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--tx);display:flex;flex-direction:column;overflow:hidden}
button{background:none;border:none;color:inherit;cursor:pointer;font-family:inherit}
a{color:inherit;text-decoration:none}
i{pointer-events:none}
::-webkit-scrollbar{width:9px}::-webkit-scrollbar-thumb{background:#2c2c2c;border-radius:99px}::-webkit-scrollbar-thumb:hover{background:#3d3d3d}

.app{display:flex;flex:1;min-height:0}
.sidebar{width:252px;flex-shrink:0;background:var(--bg);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:18px 12px;overflow-y:auto}
.main{flex:1;display:flex;flex-direction:column;min-width:0;background:var(--panel)}
.content{flex:1;overflow-y:auto;padding:0 26px 140px}

/* ── FLOATING PLAYER BAR ── */
.playerbar{
  position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:90;
  width:min(1180px,calc(100% - 28px));height:76px;border-radius:22px;
  background:rgba(20,20,20,.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid rgba(255,255,255,.14);box-shadow:0 14px 44px rgba(0,0,0,.7);
  display:flex;align-items:center;gap:16px;padding:0 16px;
}
.now{display:flex;align-items:center;gap:12px;width:26%;min-width:180px;cursor:pointer}
.now .cover{width:52px;height:52px;flex-shrink:0;border-radius:12px;background:#262626;color:#fff;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.now .cover .cimg{width:100%;height:100%;object-fit:cover;display:block}
.now-info{min-width:0}
.now-title{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.now-artist{color:var(--tx3);font-size:11.5px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ctl{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;max-width:640px}
.ctl-row{display:flex;align-items:center;gap:18px}
.icon-btn{color:var(--tx2);transition:.15s;display:flex;align-items:center;justify-content:center}
.icon-btn:hover{color:#fff}
.icon-btn.on{color:#fff}
.pb{width:42px;height:42px;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;transition:.15s}
.pb:hover{transform:scale(1.07)}
.track{display:flex;align-items:center;gap:10px;width:100%}
.time{font-size:11px;color:var(--tx3);width:32px;text-align:center;font-variant-numeric:tabular-nums}
.track-mid{flex:1;position:relative;display:flex;flex-direction:column;min-width:0}
#wave{width:100%;height:26px;display:block;margin-bottom:1px}
.prog{flex:1;height:4px;background:var(--line);border-radius:99px;cursor:pointer;position:relative}
.track-mid .prog{position:static;width:100%}
.prog .fill{position:absolute;left:0;top:0;height:100%;background:#fff;border-radius:99px;width:0%}
.prog .dot{position:absolute;top:50%;width:11px;height:11px;background:#fff;border-radius:50%;transform:translate(-50%,-50%);left:0%;opacity:0;transition:.15s}
.prog:hover .dot{opacity:1}
.side-ctl{width:26%;display:flex;justify-content:flex-end;align-items:center;gap:8px}

/* ── LOGO / SIDEBAR ── */
.logo{display:flex;align-items:center;gap:10px;padding:4px 6px 16px}
.logo .lmark{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#fff,#9a9a9a);color:#000;display:flex;align-items:center;justify-content:center;box-shadow:0 0 22px rgba(255,255,255,.15)}
.logo h1{font-size:16px;font-weight:800;letter-spacing:.4px}
.logo small{display:block;color:var(--tx3);font-size:9.5px;font-weight:600;letter-spacing:1.6px}
.side-label{display:flex;align-items:center;justify-content:space-between;color:var(--tx3);font-size:10.5px;font-weight:700;letter-spacing:1.4px;padding:16px 8px 8px}
.side-label .mini{color:var(--tx2);padding:2px 8px;border-radius:99px;border:1px solid var(--line);font-size:12px;line-height:1}
.side-label .mini:hover{border-color:#fff;color:#fff}
.nav-item{display:flex;align-items:center;gap:11px;width:100%;padding:8.5px 10px;border-radius:8px;color:var(--tx2);font-size:13px;text-align:left;transition:.15s;margin-bottom:1px}
.nav-item:hover{color:var(--tx)}
.nav-item.active{color:#000;background:#fff;font-weight:700}
.nav-item.active .nav-cnt{color:#000;opacity:.55}
.nav-nama{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nav-cnt{font-size:11px;opacity:.5}
.art-dot{width:22px;height:22px;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}
.nav-item.active .art-dot{background:#000;color:#fff}
.side-hint{color:var(--tx3);font-size:11.5px;padding:6px 10px;line-height:1.6}
.side-foot{margin-top:auto;padding:14px 8px 2px;color:var(--tx3);font-size:10px;line-height:1.7}

.topbar{display:flex;align-items:center;gap:16px;padding:16px 26px;border-bottom:1px solid var(--line);flex-shrink:0;background:var(--panel)}
.search{flex:1;max-width:430px;display:flex;align-items:center;gap:10px;background:var(--bg);border:1px solid var(--line);border-radius:99px;padding:9px 16px;color:var(--tx2)}
.search:focus-within{border-color:#fff;color:#fff}
.search input{flex:1;background:none;border:none;outline:none;color:var(--tx);font-size:14px}
.search input::placeholder{color:var(--tx3)}
.top-stats{color:var(--tx3);font-size:12px;white-space:nowrap}

.banner{position:relative;border-radius:16px;overflow:hidden;margin-top:20px;border:1px solid var(--line);background:#0a0a0a}
.banner svg.bg{display:block;width:100%;height:140px}
.banner .b-overlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 34px;background:linear-gradient(90deg,rgba(0,0,0,.85) 25%,rgba(0,0,0,.25) 70%,transparent)}
.banner .b-tag{font-size:10.5px;font-weight:700;letter-spacing:2.5px;color:#aaa;margin-bottom:8px}
.banner .b-title{font-size:clamp(22px,4vw,38px);font-weight:800;letter-spacing:-.5px;line-height:1.05}
.banner .b-sub{color:var(--tx2);font-size:13px;margin-top:8px}
.banner .b-play{margin-top:14px;width:fit-content;display:inline-flex;align-items:center;gap:9px;background:#fff;color:#000;font-weight:700;font-size:13px;padding:10px 22px;border-radius:99px;transition:.18s}
.banner .b-play:hover{transform:scale(1.05);box-shadow:0 0 30px rgba(255,255,255,.3)}

.hero{padding:22px 0 4px}
.hero h2{font-size:clamp(22px,3.4vw,34px);font-weight:800;letter-spacing:-.5px}
.hero p{color:var(--tx3);font-size:13px;margin-top:5px}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(264px,1fr));gap:13px;margin-top:16px}
.card{position:relative;display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid transparent;border-radius:11px;padding:10px 12px;cursor:pointer;transition:.15s}
.card:hover{background:var(--card-h)}
.card.playing{background:var(--card-h);border-color:#fff}
.cover{width:52px;height:52px;flex-shrink:0;border-radius:9px;background:#262626;color:#fff;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.card.playing .cover{background:#fff;color:#000}
.cimg{width:100%;height:100%;object-fit:cover;display:block}
.eq{position:absolute;bottom:5px;right:5px;display:none;gap:2px;align-items:flex-end;height:13px}
.card.playing .eq{display:flex}
.eq span{width:3px;background:#000;border-radius:1px;animation:eq 1s ease-in-out infinite}
.eq span:nth-child(2){animation-delay:.15s}.eq span:nth-child(3){animation-delay:.3s}.eq span:nth-child(4){animation-delay:.45s}
@keyframes eq{0%,100%{height:3px}50%{height:13px}}
.card-body{flex:1;min-width:0}
.ct{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ca{color:var(--tx3);font-size:12px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;transition:.15s}
.ca:hover{color:#fff;text-decoration:underline}
.cdur{color:var(--tx3);font-size:10px;margin-top:3px}
.bdg{font-size:9px;font-weight:700;background:var(--line);color:var(--tx2);padding:2px 7px;border-radius:99px;margin-right:6px;vertical-align:1.5px}
.addbtn,.playbtn,.dlbtn{width:30px;height:30px;border-radius:50%;background:#fff;color:#000;flex-shrink:0;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(4px);transition:.18s}
.card:hover .addbtn,.card:hover .playbtn,.card:hover .dlbtn{opacity:1;transform:none}
.card.playing .addbtn,.card.playing .playbtn,.card.playing .dlbtn{opacity:1;transform:none}
.playbtn:hover,.addbtn:hover{transform:scale(1.12)}
.dlbtn{background:transparent;color:var(--tx2);border:1px solid var(--line)}
.dlbtn:hover{color:#fff;border-color:#fff}
.empty{grid-column:1/-1;text-align:center;color:var(--tx3);padding:60px 0;font-size:14px}
.hidden{display:none!important}

/* ── HALAMAN PLAYER (now playing) ── */
.nowpage{max-width:980px;margin:0 auto;padding:26px 0 30px;animation:fadein .3s ease}
@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.np-back{display:inline-flex;align-items:center;gap:8px;color:var(--tx2);font-size:13px;padding:8px 14px;border-radius:99px;border:1px solid var(--line);transition:.15s;margin-bottom:22px}
.np-back:hover{color:#fff;border-color:#fff}
.np-main{display:flex;gap:44px;align-items:center}
/* cover abstrak */
.np-artwrap{position:relative;width:min(340px,42vw);flex-shrink:0}
.np-glow{position:absolute;inset:-50px;border-radius:50%;filter:blur(46px);opacity:.5;z-index:0;transition:.6s}
.np-ring{position:absolute;inset:-26px;border-radius:50%;border:1px solid rgba(255,255,255,.22);animation:spin 26s linear infinite;z-index:0}
.np-ring::after{content:'';position:absolute;inset:10px;border-radius:50%;border:1px dashed rgba(255,255,255,.18)}
@keyframes spin{to{transform:rotate(360deg)}}
.np-ring.paused{animation-play-state:paused}
.np-art{
  position:relative;z-index:1;aspect-ratio:1;border-radius:26px;overflow:hidden;
  background:#1a1a1a;box-shadow:0 30px 80px rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;
}
.np-art .cimg{width:100%;height:100%;object-fit:cover;display:block}
.np-art::after{content:'';position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.14),transparent 42%,rgba(0,0,0,.38));pointer-events:none}
.np-art .np-fallback{font-size:110px;color:#fff;opacity:.85}
.np-float{position:absolute;z-index:2;width:26px;height:26px;border-radius:50%;background:#fff;opacity:.9;filter:blur(1px);animation:floaty 5s ease-in-out infinite}
.np-float.f1{top:8%;right:2%;animation-delay:0s}
.np-float.f2{bottom:10%;left:-4%;width:16px;height:16px;animation-delay:1.4s}
.np-float.f3{top:-6%;left:18%;width:12px;height:12px;animation-delay:2.6s}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.np-info{flex:1;min-width:0}
.np-cat{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:1.6px;color:#000;background:#fff;padding:4px 12px;border-radius:99px;margin-bottom:14px}
.np-title{font-size:clamp(24px,4.2vw,44px);font-weight:800;letter-spacing:-.5px;line-height:1.08}
.np-artist{color:var(--tx2);font-size:15px;margin-top:10px}
.np-meta{color:var(--tx3);font-size:12px;margin-top:8px;display:flex;gap:12px;align-items:center}
#wavePage{width:100%;height:130px;display:block;margin:20px 0 6px}
.np-prog-row{display:flex;align-items:center;gap:12px}
.np-prog-row .time{width:auto}
.np-prog{flex:1;height:6px;background:var(--line);border-radius:99px;cursor:pointer;position:relative}
.np-prog .fill{position:absolute;left:0;top:0;height:100%;background:#fff;border-radius:99px;width:0%}
.np-prog .dot{position:absolute;top:50%;width:14px;height:14px;background:#fff;border-radius:50%;transform:translate(-50%,-50%);left:0%;opacity:0}
.np-prog:hover .dot{opacity:1}
.np-controls{display:flex;align-items:center;gap:22px;margin-top:18px}
.np-controls .pb{width:58px;height:58px}
.np-controls .pb i{pointer-events:none}
.np-queue{margin-top:34px;border-top:1px solid var(--line);padding-top:18px}
.np-queue-h{font-size:11.5px;font-weight:700;letter-spacing:1.6px;color:var(--tx3);margin-bottom:8px}
.np-qitem{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:9px;cursor:pointer;transition:.12s}
.np-qitem:hover{background:var(--card-h)}
.np-qitem.active{background:#fff;color:#000}
.qnum{width:20px;color:var(--tx3);font-size:12px;text-align:center}
.np-qitem.active .qnum{color:rgba(0,0,0,.5)}
.qname{flex:1;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qart{color:var(--tx3);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.np-qitem.active .qart{color:rgba(0,0,0,.5)}

@media (max-width:900px){
  .sidebar{display:none}
  .playerbar{bottom:10px;width:calc(100% - 16px);height:auto;flex-wrap:wrap;padding:10px 12px;gap:8px;border-radius:18px}
  .now{width:100%;min-width:0}
  .ctl{max-width:none;width:100%}
  .side-ctl{display:none}
  .content{padding:0 14px 160px}
  .topbar{padding:12px 14px}
  .np-main{flex-direction:column;align-items:center;text-align:center;gap:28px}
  .np-artwrap{width:min(280px,70vw)}
  .np-cat{margin-bottom:10px}
  .np-artist{margin-top:6px}
  .np-queue{width:100%}
}
`

const BANNER_SVG = `<svg class="bg" viewBox="0 0 1200 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="150" fill="#050505"/>
  <g stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.9">
    <path d="M0 75 Q30 30 60 75 T120 75 T180 75 T240 75 T300 75 T360 75 T420 75 T480 75 T540 75 T600 75 T660 75 T720 75 T780 75 T840 75 T900 75 T960 75 T1020 75 T1080 75 T1140 75 T1200 75"/>
  </g>
  <g stroke="#ffffff" stroke-width="1.1" fill="none" opacity="0.35">
    <path d="M0 45 Q40 10 80 45 T160 45 T240 45 T320 45 T400 45 T480 45 T560 45 T640 45 T720 45 T800 45 T880 45 T960 45 T1040 45 T1120 45 T1200 45"/>
    <path d="M0 105 Q40 140 80 105 T160 105 T240 105 T320 105 T400 105 T480 105 T560 105 T640 105 T720 105 T800 105 T880 105 T960 105 T1040 105 T1120 105 T1200 105"/>
  </g>
  <g fill="#ffffff">
    <rect x="60" y="55" width="7" height="40" rx="3.5"/><rect x="72" y="45" width="7" height="60" rx="3.5"/>
    <rect x="84" y="62" width="7" height="26" rx="3.5"/><rect x="96" y="38" width="7" height="74" rx="3.5"/>
    <rect x="108" y="52" width="7" height="46" rx="3.5"/><rect x="120" y="66" width="7" height="18" rx="3.5"/>
    <rect x="1090" y="40" width="7" height="70" rx="3.5"/><rect x="1102" y="55" width="7" height="40" rx="3.5"/>
    <rect x="1114" y="30" width="7" height="90" rx="3.5"/><rect x="1126" y="60" width="7" height="30" rx="3.5"/>
  </g>
  <circle cx="1145" cy="75" r="26" fill="none" stroke="#ffffff" stroke-width="2.5"/>
  <circle cx="1145" cy="75" r="7" fill="#ffffff"/>
</svg>`

const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TikTok Sounds — Black &amp; White Player</title>
<link rel="preload" href="styles.css" as="style">
<link rel="stylesheet" href="styles.css">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js" defer></script>
</head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="logo">
      <div class="lmark">${li("music-2", 20)}</div>
      <div><h1>TIKTOK SOUNDS</h1><small>BLACK &amp; WHITE EDITION</small></div>
    </div>
    <div class="side-label"><span>PLAYLIST</span><button class="mini" onclick="buatPlaylist()" title="Buat playlist">${li("plus", 14)}</button></div>
    <div id="plList"></div>
    <div class="side-label">KATEGORI</div>
    ${navItems}
    <div class="side-label">ARTIS</div>
    <div id="artistList"></div>
    <div class="side-foot">${songs.length} lagu • dibuat dari TikTok via tiktok-api-dl<br>Gratis • Tanpa login • Tanpa iklan<br><a href="dev.html" style="display:inline-flex;align-items:center;gap:6px;color:#fff;margin-top:8px;font-weight:700">${li("terminal", 12)}&nbsp;DEV CONSOLE</a></div>
  </aside>

  <main class="main">
    <div class="topbar">
      <div class="search">${li("search", 16)}<input id="q" placeholder="Cari judul, artis, sound..." oninput="cari()"></div>
      <div class="top-stats" id="stats"></div>
    </div>
    <div class="content">
      <!-- BROWSE -->
      <div id="browse">
        <div class="banner" id="banner">
          ${BANNER_SVG}
          <div class="b-overlay">
            <div class="b-tag">TIKTOK SOUND COLLECTION 2026</div>
            <div class="b-title">Semua Sound Trending<br>Dalam Satu Player</div>
            <div class="b-sub">${songs.length} lagu — Sasak, Lombok, Kane, RMX, Kata-kata &amp; lainnya</div>
            <button class="b-play" onclick="pilihKategori('semua');setTimeout(()=>{const l=daftarTampil();if(l.length)playIdx(l[0].i)},100)">${li("play", 15)}&nbsp;PUTAR SEMUA</button>
          </div>
        </div>
        <div class="hero">
          <h2 id="hero-title">Semua Lagu</h2>
          <p id="hero-sub">Sound trending TikTok Indonesia — preset, kane, Sasak, galau, quotes &amp; lainnya</p>
        </div>
        <div class="grid" id="grid">${cards}</div>
        <div class="empty hidden" id="empty">Nggak ketemu...</div>
      </div>

      <!-- HALAMAN PLAYER -->
      <div id="nowPage" class="nowpage hidden">
        <button class="np-back" onclick="backBrowse()">${li("arrow-left", 16)}&nbsp;Kembali</button>
        <div class="np-main">
          <div class="np-artwrap">
            <div class="np-glow" id="npGlow"></div>
            <div class="np-ring" id="npRing"><span></span></div>
            <div class="np-float f1"></div><div class="np-float f2"></div><div class="np-float f3"></div>
            <div class="np-art" id="npArt"><div class="np-fallback" id="npFallback">♪</div></div>
          </div>
          <div class="np-info">
            <span class="np-cat" id="npCat">KATEGORI</span>
            <h2 class="np-title" id="npTitle2">—</h2>
            <div class="np-artist" id="npArtist2">—</div>
            <div class="np-meta"><span id="npDur2"></span><span id="npBadge2"></span></div>
            <canvas id="wavePage" width="1200" height="130"></canvas>
            <div class="np-prog-row">
              <span class="time" id="tCur3">0:00</span>
              <div class="np-prog" id="progPage" onclick="seekFrom(event,'progPage')"><div class="fill" id="fillPage"></div><div class="dot" id="dotPage"></div></div>
              <span class="time" id="tDur3">0:00</span>
            </div>
            <div class="np-controls">
              <button class="icon-btn" id="btnViz3" onclick="cycleViz()" title="Visualizer">${li("audio-lines", 18)}</button>
              <button class="icon-btn" id="btnShuffle3" onclick="togShuffle()" title="Shuffle">${li("shuffle", 18)}</button>
              <button class="icon-btn" onclick="prevSong()" title="Sebelumnya">${li("skip-back", 24)}</button>
              <button class="pb" id="btnPlay3" onclick="togPlay()">${li("play", 28)}</button>
              <button class="icon-btn" onclick="nextSong()" title="Berikutnya">${li("skip-forward", 24)}</button>
              <button class="icon-btn" id="btnRepeat3" onclick="togRepeat()" title="Ulangi">${li("repeat", 18)}</button>
            </div>
          </div>
        </div>
        <div class="np-queue">
          <div class="np-queue-h">ANTRIAN BERIKUTNYA</div>
          <div id="npQueue"></div>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- FLOATING PLAYER BAR -->
<div class="playerbar">
  <div class="now" onclick="openNowPage()" title="Buka halaman player">
    <div class="cover" id="npCover">${li("music-2", 22)}</div>
    <div class="now-info">
      <div class="now-title" id="npTitle">Pilih lagu buat diputar</div>
      <div class="now-artist" id="npArtist">—</div>
    </div>
  </div>
  <div class="ctl">
    <div class="ctl-row">
      <button class="icon-btn" id="btnViz" onclick="cycleViz()" title="Visualizer: Bars">${li("audio-lines", 16)}</button>
      <button class="icon-btn" id="btnShuffle" onclick="togShuffle()" title="Shuffle">${li("shuffle", 16)}</button>
      <button class="icon-btn" onclick="prevSong()" title="Previous">${li("skip-back", 20)}</button>
      <button class="pb" id="btnPlay" onclick="togPlay()" title="Play/Pause">${li("play", 18)}</button>
      <button class="icon-btn" onclick="nextSong()" title="Next">${li("skip-forward", 20)}</button>
      <button class="icon-btn" id="btnRepeat" onclick="togRepeat()" title="Repeat">${li("repeat", 16)}</button>
    </div>
    <div class="track">
      <span class="time" id="tCur">0:00</span>
      <div class="track-mid">
        <canvas id="wave" width="1200" height="26"></canvas>
        <div class="prog" id="prog" onclick="seekFrom(event,'prog')"><div class="fill" id="fill"></div><div class="dot" id="dot"></div></div>
      </div>
      <span class="time" id="tDur">0:00</span>
    </div>
  </div>
  <div class="side-ctl">
    <button class="icon-btn" onclick="dlNow()" title="Download lagu ini">${li("download", 18)}</button>
  </div>
</div>

<script>
window.__SONGS = ${JSON.stringify(songs)};
window.__CATS = ${JSON.stringify(KATEGORI.map((k) => ({ id: k.id, nama: k.nama, icon: k.icon })))};
</script>
<script src="player.js"></script>
</body>
</html>`

fs.writeFileSync(path.join(__dirname, "..", "styles.css"), css)
fs.writeFileSync(path.join(__dirname, "..", "index.html"), html)
console.log("✅ index.html v5 + styles.css —", songs.length, "lagu |", (html.length / 1024).toFixed(0), "KB html,", (css.length / 1024).toFixed(0), "KB css")
