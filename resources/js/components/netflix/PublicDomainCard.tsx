import { ArchivePublicDomainItem } from '@/types/archive';

interface PublicDomainCardProps {
    item: ArchivePublicDomainItem;
    onSelect?: (item: ArchivePublicDomainItem) => void;
}

export default function PublicDomainCard({
    item,
    onSelect,
}: PublicDomainCardProps) {
    const imageUrl =
        item.thumbnail ||
        'https://placehold.co/780x439/1a1a1a/ffffff?text=Public+Domain';

    return (
        <button
            type="button"
            className="relative w-[180px] flex-none cursor-pointer overflow-hidden rounded-md text-left transition duration-200 hover:scale-[1.06] sm:w-[220px] md:w-[260px]"
            onClick={() => onSelect?.(item)}
        >
            <img
                src={imageUrl}
                alt={item.title}
                className="aspect-video h-auto w-full object-cover"
                loading="lazy"
            />
        </button>
    );
}
