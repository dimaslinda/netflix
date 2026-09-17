# WeFlix / Layar - Platform Streaming Video Berbasis Laravel 12 & React (Inertia.js)

Aplikasi web streaming video premium dengan pengalaman visual ala **Netflix** dan fitur katalog studio ala **Disney+ Hotstar**. Dibangun menggunakan arsitektur modern berbasis **Laravel 12**, **Inertia.js v2**, **React 19**, **TypeScript**, dan **Tailwind CSS v4**, terintegrasi langsung dengan API The Movie Database (TMDB) dan sistem pemutar video multi-server.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Arsitektur & Stack Teknologi](#arsitektur--stack-teknologi)
- [Prasyarat Sistem](#prasyarat-sistem)
- [Langkah Instalasi](#langkah-instalasi)
- [Konfigurasi Environment (.env)](#konfigurasi-environment-env)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Direktori Utama](#struktur-direktori-utama)
- [Panduan Pengujian & Build](#panduan-pengujian--build)
- [Lisensi](#lisensi)

---

## Fitur Utama

### 1. Desain Antarmuka Sinematik (Netflix Dark Experience)
- Desain bertema gelap bioskop premium dengan animasi transisi halus.
- Hero Carousel interaktif dengan cuplikan trailer latar, sinopsis, tombol tonton cepat, dan modal detail film.
- Navigasi responsif (Desktop & Mobile Drawer) dengan tap target minimal 44px ramah perangkat sentuh.

### 2. Multi-Server Streaming Video Player
- Pemutar video fleksibel dengan dukungan multi-server bawaan untuk menjamin ketersediaan tontonan:
  - **Server 1 (Default)**: VidLink (Dukungan subtitle dan pemutaran cepat)
  - **Server 2**: VidNest
  - **Server 3**: Embed.su
  - **Server 4**: Smashystream
  - **Server 5**: 2Embed
- Selector episode dan season interaktif untuk serial televisi (TV Series).
- Tombol navigasi kembali (*Back Button*) cerdas yang mengarahkan pemirsa kembali ke riwayat rute sebelumnya tanpa memicu reload halaman server.

### 3. Halaman Khusus Brand & Studio (Ala Disney+ Hotstar)
- Rute khusus `/browse/disney` yang menyajikan katalog studio papan atas dunia:
  - **Walt Disney Pictures**
  - **Pixar Animation Studios**
  - **Marvel Studios**
  - **Star Wars (Lucasfilm)**
  - **National Geographic**
- Filter genre sekunder instan (Semua, Animasi, Laga, Petualangan, Fiksi Ilmiah, Dokumenter).

### 4. Sistem Akun Pengguna Mandiri Khas Netflix (`/account`)
- Menggantikan sepenuhnya dashboard admin generik dengan halaman akun bernuansa Netflix murni (tanpa sidebar admin).
- **Preset Avatar Netflix**: 6 pilihan avatar SVG senyuman khas (*Merah Netflix*, *Biru Cool*, *Kuning Ceria*, *Hijau Santai*, *Ungu Misterius*, *Hitam Ninja*).
- **Pengaturan Profil**: Ubah nama tampilan, avatar, dan alamat email.
- **Keamanan Akun**:
  - Ubah kata sandi akun.
  - Kunci profil dengan PIN 4-digit terenkripsi bcrypt (dilengkapi status PIN Aktif).
- **Daftar Saya (Bookmarks)**: Simpan judul favorit ke koleksi pribadi pengguna.
- **Riwayat Tontonan (Watch History)**: Melacak episode terakhir, progres durasi waktu tonton (*resume playback*), dan stempel waktu tonton.

### 5. Pencarian dan Kategori Lengkap
- Pencarian instan (debounced search) mencakup film dan serial TV.
- Filter genre film: Laga, Komedi, Horor, Fiksi Ilmiah, Drama Korea, Anime, dan Dokumenter.
- Kategori bawaan: *Trending*, *Popular TV*, *Now Playing*, dan *Top Rated*.

---

## Arsitektur & Stack Teknologi

### Backend
- **Framework**: Laravel 12.x (PHP 8.2+)
- **Routing & Rendering**: Inertia.js Laravel Adapter v2.0
- **Autentikasi**: Laravel Fortify
- **Database**: SQLite (Bawaan development) / MySQL / PostgreSQL
- **Integrasi Pihak Ketiga**: HTTP Client Laravel ke The Movie Database (TMDB) API v3

### Frontend
- **Library UI**: React 19 dengan TypeScript strict typing
- **Styling**: Tailwind CSS v4, Radix UI Primitives, Lucide React Icons
- **Animasi & Transisi**: Framer Motion
- **Build Tool**: Vite 7 dengan plugin `@laravel/vite-plugin-wayfinder`

---

## Prasyarat Sistem

Sebelum memulai instalasi, pastikan lingkungan pengembangan Anda telah memenuhi spesifikasi berikut:
- **PHP**: Versi 8.2 atau lebih baru
- **Composer**: Versi 2.x
- **Node.js**: Versi 20.x atau 22.x LTS
- **NPM**: Versi 10.x atau lebih baru
- **Akun Pengembang TMDB**: Untuk memperoleh API Key / Access Token gratis di [The Movie Database (TMDB)](https://www.themoviedb.org/)

---

## Langkah Instalasi

Ikuti tahapan instalasi berikut untuk menyiapkan aplikasi secara lokal:

```bash
# 1. Masuk ke direktori proyek
cd e:/herd/netflix

# 2. Pasang dependensi PHP (Composer)
composer install

# 3. Pasang dependensi JavaScript/TypeScript (NPM)
npm install

# 4. Salin berkas konfigurasi lingkungan
cp .env.example .env

# 5. Buat Application Encryption Key
php artisan key:generate

# 6. Siapkan berkas database SQLite (jika menggunakan SQLite)
touch database/database.sqlite

# 7. Jalankan migrasi tabel database
php artisan migrate
```

---

## Konfigurasi Environment (.env)

Buka berkas `.env` dan lengkapi konfigurasi utama berikut:

```env
APP_NAME="WeFlix"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://netflix.test

# Database (Gunakan SQLite untuk kemudahan lokal)
DB_CONNECTION=sqlite

# Kunci API The Movie Database (TMDB)
TMDB_API_KEY=masukkan_tmdb_api_key_anda
TMDB_ACCESS_TOKEN=masukkan_tmdb_bearer_token_anda
TMDB_BASE_URL=https://api.themoviedb.org/3

# Konfigurasi Pemutar Video
VITE_EMBED_BASE_URL=https://vidlink.pro
```

---

## Menjalankan Aplikasi

Anda dapat menjalankan server pengembangan menggunakan skrip yang disediakan:

```bash
# Menjalankan server Laravel dan Vite secara bersamaan
npm run dev
```

Atau jalankan di dua jendela terminal terpisah:

```bash
# Terminal 1: Menjalankan backend server Laravel
php artisan serve

# Terminal 2: Menjalankan Vite dev server
npm run dev
```

Aplikasi siap diakses melalui peramban di URL:
`http://localhost:8000` atau domain virtual Anda (contoh: `http://netflix.test`).

---

## Struktur Direktori Utama

Berikut ringkasan berkas dan direktori penting dalam proyek:

```text
netflix/
├── app/
│   ├── Http/Controllers/
│   │   ├── HomeController.php             # Katalog beranda, trending, serial, dan kategori
│   │   ├── MovieController.php            # Detail film, serial, dan pemutar video
│   │   └── UserAccountController.php      # Akun pengguna, avatar, PIN, bookmark, riwayat
│   ├── Models/
│   │   ├── User.php                       # Model pengguna dengan mutator avatar & PIN
│   │   ├── UserBookmark.php               # Model daftar tontonan (Daftar Saya)
│   │   └── WatchHistory.php               # Model riwayat tontonan dan progres
│   └── Services/
│       └── TmdbService.php                # Layanan konsumsi API TMDB dan katalog studio
├── database/
│   └── migrations/                        # Skema database pengguna, riwayat, bookmark, pin
├── resources/
│   ├── js/
│   │   ├── components/
│   │   │   └── netflix/
│   │   │       ├── Navbar.tsx             # Navigasi utama dengan avatar dinamis
│   │   │       ├── NetflixAvatar.tsx      # Komponen avatar SVG khas Netflix
│   │   │       ├── HeroCarousel.tsx       # Banner utama interaktif
│   │   │       ├── MovieModal.tsx         # Modal sinopsis dan cuplikan judul
│   │   │       ├── MovieRow.tsx           # Baris korsel film horizontal
│   │   │       └── Footer.tsx             # Footer sinematik
│   │   ├── lib/
│   │   │   └── avatar-presets.ts          # Koleksi tema preset avatar pengguna
│   │   └── pages/
│   │       ├── Home.tsx                   # Halaman beranda utama
│   │       ├── Account.tsx                # Halaman akun Netflix murni
│   │       ├── Watch.tsx                  # Pemutar video multi-server
│   │       ├── BrowseCategory.tsx         # Jelajah kategori & studio Disney+
│   │       └── Search.tsx                 # Halaman pencarian judul
└── routes/
    └── web.php                            # Definisi seluruh rute web & API internal
```

---

## Panduan Pengujian & Build

### Pemeriksaan Tipe TypeScript
Untuk memvalidasi integritas pengetikan kode TypeScript tanpa kompilasi penuh:
```bash
npm run types
```

### Build Aset Produksi
Untuk mengompilasi bundel JavaScript, CSS, dan aset statis untuk deployment produksi:
```bash
npm run build
```

### Format dan Linting Kode
```bash
# Format kode frontend
npm run format

# Linting backend dengan Laravel Pint
composer lint
```

---

## Lisensi

Proyek ini dikembangkan untuk tujuan edukasi dan portofolio pribadi. Seluruh metadata film, poster, dan cuplikan disediakan oleh API [The Movie Database (TMDB)](https://www.themoviedb.org/).
