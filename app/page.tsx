"use client";

import { useState } from "react";
import MatrixCharacterPanel from "./components/MatrixCharacterPanel";
import MatrixStatusPanel from "./components/MatrixStatusPanel";
import MouseTail from "./components/MouseTail";

export default function Home() {

  return (
    <main className="min-h-screen w-screen relative overflow-hidden bg-black text-[#1ba51a] font-mono selection:bg-[#1ba51a] selection:text-black">
      {/* Background Grid Effect (Optional but cool) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#1ba51a 1px, transparent 1px), linear-gradient(90deg, #1ba51a 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      </div>

      <div className="relative z-10 px-[100px] py-8 flex flex-row items-stretch gap-12 h-screen w-full">
        {/* Left Column: Header & Character */}
        <div className="flex flex-col items-start gap-12">
          {/* Header/Control Panel */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold tracking-tighter border-b-2 border-[#1ba51a] pb-2 mb-2 w-fit">
              GrxxnTxa308
            </h1>

            <div className="text-xs opacity-70 mt-2 space-y-1">
              <p>{">"} ...WELCOME TO THE MATRIX...</p>
            </div>
          </div>

          {/* Character Component */}
          <div className="flex-shrink-0">
            <MatrixCharacterPanel />
          </div>
        </div>

        {/* Right Column: Status Panel (Full Height) */}
        <div className="flex-1 pb-12">
          <MatrixStatusPanel />
        </div>
      </div>



      {/* Mouse Trail */}
      <MouseTail />

      {/* Footer Info */}
      <div className="absolute bottom-4 right-4 text-[10px] opacity-40">
        SECURE_CONNECTION_ESTABLISHED // 1999
      </div>
    </main>
  );
}
