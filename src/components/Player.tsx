'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useJamendo, JamendoTrack, MUSIC_GENRES, MusicGenre } from '@/hooks/useJamendo';
import { VibeBackground } from './VibeBackground';

export function Player() {
    const { tracks, currentTrack, setCurrentTrack, isLoading, error, genre, changeGenre } = useJamendo();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [showGenres, setShowGenres] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const preloadRef = useRef<HTMLAudioElement | null>(null);
    const shouldPlayRef = useRef(false);
    const preloadedTrackRef = useRef<string | null>(null);

    const currentGenreInfo = MUSIC_GENRES.find(g => g.id === genre);

    // Get next track
    const getNextTrack = useCallback(() => {
        if (!currentTrack || tracks.length === 0) return null;
        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        return tracks[nextIndex];
    }, [currentTrack, tracks]);

    // Preload next track in background
    useEffect(() => {
        const nextTrack = getNextTrack();
        if (preloadRef.current && nextTrack && preloadedTrackRef.current !== nextTrack.id) {
            preloadRef.current.src = nextTrack.audioSrc;
            preloadRef.current.load();
            preloadedTrackRef.current = nextTrack.id;
        }
    }, [currentTrack, getNextTrack]);

    // Handle track change - play immediately if was playing
    useEffect(() => {
        if (audioRef.current && currentTrack) {
            // Check if this track is already preloaded
            const isPreloaded = preloadedTrackRef.current === currentTrack.id && preloadRef.current?.src;
            
            if (isPreloaded && preloadRef.current) {
                // Swap audio elements for instant playback
                const temp = audioRef.current;
                audioRef.current = preloadRef.current;
                preloadRef.current = temp;
                preloadedTrackRef.current = null;
            } else {
                setIsBuffering(true);
                audioRef.current.src = currentTrack.audioSrc;
            }
            
            // If we should be playing, start immediately
            if (shouldPlayRef.current || isPlaying) {
                shouldPlayRef.current = false;
                audioRef.current.play()
                    .then(() => {
                        setIsPlaying(true);
                        setIsBuffering(false);
                    })
                    .catch(err => {
                        console.error("Playback failed:", err);
                        setIsPlaying(false);
                        setIsBuffering(false);
                    });
            } else {
                setIsBuffering(false);
            }
        }
    }, [currentTrack]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current || !currentTrack) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(error => {
                        console.error("Playback failed:", error);
                        setIsPlaying(false);
                    });
            }
        }
    }, [isPlaying, currentTrack]);

    const playNext = useCallback(() => {
        if (!currentTrack || tracks.length === 0) return;
        shouldPlayRef.current = true; // Auto-play next track
        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        setCurrentTrack(tracks[nextIndex]);
    }, [currentTrack, tracks, setCurrentTrack]);

    const playPrev = useCallback(() => {
        if (!currentTrack || tracks.length === 0) return;
        shouldPlayRef.current = true; // Auto-play prev track
        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        setCurrentTrack(tracks[prevIndex]);
    }, [currentTrack, tracks, setCurrentTrack]);

    const handleTrackSelect = useCallback((track: JamendoTrack) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        setShowPlaylist(false);
    }, [setCurrentTrack]);

    const handleGenreSelect = useCallback((newGenre: MusicGenre) => {
        changeGenre(newGenre);
        setShowGenres(false);
        setIsPlaying(false);
    }, [changeGenre]);

    return (
        <>
            {/* CSS Gradient Background - reacts to album colors */}
            <VibeBackground currentTrackImage={currentTrack?.coverArt} />

            {/* Main audio element */}
            <audio
                ref={audioRef}
                preload="auto"
                onEnded={playNext}
                onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsBuffering(true)}
                onCanPlay={() => setIsBuffering(false)}
            />
            {/* Hidden preload audio for next track */}
            <audio ref={preloadRef} preload="auto" style={{ display: 'none' }} />

            {/* Genre selector - top right */}
            <div className="fixed top-4 right-4 z-50">
                <button
                    onClick={() => setShowGenres(!showGenres)}
                    className="px-4 py-2 rounded-full text-white/80 hover:text-white transition-colors flex items-center gap-2"
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <span className="text-sm">{currentGenreInfo?.label}</span>
                    <svg className={`w-4 h-4 transition-transform ${showGenres ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Genre dropdown */}
                {showGenres && (
                    <div
                        className="absolute top-full right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-xl"
                        style={{
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {MUSIC_GENRES.map((g) => (
                            <button
                                key={g.id}
                                onClick={() => handleGenreSelect(g.id)}
                                className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-white/10 transition-colors ${genre === g.id ? 'bg-white/20 text-white' : 'text-white/70'
                                    }`}
                            >
                                <span>{g.label}</span>
                                {genre === g.id && (
                                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Player Controls - fixed at bottom */}
            <div
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-full"
                style={{
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                {isLoading ? (
                    <div className="text-white/60 text-sm animate-pulse px-4">Loading {currentGenreInfo?.label}...</div>
                ) : error ? (
                    <div className="text-white/60 text-sm px-4">Music unavailable</div>
                ) : (
                    <>
                        {/* Previous */}
                        <button
                            onClick={playPrev}
                            className="p-2 text-white/70 hover:text-white hover:scale-110 transition-all"
                            aria-label="Previous track"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                            </svg>
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            disabled={!currentTrack || isBuffering}
                            className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 hover:scale-105 transition-all disabled:opacity-50"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isBuffering ? (
                                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : isPlaying ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        {/* Next */}
                        <button
                            onClick={playNext}
                            className="p-2 text-white/70 hover:text-white hover:scale-110 transition-all"
                            aria-label="Next track"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                            </svg>
                        </button>

                        {/* Track info & playlist toggle */}
                        {currentTrack && (
                            <button
                                onClick={() => setShowPlaylist(!showPlaylist)}
                                className="flex flex-col items-start text-left ml-2 max-w-[180px]"
                            >
                                <span className="text-sm font-medium text-white truncate w-full">
                                    {currentTrack.title}
                                </span>
                                <span className="text-xs text-white/50 truncate w-full">
                                    {currentTrack.artist}
                                </span>
                            </button>
                        )}
                    </>
                )}

                {/* Playlist dropdown */}
                {showPlaylist && (
                    <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-80 max-h-72 overflow-y-auto rounded-xl shadow-xl"
                        style={{
                            background: 'rgba(0,0,0,0.9)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {tracks.map((track) => (
                            <button
                                key={track.id}
                                onClick={() => handleTrackSelect(track)}
                                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-white/10 transition-colors ${currentTrack?.id === track.id ? 'bg-white/20' : ''
                                    }`}
                            >
                                <img
                                    src={track.coverArt}
                                    alt={track.title}
                                    className="w-12 h-12 rounded object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{track.title}</div>
                                    <div className="text-xs text-white/50 truncate">{track.artist}</div>
                                </div>
                                {currentTrack?.id === track.id && isPlaying && (
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
