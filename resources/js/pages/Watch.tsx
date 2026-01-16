import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface WatchProps {
    type: 'movie' | 'tv';
    id: string;
    season?: string;
    episode?: string;
}

export default function Watch({
    type,
    id,
    season = '1',
    episode = '1',
}: WatchProps) {
    const embedBaseUrl =
        (import.meta.env.VITE_EMBED_BASE_URL as string | undefined) ||
        'https://vidlink.pro';

    const embedUrl =
        type === 'tv'
            ? `${embedBaseUrl}/tv/${id}/${season}/${episode}?primaryColor=ff0000&secondaryColor=a2a2a2&iconColor=eefdec&icons=default&player=default&title=true&poster=true&autoplay=true&nextbutton=true`
            : `${embedBaseUrl}/movie/${id}?primaryColor=ff0000&secondaryColor=a2a2a2&iconColor=eefdec&icons=default&player=default&title=true&poster=true&autoplay=true&nextbutton=true`;

    const goBack = () => {
        window.history.back();
    };

    return (
        <div className="relative h-screen w-screen bg-black">
            <Head title="Watch" />

            <button
                onClick={goBack}
                className="absolute top-4 left-4 z-50 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/80"
            >
                <ArrowLeft className="h-6 w-6" />
            </button>

            <iframe
                src={embedUrl}
                className="h-full w-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture;"
                allowFullScreen
            />
        </div>
    );
}
