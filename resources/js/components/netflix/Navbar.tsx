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
    { label: 'Live TV', href: '/live-tv', isLive: true },
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

    // Pantau scroll untuk memberi latar belakang pekat saat halaman bergeser
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Tutup dropdown profil jika pengguna mengeklik di luar area
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target as Node)
            ) {
                setIsProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileOpen]);

    // Kunci scroll halaman utama ketika laci menu mobile sedang terbuka
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    const resolvedActivePath =
        activePath ??
        (typeof window !== 'undefined' ? window.location.pathname : '/');

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <header
                className={cn(
                    'fixed top-0 z-50 flex h-16 w-full items-center transition-colors duration-300',
                    isScrolled
                        ? 'bg-[var(--cinema-base)]/95 shadow-md backdrop-blur-md'
                        : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent',
                )}
            >
                <nav
                    aria-label="Navigasi Utama"
                    className="flex w-full items-center px-4 md:px-12 lg:px-16"
                >
                    <BrandMark />

                    {/* Navigasi Desktop */}
                    <ul className="ml-8 hidden items-center gap-5 lg:flex">
                        {PRIMARY_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        'cinema-focus flex items-center rounded-sm text-sm transition',
                                        resolvedActivePath === link.href
                                            ? 'text-[var(--cinema-ink)] font-bold'
                                            : 'text-[var(--cinema-ink-soft)] hover:text-[var(--cinema-ink)]',
                                    )}
                                >
                                    {'isLive' in link && link.isLive && (
                                        <span className="mr-1.5 flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                                        </span>
                                    )}
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
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Keluar dari Netflix</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="cinema-focus rounded bg-[#E50914] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#b80710]"
                            >
                                Masuk
                            </Link>
                        )}

                        {/* Tombol Pemicu Menu Mobile */}
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(true)}
                            aria-label="Buka menu navigasi"
                            className="cinema-focus flex h-11 w-11 items-center justify-center rounded-full text-[var(--cinema-ink)] transition hover:bg-white/10 lg:hidden"
                        >
                            <Menu className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                </nav>
            </header>

            {/* Panel Samping Menu Mobile */}
            {isMenuOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu navigasi utama"
                    className="fixed inset-0 z-50 lg:hidden"
                >
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    <nav
                        aria-label="Daftar navigasi mobile"
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
                                            handleLogout();
                                        }}
                                        className="cinema-focus flex min-h-11 items-center gap-2.5 rounded px-3 text-left text-[15px] font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Keluar</span>
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="cinema-focus flex min-h-11 items-center justify-center rounded bg-[#E50914] text-sm font-bold text-white transition hover:bg-[#b80710]"
                                >
                                    Masuk ke Akun
                                </Link>
                            )}
                        </div>
                    </nav>
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
    links: readonly { label: string; href: string; isLive?: boolean }[];
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
                            {link.isLive && (
                                <span className="mr-2 flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                                </span>
                            )}
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
