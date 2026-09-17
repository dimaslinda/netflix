import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-black border border-white/10 shadow-sm">
                <AppLogoIcon className="h-5 w-auto" />
            </div>
            <div className="ml-1 flex flex-col text-left">
                <span className="truncate text-base font-black tracking-widest text-[#E50914]">
                    NETFLIX
                </span>
            </div>
        </div>
    );
}
