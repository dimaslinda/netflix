import { Bell, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    activeCategory?: CategoryKey;
    brand?: ProviderBrand | null;
}

const BRAND_CONFIG: Record<
    ProviderBrand,
    { label: string; accentClass: string; navBgClass: string }
> = {
    netflix: {
        label: 'NETFLIX',
        accentClass: 'text-red-600',
        navBgClass: 'bg-zinc-900',
    },
    prime: {
        label: 'prime video',
        accentClass: 'text-[#00a8e1]',
        navBgClass: 'bg-[#0f171e]',
    },
    disney: {
        label: 'Disney+',
        accentClass: 'text-[#1f80ff]',
        navBgClass: 'bg-[#040714]',
    },
    viu: {
        label: 'viu',
        accentClass: 'text-[#fdd835]',
        navBgClass: 'bg-[#1a1a1a]',
    },
    vidio: {
        label: 'Vidio',
        accentClass: 'text-[#e50914]',
        navBgClass: 'bg-[#141414]',
    },
    hbomax: {
        label: 'HBO Max',
        accentClass: 'text-[#b535f6]',
        navBgClass: 'bg-[#0f1a2a]',
    },
};

export default function Navbar({
    onSearchClick,
    onCategoryChange,
    activeCategory = 'home',
    brand = 'netflix',
}: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
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
        <nav
            className={`fixed top-0 z-50 w-full transition-colors duration-300 ${
                isScrolled ? currentBrand.navBgClass : 'bg-transparent'
            }`}
        >
            <div className="flex items-center justify-between px-4 py-4 md:px-16">
                <div className="flex items-center space-x-8">
                    <h1
                        className={`text-2xl font-bold sm:text-3xl ${currentBrand.accentClass}`}
                    >
                        {currentBrand.label}
                    </h1>
                    <ul className="hidden space-x-4 text-sm text-gray-300 md:flex">
                        <li
                            className={`cursor-pointer hover:text-gray-300 ${
                                activeCategory === 'home'
                                    ? 'font-semibold text-white'
                                    : ''
                            }`}
                            onClick={() => onCategoryChange?.('home')}
                        >
                            Home
                        </li>
                        <li
                            className={`cursor-pointer hover:text-gray-300 ${
                                activeCategory === 'tv'
                                    ? 'font-semibold text-white'
                                    : ''
                            }`}
                            onClick={() => onCategoryChange?.('tv')}
                        >
                            TV Shows
                        </li>
                        <li
                            className={`cursor-pointer hover:text-gray-300 ${
                                activeCategory === 'movie'
                                    ? 'font-semibold text-white'
                                    : ''
                            }`}
                            onClick={() => onCategoryChange?.('movie')}
                        >
                            Movies
                        </li>
                        <li
                            className={`cursor-pointer hover:text-gray-300 ${
                                activeCategory === 'new'
                                    ? 'font-semibold text-white'
                                    : ''
                            }`}
                            onClick={() => onCategoryChange?.('new')}
                        >
                            New & Popular
                        </li>
                        <li
                            className={`cursor-pointer hover:text-gray-300 ${
                                activeCategory === 'mylist'
                                    ? 'font-semibold text-white'
                                    : ''
                            }`}
                        >
                            My List
                        </li>
                    </ul>
                </div>

                <div className="flex items-center space-x-4 text-white">
                    <button type="button" onClick={onSearchClick}>
                        <Search className="h-5 w-5 cursor-pointer" />
                    </button>
                    <Bell className="h-5 w-5 cursor-pointer" />
                    <div className="flex cursor-pointer items-center space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
                            <User className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
