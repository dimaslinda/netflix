import React, { forwardRef } from 'react';

interface PlayerControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

const PlayerControlButton = forwardRef<
    HTMLButtonElement,
    PlayerControlButtonProps
>(({ children, className = '', ...props }, ref) => (
    <button
        ref={ref}
        className={`group rounded-full p-1.5 transition-colors outline-none hover:bg-white/10 md:p-2 ${className}`}
        {...props}
    >
        <div className="flex items-center justify-center transition-transform duration-300 group-hover:scale-125">
            {children}
        </div>
    </button>
));

PlayerControlButton.displayName = 'PlayerControlButton';

export default PlayerControlButton;
