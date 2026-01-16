## Jawaban untuk pertanyaan Anda
- **Tidak ada API gratis + legal yang menyediakan “data Netflix (katalog Netflix) + video full movie/episode” seperti Netflix.** Netflix tidak menyediakan public API untuk katalog+stream, dan konten film/series populer dilindungi hak cipta.
- Yang **paling mirip Netflix secara data (metadata + thumbnail + kategori)** dan gratis adalah **TMDB**: trending/popular/top rated/genre, poster/backdrop, overview, rating.
- Untuk **video**, TMDB hanya memberi daftar “videos” berupa *key* ke YouTube/Vimeo (biasanya trailer/teaser), bukan file film. Endpoint resminya: `GET /movie/{movie_id}/videos` [TMDB Videos API](https://developer.themoviedb.org/reference/movie-videos) [2].
- Kalau Anda benar-benar ingin tombol Play memutar **video full-length** secara gratis & legal, pilihan yang realistis adalah **konten Public Domain/Open License** (contoh: Internet Archive). Internet Archive punya JSON API dan metadata item [Internet Archive JSON API](https://archive.org/help/json.php) [3]. Kontennya bukan katalog film populer Netflix, tapi benar-benar bisa diputar.

Dengan ini, saya akan membuat aplikasi **“persis Netflix dari sisi UX/fitur”** (browse, klik film, detail modal, play trailer, search), dan menambahkan **mode tambahan** untuk full movie legal dari Public Domain.

## Target yang akan saya deliver
1) Halaman home rapi seperti Netflix (layout, carousel, hover).
2) Klik film → modal detail + tombol Play.
3) Play memutar trailer (YouTube embed) untuk title TMDB.
4) Search bekerja (modal search + hasil + klik hasil membuka modal + play).
5) (Opsional) Row “Public Domain” yang benar-benar memutar video full movie dari Internet Archive.

## 1) Rapihkan UI (yang sekarang berantakan)
- Rapikan spacing, ukuran card, dan responsif (mobile/desktop).
- Pastikan carousel horizontal benar-benar rapi + scrollbar disembunyikan dengan CSS internal (tanpa bergantung plugin).
- Perbaiki layering (Navbar/Hero/Rows) agar tidak saling menimpa.

## 2) Backend: Tambah fitur TMDB yang kurang (agar aman, API key tidak bocor)
Tambahkan method di `TmdbService` + endpoint JSON di `MovieController`:
- Search: `searchMulti(query)` atau `searchMovie(query)`.
- Details: `getMovieDetails(id)` / `getTvDetails(id)`.
- Trailers: `getMovieVideos(id)` / `getTvVideos(id)` (ambil trailer YouTube terbaik).

## 3) Frontend: Movie Modal (klik card & tombol hero jadi berfungsi)
- Buat `MovieModal` (Dialog) yang menampilkan detail + tombol:
  - **Play Trailer** → embed YouTube dari `videos.key`.
  - **More Info** → detail tambahan di modal.
- Klik `MovieCard` dan tombol Play/More Info di Hero membuka modal ini.

## 4) Frontend: Search yang bekerja
- Jadikan icon search di Navbar membuka `SearchModal`.
- `SearchModal`:
  - input dengan debounce 300–500ms
  - fetch ke endpoint backend `/api/tmdb/search?q=...`
  - hasil list/grid, klik hasil → buka `MovieModal`.

## 5) (Opsional tapi saya rekomendasikan) Full video gratis & legal
- Tambah provider Internet Archive:
  - cari item video via `advancedsearch.php?...output=json` [3]
  - ambil file mp4 dari `/metadata/{identifier}`
- Tambah row “Public Domain” di Home; klik item → modal + HTML5 video player.

## 6) Verifikasi
- Jalankan lint/typecheck.
- Jalankan dev server, cek end-to-end:
  - UI rapi
  - klik card → modal
  - Play trailer jalan
  - Search jalan
  - (opsional) public domain playback jalan

Jika Anda setuju dengan rencana ini, saya langsung mulai dari UI rapih + movie modal + trailer playback dulu (itu yang bikin terasa ‘Netflix banget’), lalu lanjut search.