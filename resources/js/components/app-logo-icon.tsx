import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 111 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <defs>
                <filter
                    id="netflix-shadow"
                    x="-20%"
                    y="0"
                    width="140%"
                    height="100%"
                >
                    <feDropShadow
                        dx="4"
                        dy="0"
                        stdDeviation="5"
                        floodColor="#000000"
                        floodOpacity="0.75"
                    />
                </filter>
            </defs>

            {/* Left Vertical Bar (Darker Red) */}
            <path d="M0 0H28.5V150H0V0Z" fill="#B81D24" />

            {/* Right Vertical Bar (Darker Red) */}
            <path d="M82.5 0H111V150H82.5V0Z" fill="#B81D24" />

            {/* Diagonal Center Ribbon (Vibrant Red with shadow) */}
            <path
                d="M0 0H28.5L111 150H82.5L0 0Z"
                fill="#E50914"
                filter="url(#netflix-shadow)"
            />
        </svg>
    );
}
