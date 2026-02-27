"use client";

import React from "react";

interface MatrixSoundSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sound: {
        sfxVolume: number;
        bgmVolume: number;
        isMuted: boolean;
        toggleMute: () => void;
        adjustSfxVolume: (val: number) => void;
        adjustBgmVolume: (val: number) => void;
    };
}

export default function MatrixSoundSettingsModal({
    isOpen,
    onClose,
    sound
}: MatrixSoundSettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md border-2 border-[#1ba51a] bg-black p-6 shadow-[0_0_30px_#1ba51a44] relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-[#1ba51a22] mb-6 pb-2">
                    <h2 className="text-xl font-bold tracking-widest uppercase italic text-[#1ba51a]">Neural_Calibration</h2>
                    <button onClick={onClose} className="text-[#1ba51a] hover:text-white transition-colors text-xl font-bold">×</button>
                </div>

                <div className="space-y-8">
                    {/* Master Mute */}
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60">System_Audio_Bypass</span>
                        <button
                            onClick={sound.toggleMute}
                            className={`px-4 py-1 border text-[10px] uppercase font-black transition-all ${sound.isMuted ? "border-[#f4b400] text-[#f4b400]" : "border-[#1ba51a] text-[#1ba51a] hover:bg-[#1ba51a] hover:text-black"}`}
                        >
                            {sound.isMuted ? "[BYPASS_ACTIVE]" : "[NORMAL_OPERATION]"}
                        </button>
                    </div>

                    <div className={sound.isMuted ? "opacity-20 pointer-events-none" : "opacity-100"}>
                        {/* SFX Volume */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                                <span>Sensory_Feedback (SFX)</span>
                                <span>{Math.round(sound.sfxVolume * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={sound.sfxVolume}
                                onChange={(e) => sound.adjustSfxVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-[#1ba51a22] appearance-none cursor-pointer accent-[#1ba51a]"
                            />
                        </div>

                        {/* BGM Volume */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                                <span>Neural_Ambience (BGM)</span>
                                <span>{Math.round(sound.bgmVolume * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={sound.bgmVolume}
                                onChange={(e) => sound.adjustBgmVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-[#1ba51a22] appearance-none cursor-pointer accent-[#1ba51a]"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#1ba51a11] text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-2 border border-[#1ba51a44] text-[10px] uppercase font-bold hover:border-[#1ba51a] hover:bg-[#1ba51a11] transition-all"
                    >
                        [ARCHIVE_SETTINGS]
                    </button>
                </div>

                {/* Aesthetic Overlays */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
            </div>
        </div>
    );
}
