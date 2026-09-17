import BrandMark from './BrandMark';

/**
 * Kaki halaman.
 *
 * Isinya hanya pernyataan yang bisa diperiksa: sumber metadata, sumber takarir,
 * dan sifat katalognya. Versi sebelumnya mencantumkan baris hak cipta atas nama
 * perusahaan lain, yang bukan sekadar salah tetapi juga klaim yang tidak pernah
 * benar.
 *
 * Atribusi TMDB bukan basa-basi: syarat pemakaian API mereka mewajibkan
 * pernyataan bahwa aplikasi ini memakai data mereka dan tidak didukung mereka.
 */
export default function Footer() {
    return (
        <footer className="border-t border-[var(--cinema-line)] px-4 py-12 md:px-12 lg:px-16">
            <BrandMark />

            <div className="mt-6 max-w-2xl space-y-3 text-[13px] leading-relaxed text-[var(--cinema-ink-faint)]">
                <p>
                    Katalog pemutaran berisi film berlisensi terbuka dan berkas
                    milik Anda sendiri. Tidak ada judul berpelindung DRM yang
                    diputar di sini.
                </p>
                <p>
                    Metadata judul, poster, dan sinopsis berasal dari TMDB.
                    Aplikasi ini memakai API TMDB tetapi tidak disokong atau
                    disertifikasi oleh TMDB.
                </p>
                <p>
                    Takarir berasal dari OpenSubtitles dan SubDL. Takarir yang
                    ditandai terjemahan mesin diproses sendiri di peladen Anda.
                </p>
            </div>
        </footer>
    );
}
