import { Head, router } from '@inertiajs/react';
import {
    Bookmark,
    Check,
    Clock,
    KeyRound,
    Lock,
    Play,
    Shield,
    Trash2,
    User as UserIcon,
} from 'lucide-react';
import React, { useState } from 'react';

import Footer from '@/components/netflix/Footer';
import Navbar from '@/components/netflix/Navbar';
import NetflixAvatar from '@/components/netflix/NetflixAvatar';
import { AVATAR_PRESETS } from '@/lib/avatar-presets';
import { cn } from '@/lib/utils';

interface AccountProps {
    user: {
        id: number;
        name: string;
        email: string;
        avatar: string;
        has_pin: boolean;
        created_at: string;
    };
    watchHistories: Array<{
        id: number;
        tmdb_id: string;
        media_type: 'movie' | 'tv';
        title: string;
        poster_path: string | null;
        backdrop_path: string | null;
        season?: number;
        episode?: number;
        progress_seconds?: number;
        last_watched_at?: string;
    }>;
    bookmarks: Array<{
        id: number;
        tmdb_id: string;
        media_type: 'movie' | 'tv';
        title: string;
        poster_path: string | null;
        backdrop_path: string | null;
        vote_average?: number;
        release_date?: string;
    }>;
    initialTab?: 'profile' | 'security' | 'bookmarks' | 'history';
}

function getXsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function Account({
    user: initialUser,
    watchHistories: initialHistories,
    bookmarks: initialBookmarks,
    initialTab = 'profile',
}: AccountProps) {
    const [currentTab, setCurrentTab] = useState(initialTab);
    const [user, setUser] = useState(initialUser);
    const [histories, setHistories] = useState(initialHistories);
    const [bookmarks, setBookmarks] = useState(initialBookmarks);

    // Profile form state
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileFeedback, setProfileFeedback] = useState<{
        type: 'success' | 'error';
        msg: string;
    } | null>(null);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState<{
        type: 'success' | 'error';
        msg: string;
    } | null>(null);

    // PIN form state
    const [pin, setPin] = useState('');
    const [currentPin, setCurrentPin] = useState('');
    const [isSavingPin, setIsSavingPin] = useState(false);
    const [pinFeedback, setPinFeedback] = useState<{
        type: 'success' | 'error';
        msg: string;
    } | null>(null);

    // Handle Profile Update
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileFeedback(null);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    name,
                    email,
                    avatar: selectedAvatar,
                }),
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setUser((prev) => ({
                    ...prev,
                    name: json.user.name,
                    email: json.user.email,
                    avatar: json.user.avatar,
                }));
                setProfileFeedback({
                    type: 'success',
                    msg: 'Profil dan avatar berhasil diperbarui.',
                });
            } else {
                setProfileFeedback({
                    type: 'error',
                    msg: json.message || json.error || 'Gagal memperbarui profil.',
                });
            }
        } catch {
            setProfileFeedback({
                type: 'error',
                msg: 'Terjadi kesalahan jaringan.',
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Handle Password Update
    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPassword(true);
        setPasswordFeedback(null);

        try {
            const res = await fetch('/api/user/password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordFeedback({
                    type: 'success',
                    msg: 'Kata sandi akun berhasil diperbarui.',
                });
            } else {
                setPasswordFeedback({
                    type: 'error',
                    msg:
                        json.message ||
                        json.error ||
                        'Gagal memperbarui kata sandi. Periksa kata sandi saat ini.',
                });
            }
        } catch {
            setPasswordFeedback({
                type: 'error',
                msg: 'Terjadi kesalahan saat mengubah kata sandi.',
            });
        } finally {
            setIsSavingPassword(false);
        }
    };

    // Handle PIN Update or Removal
    const handleSavePin = async (e: React.FormEvent, remove = false) => {
        e.preventDefault();
        setIsSavingPin(true);
        setPinFeedback(null);

        try {
            const res = await fetch('/api/user/pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    remove,
                    pin: remove ? null : pin,
                    current_pin: user.has_pin ? currentPin : null,
                }),
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setUser((prev) => ({ ...prev, has_pin: json.has_pin }));
                setPin('');
                setCurrentPin('');
                setPinFeedback({
                    type: 'success',
                    msg: remove
                        ? 'Kunci PIN profil berhasil dinonaktifkan.'
                        : 'Kunci PIN profil 4-digit berhasil disimpan.',
                });
            } else {
                setPinFeedback({
                    type: 'error',
                    msg:
                        json.message ||
                        json.error ||
                        'Gagal memperbarui PIN. Pastikan PIN 4 digit.',
                });
            }
        } catch {
            setPinFeedback({
                type: 'error',
                msg: 'Terjadi kesalahan saat memproses PIN.',
            });
        } finally {
            setIsSavingPin(false);
        }
    };

    // Remove item from history
    const handleDeleteHistory = async (tmdbId: string, mediaType: string) => {
        setHistories((prev) =>
            prev.filter(
                (h) => !(h.tmdb_id === tmdbId && h.media_type === mediaType),
            ),
        );

        try {
            await fetch('/api/user/watch-history', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    tmdb_id: tmdbId,
                    media_type: mediaType,
                }),
            });
        } catch {
            // Ignore error
        }
    };

    // Remove item from bookmarks
    const handleDeleteBookmark = async (item: {
        tmdb_id: string;
        media_type: 'movie' | 'tv';
        title: string;
    }) => {
        setBookmarks((prev) =>
            prev.filter(
                (b) =>
                    !(
                        b.tmdb_id === item.tmdb_id &&
                        b.media_type === item.media_type
                    ),
            ),
        );

        try {
            await fetch('/api/user/bookmarks/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    tmdb_id: item.tmdb_id,
                    media_type: item.media_type,
                    title: item.title,
                }),
            });
        } catch {
            // Ignore error
        }
    };

    return (
        <div className="min-h-screen bg-[var(--cinema-base)] text-[var(--cinema-ink)] select-none">
            <Head title="Pengaturan Akun" />
            <Navbar activePath="/account" />

            <main className="mx-auto max-w-5xl px-4 pt-24 pb-20 md:px-8">
                {/* Header Profil Pengguna */}
                <header className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-5">
                        <NetflixAvatar
                            avatarId={user.avatar}
                            name={user.name}
                            size="xl"
                        />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-black text-white md:text-3xl">
                                    {user.name}
                                </h1>
                                {user.has_pin && (
                                    <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                                        <Lock className="h-3 w-3" /> PIN Aktif
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-zinc-400">{user.email}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                                Anggota sejak {user.created_at}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        className="cinema-focus self-start rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 sm:self-auto"
                    >
                        Keluar dari Sesi
                    </button>
                </header>

                {/* Tab Navigasi Pengaturan */}
                <div className="no-scrollbar mt-6 flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-3">
                    {(
                        [
                            { id: 'profile', label: 'Profil & Avatar', icon: UserIcon },
                            { id: 'security', label: 'Keamanan (Password & PIN)', icon: Shield },
                            { id: 'bookmarks', label: `Daftar Saya (${bookmarks.length})`, icon: Bookmark },
                            { id: 'history', label: `Riwayat Tontonan (${histories.length})`, icon: Clock },
                        ] as const
                    ).map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setCurrentTab(tab.id)}
                                className={cn(
                                    'cinema-focus flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition md:text-sm',
                                    isActive
                                        ? 'bg-[#E50914] text-white shadow-md'
                                        : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Konten Tab */}
                <div className="mt-8">
                    {/* TAB 1: PROFIL & AVATAR */}
                    {currentTab === 'profile' && (
                        <div className="max-w-2xl space-y-8">
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Pilih Avatar Netflix
                                </h2>
                                <p className="text-xs text-zinc-400">
                                    Pilih ikon avatar yang mencerminkan profil Anda.
                                </p>

                                <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
                                    {AVATAR_PRESETS.map((preset) => {
                                        const isSelected =
                                            selectedAvatar === preset.id;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedAvatar(preset.id)
                                                }
                                                className={cn(
                                                    'cinema-focus group relative flex flex-col items-center gap-2 rounded-xl p-2 transition hover:bg-white/5',
                                                    isSelected &&
                                                        'ring-2 ring-[#E50914] bg-white/10',
                                                )}
                                            >
                                                <NetflixAvatar
                                                    avatarId={preset.id}
                                                    size="lg"
                                                />
                                                <span className="text-[11px] font-semibold text-zinc-300">
                                                    {preset.name}
                                                </span>
                                                {isSelected && (
                                                    <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E50914] text-white shadow">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <form
                                onSubmit={handleSaveProfile}
                                className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-sm"
                            >
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                    Informasi Dasar
                                </h3>

                                {profileFeedback && (
                                    <div
                                        className={cn(
                                            'rounded-lg p-3 text-xs font-semibold',
                                            profileFeedback.type === 'success'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-red-500/20 text-red-300 border border-red-500/30',
                                        )}
                                    >
                                        {profileFeedback.msg}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="name"
                                        className="text-xs font-semibold text-zinc-300"
                                    >
                                        Nama Lengkap
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="cinema-focus w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E50914]"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="email"
                                        className="text-xs font-semibold text-zinc-300"
                                    >
                                        Alamat Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="cinema-focus w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E50914]"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="cinema-focus mt-2 flex min-h-[44px] items-center justify-center rounded-lg bg-[#E50914] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
                                >
                                    {isSavingProfile
                                        ? 'Menyimpan...'
                                        : 'Simpan Profil & Avatar'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: KEAMANAN (PASSWORD & PIN) */}
                    {currentTab === 'security' && (
                        <div className="grid max-w-4xl gap-8 md:grid-cols-2">
                            {/* Ubah Password */}
                            <form
                                onSubmit={handleSavePassword}
                                className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <KeyRound className="h-5 w-5 text-[#E50914]" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                        Ubah Kata Sandi
                                    </h3>
                                </div>

                                {passwordFeedback && (
                                    <div
                                        className={cn(
                                            'rounded-lg p-3 text-xs font-semibold',
                                            passwordFeedback.type === 'success'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-red-500/20 text-red-300 border border-red-500/30',
                                        )}
                                    >
                                        {passwordFeedback.msg}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="curr-pwd"
                                        className="text-xs font-semibold text-zinc-300"
                                    >
                                        Kata Sandi Saat Ini
                                    </label>
                                    <input
                                        id="curr-pwd"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(e.target.value)
                                        }
                                        required
                                        className="cinema-focus w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#E50914]"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="new-pwd"
                                        className="text-xs font-semibold text-zinc-300"
                                    >
                                        Kata Sandi Baru (Min. 8 Karakter)
                                    </label>
                                    <input
                                        id="new-pwd"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        required
                                        className="cinema-focus w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#E50914]"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="conf-pwd"
                                        className="text-xs font-semibold text-zinc-300"
                                    >
                                        Konfirmasi Kata Sandi Baru
                                    </label>
                                    <input
                                        id="conf-pwd"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        required
                                        className="cinema-focus w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-[#E50914]"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingPassword}
                                    className="cinema-focus mt-2 flex min-h-[44px] items-center justify-center rounded-lg bg-[#E50914] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isSavingPassword
                                        ? 'Memproses...'
                                        : 'Ubah Kata Sandi'}
                                </button>
                            </form>

                            {/* Kunci PIN Profil */}
                            <form
                                onSubmit={(e) => handleSavePin(e, false)}
                                className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-amber-400" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                                        Kunci PIN Profil (4 Digit)
                                    </h3>
                                </div>

                                <p className="text-xs text-zinc-400">
                                    Kunci profil Anda dengan PIN 4 angka agar
                                    riwayat dan daftar tontonan tidak dibuka oleh
                                    pengguna lain di perangkat bersama.
                                </p>

                                {pinFeedback && (
                                    <div
                                        className={cn(
                                            'rounded-lg p-3 text-xs font-semibold',
                                            pinFeedback.type === 'success'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-red-500/20 text-red-300 border border-red-500/30',
                                        )}
                                    >
                                        {pinFeedback.msg}
                                    </div>
                                )}

                                {user.has_pin && (
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="curr-pin"
                                            className="text-xs font-semibold text-zinc-300"
                                        >
                                            PIN Saat Ini
                                        </label>
                                        <input
                                            id="curr-pin"
                                            type="password"
                                            maxLength={4}
                                            value={currentPin}
                                            onChange={(e) =>
                                                setCurrentPin(e.target.value)
                                            }
                                            placeholder="4 Digit PIN"
                                            className="cinema-focus w-36 tracking-widest text-center rounded-lg border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-amber-400"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="new-pin"
                                        className="text-xs font-semibold text-zinc-300"
                                    >
                                        {user.has_pin
                                            ? 'PIN Baru (4 Digit)'
                                            : 'Atur PIN 4 Digit'}
                                    </label>
                                    <input
                                        id="new-pin"
                                        type="password"
                                        maxLength={4}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        required
                                        placeholder="••••"
                                        className="cinema-focus w-36 tracking-widest text-center rounded-lg border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-white focus:border-amber-400"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSavingPin || pin.length !== 4}
                                        className="cinema-focus flex min-h-[44px] items-center justify-center rounded-lg bg-amber-500 px-6 py-2.5 text-xs font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
                                    >
                                        {isSavingPin
                                            ? 'Menyimpan...'
                                            : user.has_pin
                                              ? 'Ubah PIN'
                                              : 'Aktifkan PIN'}
                                    </button>

                                    {user.has_pin && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleSavePin(e, true)}
                                            disabled={isSavingPin}
                                            className="cinema-focus flex min-h-[44px] items-center justify-center rounded-lg border border-red-500/40 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                                        >
                                            Hapus PIN
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: DAFTAR SAYA (BOOKMARKS) */}
                    {currentTab === 'bookmarks' && (
                        <div>
                            <div className="flex items-center justify-between pb-4">
                                <h2 className="text-lg font-bold text-white">
                                    Daftar Saya ({bookmarks.length} Judul)
                                </h2>
                                <p className="text-xs text-zinc-400">
                                    Tersimpan aman di akun Anda.
                                </p>
                            </div>

                            {bookmarks.length === 0 ? (
                                <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-12 text-center">
                                    <Bookmark className="mx-auto h-12 w-12 text-zinc-600" />
                                    <p className="mt-3 font-bold text-white">
                                        Daftar Saya Masih Kosong
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-400">
                                        Jelajahi film atau serial favorit Anda dan
                                        tekan tanda tambah untuk menyimpannya ke
                                        sini.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                    {bookmarks.map((item) => (
                                        <div
                                            key={`${item.media_type}-${item.tmdb_id}`}
                                            className="group relative overflow-hidden rounded-lg bg-zinc-900 shadow-md transition hover:scale-[1.02]"
                                        >
                                            <div className="relative aspect-[2/3] w-full">
                                                {item.poster_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                                                        alt={item.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">
                                                        No Poster
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 flex flex-col justify-between bg-black/60 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteBookmark(
                                                                    item,
                                                                )
                                                            }
                                                            title="Hapus dari Daftar"
                                                            className="cinema-focus flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-red-400 transition hover:bg-red-600 hover:text-white"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.visit(
                                                                `/watch/${item.media_type}/${item.tmdb_id}`,
                                                            )
                                                        }
                                                        className="cinema-focus flex w-full items-center justify-center gap-2 rounded-md bg-[#E50914] py-2 text-xs font-bold text-white shadow hover:bg-red-700"
                                                    >
                                                        <Play className="h-3.5 w-3.5 fill-white" />
                                                        <span>Putar Sekarang</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-2.5">
                                                <p className="line-clamp-1 text-xs font-bold text-white">
                                                    {item.title}
                                                </p>
                                                <span className="text-[10px] font-semibold uppercase text-zinc-400">
                                                    {item.media_type === 'tv'
                                                        ? 'Serial TV'
                                                        : 'Film'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: RIWAYAT TONTONAN */}
                    {currentTab === 'history' && (
                        <div>
                            <div className="flex items-center justify-between pb-4">
                                <h2 className="text-lg font-bold text-white">
                                    Riwayat Tontonan ({histories.length} Judul)
                                </h2>
                                <p className="text-xs text-zinc-400">
                                    Progres dan film terakhir yang ditonton di akun
                                    ini.
                                </p>
                            </div>

                            {histories.length === 0 ? (
                                <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-12 text-center">
                                    <Clock className="mx-auto h-12 w-12 text-zinc-600" />
                                    <p className="mt-3 font-bold text-white">
                                        Belum Ada Riwayat Tontonan
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-400">
                                        Setiap film atau episode serial yang Anda
                                        putar akan otomatis tercatat di sini.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {histories.map((h) => (
                                        <div
                                            key={`${h.media_type}-${h.tmdb_id}-${h.season}-${h.episode}`}
                                            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-900/80 p-3 transition hover:bg-zinc-800/80"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                                                    {h.backdrop_path ||
                                                    h.poster_path ? (
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w300${h.backdrop_path || h.poster_path}`}
                                                            alt={h.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-500">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col">
                                                    <h4 className="text-sm font-bold text-white">
                                                        {h.title}
                                                    </h4>
                                                    {h.media_type === 'tv' && (
                                                        <p className="text-xs text-zinc-400">
                                                            Musim {h.season} : Episode{' '}
                                                            {h.episode}
                                                        </p>
                                                    )}
                                                    <span className="text-[11px] text-zinc-500">
                                                        Terakhir diputar:{' '}
                                                        {h.last_watched_at
                                                            ? new Date(
                                                                  h.last_watched_at,
                                                              ).toLocaleDateString(
                                                                  'id-ID',
                                                                  {
                                                                      day: 'numeric',
                                                                      month: 'short',
                                                                      year: 'numeric',
                                                                  },
                                                              )
                                                            : 'Baru saja'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.visit(
                                                            h.media_type === 'tv'
                                                                ? `/watch/tv/${h.tmdb_id}?season=${h.season}&episode=${h.episode}`
                                                                : `/watch/movie/${h.tmdb_id}`,
                                                        )
                                                    }
                                                    className="cinema-focus flex min-h-[38px] items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                                                >
                                                    <Play className="h-3.5 w-3.5 fill-white" />
                                                    <span className="hidden sm:inline">
                                                        Lanjutkan
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteHistory(
                                                            h.tmdb_id,
                                                            h.media_type,
                                                        )
                                                    }
                                                    title="Hapus dari Riwayat"
                                                    className="cinema-focus flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
