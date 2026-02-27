"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// SFX Asset Mapping
const SFX_LIBRARY = {
    // ── UI Actions ──────────────────────────────────────────────────────────
    CLICK: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    ROLL: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",  // rapid tick during gacha spin
    ROLL_REVEAL: "https://assets.mixkit.co/active_storage/sfx/2620/2620-preview.mp3",  // final reveal burst
    UPGRADE: "https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3",  // upgrade commit
    SETUP: "https://assets.mixkit.co/active_storage/sfx/2594/2594-preview.mp3",  // link / setup confirm
    SELL: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",  // coin exchange / sell
    MINING_LINK: "https://assets.mixkit.co/active_storage/sfx/2607/2607-preview.mp3",  // item linked to mining
    MINING_UNLINK: "https://assets.mixkit.co/active_storage/sfx/2576/2576-preview.mp3",  // item removed from mining
    // ── Rarity Reveals ──────────────────────────────────────────────────────
    COMMON: "https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3",  // quiet blip
    RARE: "https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3",  // soft chime
    EPIC: "https://assets.mixkit.co/active_storage/sfx/2619/2619-preview.mp3",  // electric zap
    ULTRA_RARE: "https://assets.mixkit.co/active_storage/sfx/2618/2618-preview.mp3",  // power surge
    MYTHIC: "https://assets.mixkit.co/active_storage/sfx/2625/2625-preview.mp3",  // cosmic impact
    LEGENDARY: "https://assets.mixkit.co/active_storage/sfx/2582/2582-preview.mp3",  // triumphant fanfare
    ANOMALY: "https://assets.mixkit.co/active_storage/sfx/2585/2585-preview.mp3",  // glitch burst
};

// Music Cycle Playlist
const MUSIC_PLAYLIST = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
];

export type SoundType = keyof typeof SFX_LIBRARY;

export function useAudioManager() {
    const [sfxVolume, setSfxVolume] = useState(0.5);
    const [bgmVolume, setBgmVolume] = useState(0.3);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const musicRef = useRef<HTMLAudioElement | null>(null);
    const rollRef = useRef<HTMLAudioElement | null>(null);

    // Pre-load Roll Sound for high-frequency playback
    useEffect(() => {
        if (typeof window === "undefined") return;
        const audio = new Audio(SFX_LIBRARY.ROLL);
        audio.preload = "auto";
        rollRef.current = audio;
    }, []);

    // Initialize Music on First Interaction
    useEffect(() => {
        if (typeof window === "undefined") return;

        const audio = new Audio(MUSIC_PLAYLIST[currentTrackIndex]);
        audio.loop = false;
        audio.volume = isMuted ? 0 : bgmVolume;
        musicRef.current = audio;

        const handleTrackEnd = () => {
            setCurrentTrackIndex((prev) => (prev + 1) % MUSIC_PLAYLIST.length);
        };

        audio.addEventListener('ended', handleTrackEnd);

        return () => {
            audio.removeEventListener('ended', handleTrackEnd);
            audio.pause();
        };
    }, [currentTrackIndex]);

    useEffect(() => {
        if (musicRef.current) {
            musicRef.current.volume = isMuted ? 0 : bgmVolume;
        }
        if (rollRef.current) {
            rollRef.current.volume = isMuted ? 0 : sfxVolume * 0.5;
        }
    }, [bgmVolume, sfxVolume, isMuted]);

    const playSound = useCallback((type: SoundType) => {
        if (isMuted || typeof window === "undefined") return;

        // High-performance path for ROLL
        if (type === "ROLL" && rollRef.current) {
            rollRef.current.currentTime = 0;
            rollRef.current.play().catch(() => { });
            return;
        }

        console.log(`%c[NEURAL_AUDIO] PLAYING: ${type}`, "color: #1ba51a; font-weight: bold;");
        const sfx = new Audio(SFX_LIBRARY[type]);
        sfx.volume = sfxVolume;
        sfx.play().catch(e => console.warn(`[NEURAL_AUDIO] Playback failed for ${type}:`, e));
    }, [sfxVolume, isMuted]);

    const startMusic = useCallback(() => {
        if (musicRef.current && musicRef.current.paused) {
            musicRef.current.play().catch(e => console.warn("Neural link audio handshake failed. Awaiting user interaction.", e));
        }
    }, []);

    const toggleMute = () => setIsMuted(prev => !prev);
    const adjustSfxVolume = (val: number) => setSfxVolume(val);
    const adjustBgmVolume = (val: number) => setBgmVolume(val);

    return {
        playSound,
        startMusic,
        toggleMute,
        adjustSfxVolume,
        adjustBgmVolume,
        sfxVolume,
        bgmVolume,
        isMuted
    };
}
