"use client";

import React, { useState, useEffect, useRef } from "react";

type Rarity = "COMMON" | "RARE" | "ULTRA_RARE" | "LEGENDARY";

interface GachaItem {
    id: string;
    name: string;
    rarity: Rarity;
    description: string;
}

const ITEM_POOL: GachaItem[] = [
    // COMMON (70%)
    { id: "c1", name: "White Rabbit", rarity: "COMMON", description: "Knock, knock, Neo." },
    { id: "c2", name: "Binary Key", rarity: "COMMON", description: "Opens minor data sectors." },
    { id: "c3", name: "Debug Log", rarity: "COMMON", description: "Standard system output." },
    { id: "c4", name: "Static Noise", rarity: "COMMON", description: "Ghost in the machine." },

    // RARE (20%)
    { id: "r1", name: "Red Pill", rarity: "RARE", description: "See how deep the rabbit hole goes." },
    { id: "r2", name: "Blue Pill", rarity: "RARE", description: "Believe whatever you want to believe." },
    { id: "r3", name: "Telephone Line", rarity: "RARE", description: "A way back home." },

    // ULTRA_RARE (8%)
    { id: "ur1", name: "Sentinel Core", rarity: "ULTRA_RARE", description: "Hardware from a hunter-killer." },
    { id: "ur2", name: "Oracle's Cookie", rarity: "ULTRA_RARE", description: "You'll feel right as rain." },

    // LEGENDARY (2%)
    { id: "l1", name: "Neo's Sunglasses", rarity: "LEGENDARY", description: "He is The One." },
    { id: "l2", name: "Trinity's Jacket", rarity: "LEGENDARY", description: "Standard issue for the resistance." },
    { id: "l3", name: "Morpheus' Chair", rarity: "LEGENDARY", description: "Where the truth is told." },
];

const RARITY_COLORS = {
    COMMON: "#8fa18f",
    RARE: "#4285f4",
    ULTRA_RARE: "#a142f4",
    LEGENDARY: "#f4b400",
};

export default function MatrixStatusPanel() {
    const [currency, setCurrency] = useState(1000);
    const [inventory, setInventory] = useState<GachaItem[]>([]);
    const [isPulling, setIsPulling] = useState(false);
    const [lastResult, setLastResult] = useState<GachaItem | null>(null);
    const [pullAnimation, setPullAnimation] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);

    const pull = () => {
        if (currency < 100 || isPulling) return;

        setCurrency(prev => prev - 100);
        setIsPulling(true);
        setLastResult(null);

        // Animation Loop (Matrix Code style)
        let frames = 0;
        const maxFrames = 15;
        const interval = setInterval(() => {
            setPullAnimation(Math.random().toString(36).substring(7).toUpperCase());
            frames++;

            if (frames >= maxFrames) {
                clearInterval(interval);
                finalizePull();
            }
        }, 100);
    };

    const finalizePull = () => {
        const rand = Math.random();
        let targetRarity: Rarity;

        if (rand < 0.002) targetRarity = "LEGENDARY";
        else if (rand < 0.01) targetRarity = "ULTRA_RARE";
        else if (rand < 0.07) targetRarity = "RARE";
        else targetRarity = "COMMON";

        const filteredPool = ITEM_POOL.filter(item => item.rarity === targetRarity);
        const result = filteredPool[Math.floor(Math.random() * filteredPool.length)];

        setLastResult(result);
        setInventory(prev => [...prev, result]);
        setIsPulling(false);
        setPullAnimation("");
    };

    return (
        <div className="w-full h-full border-4 border-[#1ba51a] bg-black p-4 font-mono text-xs text-[#1ba51a] shadow-[0_0_20px_#1ba51a33] flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#1ba51a] mb-4 pb-1 uppercase font-bold tracking-widest text-[10px]">
                <span>Matrix_Gacha_System</span>
                <span className="text-[#f4b400]">BITS: {currency}</span>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Roll Area */}
                <div className="flex-1 border border-[#1ba51a22] bg-[#051105] rounded p-4 flex flex-col items-center justify-center relative">
                    {isPulling ? (
                        <div className="text-4xl font-bold tracking-[0.5em] animate-pulse">
                            {pullAnimation}
                        </div>
                    ) : lastResult ? (
                        <div className="text-center" style={{ animation: 'extraction 0.5s ease-out' }}>
                            <style>{`
                                @keyframes extraction {
                                    0% { opacity: 0; transform: scale(0.8); filter: brightness(2); }
                                    100% { opacity: 1; transform: scale(1); filter: brightness(1); }
                                }
                            `}</style>
                            <div className="text-[10px] opacity-60 mb-1">DATA_EXTRACTED:</div>
                            <div
                                className="text-2xl font-bold uppercase tracking-tight mb-2"
                                style={{
                                    color: RARITY_COLORS[lastResult.rarity],
                                    textShadow: `0 0 15px ${RARITY_COLORS[lastResult.rarity]}`
                                }}
                            >
                                {lastResult.name}
                            </div>
                            <div className="text-[10px] italic max-w-[200px]">
                                "{lastResult.description}"
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-40">
                            <div className="text-3xl mb-2">⌬</div>
                            <div className="text-[10px]">AWAITING_INITIALIZATION</div>
                        </div>
                    )}
                </div>

                {/* Pull Button */}
                <button
                    onClick={pull}
                    disabled={isPulling || currency < 100}
                    className="w-full border-2 border-[#1ba51a] py-3 uppercase font-bold hover:bg-[#1ba51a] hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                    <span className="relative z-10">EXTRACT_DATA [100 BITS]</span>
                    <div className="absolute inset-0 bg-[#1ba51a22] transform -translateX-full group-hover:translateX-0 transition-transform duration-300" />
                </button>

                {/* Inventory Snapshot */}
                <div className="h-20 border-t border-[#1ba51a44] pt-2">
                    <div className="text-[9px] uppercase opacity-50 mb-1">RECENT_COLLECTION:</div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {inventory.slice(-5).reverse().map((item, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 px-2 py-1 border border-[#1ba51a44] text-[9px]"
                                style={{ color: RARITY_COLORS[item.rarity] }}
                            >
                                {item.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Aesthetic Overlays */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-10" />
            <div className="scanline" />
        </div>
    );
}
