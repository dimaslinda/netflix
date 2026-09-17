import { cn } from '@/lib/utils';

interface BrandMarkProps {
    className?: string;
    /** Sembunyikan wordmark dan sisakan lambangnya saja, untuk layar sempit. */
    symbolOnly?: boolean;
}

/**
 * Tanda pengenal aplikasi.
 *
 * Lambangnya dibangun dari geometri sendiri: dua bilah rana yang saling silang
 * membentuk bukaan, mengacu pada rana kamera film. Bentuk itu dipilih karena
 * katalog aplikasi ini berisi sinema arsip, dan lambangnya harus menunjuk ke
 * alat perekamnya, bukan ke layanan siaran mana pun.
 *
 * Wordmark sengaja berupa teks biasa, bukan gambar, supaya ikut menyesuaikan
 * ukuran fon pemirsa dan tetap terbaca pembaca layar.
 */
export default function BrandMark({ className, symbolOnly }: BrandMarkProps) {
    return (
        <span className={cn('flex items-center gap-2.5', className)}>
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6 w-6 shrink-0"
                fill="none"
            >
                <rect
                    x="1.5"
                    y="1.5"
                    width="21"
                    height="21"
                    rx="5"
                    stroke="var(--cinema-accent)"
                    strokeWidth="2"
                />
                <path
                    d="M12 6.5 L17.5 12 L12 17.5 L6.5 12 Z"
                    fill="var(--cinema-accent)"
                />
            </svg>

            {!symbolOnly && (
                <span className="text-[19px] leading-none font-bold tracking-[0.22em] text-[var(--cinema-ink)]">
                    LAYAR
                </span>
            )}
        </span>
    );
}
