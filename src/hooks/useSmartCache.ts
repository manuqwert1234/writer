'use client';

import { useCallback } from 'react';
import { get, set, keys, del } from 'idb-keyval';

// Cache entry structure
interface CacheEntry {
    completion: string;
    timestamp: number;
    hitCount: number;
}

// Cache configuration
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_ENTRIES = 500;
const CONTEXT_KEY_LENGTH = 100; // Last N chars used for key

/**
 * Simple hash function for text context
 * Creates a deterministic hash from the input string
 */
const hashContext = (text: string): string => {
    let hash = 0;
    const normalized = text.toLowerCase().trim();
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return `cache_${hash}`;
};

/**
 * useSmartCache - A local-first caching system for autocomplete
 * 
 * This hook provides:
 * - IndexedDB-based persistence (survives page refreshes)
 * - LRU-style eviction (removes old entries when limit reached)
 * - Hit counting (frequently used completions are prioritized)
 * - TTL expiration (entries expire after 7 days)
 */
export function useSmartCache() {
    /**
     * Check if a cached completion exists for the given context
     */
    const checkMemory = useCallback(async (context: string): Promise<string | null> => {
        try {
            // Use last N characters of context as the cache key
            const keyContext = context.slice(-CONTEXT_KEY_LENGTH);
            if (keyContext.length < 20) return null; // Too short to cache

            const key = hashContext(keyContext);
            const cached = await get<CacheEntry>(key);

            if (!cached) return null;

            // Check if entry is expired
            if (Date.now() - cached.timestamp > CACHE_TTL) {
                await del(key);
                return null;
            }

            // Update hit count (for future LRU optimization)
            await set(key, {
                ...cached,
                hitCount: cached.hitCount + 1,
                timestamp: Date.now(), // Refresh timestamp on hit
            });

            console.log('⚡ Cache HIT! Serving from local memory');
            return cached.completion;
        } catch (error) {
            console.warn('Cache check failed:', error);
            return null;
        }
    }, []);

    /**
     * Save a context-completion pair to the cache
     */
    const saveToMemory = useCallback(async (context: string, completion: string): Promise<void> => {
        try {
            // Don't cache if completion is too short
            if (completion.length < 5) return;

            const keyContext = context.slice(-CONTEXT_KEY_LENGTH);
            if (keyContext.length < 20) return; // Too short to cache

            const key = hashContext(keyContext);

            // Save the entry
            await set(key, {
                completion,
                timestamp: Date.now(),
                hitCount: 1,
            });

            console.log('💾 Saved to local cache');

            // Cleanup old entries periodically (1% chance per save)
            if (Math.random() < 0.01) {
                await cleanupOldEntries();
            }
        } catch (error) {
            console.warn('Cache save failed:', error);
        }
    }, []);

    /**
     * Remove old entries when cache exceeds max size
     */
    const cleanupOldEntries = useCallback(async (): Promise<void> => {
        try {
            const allKeys = await keys();
            const cacheKeys = allKeys.filter(k =>
                typeof k === 'string' && k.startsWith('cache_')
            );

            if (cacheKeys.length <= MAX_CACHE_ENTRIES) return;

            console.log(`🧹 Cleaning up cache (${cacheKeys.length} entries)`);

            // Get all entries with timestamps
            const entries: { key: IDBValidKey; timestamp: number }[] = [];
            for (const key of cacheKeys) {
                const entry = await get<CacheEntry>(key);
                if (entry) {
                    entries.push({ key, timestamp: entry.timestamp });
                }
            }

            // Sort by timestamp (oldest first) and delete the oldest
            entries.sort((a, b) => a.timestamp - b.timestamp);
            const toDelete = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);

            for (const { key } of toDelete) {
                await del(key);
            }

            console.log(`🗑️ Removed ${toDelete.length} old cache entries`);
        } catch (error) {
            console.warn('Cache cleanup failed:', error);
        }
    }, []);

    /**
     * Clear the entire cache (useful for debugging or user preference)
     */
    const clearCache = useCallback(async (): Promise<void> => {
        try {
            const allKeys = await keys();
            const cacheKeys = allKeys.filter(k =>
                typeof k === 'string' && k.startsWith('cache_')
            );

            for (const key of cacheKeys) {
                await del(key);
            }

            console.log('🗑️ Cache cleared');
        } catch (error) {
            console.warn('Cache clear failed:', error);
        }
    }, []);

    /**
     * Get cache statistics (for debugging/display)
     */
    const getCacheStats = useCallback(async (): Promise<{ count: number; oldestAge: number }> => {
        try {
            const allKeys = await keys();
            const cacheKeys = allKeys.filter(k =>
                typeof k === 'string' && k.startsWith('cache_')
            );

            let oldestTimestamp = Date.now();
            for (const key of cacheKeys) {
                const entry = await get<CacheEntry>(key);
                if (entry && entry.timestamp < oldestTimestamp) {
                    oldestTimestamp = entry.timestamp;
                }
            }

            return {
                count: cacheKeys.length,
                oldestAge: Math.floor((Date.now() - oldestTimestamp) / (1000 * 60 * 60)), // hours
            };
        } catch {
            return { count: 0, oldestAge: 0 };
        }
    }, []);

    return {
        checkMemory,
        saveToMemory,
        clearCache,
        getCacheStats,
    };
}
