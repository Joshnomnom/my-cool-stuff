"use client";

import React from "react";

interface GachaItem {
    id: string;
    name: string;
    rarity: "COMMON" | "RARE" | "EPIC" | "ULTRA_RARE" | "MYTHIC" | "LEGENDARY" | "ANOMALY";
    description: string;
    miningRate: number;
    sellValue: number;
    location: "storage" | "mining";
}

interface MatrixInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: GachaItem[];
    currency: number;
    onDeleteItem?: (id: string) => void;
    onToggleMining?: (id: string) => void;
    yieldPulse?: { id: number; amount: number } | null;
    playSound?: (type: any) => void;
}

export default function MatrixInventoryModal({
    isOpen,
    onClose,
    items,
    currency,
    onDeleteItem,
    onToggleMining,
    yieldPulse,
    playSound
}: MatrixInventoryModalProps) {
    if (!isOpen) return null;

    const activeThreads = items.filter(i => i.location === "mining");
    const storageItems = items.filter(i => i.location === "storage");
    const totalYield = activeThreads.reduce((sum, item) => sum + (item.miningRate || 0), 0);

    const rarityColors = {
        COMMON: "#1ba51a66",
        RARE: "#4a90e2",
        EPIC: "#00f2ff",
        ULTRA_RARE: "#a335ee",
        MYTHIC: "#ff00ff",
        LEGENDARY: "#ff8000",
        ANOMALY: "#ffffff",
    };

    const ItemCard = ({ item }: { item: GachaItem }) => (
        <div className="border-2 border-[#1ba51a22] p-4 bg-[#051105] hover:border-[#1ba51a] transition-all group relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-2">
                <span
                    className="text-[9px] font-bold px-2 py-0.5 border"
                    style={{ borderColor: rarityColors[item.rarity], color: rarityColors[item.rarity], backgroundColor: `${rarityColors[item.rarity]}11` }}
                >
                    {item.rarity}
                </span>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-[#1ba51a]">+{item.miningRate} B/s</span>
                </div>
            </div>
            <h3 className="text-lg font-bold mb-1 group-hover:text-white transition-colors">{item.name}</h3>
            <p className="text-[10px] opacity-40 italic h-6 line-clamp-1 mb-4">{item.description}</p>

            <div className="mt-auto flex flex-col gap-2">
                <button
                    onClick={() => {
                        playSound?.("CLICK");
                        onToggleMining?.(item.id);
                    }}
                    className={`py-2 text-[9px] font-bold uppercase transition-all ${item.location === "mining"
                        ? "bg-[#1ba51a] text-black"
                        : "border border-[#1ba51a44] text-[#1ba51a] hover:border-[#1ba51a]"
                        }`}
                >
                    {item.location === "mining" ? "[UNLINK_THREAD]" : "[LINK_TO_MINING]"}
                </button>
                <button
                    onClick={() => {
                        playSound?.("CLICK");
                        onDeleteItem?.(item.id);
                    }}
                    className="text-[8px] opacity-40 hover:opacity-100 hover:text-red-500 uppercase transition-all"
                >
                    [EXCHANGE: {item.sellValue} BITS]
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="w-full max-w-5xl h-[85vh] border-4 border-[#1ba51a] bg-black p-8 shadow-[0_0_50px_#1ba51a44] relative overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-[#1ba51a] mb-6 pb-4">
                    <div className="flex flex-col">
                        <h2 className="text-4xl font-bold tracking-[0.2em] uppercase italic text-[#1ba51a]">Neural_Threads</h2>
                        <div className="text-[10px] opacity-40 mt-1 uppercase flex gap-4">
                            <span>Sector_Yield: <span className="text-[#1ba51a] font-bold">+{totalYield.toFixed(1)} BITS/s</span></span>
                            <span>Active_Links: <span className={activeThreads.length >= 5 ? "text-[#f4b400]" : "text-[#1ba51a]"}>{activeThreads.length}/5</span></span>
                        </div>
                    </div>
                    <button onClick={onClose} className="border border-[#1ba51a] px-6 py-2 text-xs hover:bg-[#1ba51a] hover:text-black transition-all font-bold">
                        [DISCONNECT_HUD]
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-10 custom-scrollbar">
                    {/* Active Mining Section */}
                    <section className="relative">
                        <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#f4b400]">/// ACTIVE_MINING_GRID</h3>
                            <div className="h-px flex-1 bg-[#f4b40022]" />
                        </div>

                        {/* Localized Pulse Animation */}
                        {yieldPulse && (
                            <div
                                key={yieldPulse.id}
                                className="absolute top-0 right-0 pointer-events-none z-50 flex items-center gap-2 font-black text-[#f4b400] text-2xl animate-modal-yield-float"
                            >
                                <span className="opacity-50 text-xs">⌬</span>
                                +{yieldPulse.amount.toFixed(1)}
                                <style>{`
                                    @keyframes modal-yield-float {
                                        0% { opacity: 0; transform: translateY(0) scale(0.8); }
                                        20% { opacity: 1; transform: translateY(-10px) scale(1.1); }
                                        100% { opacity: 0; transform: translateY(-40px) scale(1.1); }
                                    }
                                    .animate-modal-yield-float { animation: modal-yield-float 1.5s ease-out forwards; }
                                `}</style>
                            </div>
                        )}

                        {activeThreads.length === 0 ? (
                            <div className="p-8 border border-dashed border-[#1ba51a22] text-center opacity-20 text-[10px] uppercase bg-[#1ba51a05]">
                                No_Active_Links_Detected. Connect_Data_To_Process_Bits.
                            </div>
                        ) : (
                            <div className="relative p-6 bg-[#f4b40005] border border-[#f4b40011] rounded-lg shadow-[inset_0_0_30px_rgba(244,180,0,0.02)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {activeThreads.map(item => <ItemCard key={item.id} item={item} />)}
                                </div>
                                <div className="absolute -top-2 left-4 px-2 bg-black text-[8px] font-black text-[#f4b40011] uppercase tracking-[0.3em]">
                                    Direct_Neural_Bandwidth
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Industrial Storage Section */}
                    <section>
                        <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">/// NEURAL_BUFFER_STORAGE</h3>
                            <div className="h-px flex-1 bg-[#1ba51a11]" />
                            <span className="text-[10px] opacity-40 font-bold">{storageItems.length}/25 RECORDS</span>
                        </div>
                        {storageItems.length === 0 ? (
                            <div className="p-8 border border-dashed border-[#1ba51a22] text-center opacity-20 text-[10px] uppercase">
                                Neural_Buffer_Empty. Requisition_Data_At_Marketplace.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {storageItems.map(item => <ItemCard key={item.id} item={item} />)}
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer Deco */}
                <div className="absolute bottom-4 left-8 text-[8px] opacity-30 uppercase tracking-[0.5em] font-bold">
                    System_Architecture_V4.0 // High_Throughput_Recollection
                </div>

                {/* Matrix Background Overlays */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
                <div className="scanline" />
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
