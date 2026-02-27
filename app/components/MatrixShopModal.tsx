"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

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
    // ===== COMMON (1–25) =====
    { id: "1", name: "Corrupted_Pointer", rarity: "COMMON", description: "A pointer that leads to a memory leak. Practically junk.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "2", name: "Null_Terminator", rarity: "COMMON", description: "A simple string terminator. Ubiquitous in the system.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "3", name: "Byte_Fragment", rarity: "COMMON", description: "1/8th of a data point. Requires collection.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "4", name: "Stack_Trace", rarity: "COMMON", description: "A readable trail of minor failures.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "5", name: "Cache_Miss", rarity: "COMMON", description: "Requested data not found.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "6", name: "Deprecated_Library", rarity: "COMMON", description: "Outdated but still lingering.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "7", name: "Minor_Glitch", rarity: "COMMON", description: "A harmless distortion.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "8", name: "Lost_Packet", rarity: "COMMON", description: "Data fragment dropped in transmission.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "9", name: "Broken_Link", rarity: "COMMON", description: "Leads nowhere.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "10", name: "Dusty_Sector", rarity: "COMMON", description: "Unused storage cluster.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "11", name: "Obsolete_Driver", rarity: "COMMON", description: "Barely functional driver.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "12", name: "Lag_Spike", rarity: "COMMON", description: "Temporary delay anomaly.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "13", name: "Syntax_Error", rarity: "COMMON", description: "Invalid command detected.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "14", name: "Cold_Boot_Log", rarity: "COMMON", description: "System startup residue.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "15", name: "Low_Battery_Cell", rarity: "COMMON", description: "Almost depleted energy.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "16", name: "Glitched_UI", rarity: "COMMON", description: "Flickering interface layer.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "17", name: "Temporary_File", rarity: "COMMON", description: "Scheduled for deletion.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "18", name: "Unused_Port", rarity: "COMMON", description: "Inactive connection point.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "19", name: "Memory_Dust", rarity: "COMMON", description: "Residual fragmented memory.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "20", name: "Zero_Vector", rarity: "COMMON", description: "No directional data.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "21", name: "Old_Patch", rarity: "COMMON", description: "Security fix long outdated.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "22", name: "Basic_Script", rarity: "COMMON", description: "Simple execution routine.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "23", name: "Test_Packet", rarity: "COMMON", description: "Diagnostic transmission unit.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "24", name: "Idle_Thread", rarity: "COMMON", description: "Waiting for execution.", ...RARITY_STATS.COMMON, location: "storage" },
    { id: "25", name: "Background_Noise", rarity: "COMMON", description: "Insignificant signal fluctuation.", ...RARITY_STATS.COMMON, location: "storage" },

    // ===== RARE (26–45) =====
    { id: "26", name: "Encrypted_Key", rarity: "RARE", description: "May bypass security gates.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "27", name: "Buffer_Overflow", rarity: "RARE", description: "Destabilizes local sectors.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "28", name: "Firewall_Shard", rarity: "RARE", description: "Fragment of a defense wall.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "29", name: "Recursive_Call", rarity: "RARE", description: "Repeats endlessly.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "30", name: "Ghost_Process", rarity: "RARE", description: "Hidden background entity.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "31", name: "Proxy_Shadow", rarity: "RARE", description: "Masks real origin.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "32", name: "Signal_Amplifier", rarity: "RARE", description: "Boosts digital output.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "33", name: "Intrusion_Log", rarity: "RARE", description: "Unauthorized access record.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "34", name: "Secure_Handshake", rarity: "RARE", description: "Encrypted connection ritual.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "35", name: "Deep_Scan", rarity: "RARE", description: "Detects hidden sectors.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "36", name: "Access_Node", rarity: "RARE", description: "Temporary privilege node.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "37", name: "Code_Injection", rarity: "RARE", description: "Foreign execution block.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "38", name: "Fragmented_AI", rarity: "RARE", description: "Incomplete logic engine.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "39", name: "Dynamic_Patch", rarity: "RARE", description: "Adaptive security fix.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "40", name: "Overclock_Chip", rarity: "RARE", description: "Increases throughput.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "41", name: "Dark_Protocol", rarity: "RARE", description: "Hidden communication method.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "42", name: "Signal_Jammer", rarity: "RARE", description: "Disrupts connections.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "43", name: "Packet_Sniffer", rarity: "RARE", description: "Reads hidden traffic.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "44", name: "Binary_Mask", rarity: "RARE", description: "Obscures data identity.", ...RARITY_STATS.RARE, location: "storage" },
    { id: "45", name: "Sector_Shift", rarity: "RARE", description: "Relocates memory zone.", ...RARITY_STATS.RARE, location: "storage" },

    // ===== EPIC (46–65) =====
    { id: "46", name: "Neural_Link_V2", rarity: "EPIC", description: "Enhanced cognitive throughput.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "47", name: "Data_Siphon", rarity: "EPIC", description: "Extracts bits efficiently.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "48", name: "Quantum_Tunnel", rarity: "EPIC", description: "Transfers data invisibly.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "49", name: "AI_Subroutine", rarity: "EPIC", description: "Semi-autonomous AI.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "50", name: "Phase_Shifter", rarity: "EPIC", description: "Alters system layer state.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "51", name: "Hyper_Thread_Core", rarity: "EPIC", description: "Parallel execution boost.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "52", name: "Entropy_Field", rarity: "EPIC", description: "Chaos induction zone.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "53", name: "Deep_Learning_Node", rarity: "EPIC", description: "Self-improving logic.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "54", name: "Cybernetic_Frame", rarity: "EPIC", description: "Reinforced system shell.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "55", name: "Digital_Mirage", rarity: "EPIC", description: "False projection layer.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "56", name: "Virtual_Duplicate", rarity: "EPIC", description: "Cloned execution body.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "57", name: "Neon_Shard", rarity: "EPIC", description: "Energy-infused fragment.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "58", name: "Time_Skip_Module", rarity: "EPIC", description: "Short temporal jump.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "59", name: "Signal_Phantom", rarity: "EPIC", description: "Invisible transmission.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "60", name: "Subspace_Bridge", rarity: "EPIC", description: "Cross-layer connector.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "61", name: "Logic_Bloom", rarity: "EPIC", description: "Expands processing radius.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "62", name: "Neural_Overdrive", rarity: "EPIC", description: "Temporary hyperfocus mode.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "63", name: "Digital_Warden", rarity: "EPIC", description: "Autonomous guardian.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "64", name: "Pulse_Array", rarity: "EPIC", description: "Energy emission cluster.", ...RARITY_STATS.EPIC, location: "storage" },
    { id: "65", name: "Code_Weaver", rarity: "EPIC", description: "Rewrites small routines.", ...RARITY_STATS.EPIC, location: "storage" },

    // ===== ULTRA_RARE (66–80) =====
    { id: "66", name: "Logic_Bomb", rarity: "ULTRA_RARE", description: "Targeted system disruption.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "67", name: "Root_Access_Token", rarity: "ULTRA_RARE", description: "Elevated privileges.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "68", name: "Kernel_Backdoor", rarity: "ULTRA_RARE", description: "Hidden core entry.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "69", name: "Singularity_Node", rarity: "ULTRA_RARE", description: "Infinite compression logic.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "70", name: "Reality_Buffer", rarity: "ULTRA_RARE", description: "Stabilizes collapsing sectors.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "71", name: "Void_Capsule", rarity: "ULTRA_RARE", description: "Contains raw emptiness.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "72", name: "Overmind_Link", rarity: "ULTRA_RARE", description: "Connects to higher AI.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "73", name: "Dark_Matter_Drive", rarity: "ULTRA_RARE", description: "Exotic propulsion unit.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "74", name: "Infinite_Loop_Core", rarity: "ULTRA_RARE", description: "Self-sustaining execution.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "75", name: "Quantum_Shard", rarity: "ULTRA_RARE", description: "Fragment of unstable space.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "76", name: "Entropy_Blade", rarity: "ULTRA_RARE", description: "Cuts structured logic.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "77", name: "Phantom_Override", rarity: "ULTRA_RARE", description: "Forces system compliance.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "78", name: "Chrono_Shard", rarity: "ULTRA_RARE", description: "Frozen time fragment.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "79", name: "Aether_Compiler", rarity: "ULTRA_RARE", description: "Compiles raw reality.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },
    { id: "80", name: "Blackout_Field", rarity: "ULTRA_RARE", description: "Suppresses all signals.", ...RARITY_STATS.ULTRA_RARE, location: "storage" },

    // ===== MYTHIC (81–90) =====
    { id: "81", name: "Binary_Eclipse", rarity: "MYTHIC", description: "Total code darkness.", ...RARITY_STATS.MYTHIC, location: "storage" },
    { id: "82", name: "Source_Code_Fragment", rarity: "MYTHIC", description: "Original architecture piece.", ...RARITY_STATS.MYTHIC, location: "storage" },
    { id: "83", name: "System_Ghost", rarity: "MYTHIC", description: "Echo of deleted admin.", ...RARITY_STATS.MYTHIC, location: "storage" },
    { id: "84", name: "Reality_Glitch", rarity: "MYTHIC", description: "Permanent distortion event.", ...RARITY_STATS.MYTHIC, location: "storage" },
    { id: "85", name: "Omega_Protocol", rarity: "MYTHIC", description: "Final contingency code.", ...RARITY_STATS.MYTHIC, location: "storage" },
    { id: "86", name: "Prime_Compiler", rarity: "MYTHIC", description: "Builds universal logic.", ...RARITY_STATS.MYTHIC, location: "storage" },
    { id: "87", name: "Eternal_Process", rarity: "MYTHIC", description: "Cannot be terminated.", ...RARITY_STATS.MYTHIC, location: "storage" },
    { id: "88", name: "Neural_Singularity", rarity: "MYTHIC", description: "Infinite cognition node.", ...RARITY_STATS.MYTHIC, location: "storage" },
    { id: "89", name: "Void_Architect", rarity: "MYTHIC", description: "Designs from nothingness.", ...RARITY_STATS.MYTHIC, location: "storage" },
    { id: "90", name: "Absolute_Override", rarity: "MYTHIC", description: "Total system rewrite.", ...RARITY_STATS.MYTHIC, location: "storage" },

    // ===== LEGENDARY (91–97) =====
    { id: "91", name: "Anomaly_Glasses", rarity: "LEGENDARY", description: "Perceives hidden layers.", ...RARITY_STATS.LEGENDARY, location: "storage" },
    { id: "92", name: "Prophecy_Algorithm", rarity: "LEGENDARY", description: "Predicts probable futures.", ...RARITY_STATS.LEGENDARY, location: "storage" },
    { id: "93", name: "Architect_Prime_Key", rarity: "LEGENDARY", description: "Master authorization signature.", ...RARITY_STATS.LEGENDARY, location: "storage" },
    { id: "94", name: "Infinity_Thread", rarity: "LEGENDARY", description: "Runs through all systems.", ...RARITY_STATS.LEGENDARY, location: "storage" },
    { id: "95", name: "Red_Pill_Executable", rarity: "LEGENDARY", description: "Forces system awakening.", ...RARITY_STATS.LEGENDARY, location: "storage" },
    { id: "96", name: "Celestial_Mainframe", rarity: "LEGENDARY", description: "Higher-dimensional processor.", ...RARITY_STATS.LEGENDARY, location: "storage" },
    { id: "97", name: "Origin_Command", rarity: "LEGENDARY", description: "First executable instruction.", ...RARITY_STATS.LEGENDARY, location: "storage" },

    // ===== ANOMALY (98–100) =====
    { id: "98", name: "The_One_Variable", rarity: "ANOMALY", description: "The variable that changes everything.", ...RARITY_STATS.ANOMALY, location: "storage" },
    { id: "99", name: "Undefined_Behavior", rarity: "ANOMALY", description: "Outcome cannot be predicted.", ...RARITY_STATS.ANOMALY, location: "storage" },
    { id: "100", name: "God_Process", rarity: "ANOMALY", description: "Runs above all threads.", ...RARITY_STATS.ANOMALY, location: "storage" },
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

interface MatrixShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    currency: number;
    inventory: GachaItem[];
    miningMultiplierLevel: number;
    inventoryCapacityLevel: number;
    playSound: (type: any) => void;
}

type ExtractionTier = "STANDARD" | "ADVANCED" | "QUANTUM";

const EXTRACTION_CONFIG: Record<ExtractionTier, { cost: number, rates: Record<Rarity, number> }> = {
    STANDARD: {
        cost: 100,
        rates: { COMMON: 0.60, RARE: 0.25, EPIC: 0.10, ULTRA_RARE: 0.035, MYTHIC: 0.01, LEGENDARY: 0.004, ANOMALY: 0.001 }
    },
    ADVANCED: {
        cost: 1000,
        rates: { COMMON: 0.20, RARE: 0.35, EPIC: 0.25, ULTRA_RARE: 0.12, MYTHIC: 0.05, LEGENDARY: 0.02, ANOMALY: 0.01 }
    },
    QUANTUM: {
        cost: 10000,
        rates: { COMMON: 0.00, RARE: 0.00, EPIC: 0.40, ULTRA_RARE: 0.30, MYTHIC: 0.15, LEGENDARY: 0.07, ANOMALY: 0.08 }
    }
};

export default function MatrixShopModal({
    isOpen,
    onClose,
    currency,
    inventory,
    miningMultiplierLevel,
    inventoryCapacityLevel,
    playSound
}: MatrixShopModalProps) {
    const [isRolling, setIsRolling] = useState(false);
    const [lastResult, setLastResult] = useState<GachaItem | null>(null);
    const [pullAnimation, setPullAnimation] = useState("");
    const [logs, setLogs] = useState<string[]>(["[SYSTEM_INIT]", "AWAITING_REQUISITION..."]);
    const [activeTier, setActiveTier] = useState<ExtractionTier>("STANDARD");

    if (!isOpen) return null;

    const maxCapacity = 25 + (inventoryCapacityLevel - 1) * 5;
    const upgradeThroughputCost = Math.floor(500 * Math.pow(1.5, miningMultiplierLevel - 1));
    const upgradeBufferCost = Math.floor(2000 * Math.pow(2, inventoryCapacityLevel - 1));

    const addLog = (msg: string) => {
        setLogs(prev => [msg, ...prev].slice(0, 5));
    };

    const pull = async (tier: ExtractionTier) => {
        const config = EXTRACTION_CONFIG[tier];
        if (currency < config.cost || isRolling) return;
        if (inventory.length >= maxCapacity) {
            addLog(`ERROR: NEURAL_BUFFER_OVERFLOW [${inventory.length}/${maxCapacity}]`);
            return;
        }

        setIsRolling(true);
        setLastResult(null);
        addLog(`REQUISITIONING_${tier}_DATA...`);

        let frames = 0;
        const frameInterval = setInterval(() => {
            const temp = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
            setLastResult(temp);
            setPullAnimation(Math.random().toString(36).substring(7).toUpperCase());
            playSound("ROLL");
            frames++;

            if (frames > 15) {
                clearInterval(frameInterval);

                const rand = Math.random();
                let targetRarity: Rarity = "COMMON";
                let cumulative = 0;

                const sortedRarities: Rarity[] = ["COMMON", "RARE", "EPIC", "ULTRA_RARE", "MYTHIC", "LEGENDARY", "ANOMALY"];
                for (const r of sortedRarities) {
                    cumulative += config.rates[r];
                    if (rand < cumulative) {
                        targetRarity = r;
                        break;
                    }
                }

                const pool = ITEM_POOL.filter(i => i.rarity === targetRarity);
                const final = { ...pool[Math.floor(Math.random() * pool.length)], id: `node_${Date.now()}` };

                setLastResult(final);
                setIsRolling(false);
                setPullAnimation("");
                addLog(`DATA_ACQUIRED: [${final.name}]`);
                playSound("ROLL_REVEAL");
                setTimeout(() => playSound(final.rarity), 400);

                saveToFirestore({
                    currency: currency - config.cost,
                    inventory: [...inventory, final]
                });
            }
        }, 80);
    };

    const handleUpgrade = async (type: "throughput" | "buffer") => {
        const cost = type === "throughput" ? upgradeThroughputCost : upgradeBufferCost;
        if (currency < cost) {
            addLog("ERROR: INSUFFICIENT_BITS");
            return;
        }

        addLog(`DEPLOYING_${type.toUpperCase()}_UPGRADE...`);
        const updateData: any = {
            currency: currency - cost
        };

        playSound("UPGRADE");

        if (type === "throughput") {
            updateData.miningMultiplierLevel = miningMultiplierLevel + 1;
        } else {
            updateData.inventoryCapacityLevel = inventoryCapacityLevel + 1;
        }

        saveToFirestore(updateData);
    };

    const saveToFirestore = async (updateData: any) => {
        const user = auth.currentUser;
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        try {
            await setDoc(userRef, updateData, { merge: true });
        } catch (error) {
            console.error("SHOP_SYNC_ERROR", error);
            addLog("CRITICAL: SYNC_FAILURE");
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-2xl border-4 border-[#1ba51a] bg-black p-8 shadow-[0_0_50px_#1ba51a33] relative overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-end border-b-2 border-[#1ba51a] mb-8 pb-4">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-bold tracking-[0.2em] uppercase italic text-[#1ba51a]">
                            Matrix_Marketplace
                        </h2>
                        <div className="text-[10px] opacity-40 mt-1 uppercase">
                            Available_Credits: <span className="text-[#f4b400] font-bold">{currency} BITS</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="border border-[#1ba51a] px-4 py-1 text-xs hover:bg-[#1ba51a] hover:text-black transition-all">
                        [EXIT_STORE]
                    </button>
                </div>

                <div className="flex gap-8 h-[450px]">
                    {/* Left Column: Extraction & Rates */}
                    <div className="flex-1 flex flex-col gap-4">
                        {/* Status/Rates Display */}
                        <div className="border border-[#1ba51a44] bg-[#051105] p-3 relative overflow-hidden h-40 flex items-center justify-center">
                            {isRolling ? (
                                <div className="text-4xl font-bold animate-pulse text-[#1ba51a] tracking-widest">{pullAnimation}</div>
                            ) : lastResult ? (
                                <div className="text-center animate-in fade-in zoom-in duration-500">
                                    <div className="text-[10px] opacity-40 mb-1 uppercase tracking-[0.3em]">Data_Recieved:</div>
                                    <div
                                        className="text-2xl font-bold uppercase mb-1"
                                        style={{ color: RARITY_COLORS[lastResult.rarity], textShadow: `0 0 15px ${RARITY_COLORS[lastResult.rarity]}66` }}
                                    >
                                        {lastResult.name}
                                    </div>
                                    <div className="text-[9px] italic opacity-60">Base_Yield: {lastResult.miningRate} BITS/pulse</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 w-full gap-4 px-4 overflow-y-auto custom-scrollbar">
                                    <div className="text-left">
                                        <h4 className="text-[10px] font-bold text-[#1ba51a22] mb-2 uppercase tracking-widest">// NEURAL_WEIGHTS</h4>
                                        {Object.entries(EXTRACTION_CONFIG[activeTier].rates).filter(([_, v]) => v > 0).map(([k, v]) => (
                                            <div key={k} className="flex justify-between text-[8px] border-b border-[#1ba51a08] py-0.5">
                                                <span style={{ color: RARITY_COLORS[k as Rarity] }}>{k}:</span>
                                                <span className="opacity-40">{(v * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-[8px] opacity-20 italic flex items-center justify-center text-center">
                                        Requisition_Weights: Select tier below to calibrate sensor sensitivity.
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#1ba51a_3px)]" />
                        </div>

                        {/* Extraction Tiers */}
                        <div className="grid grid-cols-3 gap-3">
                            {(Object.keys(EXTRACTION_CONFIG) as ExtractionTier[]).map(tier => (
                                <button
                                    key={tier}
                                    onMouseEnter={() => setActiveTier(tier)}
                                    onClick={() => { playSound("SETUP"); pull(tier); }}
                                    disabled={isRolling || currency < EXTRACTION_CONFIG[tier].cost || inventory.length >= maxCapacity}
                                    className={`relative flex flex-col p-3 border group transition-all ${activeTier === tier ? "border-[#1ba51a] bg-[#1ba51a11]" : "border-[#1ba51a22] bg-[#051105]"
                                        } disabled:opacity-20`}
                                >
                                    <span className="text-[9px] font-bold tracking-tighter mb-1 opacity-60">[{tier}]</span>
                                    <span className="text-sm font-black text-[#f4b400]">{EXTRACTION_CONFIG[tier].cost}</span>
                                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#1ba51a] scale-x-0 group-hover:scale-x-100 transition-transform" />
                                </button>
                            ))}
                        </div>

                        {/* Logs */}
                        <div className="flex-1 bg-black/40 border border-[#1ba51a11] p-3 flex flex-col gap-1 overflow-hidden font-mono">
                            <div className="text-[7px] uppercase font-bold text-[#1ba51a44] mb-1">Process_Logs:</div>
                            {logs.map((log, i) => (
                                <div key={i} className={`text-[8px] ${i === 0 ? "text-[#1ba51a]" : "opacity-20"}`}>
                                    {`> ${log}`}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Upgrade Terminal */}
                    <div className="w-[200px] flex flex-col gap-4 border-l border-[#1ba51a11] pl-8">
                        <div className="text-[10px] font-bold text-[#1ba51a] uppercase tracking-[0.2em] mb-2 border-b border-[#1ba51a44] pb-2">
                            /// UPGRADE_NODE
                        </div>

                        {/* Multiplier Upgrade */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[9px]">
                                <span className="opacity-40">THROUGHPUT:</span>
                                <span className="text-[#1ba51a]">LVL.{miningMultiplierLevel}</span>
                            </div>
                            <button
                                onClick={() => handleUpgrade("throughput")}
                                disabled={currency < upgradeThroughputCost}
                                className="border border-[#1ba51a44] p-3 bg-[#1ba51a05] hover:bg-[#1ba51a1a] transition-all group disabled:opacity-20"
                            >
                                <div className="text-[10px] font-bold uppercase mb-1">Neural_Boost</div>
                                <div className="text-xs text-[#f4b400] font-black">{upgradeThroughputCost} BITS</div>
                                <div className="text-[8px] opacity-40 mt-1 italic">+20% Passive Rate</div>
                            </button>
                        </div>

                        {/* Capacity Upgrade */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[9px]">
                                <span className="opacity-40">CAPACITY:</span>
                                <span className="text-[#1ba51a]">{maxCapacity} RECORDS</span>
                            </div>
                            <button
                                onClick={() => handleUpgrade("buffer")}
                                disabled={currency < upgradeBufferCost}
                                className="border border-[#1ba51a44] p-3 bg-[#1ba51a05] hover:bg-[#1ba51a1a] transition-all group disabled:opacity-20"
                            >
                                <div className="text-[10px] font-bold uppercase mb-1">Buffer_Expand</div>
                                <div className="text-xs text-[#f4b400] font-black">{upgradeBufferCost} BITS</div>
                                <div className="text-[8px] opacity-40 mt-1 italic">+5 Global Slots</div>
                            </button>
                        </div>

                        <div className="mt-auto p-3 bg-[#1ba51a05] border border-[#1ba51a11]">
                            <div className="text-[8px] opacity-40 uppercase tracking-widest leading-relaxed">
                                Notice: All Neural upgrades are persistent across re-entry. Efficiency curves may diminish as entropy increases.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
