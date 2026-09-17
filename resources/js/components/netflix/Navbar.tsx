import { Link, router, usePage } from '@inertiajs/react';
import {
    Bookmark,
    ChevronDown,
    Clock,
    LogOut,
    Menu,
    Search,
    User as UserIcon,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import BrandMark from './BrandMark';
import NetflixAvatar from './NetflixAvatar';

interface NavbarProps {
    /** Rute yang sedang aktif, dipakai untuk menandai tautan terpilih. */
    activePath?: string;
}

/**
 * Setiap tautan di sini menunjuk rute yang benar-benar terdaftar di
 * routes/web.php. Menu yang belum punya halaman tidak dipasang, karena tautan
 * buntu lebih merusak kepercayaan daripada menu yang pendek.
 */
const PRIMARY_LINKS = [
    { label: 'Beranda', href: '/' },
    { label: 'Disney+', href: '/browse/disney' },
    { label: 'Film', href: '/browse/trending' },
    { label: 'Serial', href: '/browse/popular-tv' },
    { label: 'Anak-anak', href: '/browse/kids' },
    { label: 'Baru Tayang', href: '/browse/now-playing' },
    { label: 'Daftar Saya', href: '/account?tab=bookmarks' },
] as const;

const GENRE_LINKS = [
    { label: 'Laga', href: '/browse/action' },
    { label: 'Komedi', href: '/browse/comedy' },
    { label: 'Horor', href: '/browse/horror' },
    { label: 'Fiksi Ilmiah', href: '/browse/scifi' },
    { label: 'Drama Korea', href: '/browse/korean' },
    { label: 'Anime', href: '/browse/anime' },
    { label: 'Dokumenter', href: '/browse/documentaries' },
] as const;

interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

export default function Navbar({ activePath }: NavbarProps) {
    const { auth } = usePage<{ auth?: { user?: AuthUser | null } }>().props;
    const user = auth?.user;

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Tutup dropdown profil saat mengeklik di luar elemen
    useEffect(() => {
        if (!isProfileOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(e.target as Node)
            ) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen]);

    // Bilah atas tembus pandang di puncak halaman supaya seni kunci hero utuh,
    // lalu memadat begitu pemirsa menggulir agar tautan tetap terbaca.
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 24);

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Menu geser menahan gulir halaman di belakangnya, dan tertutup dengan
    // Escape seperti dialog mana pun.
    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMenuOpen]);

    const currentPath =
        activePath ??
        (typeof window === 'undefined'
            ? '/'
            : window.location.pathname + window.location.search);

    return (
        <>
            <header
                className={cn(
                    'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
                    isScrolled
                        ? 'bg-[var(--cinema-base)]/95 backdrop-blur-md'
                        : 'bg-gradient-to-b from-black/80 to-transparent',
                )}
            >
                <nav
                    aria-label="Navigasi utama"
                    className="flex h-16 items-center gap-6 px-4 md:h-[68px] md:px-12 lg:px-16"
                >
                    <Link
                        href="/"
                        aria-label="Ke beranda"
                        className="cinema-focus shrink-0"
                    >
                        <BrandMark />
                    </Link>

                    <ul className="hidden items-center gap-6 lg:flex">
                        {PRIMARY_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        'cinema-focus text-[13px] font-medium transition-colors',
                                        currentPath === link.href
                                            ? 'text-[var(--cinema-ink)]'
                                            : 'text-[var(--cinema-ink-soft)] hover:text-[var(--cinema-ink)]',
                                    )}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => router.visit('/search')}
                            aria-label="Cari judul"
                            className="cinema-focus flex h-11 w-11 items-center justify-center rounded-full text-[var(--cinema-ink)] transition hover:bg-white/10"
                        >
                            <Search className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Bagian Akun / Autentikasi Pengguna */}
                        {user ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsProfileOpen((prev) => !prev)
                                    }
                                    aria-label="Menu profil akun"
                                    aria-expanded={isProfileOpen}
                                    className="cinema-focus flex items-center gap-1.5 rounded-sm p-1 transition hover:opacity-85"
                                >
                                    <NetflixAvatar
                                        avatarId={user.avatar}
                                        size="sm"
                                    />
                                    <ChevronDown
                                        className={cn(
                                            'h-3.5 w-3.5 text-zinc-400 transition-transform duration-200',
                                            isProfileOpen && 'rotate-180',
                                        )}
                                        aria-hidden="true"
                                    />
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-white/10 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-md">
                                        <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2.5">
                                            <NetflixAvatar
                                                avatarId={user.avatar}
                                                size="sm"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-bold text-white">
                                                    {user.name}
                                                </p>
                                                <p className="truncate text-[11px] text-zinc-400">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="py-1">
                                            <Link
                                                href="/account?tab=bookmarks"
                                                onClick={() =>
                                                    setIsProfileOpen(false)
                                                }
                                                className="flex items-center gap-2.5 rounded px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                                            >
                                                <Bookmark className="h-4 w-4 text-zinc-400" />
                                                <span>Daftar Saya</span>
                                            </Link>

                                            <Link
                                                href="/account?tab=history"
                                                onClick={() =>
                                                    setIsProfileOpen(false)
                                                }
                                                className="flex items-center gap-2.5 rounded px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                                            >
                                                <Clock className="h-4 w-4 text-zinc-400" />
                                                <span>Riwayat Tontonan</span>
                                            </Link>

                                            <Link
                                                href="/account"
                                                onClick={() =>
                                                    setIsProfileOpen(false)
                                                }
                                                className="flex items-center gap-2.5 rounded px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                                            >
                                                <UserIcon className="h-4 w-4 text-zinc-400" />
                                                <span>Pengaturan Akun</span>
                                            </Link>
                                        </div>

                                        <div className="border-t border-white/10 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsProfileOpen(false);
                                                    router.post('/logout');
                                                }}
                                                className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Keluar</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="cinema-focus flex min-h-[36px] items-center justify-center rounded bg-[#E50914] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95"
                                >
                                    Masuk
                                </Link>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(true)}
                            aria-label="Buka menu"
                            aria-expanded={isMenuOpen}
                            className="cinema-focus flex h-11 w-11 items-center justify-center rounded-full text-[var(--cinema-ink)] transition hover:bg-white/10 lg:hidden"
                        >
                            <Menu className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </nav>
            </header>

            {isMenuOpen && (
                <div className="fixed inset-0 z-[60]">
                    <button
                        type="button"
                        aria-label="Tutup menu"
                        onClick={() => setIsMenuOpen(false)}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu navigasi"
                        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-[var(--cinema-raised)] p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between">
                            <BrandMark />
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(false)}
                                aria-label="Tutup menu"
                                className="cinema-focus flex h-11 w-11 items-center justify-center rounded-full text-[var(--cinema-ink)] transition hover:bg-white/10"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        <MenuSection
                            title="Jelajah"
                            links={PRIMARY_LINKS}
                            onNavigate={() => setIsMenuOpen(false)}
                        />
                        <MenuSection
                            title="Genre"
                            links={GENRE_LINKS}
                            onNavigate={() => setIsMenuOpen(false)}
                        />

                        {/* Mobile Account Section */}
                        <div className="mt-8 border-t border-white/10 pt-6">
                            {user ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 px-3 pb-3">
                                        <NetflixAvatar
                                            avatarId={user.avatar}
                                            size="md"
                                        />
                                        <div className="min-w-0 flex-1 flex flex-col">
                                            <span className="truncate text-sm font-bold text-white">
                                                {user.name}
                                            </span>
                                            <span className="truncate text-xs text-zinc-400">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        href="/account?tab=bookmarks"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="cinema-focus flex min-h-11 items-center gap-2.5 rounded px-3 text-[15px] font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                                    >
                                        <Bookmark className="h-4 w-4 text-zinc-400" />
                                        <span>Daftar Saya</span>
                                    </Link>
                                    <Link
                                        href="/account?tab=history"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="cinema-focus flex min-h-11 items-center gap-2.5 rounded px-3 text-[15px] font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                                    >
                                        <Clock className="h-4 w-4 text-zinc-400" />
                                        <span>Riwayat Tontonan</span>
                                    </Link>
                                    <Link
                                        href="/account"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="cinema-focus flex min-h-11 items-center gap-2.5 rounded px-3 text-[15px] font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
                                    >
                                        <UserIcon className="h-4 w-4 text-zinc-400" />
                                        <span>Pengaturan Akun</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.post('/logout');
                                        }}
                                        className="cinema-focus flex min-h-11 items-center gap-2.5 rounded px-3 text-left text-[15px] font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Keluar</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="cinema-focus flex min-h-11 items-center justify-center rounded bg-[#E50914] px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="cinema-focus flex min-h-11 items-center justify-center rounded border border-white/20 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
                                    >
                                        Daftar Akun Baru
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function MenuSection({
    title,
    links,
    onNavigate,
}: {
    title: string;
    links: readonly { label: string; href: string }[];
    onNavigate: () => void;
}) {
    return (
        <section className="mt-8">
            <h2 className="text-[11px] font-bold tracking-widest text-[var(--cinema-ink-faint)] uppercase">
                {title}
            </h2>
            <ul className="mt-3 space-y-1">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link
                            href={link.href}
                            onClick={onNavigate}
                            className="cinema-focus flex min-h-11 items-center rounded px-3 text-[15px] font-medium text-[var(--cinema-ink-soft)] transition hover:bg-white/5 hover:text-[var(--cinema-ink)]"
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
