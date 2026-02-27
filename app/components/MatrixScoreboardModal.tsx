"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Rarity = "COMMON" | "RARE" | "EPIC" | "ULTRA_RARE" | "MYTHIC" | "LEGENDARY" | "ANOMALY";

interface GachaItem {
    id: string;
    name: string;
    rarity: Rarity;
    miningRate: number;
    sellValue: number;
    location: "storage" | "mining";
}

interface PlayerRecord {
    uid: string;
    displayName: string;
    photoURL: string;
    currency: number;
    miningRate: number;      // effective rate with personal multiplier applied
    baseRate: number;        // raw sum of active items
    multiplierLevel: number; // their personal upgrade level
    activeItems: GachaItem[];
}

interface MatrixScoreboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    playSound?: (type: any) => void;
}

const RARITY_COLORS: Record<Rarity, string> = {
    COMMON: "#8fa18f",
    RARE: "#4285f4",
    EPIC: "#00f2ff",
    ULTRA_RARE: "#a142f4",
    MYTHIC: "#ff00ff",
    LEGENDARY: "#f4b400",
    ANOMALY: "#ffffff",
};

const RANK_ICONS = ["◈", "◇", "◆", "○", "●"];

export default function MatrixScoreboardModal({
    isOpen,
    onClose,
    playSound,
}: MatrixScoreboardModalProps) {
    const [players, setPlayers] = useState<PlayerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerRecord | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError("");
        setSelectedPlayer(null);

        const fetchAll = async () => {
            try {
                const snapshot = await getDocs(collection(db, "users"));
                const records: PlayerRecord[] = [];

                snapshot.forEach((doc) => {
                    const d = doc.data();
                    const inventory: GachaItem[] = d.inventory ?? [];
                    const multiplierLevel: number = d.miningMultiplierLevel ?? 1;
                    // Same formula as the game engine in page.tsx
                    const multiplier = 1 + (multiplierLevel - 1) * 0.2;

                    const activeItems = inventory
                        .filter((i) => i.location === "mining")
                        .sort((a, b) => b.miningRate - a.miningRate)
                        .slice(0, 5);

                    const baseRate = activeItems.reduce((s, i) => s + (i.miningRate || 0), 0);
                    const effectiveRate = baseRate * multiplier;

                    records.push({
                        uid: doc.id,
                        displayName: d.displayName || d.email?.split("@")[0] || "UNKNOWN_AGENT",
                        photoURL: d.photoURL || "",
                        currency: Math.floor(d.currency ?? 0),
                        miningRate: effectiveRate,
                        baseRate,
                        multiplierLevel,
                        activeItems,
                    });
                });

                records.sort((a, b) => b.currency - a.currency);
                setPlayers(records);
            } catch (e: any) {
                setError("SECTOR_ACCESS_DENIED: " + e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectPlayer = (p: PlayerRecord) => {
        playSound?.("CLICK");
        setSelectedPlayer(prev => prev?.uid === p.uid ? null : p);
    };

    return (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl h-[85vh] border-4 border-[#1ba51a] bg-black shadow-[0_0_60px_#1ba51a33] relative overflow-hidden flex flex-col">

                {/* Scanline overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-10" />

                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-[#1ba51a] px-8 py-5 flex-shrink-0 relative z-20">
                    <div>
                        <h2 className="text-3xl font-bold tracking-[0.2em] uppercase italic text-[#1ba51a]">
                            Global_Rankings
                        </h2>
                        <div className="text-[9px] opacity-40 mt-1 uppercase tracking-widest">
                            Neural_Grid // {players.length} Agents_Connected
                        </div>
                    </div>
                    <button
                        onClick={() => { playSound?.("CLICK"); onClose(); }}
                        className="border border-[#1ba51a] px-5 py-2 text-xs hover:bg-[#1ba51a] hover:text-black transition-all font-bold uppercase"
                    >
                        [Disconnect]
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden relative z-20">

                    {/* Leaderboard */}
                    <div className={`flex flex-col overflow-y-auto custom-scrollbar transition-all duration-300 ${selectedPlayer ? "w-[55%]" : "w-full"}`}>
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-[#1ba51a] text-sm animate-pulse uppercase tracking-widest">
                                    &gt; Scanning_Neural_Grid...
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex-1 flex items-center justify-center p-8">
                                <div className="text-red-500 text-[10px] uppercase tracking-widest border border-red-900/40 bg-red-950/20 p-4">
                                    {error}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Table Header */}
                                <div className="grid grid-cols-[40px_1fr_140px_120px] gap-2 px-6 py-2 border-b border-[#1ba51a22] text-[8px] uppercase tracking-[0.3em] opacity-40 font-bold flex-shrink-0">
                                    <span>#</span>
                                    <span>Agent</span>
                                    <span className="text-right">Total_Bits</span>
                                    <span className="text-right">Mining_B/s</span>
                                </div>

                                {/* Rows */}
                                {players.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-[10px] opacity-20 uppercase">
                                        No_Agents_Detected
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {players.map((p, i) => {
                                            const isTop3 = i < 3;
                                            const isSelected = selectedPlayer?.uid === p.uid;
                                            const rankColor = i === 0 ? "#f4b400" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#1ba51a44";

                                            return (
                                                <button
                                                    key={p.uid}
                                                    onClick={() => handleSelectPlayer(p)}
                                                    className={`grid grid-cols-[40px_1fr_140px_120px] gap-2 items-center px-6 py-3 border-b border-[#1ba51a11] text-left transition-all group relative
                                                        ${isSelected
                                                            ? "bg-[#1ba51a11] border-l-2 border-l-[#1ba51a]"
                                                            : "hover:bg-[#1ba51a08] hover:border-l-2 hover:border-l-[#1ba51a44]"
                                                        }`}
                                                >
                                                    {/* Rank */}
                                                    <span
                                                        className="text-sm font-black"
                                                        style={{ color: rankColor, textShadow: isTop3 ? `0 0 10px ${rankColor}66` : undefined }}
                                                    >
                                                        {isTop3 ? RANK_ICONS[i] : `${i + 1}`}
                                                    </span>

                                                    {/* Agent */}
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 border border-[#1ba51a44] bg-[#051105] flex-shrink-0 overflow-hidden">
                                                            {p.photoURL ? (
                                                                <img src={p.photoURL} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs opacity-30">⌬</div>
                                                            )}
                                                        </div>
                                                        <span className={`text-[11px] font-bold uppercase truncate ${isSelected ? "text-white" : "text-[#1ba51a]"}`}>
                                                            {p.displayName}
                                                        </span>
                                                    </div>

                                                    {/* Bits */}
                                                    <div className="text-right">
                                                        <span className={`text-[11px] font-black ${isTop3 ? "" : "opacity-70"}`}
                                                            style={{ color: isTop3 ? rankColor : "#f4b400" }}>
                                                            {p.currency.toLocaleString()}
                                                        </span>
                                                        <span className="text-[8px] opacity-30 ml-1">BITS</span>
                                                    </div>

                                                    {/* Mining Rate */}
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-[#1ba51a] font-bold">
                                                            +{p.miningRate.toFixed(2)}
                                                        </span>
                                                        <span className="text-[8px] opacity-30 ml-1">B/s</span>
                                                    </div>

                                                    {/* Top 3 glow */}
                                                    {isTop3 && (
                                                        <div
                                                            className="absolute inset-0 pointer-events-none opacity-5"
                                                            style={{ background: `linear-gradient(90deg, ${rankColor}22, transparent)` }}
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Player Profile Panel */}
                    {selectedPlayer && (
                        <div className="w-[45%] border-l-2 border-[#1ba51a22] flex flex-col overflow-y-auto custom-scrollbar bg-[#030d03]">
                            {/* Profile Header */}
                            <div className="p-6 border-b border-[#1ba51a22] flex flex-col items-center gap-3 flex-shrink-0">
                                <div className="w-20 h-20 border-2 border-[#1ba51a] overflow-hidden shadow-[0_0_20px_#1ba51a33]">
                                    {selectedPlayer.photoURL ? (
                                        <img src={selectedPlayer.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">⌬</div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold uppercase tracking-widest text-white">
                                        {selectedPlayer.displayName}
                                    </div>
                                    <div className="text-[9px] opacity-40 mt-1 uppercase">// NEURAL_RECORD</div>
                                </div>
                                <div className="w-full grid grid-cols-3 gap-2 mt-2">
                                    <div className="bg-[#1ba51a08] border border-[#1ba51a22] p-3 text-center">
                                        <div className="text-[8px] opacity-40 uppercase mb-1">Total_Bits</div>
                                        <div className="text-[#f4b400] font-black text-sm">{selectedPlayer.currency.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-[#1ba51a08] border border-[#1ba51a22] p-3 text-center">
                                        <div className="text-[8px] opacity-40 uppercase mb-1">Eff._Rate</div>
                                        <div className="text-[#1ba51a] font-black text-sm">+{selectedPlayer.miningRate.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-[#1ba51a08] border border-[#1ba51a22] p-3 text-center">
                                        <div className="text-[8px] opacity-40 uppercase mb-1">Multiplier</div>
                                        <div className="text-[#a142f4] font-black text-sm">x{(1 + (selectedPlayer.multiplierLevel - 1) * 0.2).toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Items */}
                            <div className="p-6 flex flex-col gap-3">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#f4b400]">
                                        /// Active_Mining_Threads
                                    </h3>
                                    <div className="h-px flex-1 bg-[#f4b40022]" />
                                </div>

                                {selectedPlayer.activeItems.length === 0 ? (
                                    <div className="p-6 border border-dashed border-[#1ba51a22] text-center opacity-20 text-[9px] uppercase">
                                        No_Active_Links_Detected
                                    </div>
                                ) : (
                                    selectedPlayer.activeItems.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-3 p-3 border border-[#1ba51a11] bg-[#051105] group hover:border-[#1ba51a33] transition-all">
                                            <span className="text-[10px] opacity-30 font-bold w-4">{idx + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-bold uppercase truncate text-white/80">{item.name}</div>
                                                <span
                                                    className="text-[8px] font-bold px-1.5 py-0.5 border mt-1 inline-block"
                                                    style={{
                                                        borderColor: RARITY_COLORS[item.rarity],
                                                        color: RARITY_COLORS[item.rarity],
                                                        backgroundColor: `${RARITY_COLORS[item.rarity]}11`
                                                    }}
                                                >
                                                    {item.rarity}
                                                </span>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-[10px] font-bold text-[#1ba51a]">+{item.miningRate}</div>
                                                <div className="text-[8px] opacity-30">B/s</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="absolute bottom-3 left-8 text-[8px] opacity-20 uppercase tracking-[0.4em] font-bold z-20">
                    Live_Sector_Feed // Rankings_Update_On_Open
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1ba51a33; border-radius: 2px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #1ba51a; }
            `}</style>
        </div>
    );
}
