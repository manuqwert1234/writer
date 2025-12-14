'use client';

import { Loader2, FileText, Music, AlertTriangle, RefreshCw } from "./Icons";

// Skeleton loader for documents
export function DocumentSkeleton() {
    return (
        <div className="space-y-2">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-foreground/5 animate-pulse">
                    <div className="h-4 bg-foreground/10 rounded mb-2"></div>
                    <div className="h-3 bg-foreground/5 rounded w-24"></div>
                </div>
            ))}
        </div>
    );
}

// Loading spinner for documents
export function DocumentLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative">
                <FileText className="w-12 h-12 text-foreground/30 mb-4" />
                <Loader2 className="w-6 h-6 text-foreground/50 absolute top-0 right-0 animate-spin" />
            </div>
            <div className="text-foreground/50">Loading document...</div>
        </div>
    );
}

// Loading spinner for authentication
export function AuthLoading() {
    return (
        <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 text-foreground/50 animate-spin mr-2" />
            <span className="text-sm text-foreground/50">Loading...</span>
        </div>
    );
}

// Full page loading state
export function FullPageLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-foreground/10 rounded-full"></div>
                <Loader2 className="w-8 h-8 text-foreground/30 absolute top-2 left-2 animate-spin" />
            </div>
            <div className="text-foreground/50 text-sm">Loading Writer...</div>
        </div>
    );
}

// Music loading state
export function MusicLoading() {
    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 text-foreground/50 text-sm">
            <Music className="w-4 h-4" />
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading music...
        </div>
    );
}

// Quick loading indicator for inline use
export function QuickLoading({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex items-center gap-2 text-foreground/50 text-sm">
            <Loader2 className="w-3 h-3 animate-spin" />
            {text}
        </div>
    );
}
