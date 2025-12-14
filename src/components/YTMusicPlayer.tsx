'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useYTMusic, YTMusicTrack, MUSIC_CATEGORIES, MusicCategory } from '@/hooks/useYTMusic';
import { VibeBackground } from './VibeBackground';

export function YTMusicPlayer() {
    const { tracks, currentTrack, setCurrentTrack, isLoading, error, category, changeCategory, getAudioUrl } = useYTMusic();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [showCategories, setShowCategories] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const shouldPlayRef = useRef(false);

    const currentCategoryInfo = MUSIC_CATEGORIES.find(c => c.id === category);

    // Handle track change - fetch audio URL and play
    useEffect(() => {
        if (currentTrack && audioRef.current) {
            const loadAndPlay = async () => {
                setIsBuffering(true);
                
                // Get audio URL from API
                const audioUrl = await getAudioUrl(currentTrack.id);
                
                if (audioUrl && audioRef.current) {
                    audioRef.current.src = audioUrl;
                    
                    if (shouldPlayRef.current || isPlaying) {
                        shouldPlayRef.current = false;
                        try {
                            await audioRef.current.play();
                            setIsPlaying(true);
                        } catch (err) {
                            console.error("Playback failed:", err);
                            setIsPlaying(false);
                        }
                    }
                }
                setIsBuffering(false);
            };
            
            loadAndPlay();
        }
    }, [currentTrack, getAudioUrl]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current || !currentTrack) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            setIsBuffering(true);
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
        }
    }, [isPlaying, currentTrack]);

    const playNext = useCallback(() => {
        if (!currentTrack || tracks.length === 0) return;
        shouldPlayRef.current = true;
        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        setCurrentTrack(tracks[nextIndex]);
    }, [currentTrack, tracks, setCurrentTrack]);

    const playPrev = useCallback(() => {
        if (!currentTrack || tracks.length === 0) return;
        shouldPlayRef.current = true;
        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        setCurrentTrack(tracks[prevIndex]);
    }, [currentTrack, tracks, setCurrentTrack]);

    const handleTrackSelect = useCallback((track: YTMusicTrack) => {
        shouldPlayRef.current = true;
        setCurrentTrack(track);
        setShowPlaylist(false);
    }, [setCurrentTrack]);

    const handleCategorySelect = useCallback((newCategory: MusicCategory) => {
        changeCategory(newCategory);
        setShowCategories(false);
        setIsPlaying(false);
    }, [changeCategory]);

    return (
        <>
            {/* CSS Gradient Background */}
            <VibeBackground currentTrackImage={currentTrack?.coverArt} />

            {/* Audio element */}
            <audio
                ref={audioRef}
                preload="auto"
                onEnded={playNext}
                onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsBuffering(true)}
                onCanPlay={() => setIsBuffering(false)}
            />

            {/* Category selector - top right */}
            <div className="fixed top-4 right-4 z-50">
                <button
                    onClick={() => setShowCategories(!showCategories)}
                    className="px-4 py-2 rounded-full text-white/80 hover:text-white transition-colors flex items-center gap-2"
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <span className="text-xs text-red-400">YT</span>
                    <span className="text-sm">{currentCategoryInfo?.label}</span>
                    <svg className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Category dropdown */}
                {showCategories && (
                    <div
                        className="absolute top-full right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-xl"
                        style={{
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {MUSIC_CATEGORIES.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => handleCategorySelect(c.id)}
                                className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-white/10 transition-colors ${category === c.id ? 'bg-white/20 text-white' : 'text-white/70'}`}
                            >
                                <span>{c.label}</span>
                                {category === c.id && (
                                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Player Controls */}
            <div
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-full"
                style={{
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                {isLoading ? (
                    <div className="text-white/60 text-sm animate-pulse px-4">Loading {currentCategoryInfo?.label}...</div>
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

                        {/* Track info */}
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
                                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-white/10 transition-colors ${currentTrack?.id === track.id ? 'bg-white/20' : ''}`}
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

