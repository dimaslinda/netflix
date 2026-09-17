import { Info, Play, Star, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { Movie } from '@/types/tmdb';

interface HeroProps {
    movie: Movie;
    onPlay?: (movie: Movie) => void;
    onMoreInfo?: (movie: Movie) => void;
}

/** Jeda sebelum cuplikan menggantikan seni kunci. Cukup lama agar gambar diam
 *  sempat terbaca lebih dulu, cukup pendek agar halaman tidak terasa beku. */
const TRAILER_DELAY_MS = 3000;

const OVERVIEW_LIMIT = 220;

/**
 * Panel pembuka beranda.
 *
 * Semua yang tampil di sini datang dari TMDB apa adanya: judul, tahun tayang,
 * rata-rata penilaian, sinopsis. Tidak ada skor kecocokan, klasifikasi umur,
 * atau lencana resolusi, karena tidak satu pun dari itu yang benar-benar kita
 * ketahui, dan angka karangan di panel terbesar halaman adalah kebohongan
 * paling mahal yang bisa dipasang sebuah katalog.
 */
export default function Hero({ movie, onPlay, onMoreInfo }: HeroProps) {
    const [isMuted, setIsMuted] = useState(true);
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [isTrailerVisible, setIsTrailerVisible] = useState(false);
    const [isArtLoaded, setIsArtLoaded] = useState(false);

    const mediaType = movie.media_type ?? 'movie';
    const artPath = movie.backdrop_path ?? movie.poster_path;
    const artUrl = artPath
        ? `https://image.tmdb.org/t/p/w1280${artPath}`
        : null;

    const title = movie.title ?? movie.name ?? movie.original_name ?? '';

    const releaseYear =
        movie.release_date?.slice(0, 4) ?? movie.first_air_date?.slice(0, 4);

    const rating =
        typeof movie.vote_average === 'number' && movie.vote_average > 0
            ? movie.vote_average.toFixed(1)
            : null;

    const overview = movie.overview?.trim();

    const loadTrailer = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/tmdb/${mediaType}/${movie.id}/videos`,
            );
            const data = (await response.json()) as {
                best?: { embed_url?: string | null };
            };

            if (data.best?.embed_url) {
                setTrailerUrl(`${data.best.embed_url}&mute=1`);
                setIsTrailerVisible(true);
            }
        } catch {
            // Cuplikan hanya pemanis. Kegagalan memuatnya membiarkan seni kunci
            // tetap tampil, jadi tidak ada yang perlu dilaporkan ke pemirsa.
        }
    }, [mediaType, movie.id]);

    useEffect(() => {
        const timer = setTimeout(() => void loadTrailer(), TRAILER_DELAY_MS);

        return () => clearTimeout(timer);
    }, [loadTrailer]);

    const isRevealed = !artUrl || isArtLoaded;

    const toggleTrailerSound = () => {
        const next = !isMuted;
        setIsMuted(next);
        setTrailerUrl((url) =>
            url ? url.replace(/mute=\d/, `mute=${next ? 1 : 0}`) : url,
        );
    };

    return (
        <section
            className="relative flex min-h-[520px] flex-col justify-end pb-16 md:h-[76vh] md:max-h-[760px] md:pb-24 lg:pb-32"
            aria-label={`Sorotan: ${title}`}
        >
            <div className="absolute inset-0 overflow-hidden bg-[var(--cinema-raised)]">
                {artUrl && (
                    <img
                        src={artUrl}
                        alt=""
                        onLoad={() => setIsArtLoaded(true)}
                        className={cn(
                            'absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-1000',
                            isTrailerVisible && trailerUrl
                                ? 'opacity-0'
                                : isArtLoaded
                                  ? 'opacity-100'
                                  : 'opacity-0',
                        )}
                    />
                )}

                {isTrailerVisible && trailerUrl && (
                    <iframe
                        src={trailerUrl}
                        title={`Cuplikan ${title}`}
                        allow="autoplay; encrypted-media"
                        className="pointer-events-none absolute inset-0 h-full w-full scale-150"
                    />
                )}

                {/* Dua lapis peredup: satu dari bawah agar teks terbaca di atas
                    adegan terang apa pun, satu dari kiri agar kolom teks punya
                    dasar gelap yang konsisten. Keduanya memenuhi ambang kontras
                    WCAG untuk teks putih. */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--cinema-base)] via-[var(--cinema-base)]/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--cinema-base)] via-[var(--cinema-base)]/30 to-transparent" />
            </div>

            <div
                className={cn(
                    'relative z-10 max-w-2xl px-4 transition-all duration-700 md:px-12 lg:px-16',
                    isRevealed
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-6 opacity-0',
                )}
            >
                <h1 className="text-3xl font-black tracking-tight text-[var(--cinema-ink)] md:text-5xl lg:text-6xl">
                    {title}
                </h1>

                {(releaseYear ?? rating) && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--cinema-ink-soft)]">
                        {releaseYear && <span>{releaseYear}</span>}
                        {rating && (
                            <span className="flex items-center gap-1.5">
                                <Star
                                    className="h-3.5 w-3.5 fill-[var(--cinema-accent)] text-[var(--cinema-accent)]"
                                    aria-hidden="true"
                                />
                                {rating}
                                <span className="text-[var(--cinema-ink-faint)]">
                                    dari 10 di TMDB
                                </span>
                            </span>
                        )}
                    </div>
                )}

                {overview && (
                    <p className="mt-4 text-sm leading-relaxed text-[var(--cinema-ink-soft)] md:text-base">
                        {overview.length > OVERVIEW_LIMIT
                            ? `${overview.slice(0, OVERVIEW_LIMIT).trimEnd()}...`
                            : overview}
                    </p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => onPlay?.(movie)}
                        className="cinema-focus flex min-h-11 items-center gap-2 rounded bg-[var(--cinema-ink)] px-6 text-[15px] font-bold text-[var(--cinema-base)] transition hover:bg-white active:scale-[0.98]"
                    >
                        <Play
                            className="h-5 w-5"
                            fill="currentColor"
                            aria-hidden="true"
                        />
                        Putar
                    </button>

                    <button
                        type="button"
                        onClick={() => onMoreInfo?.(movie)}
                        className="cinema-focus flex min-h-11 items-center gap-2 rounded bg-white/15 px-6 text-[15px] font-bold text-[var(--cinema-ink)] backdrop-blur-sm transition hover:bg-white/25 active:scale-[0.98]"
                    >
                        <Info className="h-5 w-5" aria-hidden="true" />
                        Rincian
                    </button>

                    {trailerUrl && (
                        <button
                            type="button"
                            onClick={toggleTrailerSound}
                            aria-label={
                                isMuted
                                    ? 'Nyalakan suara cuplikan'
                                    : 'Bisukan cuplikan'
                            }
                            className="cinema-focus flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-[var(--cinema-ink)] transition hover:border-white/70 hover:bg-white/10"
                        >
                            {isMuted ? (
                                <VolumeX
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Volume2
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
