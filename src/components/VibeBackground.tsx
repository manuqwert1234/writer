'use client';

import React, { useState, useEffect, memo, CSSProperties, useRef } from 'react';
import ColorThief from 'colorthief';

interface VibeBackgroundProps {
    currentTrackImage?: string;
    enableSync?: boolean;
}

// Helper to convert RGB array to hex
function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Blend two hex colors
function mix(hex1: string, hex2: string, ratio = 0.2): string {
    const h1 = hex1.replace('#', '');
    const h2 = hex2.replace('#', '');
    const c1 = [parseInt(h1.slice(0, 2), 16), parseInt(h1.slice(2, 4), 16), parseInt(h1.slice(4, 6), 16)];
    const c2 = [parseInt(h2.slice(0, 2), 16), parseInt(h2.slice(2, 4), 16), parseInt(h2.slice(4, 6), 16)];
    const m = c1.map((v, i) => Math.round(v * (1 - ratio) + c2[i] * ratio));
    return rgbToHex(m[0], m[1], m[2]);
}

// Animated gradient background that flows from bottom-right to top-left
const VibeBackground = memo(function VibeBackground({
    currentTrackImage,
    enableSync = true
}: VibeBackgroundProps) {
    const defaultPalette = {
        color1: '#1a1a2e',
        color2: '#16213e',
        color3: '#0f3460'
    };

    const [baseColors, setBaseColors] = useState(defaultPalette);
    const [nextColors, setNextColors] = useState(defaultPalette);
    const [mounted, setMounted] = useState(false);
    const [isBlending, setIsBlending] = useState(false);
    const blendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const layerTransition = 'background 4.5s var(--ease-soft), filter 2.4s ease, opacity 2.4s var(--ease-soft)';

    useEffect(() => {
        if (!enableSync || !currentTrackImage) return;

        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
            const colorThief = new ColorThief();
            try {
                const rawPalette = colorThief.getPalette(img, 5);
                if (rawPalette && rawPalette.length >= 3) {
                    // Soften extremes to avoid flashes; blend with default base color
                    const color1 = mix(rgbToHex(rawPalette[0][0], rawPalette[0][1], rawPalette[0][2]), defaultPalette.color1, 0.25);
                    const color2 = mix(rgbToHex(rawPalette[1][0], rawPalette[1][1], rawPalette[1][2]), defaultPalette.color1, 0.25);
                    const color3 = mix(rgbToHex(rawPalette[2][0], rawPalette[2][1], rawPalette[2][2]), defaultPalette.color1, 0.25);
                    const palette = { color1, color2, color3 };

                    setNextColors(palette);
                    setIsBlending(true);

                    if (blendTimeoutRef.current) {
                        clearTimeout(blendTimeoutRef.current);
                    }
                    blendTimeoutRef.current = setTimeout(() => {
                        setBaseColors(palette);
                        setIsBlending(false);
                    }, 1200);
                }
            } catch (err) {
                console.error('Color extraction failed:', err);
            }
        };

        img.src = currentTrackImage;
    }, [currentTrackImage, enableSync]);

    useEffect(() => {
        setMounted(true);
        return () => {
            if (blendTimeoutRef.current) {
                clearTimeout(blendTimeoutRef.current);
            }
        };
    }, []);

    const renderLayers = (palette: typeof defaultPalette, extra?: CSSProperties) => (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                ...extra,
            }}
        >
            {/* Animated base gradient */}
            <div
                style={{
                    position: 'absolute',
                    inset: '-40%',
                    width: '200%',
                    height: '200%',
                    background: `linear-gradient(135deg, ${palette.color1} 0%, ${palette.color2} 20%, ${palette.color3} 45%, ${palette.color2} 70%, ${palette.color1} 100%)`,
                    backgroundSize: '240% 240%',
                    animation: 'gradientFlow 46s ease-in-out infinite',
                    transition: layerTransition,
                    filter: 'saturate(1.05) contrast(1.05)',
                    willChange: 'transform, background-position'
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
                    background: `radial-gradient(circle, ${palette.color1}dd 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    animation: 'blobFloat 38s ease-in-out infinite',
                    transition: layerTransition,
                    opacity: 0.6,
                    willChange: 'transform, opacity'
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
                    background: `radial-gradient(circle, ${palette.color2}cc 0%, transparent 70%)`,
                    filter: 'blur(80px)',
                    animation: 'blobFloat 42s ease-in-out infinite reverse',
                    transition: layerTransition,
                    opacity: 0.55,
                    willChange: 'transform, opacity'
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
                    background: `radial-gradient(circle, ${palette.color3}bb 0%, transparent 70%)`,
                    filter: 'blur(70px)',
                    animation: 'blobFloat 36s ease-in-out infinite',
                    animationDelay: '-5s',
                    transition: layerTransition,
                    opacity: 0.5,
                    willChange: 'transform, opacity'
                }}
            />

            {/* Soft color wash */}
            <div
                style={{
                    position: 'absolute',
                    inset: '-10%',
                    background: `radial-gradient(120% 120% at 20% 20%, ${palette.color2}33 0%, transparent 55%), radial-gradient(120% 120% at 80% 80%, ${palette.color3}26 0%, transparent 60%)`,
                    mixBlendMode: 'screen',
                    animation: 'slowDrift 54s ease-in-out infinite',
                    transition: layerTransition,
                    willChange: 'transform, opacity',
                    opacity: 0.55
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
                    animation: 'slowDrift 48s ease-in-out infinite',
                    willChange: 'transform'
                }}
            />

            {/* Subtle dark overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.12)',
                    mixBlendMode: 'multiply',
                    pointerEvents: 'none',
                    animation: 'pulseGlow 10s ease-in-out infinite',
                    transition: 'opacity 1.2s var(--ease-soft)'
                }}
            />
        </div>
    );

    return (
        <>
            {/* Inject keyframes for animation */}
            <style jsx global>{`
                @keyframes gradientFlow {
                    0% { background-position: 15% 50%; }
                    50% { background-position: 85% 50%; }
                    100% { background-position: 15% 50%; }
                }
                
                @keyframes blobFloat {
                    0%, 100% { transform: translate(0%, 0%) scale(1); }
                    25% { transform: translate(-3%, -4%) scale(1.02); }
                    50% { transform: translate(-5%, -6%) scale(1); }
                    75% { transform: translate(-2%, -3%) scale(0.99); }
                }

                @keyframes slowDrift {
                    0% { transform: translate3d(-1%, 0.5%, 0) rotate(0deg); }
                    50% { transform: translate3d(1.5%, -1.5%, 0) rotate(0.5deg); }
                    100% { transform: translate3d(-1%, 0.5%, 0) rotate(0deg); }
                }

                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.35; }
                    50% { opacity: 0.6; }
                }
            `}</style>

            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: -10,
                    overflow: 'hidden',
                    opacity: mounted ? 1 : 0,
                    transition: 'opacity 1200ms var(--ease-soft)',
                }}
            >
                {renderLayers(baseColors)}
                {isBlending && (
                    renderLayers(nextColors, {
                        opacity: isBlending ? 1 : 0,
                        transition: 'opacity 1.4s var(--ease-soft)'
                    })
                )}
            </div>
        </>
    );
}, (prevProps, nextProps) => {
    return prevProps.currentTrackImage === nextProps.currentTrackImage;
});

VibeBackground.displayName = 'VibeBackground';

export { VibeBackground };
