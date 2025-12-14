'use client';

import { lazy, Suspense } from 'react';
import { Loader2 } from "./Icons";

// Lazy load the Player component (Jamendo - works everywhere)
const Player = lazy(() => import('./Player').then(module => ({ default: module.Player })));

export function LazyPlayer() {
    return (
        <Suspense 
            fallback={
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 text-foreground/50 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading music...
                </div>
            }
        >
            <Player />
        </Suspense>
    );
}
