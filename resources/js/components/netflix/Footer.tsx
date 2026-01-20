import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
    const footerLinks = [
        ['Audio Description', 'Help Center', 'Gift Cards', 'Media Center'],
        ['Investor Relations', 'Jobs', 'Terms of Use', 'Privacy'],
        ['Legal Notices', 'Cookie Preferences', 'Corporate Information', 'Contact Us'],
    ];

    return (
        <footer className="mt-16 border-t border-zinc-800 bg-[#141414] px-4 pt-12 pb-8 text-zinc-400 md:px-16">
            <div className="mx-auto max-w-6xl">
                {/* Social Icons */}
                <div className="mb-6 flex gap-6">
                    <a href="#" className="transition hover:text-white">
                        <Facebook className="h-6 w-6" />
                    </a>
                    <a href="#" className="transition hover:text-white">
                        <Instagram className="h-6 w-6" />
                    </a>
                    <a href="#" className="transition hover:text-white">
                        <Twitter className="h-6 w-6" />
                    </a>
                    <a href="#" className="transition hover:text-white">
                        <Youtube className="h-6 w-6" />
                    </a>
                </div>

                {/* Links Grid */}
                <div className="mb-6 grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                    {footerLinks.map((column, colIndex) => (
                        <div key={colIndex} className="space-y-3">
                            {column.map((link) => (
                                <a
                                    key={link}
                                    href="#"
                                    className="block underline-offset-2 transition hover:text-white hover:underline"
                                >
                                    {link}
                                </a>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Service Code Button */}
                <button className="mb-6 border border-zinc-500 px-2 py-1 text-xs hover:text-white">
                    Service Code
                </button>

                {/* Copyright */}
                <p className="text-xs text-zinc-500">
                    © 1997-{new Date().getFullYear()} Netflix, Inc.
                </p>
                <p className="mt-2 text-xs text-zinc-600">
                    This is a Netflix clone for educational purposes only. All movie data is provided by TMDB.
                </p>
            </div>
        </footer>
    );
}
