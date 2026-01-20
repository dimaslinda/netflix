import {
    Bell,
    ChevronDown,
    Menu,
    Search,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import NetflixLogo from './NetflixLogo';

type CategoryKey = 'home' | 'tv' | 'movie' | 'new' | 'mylist';

type ProviderBrand =
    | 'netflix'
    | 'prime'
    | 'disney'
    | 'viu'
    | 'vidio'
    | 'hbomax';

interface NavbarProps {
    onSearchClick?: () => void;
    onCategoryChange?: (key: CategoryKey) => void;
    onProviderChange?: () => void;
    activeCategory?: CategoryKey;
    brand?: ProviderBrand | null;
}

const BRAND_CONFIG: Record<
    ProviderBrand,
    { label: string; accentClass: string; navBgClass: string; logo?: boolean }
> = {
    netflix: {
        label: 'NETFLIX',
        accentClass: 'text-red-600',
        navBgClass: 'bg-zinc-900/95',
        logo: true,
    },
    prime: {
        label: 'prime video',
        accentClass: 'text-[#00a8e1]',
        navBgClass: 'bg-[#0f171e]/95',
    },
    disney: {
        label: 'Disney+',
        accentClass: 'text-[#1f80ff]',
        navBgClass: 'bg-[#040714]/95',
    },
    viu: {
        label: 'viu',
        accentClass: 'text-[#fdd835]',
        navBgClass: 'bg-[#1a1a1a]/95',
    },
    vidio: {
        label: 'Vidio',
        accentClass: 'text-[#e50914]',
        navBgClass: 'bg-[#141414]/95',
    },
    hbomax: {
        label: 'HBO Max',
        accentClass: 'text-[#b535f6]',
        navBgClass: 'bg-[#0f1a2a]/95',
    },
};

const CATEGORIES = [
    { key: 'home' as CategoryKey, label: 'Home' },
    { key: 'tv' as CategoryKey, label: 'TV Shows' },
    { key: 'movie' as CategoryKey, label: 'Movies' },
    { key: 'new' as CategoryKey, label: 'New & Popular' },
    { key: 'mylist' as CategoryKey, label: 'My List' },
];

export default function Navbar({
    onSearchClick,
    onCategoryChange,
    onProviderChange,
    activeCategory = 'home',
    brand = 'netflix',
}: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showBrowseMenu, setShowBrowseMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const brandKey: ProviderBrand = (
        ['netflix', 'prime', 'disney', 'viu', 'vidio', 'hbomax'] as const
    ).includes(brand ?? 'netflix')
        ? ((brand ?? 'netflix') as ProviderBrand)
        : 'netflix';

    const currentBrand = BRAND_CONFIG[brandKey];

    return (
        <>
            <nav
                className={`fixed top-0 z-50 w-full transition-all duration-500 ${isScrolled
                        ? `${currentBrand.navBgClass} backdrop-blur-sm shadow-lg`
                        : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
                    }`}
            >
                <div className="flex items-center justify-between px-4 py-3 md:px-12 lg:px-16">
                    {/* Left Section */}
                    <div className="flex items-center gap-6 lg:gap-12">
                        {/* Logo */}
                        <div className="flex items-center">
                            {currentBrand.logo ? (
                                <NetflixLogo
                                    className="h-6 w-auto cursor-pointer transition hover:opacity-80 md:h-7"
                                    width={92}
                                    height={25}
                                />
                            ) : (
                                <h1
                                    className={`text-xl font-bold sm:text-2xl ${currentBrand.accentClass}`}
                                >
                                    {currentBrand.label}
                                </h1>
                            )}
                        </div>

                        {/* Desktop Navigation */}
                        <ul className="hidden items-center gap-5 text-sm font-light text-gray-200 lg:flex">
                            {CATEGORIES.map((cat) => (
                                <li key={cat.key}>
                                    <button
                                        type="button"
                                        className={`transition duration-300 hover:text-gray-400 ${activeCategory === cat.key
                                                ? 'font-medium text-white'
                                                : ''
                                            }`}
                                        onClick={() => onCategoryChange?.(cat.key)}
                                    >
                                        {cat.label}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Browse Menu (Tablet) */}
                        <div className="relative hidden md:block lg:hidden">
                            <button
                                type="button"
                                className="flex items-center gap-1 text-sm font-medium text-white"
                                onClick={() => setShowBrowseMenu(!showBrowseMenu)}
                            >
                                Browse
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-300 ${showBrowseMenu ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {showBrowseMenu && (
                                <div className="absolute top-full left-0 mt-3 w-48 border border-zinc-700 bg-black/95 py-2 shadow-xl">
                                    <div className="absolute -top-2 left-4 h-0 w-0 border-r-8 border-b-8 border-l-8 border-r-transparent border-b-white border-l-transparent" />
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-zinc-800 ${activeCategory === cat.key
                                                    ? 'font-semibold text-white'
                                                    : 'text-zinc-300'
                                                }`}
                                            onClick={() => {
                                                onCategoryChange?.(cat.key);
                                                setShowBrowseMenu(false);
                                            }}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4 text-white md:gap-5">
                        {/* Search */}
                        <button
                            type="button"
                            onClick={onSearchClick}
                            className="transition hover:text-zinc-300"
                        >
                            <Search className="h-5 w-5 cursor-pointer" />
                        </button>

                        {/* Kids (Desktop only) */}
                        <span className="hidden cursor-pointer text-sm font-light transition hover:text-zinc-300 lg:inline">
                            Kids
                        </span>

                        {/* Notifications */}
                        <div className="relative">
                            <Bell className="h-5 w-5 cursor-pointer transition hover:text-zinc-300" />
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold">
                                3
                            </span>
                        </div>

                        {/* Profile Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={() => setShowProfileMenu(true)}
                            onMouseLeave={() => setShowProfileMenu(false)}
                        >
                            <button
                                type="button"
                                className="flex cursor-pointer items-center gap-1"
                            >
                                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded">
                                    <img
                                        src="https://occ-0-6246-2186.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABXYofKdCJceEP7pdxcEZ9wt80GsxEyXIbnG_QM8znksNz3JexvRbDLr0_AcNKr2SJtT-MLr1eCOA-e7xlDHsx4Jmmsi5ej8.png?r=1d4"
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {showProfileMenu && (
                                <div className="absolute top-full right-0 mt-3 w-52 border border-zinc-700 bg-black/95 shadow-xl">
                                    <div className="absolute -top-2 right-4 h-0 w-0 border-r-8 border-b-8 border-l-8 border-r-transparent border-b-white border-l-transparent" />
                                    <div className="py-2">
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-zinc-300 hover:underline"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-yellow-500">
                                                <User className="h-5 w-5 text-black" />
                                            </div>
                                            Kids
                                        </button>
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-zinc-300 hover:underline"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-700 text-white">
                                                +
                                            </div>
                                            Add Profile
                                        </button>
                                    </div>
                                    <div className="border-t border-zinc-700 py-2">
                                        <button className="block w-full px-4 py-2 text-left text-sm text-zinc-300 hover:underline">
                                            Manage Profiles
                                        </button>
                                        <button className="block w-full px-4 py-2 text-left text-sm text-zinc-300 hover:underline">
                                            Transfer Profile
                                        </button>
                                        <button className="block w-full px-4 py-2 text-left text-sm text-zinc-300 hover:underline">
                                            Account
                                        </button>
                                        <button className="block w-full px-4 py-2 text-left text-sm text-zinc-300 hover:underline">
                                            Help Center
                                        </button>
                                    </div>
                                    <div className="border-t border-zinc-700">
                                        <button
                                            type="button"
                                            onClick={onProviderChange}
                                            className="block w-full px-4 py-3 text-center text-sm text-zinc-300 hover:underline"
                                        >
                                            Change Streaming Service
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            type="button"
                            className="md:hidden"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                        >
                            {showMobileMenu ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div className="fixed inset-0 z-40 bg-black/95 pt-16">
                    <div className="flex h-full flex-col items-center justify-center gap-6 text-2xl">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.key}
                                type="button"
                                className={`transition hover:text-zinc-400 ${activeCategory === cat.key
                                        ? 'font-bold text-white'
                                        : 'text-zinc-300'
                                    }`}
                                onClick={() => {
                                    onCategoryChange?.(cat.key);
                                    setShowMobileMenu(false);
                                }}
                            >
                                {cat.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                onProviderChange?.();
                                setShowMobileMenu(false);
                            }}
                            className="mt-8 text-sm text-zinc-500 hover:text-white"
                        >
                            Change Streaming Service
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
