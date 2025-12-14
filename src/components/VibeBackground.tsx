'use client';

import React, { useState, useEffect, memo, CSSProperties } from 'react';
import ColorThief from 'colorthief';

interface VibeBackgroundProps {
    currentTrackImage?: string;
}

// Helper to convert RGB array to hex
function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Animated gradient background that flows from bottom-right to top-left
const VibeBackground = memo(function VibeBackground({
    currentTrackImage
}: VibeBackgroundProps) {
    const [colors, setColors] = useState({
        color1: '#1a1a2e',
        color2: '#16213e',
        color3: '#0f3460'
    });

    useEffect(() => {
        if (!currentTrackImage) return;

        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            const colorThief = new ColorThief();
            try {
                const rawPalette = colorThief.getPalette(img, 5);
                if (rawPalette && rawPalette.length >= 3) {
                    setColors({
                        color1: rgbToHex(rawPalette[0][0], rawPalette[0][1], rawPalette[0][2]),
                        color2: rgbToHex(rawPalette[1][0], rawPalette[1][1], rawPalette[1][2]),
                        color3: rgbToHex(rawPalette[2][0], rawPalette[2][1], rawPalette[2][2]),
                    });
                }
            } catch (err) {
                console.error('Color extraction failed:', err);
            }
        };

        img.src = currentTrackImage;
    }, [currentTrackImage]);

    return (
        <>
            {/* Inject keyframes for animation */}
            <style jsx global>{`
                @keyframes gradientFlow {
                    0% {
                        background-position: 100% 100%;
                    }
                    50% {
                        background-position: 0% 0%;
                    }
                    100% {
                        background-position: 100% 100%;
                    }
                }
                
                @keyframes blobFloat {
                    0%, 100% {
                        transform: translate(0%, 0%) scale(1);
                    }
                    25% {
                        transform: translate(-10%, -15%) scale(1.1);
                    }
                    50% {
                        transform: translate(-20%, -25%) scale(1);
                    }
                    75% {
                        transform: translate(-10%, -10%) scale(0.95);
                    }
                }
            `}</style>

            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: -10,
                    overflow: 'hidden',
                }}
            >
                {/* Animated base gradient */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '-50%',
                        width: '200%',
                        height: '200%',
                        background: `linear-gradient(135deg, ${colors.color1} 0%, ${colors.color2} 25%, ${colors.color3} 50%, ${colors.color2} 75%, ${colors.color1} 100%)`,
                        backgroundSize: '400% 400%',
                        animation: 'gradientFlow 15s ease infinite',
                        transition: 'background 2s ease-in-out',
                    }}
                />

                {/* Floating blob 1 */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-20%',
                        right: '-20%',
                        width: '80%',
                        height: '80%',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${colors.color1}dd 0%, transparent 70%)`,
                        filter: 'blur(60px)',
                        animation: 'blobFloat 20s ease-in-out infinite',
                        transition: 'background 2s ease-in-out',
                    }}
                />

                {/* Floating blob 2 */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-10%',
                        left: '-10%',
                        width: '70%',
                        height: '70%',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${colors.color2}cc 0%, transparent 70%)`,
                        filter: 'blur(80px)',
                        animation: 'blobFloat 25s ease-in-out infinite reverse',
                        transition: 'background 2s ease-in-out',
                    }}
                />

                {/* Floating blob 3 */}
                <div
                    style={{
                        position: 'absolute',
                        top: '30%',
                        right: '10%',
                        width: '50%',
                        height: '50%',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${colors.color3}bb 0%, transparent 70%)`,
                        filter: 'blur(70px)',
                        animation: 'blobFloat 18s ease-in-out infinite',
                        animationDelay: '-5s',
                        transition: 'background 2s ease-in-out',
                    }}
                />

                {/* Grain texture */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.03,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        pointerEvents: 'none',
                    }}
                />

                {/* Subtle dark overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        pointerEvents: 'none',
                    }}
                />
            </div>
        </>
    );
}, (prevProps, nextProps) => {
    return prevProps.currentTrackImage === nextProps.currentTrackImage;
});

VibeBackground.displayName = 'VibeBackground';

export { VibeBackground };
