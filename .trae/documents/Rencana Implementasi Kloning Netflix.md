Untuk mengubah project ini menjadi kloning Netflix, saya merekomendasikan penggunaan **TMDB (The Movie Database) API**. Ini adalah standar industri untuk data film open-source yang menyediakan poster berkualitas tinggi, backdrop, dan data trending yang sangat mirip dengan tampilan Netflix.

Berikut adalah rencana implementasi langkah demi langkah:

## 1. Persiapan & Konfigurasi API
-   **Rekomendasi API**: TMDB (The Movie Database). Anda perlu mendaftar (gratis) untuk mendapatkan API Key.
-   **Setup Environment**: Menambahkan `TMDB_API_KEY` dan `TMDB_BASE_URL` ke dalam file `.env`.
-   **Backend Service**: Membuat `App\Services\TmdbService` untuk menangani komunikasi dengan API (fetch trending movies, genres, top rated, dll).

## 2. Struktur Backend (Laravel)
-   **Controller**: Membuat `MovieController` untuk mengambil data dari `TmdbService` dan mengirimkannya ke frontend via Inertia.
-   **Routes**: Mengubah `routes/web.php` untuk mengarahkan halaman utama (`/`) ke tampilan Netflix Home, bukan halaman Welcome default.

## 3. Implementasi Frontend (React + Inertia + Tailwind)
Kita akan menggunakan komponen yang sudah ada (shadcn/ui & lucide-react) dan membuat komponen baru khusus Netflix:
-   **Layout Utama**:
    -   `Navbar`: Transparan di atas, berubah menjadi hitam solid saat di-scroll.
    -   `Hero Section`: Menampilkan film trending dengan backdrop besar, judul, dan tombol "Play" / "More Info".
-   **Komponen Film**:
    -   `MovieRow`: Komponen untuk menampilkan daftar film secara horizontal (scrollable).
    -   `MovieCard`: Kartu poster film dengan efek hover (zoom in).
-   **Halaman**:
    -   `Home`: Menggabungkan Hero dan beberapa MovieRow (Trending, Top Rated, Action, Comedy, dll).

## 4. Pembersihan (Cleanup)
-   Menghapus atau memodifikasi halaman default Laravel (`welcome.blade.php` / `Welcome.tsx`) agar project langsung terbuka sebagai aplikasi streaming.

Apakah Anda setuju dengan rencana ini? Jika ya, saya akan mulai dengan membuat Service untuk API film.