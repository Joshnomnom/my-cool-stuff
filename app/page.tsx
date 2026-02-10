"use client";

import { useState } from "react";
import MatrixCharacterPanel from "./components/MatrixCharacterPanel";
import MouseTail from "./components/MouseTail";

export default function Home() {
  const [shockTrigger, setShockTrigger] = useState(false);

  // Trigger shock effect
  const handleShock = () => {
    // Force a re-trigger if already true (though timeout handles it mostly)
    setShockTrigger(true);
    // Reset trigger quickly so it can be triggered again
    setTimeout(() => setShockTrigger(false), 100);
  };

  return (
    <main className="min-h-screen w-screen relative overflow-hidden bg-black text-[#1ba51a] font-mono selection:bg-[#1ba51a] selection:text-black">
      {/* Background Grid Effect (Optional but cool) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#1ba51a 1px, transparent 1px), linear-gradient(90deg, #1ba51a 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      </div>

      <div className="relative z-10 px-[100px] py-8 flex flex-col items-start gap-12 h-full">
        {/* Header/Control Panel */}
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold tracking-tighter border-b-2 border-[#1ba51a] pb-2 mb-2 w-fit">
            MATRIX_NODE_V1
          </h1>

          <button
            onClick={handleShock}
            className="border-2 border-[#1ba51a] px-6 py-3 hover:bg-[#1ba51a] hover:text-black transition-all duration-100 active:scale-95 font-bold uppercase tracking-wider text-sm shadow-[0_0_10px_#1ba51a55] w-fit"
          >
            [INITIATE_SHOCK_PROTOCOL]
          </button>

          <div className="text-xs opacity-70 mt-2 space-y-1">
            <p>{">"} SYSTEM: ONLINE</p>
            <p>{">"} TARGET: AGENT_SMITH_CLONE</p>
            <p>{">"} STATUS: MOVING</p>
          </div>
        </div>

        {/* Character Component */}
        <MatrixCharacterPanel shockTrigger={shockTrigger} />

        {/* Mouse Trail */}
        <MouseTail />
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-4 right-4 text-[10px] opacity-40">
        SECURE_CONNECTION_ESTABLISHED // 1999
      </div>
    </main>
  );
}
