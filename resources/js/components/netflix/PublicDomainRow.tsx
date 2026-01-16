import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import { ArchivePublicDomainItem } from '@/types/archive';

import PublicDomainCard from './PublicDomainCard';

interface PublicDomainRowProps {
    title: string;
    items: ArchivePublicDomainItem[];
    onSelect?: (item: ArchivePublicDomainItem) => void;
}

export default function PublicDomainRow({
    title,
    items,
    onSelect,
}: PublicDomainRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [isMoved, setIsMoved] = useState(false);

    const handleClick = (direction: 'left' | 'right') => {
        setIsMoved(true);
        if (!rowRef.current) return;

        const { scrollLeft, clientWidth } = rowRef.current;
        const scrollTo =
            direction === 'left'
                ? scrollLeft - clientWidth
                : scrollLeft + clientWidth;
        rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    };

    return (
        <div className="space-y-2">
            <h2 className="cursor-pointer text-base font-semibold text-[#e5e5e5] transition duration-200 hover:text-white md:text-2xl">
                {title}
            </h2>
            <div className="group relative md:-ml-2">
                <ChevronLeft
                    className={`absolute top-0 bottom-0 left-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition group-hover:opacity-100 hover:scale-125 ${
                        !isMoved && 'hidden'
                    }`}
                    onClick={() => handleClick('left')}
                />
                <div
                    ref={rowRef}
                    className="scrollbar-hide flex items-center gap-x-2 overflow-x-scroll md:gap-x-4 md:px-2"
                >
                    {items.map((item) => (
                        <PublicDomainCard
                            key={item.identifier}
                            item={item}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
                <ChevronRight
                    className="absolute top-0 right-2 bottom-0 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition group-hover:opacity-100 hover:scale-125"
                    onClick={() => handleClick('right')}
                />
            </div>
        </div>
    );
}
