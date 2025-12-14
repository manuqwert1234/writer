'use client';

import { ThemeToggle } from './ThemeToggle';
import { useAppStore } from '@/store/theme-store';

export function Navbar() {
    const { focusMode, isTyping, toggleFocusMode } = useAppStore();
    const shouldFade = focusMode || isTyping;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-500 ${shouldFade ? 'opacity-10 hover:opacity-100' : 'opacity-100'
                }`}
            style={{ height: '4rem' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
                {/* Left spacer for hamburger on mobile */}
                <div className="w-12 sm:w-0 shrink-0"></div>
                
                {/* Writer title - centered on small, left on large */}
                <div className="flex-1 flex items-center justify-center min-[1200px]:justify-start" style={{ paddingTop: '0.25rem' }}>
                    <h1
                        className="text-xl font-mono font-semibold text-white leading-none m-0"
                        style={{ mixBlendMode: 'difference' }}
                    >
                        Writer
                    </h1>
                </div>

                {/* Right side - Theme button (hidden on mobile) */}
                <div
                    className="hidden sm:flex items-center gap-2 shrink-0"
                    style={{ mixBlendMode: 'difference', paddingTop: '0.25rem' }}
                >
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}
