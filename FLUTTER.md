# 📱 Flutter + Musix REST API — Sound Story Otomatis

API: `https://musix-api.onrender.com` (atau URL Netlify/Render kamu)

## 🎯 Alur "Sound Story Otomatis"

1. App minta **1 lagu acak** (bisa per kategori) → `GET /api/story?category=sasak`
2. API balas: `{ song, story: { caption, hashtags } }`
3. App **streaming audio** dari `song.audio` (support HTTP Range → seek lancar)
4. Saat lagu selesai → otomatis ambil story berikutnya (loop tanpa sentuh)

## 📦 Dependencies

```yaml
dependencies:
  http: ^1.2.0
  just_audio: ^0.9.36
```

## 🧩 Model

```dart
class Song {
  final String id, title, artist, category, categoryName, badge, cover, audio;
  final int duration;

  Song.fromJson(Map<String, dynamic> j)
      : id = j['id'], title = j['title'], artist = j['artist'],
        category = j['category'], categoryName = j['categoryName'],
        badge = j['badge'] ?? '', cover = j['cover'] ?? '',
        audio = j['audio'], duration = j['duration'] ?? 0;

  String get audioUrl => '$baseUrl/$audio';
  String get coverUrl => '$baseUrl/$cover';
}

class Story {
  final Song song;
  final String caption;
  final List<String> hashtags;
  Story.fromJson(Map<String, dynamic> j)
      : song = Song.fromJson(j['song']),
        caption = j['story']['caption'],
        hashtags = List<String>.from(j['story']['hashtags']);
}

const baseUrl = 'https://musix-api.onrender.com'; // ganti dgn URL kamu
```

## 🚀 Contoh: Sound Story Otomatis (main.dart)

```dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';

void main() => runApp(const MusixApp());

class MusixApp extends StatelessWidget {
  const MusixApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true),
        home: const StoryScreen(),
      );
}

class StoryScreen extends StatefulWidget {
  const StoryScreen({super.key});
  @override
  State<StoryScreen> createState() => _StoryScreenState();
}

class _StoryScreenState extends State<StoryScreen> {
  final _player = AudioPlayer();
  final _http = http.Client();

  Story? _story;
  bool _loading = true;
  String? _category; // null = semua, atau 'sasak', 'kane', 'rmx', dll

  @override
  void initState() {
    super.initState();
    _nextStory();
    // AUTO: ganti story otomatis setiap lagu selesai
    _player.playerStateStream.listen((ps) {
      if (ps.processingState == ProcessingState.completed) _nextStory();
    });
  }

  Future<void> _nextStory() async {
    setState(() => _loading = true);
    try {
      final uri = Uri.parse('$baseUrl/api/story')
          .replace(queryParameters: _category == null ? null : {'category': _category});
      final res = await _http.get(uri);
      if (res.statusCode != 200) throw Exception('API error ${res.statusCode}');

      final story = Story.fromJson(jsonDecode(res.body));
      await _player.setUrl(story.song.audioUrl); // streaming + seek
      _player.play();

      if (!mounted) return;
      setState(() { _story = story; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Gagal: $e')));
    }
  }

  @override
  void dispose() {
    _player.dispose();
    _http.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('🎧 Musix Story', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          // Pilih kategori
          PopupMenuButton<String>(
            initialValue: _category,
            onSelected: (v) { _category = v == 'semua' ? null : v; _nextStory(); },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'semua', child: Text('Semua')),
              PopupMenuItem(value: 'sasak', child: Text('Lagu Sasak')),
              PopupMenuItem(value: 'kane', child: Text('Sound Kane')),
              PopupMenuItem(value: 'rmx', child: Text('Sound RMX')),
              PopupMenuItem(value: 'galau', child: Text('Kata Kata Galau')),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Colors.white))
          : _story == null
              ? const Center(child: Text('Tidak ada story', style: TextStyle(color: Colors.grey)))
              : Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      // Cover
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.network(
                          _story!.song.coverUrl,
                          width: 220, height: 220, fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 220, height: 220, color: Colors.white12,
                            child: const Icon(Icons.music_note, size: 80, color: Colors.white38),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(_story!.song.title,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center),
                      const SizedBox(height: 6),
                      Text(_story!.song.artist,
                          style: const TextStyle(color: Colors.grey), textAlign: TextAlign.center),
                      const SizedBox(height: 8),
                      Text('${_story!.song.categoryName} • ${_story!.song.duration} detik',
                          style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      const SizedBox(height: 24),
                      // Caption siap copy (buat status WA)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white10,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: SelectableText(_story!.caption,
                            style: const TextStyle(fontSize: 13, height: 1.5)),
                      ),
                      const SizedBox(height: 8),
                      Text('#${_story!.hashtags.join(' #')}',
                          style: const TextStyle(color: Colors.blueGrey, fontSize: 12)),
                      const Spacer(),
                      // Kontrol
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                            onPressed: () => _player.seek(Duration.zero),
                            icon: const Icon(Icons.replay, color: Colors.white),
                          ),
                          const SizedBox(width: 16),
                          StreamBuilder<PlayerState>(
                            stream: _player.playerStateStream,
                            builder: (_, snap) {
                              final playing = snap.data?.playing ?? false;
                              return IconButton.filled(
                                iconSize: 40,
                                onPressed: () => playing ? _player.pause() : _player.play(),
                                icon: Icon(playing ? Icons.pause : Icons.play_arrow),
                              );
                            },
                          ),
                          const SizedBox(width: 16),
                          IconButton(
                            onPressed: _nextStory,
                            icon: const Icon(Icons.skip_next, color: Colors.white),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Auto ganti lagu tiap selesai 🔁',
                          style: TextStyle(color: Colors.grey[600], fontSize: 11)),
                    ],
                  ),
                ),
    );
  }
}
```

## 📡 Ringkasan endpoint

| Endpoint | Fungsi |
|---|---|
| `GET /api/health` | Cek server hidup |
| `GET /api/songs?category=&q=&limit=&offset=&sort=random\|views` | Daftar lagu (filter & pagination) |
| `GET /api/songs/random?category=` | 1 lagu acak |
| `GET /api/songs/:id` | Detail lagu |
| `GET /api/categories` | Semua kategori + jumlah |
| `GET /api/artists` | Artis + jumlah |
| `GET /api/story?category=` | **Sound story otomatis** (lagu + caption + hashtags) |
| `GET /hasil/xxx.mp3` | Streaming audio (HTTP Range) |

## 🗂️ Field lagu

```json
{
  "id": "sasak_7633829243306233106",
  "title": "original sound - collenfecky2",
  "artist": "👑𝕮𝖔𝖑𝖑𝖊𝖓 𝕱𝖊𝖈𝖐𝖞👑 • Solusi tipak 176K",
  "category": "sasak",
  "categoryName": "Lagu Sasak",
  "badge": "Solusi tipak 176K",
  "duration": 22,
  "cover": "hasil/covers/7633829243306233106.jpg",
  "audio": "hasil/sasak_7633829243306233106.mp3",
  "audioRemote": "https://h.uguu.se/..."
}
```

> `audio` & `cover` adalah path relatif → gabung dengan base URL API.
