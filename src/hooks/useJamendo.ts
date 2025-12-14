'use client';

import { useState, useEffect, useCallback } from 'react';

// Jamendo API configuration
const JAMENDO_CLIENT_ID = 'e5d05af3';
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

// Available music genres/moods
export const MUSIC_GENRES = [
    { id: 'lofi+ambient', label: 'Lo-Fi Ambient' },
    { id: 'chillout', label: 'Chill Out' },
    { id: 'jazz', label: 'Jazz' },
    { id: 'classical', label: 'Classical' },
    { id: 'electronic', label: 'Electronic' },
    { id: 'acoustic', label: 'Acoustic' },
    { id: 'piano', label: 'Piano' },
    { id: 'instrumental', label: 'Instrumental' },
    { id: 'meditation', label: 'Meditation' },
    { id: 'focus', label: 'Focus' },
] as const;

export type MusicGenre = typeof MUSIC_GENRES[number]['id'];

export interface JamendoTrack {
    id: string;
    title: string;
    artist: string;
    audioSrc: string;
    coverArt: string;
}

interface JamendoApiTrack {
    id: string;
    name: string;
    artist_name: string;
    audio: string;
    image: string;
}

interface JamendoApiResponse {
    headers: {
        status: string;
        code: number;
        error_message: string;
        results_count: number;
    };
    results: JamendoApiTrack[];
}

export function useJamendo(initialGenre: MusicGenre = 'lofi+ambient') {
    const [tracks, setTracks] = useState<JamendoTrack[]>([]);
    const [currentTrack, setCurrentTrack] = useState<JamendoTrack | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [genre, setGenre] = useState<MusicGenre>(initialGenre);

    const fetchTracks = useCallback(async (selectedGenre: MusicGenre) => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                client_id: JAMENDO_CLIENT_ID,
                format: 'json',
                limit: '50',
                include: 'musicinfo',
                tags: selectedGenre,
                audioformat: 'mp32',
                boost: 'popularity_total',
            });

            const response = await fetch(`${JAMENDO_API_BASE}/tracks/?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Jamendo API error: ${response.status}`);
            }

            const data: JamendoApiResponse = await response.json();

            if (data.headers.code !== 0) {
                throw new Error(data.headers.error_message || 'Unknown API error');
            }

            // Map API response - use the direct audio URL from API
            const mappedTracks: JamendoTrack[] = data.results.map((track) => ({
                id: track.id,
                title: track.name,
                artist: track.artist_name,
                audioSrc: track.audio, // Use direct URL from API
                coverArt: track.image,
            }));

            setTracks(mappedTracks);

            // Set first track as current
            if (mappedTracks.length > 0) {
                setCurrentTrack(mappedTracks[0]);
            }
        } catch (err) {
            console.error('Error fetching Jamendo tracks:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Change genre and fetch new tracks
    const changeGenre = useCallback((newGenre: MusicGenre) => {
        setGenre(newGenre);
        fetchTracks(newGenre);
    }, [fetchTracks]);

    useEffect(() => {
        fetchTracks(genre);
    }, []); // Only on mount

    return {
        tracks,
        currentTrack,
        setCurrentTrack,
        isLoading,
        error,
        genre,
        changeGenre,
        refetch: () => fetchTracks(genre),
    };
}
