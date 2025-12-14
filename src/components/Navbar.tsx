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
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-4 pb-4 flex items-center h-16 sm:h-14">
                {/* Left spacer for hamburger on mobile */}
                <div className="w-12 sm:w-0 shrink-0"></div>
                
                {/* Writer title - centered on small, left on large */}
                <div className="flex-1 flex items-center justify-center min-[1200px]:justify-start">
                    <h1
                        className="text-xl font-mono font-semibold text-white leading-none"
                        style={{ mixBlendMode: 'difference' }}
                    >
                        Writer
                    </h1>
                </div>

                {/* Right side - Focus and Theme buttons (hidden on mobile) */}
                <div
                    className="hidden sm:flex items-center gap-2 shrink-0"
                    style={{ mixBlendMode: 'difference' }}
                >
                    <button
                        onClick={toggleFocusMode}
                        className={`p-3 rounded-full transition-colors text-white ${focusMode ? 'bg-white/20' : 'hover:bg-white/10'
                            }`}
                        aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                    </button>
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}
