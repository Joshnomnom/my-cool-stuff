"use client";

import React from "react";

export default function MatrixStatusPanel() {
    return (
        <div className="w-full h-full border-4 border-[#1ba51a] bg-black p-4 font-mono text-[10px] text-[#1ba51a] shadow-[0_0_20px_#1ba51a33] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#1ba51a] mb-2 pb-1 uppercase font-bold tracking-widest text-[9px]">
                <span>System_Status</span>
                <span className="animate-pulse">● READY</span>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
                {/* Empty content for future implementation */}
                <div className="opacity-40 italic">
                    {">"} AWAITING_DATA_STREAM...
                </div>
                <div className="animate-pulse">_</div>
            </div>

            {/* Aesthetic Overlays */}
            {/* <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-10" />
            <div className="scanline" /> */}
        </div>
    );
}
