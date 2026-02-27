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
    miningRate: number; // BITS per second
    sellValue: number;  // BITS returned on sell
    isMining?: boolean;
}

const RARITY_STATS: Record<Rarity, { miningRate: number, sellValue: number }> = {
    COMMON: { miningRate: 0.1, sellValue: 10 },
    RARE: { miningRate: 0.2, sellValue: 25 },
    EPIC: { miningRate: 0.5, sellValue: 60 },
    ULTRA_RARE: { miningRate: 1.0, sellValue: 150 },
    MYTHIC: { miningRate: 2.5, sellValue: 400 },
    LEGENDARY: { miningRate: 5.0, sellValue: 1000 },
    ANOMALY: { miningRate: 15.0, sellValue: 5000 },
};

const ITEM_POOL: GachaItem[] = [
    // COMMON
    { id: "1", name: "Corrupted_Pointer", rarity: "COMMON", description: "A pointer that leads to a memory leak. Practically junk.", ...RARITY_STATS.COMMON },
    { id: "2", name: "Null_Terminator", rarity: "COMMON", description: "A simple string terminator. Ubiquitous in the system.", ...RARITY_STATS.COMMON },
    { id: "3", name: "Byte_Fragment", rarity: "COMMON", description: "1/8th of a data point. Requires collection.", ...RARITY_STATS.COMMON },
    { id: "15", name: "Stack_Trace", rarity: "COMMON", description: "A readable trail of minor failures. Mostly harmless.", ...RARITY_STATS.COMMON },
    { id: "16", name: "Cache_Miss", rarity: "COMMON", description: "Requested data not found. Slight latency detected.", ...RARITY_STATS.COMMON },
    { id: "17", name: "Deprecated_Library", rarity: "COMMON", description: "Outdated but still lingering in the system.", ...RARITY_STATS.COMMON },
    { id: "18", name: "Minor_Glitch", rarity: "COMMON", description: "A visual distortion with no real consequence.", ...RARITY_STATS.COMMON },
    { id: "19", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "50", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "51", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "52", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "53", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "54", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "55", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "56", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "57", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "58", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    { id: "59", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON },
    // RARE
    { id: "4", name: "Encrypted_Key", rarity: "RARE", description: "May bypass standard security gates. Glowing faintly.", ...RARITY_STATS.RARE },
    { id: "5", name: "Buffer_Overflow", rarity: "RARE", description: "Use with caution. Can destabilize local sectors.", ...RARITY_STATS.RARE },
    { id: "20", name: "Firewall_Shard", rarity: "RARE", description: "A fragment of a defensive perimeter.", ...RARITY_STATS.RARE },
    { id: "21", name: "Recursive_Call", rarity: "RARE", description: "Repeats itself until externally interrupted.", ...RARITY_STATS.RARE },
    { id: "22", name: "Ghost_Process", rarity: "RARE", description: "Runs silently in the background. Hard to detect.", ...RARITY_STATS.RARE },
    { id: "23", name: "Latency_Spike", rarity: "RARE", description: "Temporal distortion in network flow.", ...RARITY_STATS.RARE },
    { id: "24", name: "Checksum_Override", rarity: "RARE", description: "Integrity validation temporarily bypassed.", ...RARITY_STATS.RARE },
    // EPIC
    { id: "10", name: "Neural_Link_V2", rarity: "EPIC", description: "Enhanced cognitive throughput. Stable bandwidth.", ...RARITY_STATS.EPIC },
    { id: "11", name: "Data_Siphon", rarity: "EPIC", description: "Efficiently extracts bits from background processes.", ...RARITY_STATS.EPIC },
    { id: "25", name: "Quantum_Tunnel", rarity: "EPIC", description: "Transfers data outside observable pathways.", ...RARITY_STATS.EPIC },
    { id: "26", name: "AI_Subroutine", rarity: "EPIC", description: "Semi-autonomous decision-making entity.", ...RARITY_STATS.EPIC },
    { id: "27", name: "Entropy_Injector", rarity: "EPIC", description: "Introduces calculated randomness into execution.", ...RARITY_STATS.EPIC },
    { id: "28", name: "Protocol_Shifter", rarity: "EPIC", description: "Alters communication standards mid-stream.", ...RARITY_STATS.EPIC },
    { id: "29", name: "Data_Phantom", rarity: "EPIC", description: "Exists briefly between read and write cycles.", ...RARITY_STATS.EPIC },
    // ULTRA_RARE
    { id: "6", name: "Logic_Bomb", rarity: "ULTRA_RARE", description: "A powerful disruption tool. Targeted execution.", ...RARITY_STATS.ULTRA_RARE },
    { id: "7", name: "Root_Access_Token", rarity: "ULTRA_RARE", description: "Elevated privileges detected. Handle with care.", ...RARITY_STATS.ULTRA_RARE },
    { id: "30", name: "Kernel_Backdoor", rarity: "ULTRA_RARE", description: "Undocumented entry point into core systems.", ...RARITY_STATS.ULTRA_RARE },
    { id: "31", name: "Singularity_Node", rarity: "ULTRA_RARE", description: "Compression of infinite logic into one point.", ...RARITY_STATS.ULTRA_RARE },
    { id: "32", name: "Zero_Day_Protocol", rarity: "ULTRA_RARE", description: "Exploit with no prior signature.", ...RARITY_STATS.ULTRA_RARE },
    { id: "33", name: "Neural_Override", rarity: "ULTRA_RARE", description: "Hijacks cognitive threads instantly.", ...RARITY_STATS.ULTRA_RARE },
    { id: "34", name: "Reality_Buffer", rarity: "ULTRA_RARE", description: "Absorbs anomalies before system collapse.", ...RARITY_STATS.ULTRA_RARE },
    // MYTHIC
    { id: "12", name: "Binary_Eclipse", rarity: "MYTHIC", description: "A total darkness in the code. Beyond detection.", ...RARITY_STATS.MYTHIC },
    { id: "13", name: "Source_Code_Fragment", rarity: "MYTHIC", description: "A piece of the original architecture. Reality-warping.", ...RARITY_STATS.MYTHIC },
    { id: "35", name: "System_Ghost", rarity: "MYTHIC", description: "An echo of a deleted administrator.", ...RARITY_STATS.MYTHIC },
    { id: "36", name: "Infinite_Loop_Core", rarity: "MYTHIC", description: "A closed cycle with no escape condition.", ...RARITY_STATS.MYTHIC },
    { id: "37", name: "Chrono_Bit", rarity: "MYTHIC", description: "Time-indexed data from a future commit.", ...RARITY_STATS.MYTHIC },
    { id: "38", name: "Black_Mirror_Node", rarity: "MYTHIC", description: "Reflects system calls back at their origin.", ...RARITY_STATS.MYTHIC },
    { id: "39", name: "Origin_Packet", rarity: "MYTHIC", description: "Believed to be from the first system boot.", ...RARITY_STATS.MYTHIC },
    // LEGENDARY
    { id: "8", name: "Neo's_Sunglasses", rarity: "LEGENDARY", description: "A fragment of the anomaly's code. Total perception.", ...RARITY_STATS.LEGENDARY },
    { id: "9", name: "The_Oracle's_Cookie", rarity: "LEGENDARY", description: "A data structure containing a vision of the future.", ...RARITY_STATS.LEGENDARY },
    { id: "40", name: "Architect_Prime_Key", rarity: "LEGENDARY", description: "Master authorization signature.", ...RARITY_STATS.LEGENDARY },
    { id: "41", name: "Zion_Mainframe_Map", rarity: "LEGENDARY", description: "Reveals hidden layers of the system.", ...RARITY_STATS.LEGENDARY },
    { id: "42", name: "Red_Pill_Executable", rarity: "LEGENDARY", description: "Forces awareness beyond simulation bounds.", ...RARITY_STATS.LEGENDARY },
    { id: "43", name: "Sentinel_Control_Code", rarity: "LEGENDARY", description: "Overrides autonomous hunter units.", ...RARITY_STATS.LEGENDARY },
    { id: "44", name: "Anomaly_Signature", rarity: "LEGENDARY", description: "Trace of an impossible variable.", ...RARITY_STATS.LEGENDARY },
    // ANOMALY
    { id: "14", name: "The_One_Variable", rarity: "ANOMALY", description: "The variable that changes everything. System-level rewrite.", ...RARITY_STATS.ANOMALY },
    { id: "45", name: "Undefined_Behavior", rarity: "ANOMALY", description: "The system cannot predict its outcome.", ...RARITY_STATS.ANOMALY },
    { id: "46", name: "Reality_Recompiler", rarity: "ANOMALY", description: "Rewrites execution at runtime.", ...RARITY_STATS.ANOMALY },
    { id: "47", name: "Admin_Override_True", rarity: "ANOMALY", description: "Absolute authority granted.", ...RARITY_STATS.ANOMALY },
    { id: "48", name: "Simulation_Reset_Vector", rarity: "ANOMALY", description: "Triggers global state rollback.", ...RARITY_STATS.ANOMALY },
    { id: "49", name: "God_Process", rarity: "ANOMALY", description: "Runs above all threads. Cannot be terminated.", ...RARITY_STATS.ANOMALY },
];

const RARITY_COLORS = {
    COMMON: "#8fa18f",
    RARE: "#4285f4",
    EPIC: "#00f2ff",
    ULTRA_RARE: "#a142f4",
    MYTHIC: "#ff00ff",
    LEGENDARY: "#f4b400",
    ANOMALY: "#ffffff",
};

interface MatrixStatusPanelProps {
    onRequireAuth?: () => void;
    currency: number;
    inventory: GachaItem[];
}

export default function MatrixStatusPanel({ onRequireAuth, currency, inventory }: MatrixStatusPanelProps) {
    const [isRolling, setIsRolling] = useState(false);
    const [lastResult, setLastResult] = useState<GachaItem | null>(null);
    const [pullAnimation, setPullAnimation] = useState("");
    const [statusLogs, setStatusLogs] = useState<string[]>(["SYSTEM_READY", "AWAITING_INPUT..."]);
    const [user, setUser] = useState<any>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Only sync auth state locally for the pull logic check
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                addLog("CONNECTION_STABLE: " + currentUser.uid.substring(0, 8));
            } else {
                addLog("USER_DISCONNECTED");
            }
        });
        return () => unsubscribeAuth();
    }, []);

    const saveToFirestore = async (newCurrency: number, newItem?: GachaItem) => {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const updatedInventory = newItem ? [...inventory, newItem] : inventory;

        try {
            await setDoc(userRef, {
                currency: Math.floor(newCurrency),
                inventory: updatedInventory
            }, { merge: true });
            addLog("DATA_PERSISTED: " + (newItem ? newItem.name : "BITS_SYNCED"));
        } catch (error) {
            console.error("FIRESTORE_SYNC_FAILED", error);
            addLog("ERROR: DATA_PERSIST_FAILURE");
        }
    };

    const addLog = (msg: string) => {
        setStatusLogs(prev => [msg, ...prev].slice(0, 5));
    };

    const pull = () => {
        if (!user) {
            onRequireAuth?.();
            return;
        }
        if (currency < 100 || isRolling) {
            addLog("WARNING: INSUFFICIENT_BITS_OR_ROLL_IN_PROGRESS");
            return;
        }

        if (inventory.length >= 25) {
            addLog("NEURAL_BUFFER_FULL: [25/25]");
            return;
        }

        const newCurrency = currency - 100;
        setIsRolling(true);
        setLastResult(null);
        addLog("INITIATING_DATA_EXTRACTION...");

        // Animation Loop (Matrix Code style)
        let frames = 0;
        const frameInterval = setInterval(() => {
            const tempItem = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
            setLastResult(tempItem);
            setPullAnimation(Math.random().toString(36).substring(7).toUpperCase());
            frames++;

            if (frames > 15) {
                clearInterval(frameInterval);

                // Real result
                const rand = Math.random();
                let targetRarity: Rarity;
                if (rand < 0.001) targetRarity = "ANOMALY";        // 0.1%
                else if (rand < 0.005) targetRarity = "LEGENDARY"; // 0.4%
                else if (rand < 0.015) targetRarity = "MYTHIC";    // 1%
                else if (rand < 0.05) targetRarity = "ULTRA_RARE"; // 3.5%
                else if (rand < 0.15) targetRarity = "EPIC";       // 10%
                else if (rand < 0.40) targetRarity = "RARE";       // 25%
                else targetRarity = "COMMON";

                const filteredPool = ITEM_POOL.filter(item => item.rarity === targetRarity);
                const finalItem = filteredPool[Math.floor(Math.random() * filteredPool.length)];

                setLastResult(finalItem);
                setIsRolling(false);
                setPullAnimation("");
                addLog(`EXTRACTION_SUCCESS: [${finalItem.name}]`);

                // Persist to Firestore
                saveToFirestore(newCurrency, finalItem);
            }
        }, 80);
    };

    return (
        <div className="w-full h-full border-4 border-[#1ba51a] bg-black p-4 font-mono text-xs text-[#1ba51a] shadow-[0_0_20px_#1ba51a33] flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#1ba51a] mb-4 pb-1 uppercase font-bold tracking-widest text-[10px]">
                <span>Matrix_Gacha_System</span>
                <span className="text-[#f4b400]">BITS: {Math.floor(currency)}</span>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Roll Area */}
                <div className="flex-1 border border-[#1ba51a22] bg-[#051105] rounded p-4 flex flex-col items-center justify-center relative">
                    {isRolling ? (
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

                {/* Capacity Indicator */}
                <div className="px-4 py-2 border border-[#1ba51a22] bg-[#1ba51a05] mb-2">
                    <div className="flex justify-between text-[8px] uppercase font-bold mb-1 opacity-60">
                        <span>Neural_Storage_Buffer</span>
                        <span className={inventory.length >= 25 ? "text-red-500" : ""}>{inventory.length}/25</span>
                    </div>
                    <div className="h-0.5 bg-[#1ba51a11] w-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${inventory.length >= 25 ? "bg-red-600" : "bg-[#1ba51a]"}`}
                            style={{ width: `${Math.min((inventory.length / 25) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Pull Button */}
                <button
                    onClick={pull}
                    disabled={isRolling || currency < 100}
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
