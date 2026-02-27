"use client";

import React from "react";

interface GachaItem {
    id: string;
    name: string;
    rarity: "COMMON" | "RARE" | "EPIC" | "ULTRA_RARE" | "MYTHIC" | "LEGENDARY" | "ANOMALY";
    description: string;
    miningRate: number;
    sellValue: number;
    isMining?: boolean;
}

interface MatrixInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: GachaItem[];
    currency: number;
    onDeleteItem?: (index: number) => void;
    onToggleMining?: (index: number) => void;
}

export default function MatrixInventoryModal({
    isOpen,
    onClose,
    items,
    currency,
    onDeleteItem,
    onToggleMining
}: MatrixInventoryModalProps) {
    if (!isOpen) return null;

    const activeMiningCount = items.filter(i => i.isMining).length;

    const rarityColors = {
        COMMON: "#1ba51a66",
        RARE: "#4a90e2",
        EPIC: "#00f2ff",
        ULTRA_RARE: "#a335ee",
        MYTHIC: "#ff00ff",
        LEGENDARY: "#ff8000",
        ANOMALY: "#ffffff",
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[80vh] border-4 border-[#1ba51a] bg-black p-8 shadow-[0_0_50px_#1ba51a44] relative overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-end border-b-2 border-[#1ba51a] mb-8 pb-4">
                    <div className="flex justify-between items-end w-full">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-bold tracking-[0.2em] uppercase italic bg-gradient-to-r from-[#1ba51a] to-[#4285f4] bg-clip-text text-transparent">
                                Personalized_Inventory
                            </h2>
                            <div className="text-[10px] opacity-40 mt-1 flex items-center gap-4">
                                <span>TOTAL_RECORDS: {items.length}/25</span>
                                <span className={`${activeMiningCount >= 5 ? "text-[#f4b400]" : "text-[#1ba51a]"}`}>
                                    ACTIVE_LINKS: {activeMiningCount}/5
                                </span>
                                <span className="text-[#1ba51a]">TOTAL_STAKED_YIELD: +{items.filter(i => i.isMining).reduce((sum, item) => sum + (item.miningRate || 0), 0).toFixed(1)} BITS/s</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase opacity-50 mb-1">Available_Bits:</div>
                            <div className="text-2xl font-bold text-[#f4b400] drop-shadow-[0_0_10px_#f4b40044]">
                                {Math.floor(currency)} ⌬
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#1ba51a] hover:text-white transition-colors uppercase text-xs font-bold border border-[#1ba51a] px-4 py-1"
                    >
                        [CLOSE_UPLINK]
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 italic py-20">
                            <p className="text-xl mb-2">SCANNING_RECORDS...</p>
                            <p className="text-sm">NO_DATA_FOUND_IN_LOCAL_SECTOR</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    className="border-2 border-[#1ba51a22] p-4 bg-[#051105] hover:border-[#1ba51a] transition-all group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 w-fit" style={{ backgroundColor: `${rarityColors[item.rarity]}33`, color: rarityColors[item.rarity] }}>
                                                {item.rarity}
                                            </span>
                                            {item.isMining && (
                                                <span className="text-[7px] font-bold bg-[#1ba51a] text-black px-1.5 py-0.5 tracking-[0.2em] animate-pulse">
                                                    LINKED_ACTIVE
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-bold" style={{ color: rarityColors[item.rarity] }}>+{item.miningRate} BITS/s</div>
                                            <div className="text-[7px] opacity-30 mt-0.5">#ID_{item.id.slice(0, 4)}</div>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold mb-1 group-hover:text-white transition-colors">{item.name}</h3>
                                    <p className="text-[10px] opacity-60 leading-relaxed italic mb-4 h-8 line-clamp-2">{item.description}</p>

                                    <div className="mt-auto pt-4 border-t border-[#1ba51a11] flex flex-col gap-2">
                                        <button
                                            onClick={() => onToggleMining?.(index)}
                                            disabled={!item.isMining && activeMiningCount >= 5}
                                            className={`text-[8px] font-bold uppercase tracking-widest px-3 py-2 border transition-all flex items-center justify-center gap-2 ${item.isMining
                                                ? "bg-[#1ba51a22] border-[#1ba51a] text-white shadow-[0_0_10px_#1ba51a44]"
                                                : "bg-black border-[#1ba51a44] text-[#1ba51a] hover:border-[#1ba51a] disabled:opacity-20"
                                                }`}
                                        >
                                            <span className={item.isMining ? "animate-spin-slow" : ""}>⌬</span>
                                            {item.isMining ? "[UNLINK_NEURAL_THREAD]" : "[LINK_NEURAL_THREAD]"}
                                        </button>

                                        <button
                                            onClick={() => onDeleteItem?.(index)}
                                            className="text-[8px] font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest px-3 py-1.5 border border-red-900/20 hover:border-red-500/40 bg-red-950/05 transition-all text-center"
                                        >
                                            [EXCHANGE_FOR_{item.sellValue}_BITS]
                                        </button>
                                    </div>

                                    {/* Subtle Glitch Decoration */}
                                    <div className="absolute top-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-10 pointer-events-none">
                                        <div className="absolute top-0 right-0 border-t-2 border-r-2 border-[#1ba51a] w-full h-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Decor */}
                <div className="mt-8 pt-4 border-t border-[#1ba51a22] flex justify-between items-center text-[8px] opacity-30 italic">
                    <span>{items.length} RECORD(S)_RETRIEVED</span>
                    <span>ENCRYPTION: AES-256-QUANTUM</span>
                </div>

                {/* Matrix Background Overlays */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
                <div className="scanline" />
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1ba51a44;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #1ba51a;
                }
            `}</style>
        </div>
    );
}
