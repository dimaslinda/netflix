import { useEffect, useMemo, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    ArchiveMetadataResponse,
    ArchivePublicDomainItem,
} from '@/types/archive';

interface PublicDomainModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: ArchivePublicDomainItem | null;
}

function pickMp4(files: ArchiveMetadataResponse['files']): string | null {
    const list = Array.isArray(files) ? files : [];
    const mp4 = list.find((f) => {
        const name = f.name || '';
        const format = (f.format || '').toLowerCase();
        return (
            name.toLowerCase().endsWith('.mp4') &&
            (format.includes('mpeg4') || format.includes('h.264'))
        );
    });
    return mp4?.name || null;
}

export default function PublicDomainModal({
    open,
    onOpenChange,
    item,
}: PublicDomainModalProps) {
    const identifier = item?.identifier;
    const title = item?.title || '';

    const [loading, setLoading] = useState(true);
    const [videoFile, setVideoFile] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !identifier) return;

        let cancelled = false;

        fetch(`/api/archive/metadata/${encodeURIComponent(identifier)}`)
            .then((r) => r.json())
            .then((json: ArchiveMetadataResponse) => {
                if (cancelled) return;
                const file = pickMp4(json.files);
                if (!file) {
                    setError('Video MP4 tidak ditemukan untuk item ini.');
                    return;
                }
                setVideoFile(file);
            })
            .catch(() => {
                if (cancelled) return;
                setError('Gagal mengambil metadata dari Internet Archive.');
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, identifier]);

    const videoUrl = useMemo(() => {
        if (!identifier || !videoFile) return null;
        return `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(videoFile)}`;
    }, [identifier, videoFile]);

    const thumbnail =
        item?.thumbnail ||
        'https://placehold.co/1920x1080/1a1a1a/ffffff?text=Public+Domain';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl overflow-hidden border-zinc-800 bg-zinc-900 p-0 text-white',
                )}
            >
                <div className="relative">
                    <div className="relative aspect-video w-full bg-black">
                        {videoUrl ? (
                            <video
                                className="h-full w-full"
                                src={videoUrl}
                                controls
                                autoPlay
                            />
                        ) : (
                            <img
                                src={thumbnail}
                                alt={title}
                                className="h-full w-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/10 to-transparent" />
                    </div>
                    <div className="absolute right-0 bottom-0 left-0 px-6 pb-5">
                        <h2 className="text-2xl font-bold md:text-3xl">
                            {title}
                        </h2>
                        <div className="mt-3 text-sm text-zinc-300">
                            {loading
                                ? 'Loading...'
                                : error
                                  ? error
                                  : 'Public Domain'}
                        </div>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-6 pt-6 pb-8">
                    {item?.description ? (
                        <p className="text-sm leading-relaxed text-zinc-200 md:text-base">
                            {item.description}
                        </p>
                    ) : (
                        <p className="text-sm text-zinc-300">
                            Tidak ada deskripsi.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
