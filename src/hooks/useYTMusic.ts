'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface YTMusicTrack {
    id: string;
    title: string;
    artist: string;
    duration: number;
    coverArt: string;
    audioSrc?: string;
}

// Music categories to search for
export const MUSIC_CATEGORIES = [
    { id: 'lofi chill beats', label: 'Lo-Fi Chill' },
    { id: 'jazz instrumental', label: 'Jazz' },
    { id: 'classical piano', label: 'Classical' },
    { id: 'ambient electronic', label: 'Ambient' },
    { id: 'acoustic guitar instrumental', label: 'Acoustic' },
    { id: 'meditation music', label: 'Meditation' },
    { id: 'focus study music', label: 'Focus' },
    { id: 'synthwave', label: 'Synthwave' },
] as const;

export type MusicCategory = typeof MUSIC_CATEGORIES[number]['id'];

export function useYTMusic(initialCategory: MusicCategory = 'lofi chill beats') {
    const [tracks, setTracks] = useState<YTMusicTrack[]>([]);
    const [currentTrack, setCurrentTrack] = useState<YTMusicTrack | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [category, setCategory] = useState<MusicCategory>(initialCategory);
    const audioUrlCache = useRef<Map<string, string>>(new Map());

    // Fetch tracks for a category
    const fetchTracks = useCallback(async (searchQuery: MusicCategory) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/ytmusic?action=search&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setTracks(data.songs || []);
            if (data.songs?.length > 0) {
                setCurrentTrack(data.songs[0]);
            }
        } catch (err) {
            console.error('YTMusic fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch music');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get audio URL for a track
    const getAudioUrl = useCallback(async (videoId: string): Promise<string | null> => {
        // Check cache first
        if (audioUrlCache.current.has(videoId)) {
            return audioUrlCache.current.get(videoId)!;
        }

        try {
            const res = await fetch(`/api/ytmusic?action=stream&id=${videoId}`);
            const data = await res.json();

            if (data.audioUrl) {
                audioUrlCache.current.set(videoId, data.audioUrl);
                return data.audioUrl;
            }
            return null;
        } catch (err) {
            console.error('Failed to get audio URL:', err);
            return null;
        }
    }, []);

    // Change category
    const changeCategory = useCallback((newCategory: MusicCategory) => {
        setCategory(newCategory);
        fetchTracks(newCategory);
    }, [fetchTracks]);

    // Initial fetch
    useEffect(() => {
        fetchTracks(category);
    }, []);

    return {
        tracks,
        currentTrack,
        setCurrentTrack,
        isLoading,
        error,
        category,
        changeCategory,
        getAudioUrl,
        refetch: () => fetchTracks(category),
    };
}

