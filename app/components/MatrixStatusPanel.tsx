"use client";

import React, { useState, useEffect, useRef } from "react";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

type Rarity = "COMMON" | "RARE" | "EPIC" | "ULTRA_RARE" | "MYTHIC" | "LEGENDARY" | "ANOMALY";

interface GachaItem {
    id: string;
    name: string;
    rarity: Rarity;
    description: string;
    miningRate: number;
    sellValue: number;
    location: "storage" | "mining";
}

interface MatrixStatusPanelProps {
    onRequireAuth?: () => void;
    onOpenShop: () => void;
    currency: number;
    inventory: GachaItem[];
    miningMultiplierLevel: number;
    inventoryCapacityLevel: number;
    sound?: {
        isMuted: boolean;
    };
}

export default function MatrixStatusPanel({
    onRequireAuth,
    onOpenShop,
    currency,
    inventory,
    miningMultiplierLevel,
    inventoryCapacityLevel,
    sound
}: MatrixStatusPanelProps) {
    const [statusLogs, setStatusLogs] = useState<string[]>(["SYSTEM_READY", "STABLE_UPLINK_ESTABLISHED"]);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribeAuth();
    }, []);

    const addLog = (msg: string) => {
        setStatusLogs(prev => [msg, ...prev].slice(0, 5));
    };

    const activeMining = inventory.filter(i => i.location === "mining");
    const baseYield = activeMining.reduce((sum, i) => sum + (i.miningRate || 0), 0);
    const multiplier = 1 + (miningMultiplierLevel - 1) * 0.2;
    const currentYield = baseYield * multiplier;

    return (
        <div className="w-full h-full border-4 border-[#1ba51a] bg-black p-4 font-mono text-xs text-[#1ba51a] shadow-[0_0_20px_#1ba51a33] flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#1ba51a] mb-4 pb-1 uppercase font-bold tracking-widest text-[10px]">
                <span>Neural_Status_Panel</span>
                <div className="flex items-center gap-4">
                    <span className="text-[#f4b400]">⌬ {Math.floor(currency)} BITS</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Visual Status Display */}
                <div className="h-40 border border-[#1ba51a22] bg-[#051105] p-6 flex flex-col justify-center gap-4 relative">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <div className="text-[10px] opacity-40 uppercase mb-1">Effective_Yield:</div>
                            <div className="text-4xl font-bold tracking-tighter italic">+{currentYield.toFixed(2)} <span className="text-[14px] not-italic opacity-40 uppercase">BITS/s</span></div>
                            <div className="text-[9px] text-[#f4b400] font-bold mt-1 uppercase tracking-tighter">Multiplier: x{multiplier.toFixed(2)} [LVL.{miningMultiplierLevel}]</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] opacity-40 uppercase mb-1">Active_Threads:</div>
                            <div className="text-2xl font-bold">{activeMining.length}/5</div>
                        </div>
                    </div>

                    <div className="h-2 bg-[#1ba51a11] w-full mt-2 relative overflow-hidden">
                        <div
                            className="h-full bg-[#1ba51a] animate-pulse shadow-[0_0_10px_#1ba51a]"
                            style={{ width: `${(activeMining.length / 5) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Capacity Indicator */}
                <div className="px-4 py-3 border border-[#1ba51a22] bg-[#1ba51a05]">
                    <div className="flex justify-between text-[8px] uppercase font-bold mb-2 opacity-60">
                        <span>Neural_Buffer_Usage</span>
                        <span className={inventory.length >= (25 + (inventoryCapacityLevel - 1) * 5) ? "text-red-500" : ""}>{inventory.length}/{25 + (inventoryCapacityLevel - 1) * 5}</span>
                    </div>
                    <div className="h-1 bg-[#1ba51a11] w-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${inventory.length >= (25 + (inventoryCapacityLevel - 1) * 5) ? "bg-red-600" : "bg-[#1ba51a]"}`}
                            style={{ width: `${Math.min((inventory.length / (25 + (inventoryCapacityLevel - 1) * 5)) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Logs Area */}
                <div className="flex-1 border border-[#1ba51a11] p-4 bg-black/40 flex flex-col gap-1 overflow-hidden">
                    <div className="text-[8px] opacity-20 uppercase font-bold mb-2 border-b border-[#1ba51a08] pb-1">Activity_Feed:</div>
                    {statusLogs.map((log, i) => (
                        <div key={i} className={`text-[9px] ${i === 0 ? "opacity-100" : "opacity-30"}`}>
                            {`> ${log}`}
                        </div>
                    ))}
                </div>

                {/* Shop Button */}
                <button
                    onClick={onOpenShop}
                    className="w-full border-2 border-[#1ba51a] py-3 uppercase font-bold text-sm tracking-[0.3em] hover:bg-[#1ba51a] hover:text-black transition-all shadow-[0_0_20px_#1ba51a22] group relative overflow-hidden active:scale-95"
                >
                    <span className="relative z-10">[MARKETPLACE]</span>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </button>
            </div>

            {/* Aesthetic Overlays */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-10" />
            <div className="scanline" />
        </div>
    );
}
