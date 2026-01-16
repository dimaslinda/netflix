## Titik edit embed ada di mana?
Ada 2 titik utama di [MovieModal.tsx](file:///e:/herd/netflix/resources/js/components/netflix/MovieModal.tsx):

1) **Sumber URL embed (yang dipakai iframe)**
- Baris [MovieModal.tsx:L71](file:///e:/herd/netflix/resources/js/components/netflix/MovieModal.tsx#L69-L72):
  - `const bestEmbed = videos?.best?.embed_url || null;`
- Ini adalah tempat paling aman untuk Anda ganti menjadi URL embed Anda sendiri.

2) **Iframe player yang merender video**
- Baris [MovieModal.tsx:L82-L90](file:///e:/herd/netflix/resources/js/components/netflix/MovieModal.tsx#L81-L90):
  - `src={bestEmbed}`
- Kalau Anda sudah mengganti `bestEmbed` menjadi URL Anda, iframe akan otomatis memutar URL tersebut ketika tombol Play diklik.

## Rangka (skenario edit yang Anda lakukan sendiri)
- Anda cukup ubah bagian `bestEmbed` agar membentuk URL yang Anda inginkan berdasarkan:
  - `id` (TMDB id) di [MovieModal.tsx:L33](file:///e:/herd/netflix/resources/js/components/netflix/MovieModal.tsx#L29-L34)
  - `mediaType` (movie/tv) di [MovieModal.tsx:L29-L33](file:///e:/herd/netflix/resources/js/components/netflix/MovieModal.tsx#L29-L33)

Contoh bentuk rangka logikanya (tanpa menyebut provider tertentu):
- Jika `mediaType === 'movie'` → `embedUrl = `${BASE}/movie/${id}`
- Jika `mediaType === 'tv'` → `embedUrl = `${BASE}/tv/${id}/${season}/${episode}`

Catatan: untuk TV show Anda perlu menyediakan `season` dan `episode` (bisa default 1/1 dulu, atau ambil dari pilihan user).

## Opsi implementasi yang saya bisa kerjakan setelah Anda konfirmasi
Karena Anda minta “siapkan rangka”, setelah Anda konfirmasi saya bisa buatkan (tanpa mengunci ke provider tertentu):
- Konfigurasi `.env`: `EMBED_BASE_URL=...`
- Helper di MovieModal untuk build URL embed dari `mediaType + id (+ season/episode)`
- UI kecil untuk pilih Season/Episode kalau `mediaType==='tv'`

Anda tetap bebas mengganti `EMBED_BASE_URL` ke layanan embed pilihan Anda dan mengubah format URL di 1 fungsi helper saja.
