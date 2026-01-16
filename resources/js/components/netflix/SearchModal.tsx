import { useEffect, useMemo, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Movie, TmdbResponse } from '@/types/tmdb';

import MovieCard from './MovieCard';

interface SearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (movie: Movie) => void;
}

export default function SearchModal({
    open,
    onOpenChange,
    onSelect,
}: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Movie[]>([]);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) return;

        const controller = new AbortController();
        const handle = setTimeout(() => {
            setLoading(true);
            fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`, {
                signal: controller.signal,
            })
                .then((r) => r.json())
                .then((json: TmdbResponse) => {
                    const filtered = (json.results || []).filter(
                        (item) =>
                            item.media_type === 'movie' ||
                            item.media_type === 'tv',
                    );
                    setResults(filtered);
                })
                .catch(() => {})
                .finally(() => setLoading(false));
        }, 400);

        return () => {
            controller.abort();
            clearTimeout(handle);
        };
    }, [query]);

    const canSearch = query.trim().length >= 2;
    const visibleResults = canSearch ? results : [];
    const visibleLoading = canSearch ? loading : false;

    const headerText = useMemo(() => {
        const q = query.trim();
        if (q.length < 2) return 'Ketik minimal 2 karakter untuk mencari';
        if (visibleLoading) return 'Mencari...';
        if (visibleResults.length === 0) return 'Tidak ada hasil';
        return `Hasil pencarian untuk “${q}”`;
    }, [query, visibleLoading, visibleResults.length]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] max-h-[90vh] w-full max-w-none flex-col border-none bg-[#141414] p-0 text-white sm:h-screen sm:max-h-screen">
                <div className="border-b border-zinc-800 px-4 py-4 md:px-16">
                    <div className="max-w-xl">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for a movie, TV show..."
                            className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
                            autoFocus
                        />
                        <div className="mt-3 text-sm text-zinc-400">
                            {headerText}
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pt-6 pb-10 md:px-16">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {visibleResults.map((movie) => (
                            <MovieCard
                                key={`${movie.media_type}-${movie.id}`}
                                movie={movie}
                                onSelect={(m) => onSelect(m)}
                                isSearchCard
                            />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
