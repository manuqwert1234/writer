'use client';

import { useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useSmartCache } from './useSmartCache';

/**
 * useAutocomplete - AI-powered autocomplete with smart caching
 * 
 * 2-layer system:
 * 1. Layer 1: Local Cache (IndexedDB) → ~10ms latency
 * 2. Layer 2: Groq Cloud API → ~300ms+ latency
 */
export function useAutocomplete() {
    const [ghostText, setGhostText] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [cacheHit, setCacheHit] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const abortController = useRef<AbortController | null>(null);
    const lastContext = useRef<string>('');

    const { checkMemory, saveToMemory } = useSmartCache();

    /**
     * Fetch suggestion - tries cache first, then API
     */
    const fetchSuggestion = useCallback(async (editor: Editor) => {
        const text = editor.getText();
        const cursorPosition = editor.state.selection.anchor;
        // Get more context (last 1000 chars) for better paragraph memory
        const context = text.slice(Math.max(0, cursorPosition - 1000), cursorPosition);

        if (!context.trim() || context.length < 10) {
            setGhostText('');
            return;
        }

        if (context === lastContext.current) return;
        lastContext.current = context;

        if (abortController.current) {
            abortController.current.abort();
        }

        // Layer 1: Check Local Cache First (~10ms)
        try {
            const cachedSuggestion = await checkMemory(context);
            if (cachedSuggestion) {
                setGhostText(cachedSuggestion);
                setCacheHit(true);
                return;
            }
        } catch (err) {
            console.warn('Cache check error:', err);
        }

        // Layer 2: Call Groq Cloud API
        abortController.current = new AbortController();

        // 2.5s timeout - if 8B Instant takes longer, something is broken
        const timeoutId = setTimeout(() => abortController.current?.abort(), 2500);

        setIsLoading(true);
        setCacheHit(false);

        try {
            const res = await fetch('/api/autocomplete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context }),
                signal: abortController.current.signal,
            });

            clearTimeout(timeoutId);

            const data = await res.json();
            if (data.suggestion) {
                setGhostText(data.suggestion);
                await saveToMemory(context, data.suggestion);
            } else {
                setGhostText('');
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if ((err as Error).name !== 'AbortError') {
                console.error('Autocomplete error:', err);
            }
            setGhostText('');
        } finally {
            setIsLoading(false);
        }
    }, [checkMemory, saveToMemory]);

    /**
     * Called on every keystroke
     */
    const handleTyping = useCallback((editor: Editor) => {
        setGhostText('');
        lastContext.current = '';
        setCacheHit(false);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            fetchSuggestion(editor);
        }, 500); // Faster response (500ms instead of 1s)
    }, [fetchSuggestion]);

    /**
     * Accept the ghost text (Tab key)
     */
    const acceptGhostText = useCallback((): string => {
        const text = ghostText;
        setGhostText('');
        lastContext.current = '';
        setCacheHit(false);
        return text;
    }, [ghostText]);

    /**
     * Dismiss ghost text (Escape key)
     */
    const dismissGhostText = useCallback(() => {
        setGhostText('');
        setCacheHit(false);
    }, []);

    return {
        ghostText,
        handleTyping,
        acceptGhostText,
        dismissGhostText,
        isLoading,
        cacheHit,
    };
}
