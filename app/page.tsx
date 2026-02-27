"use client";

import { useEffect, useState } from "react";
import MatrixCharacterPanel from "./components/MatrixCharacterPanel";
import MatrixStatusPanel from "./components/MatrixStatusPanel";
import MatrixAuthModal from "./components/MatrixAuthModal";
import MatrixInventoryModal from "./components/MatrixInventoryModal";
import MatrixProfileModal from "./components/MatrixProfileModal";
import MatrixShopModal from "./components/MatrixShopModal";
import MouseTail from "./components/MouseTail";
import { auth, db } from "@/lib/firebase";
import MatrixSoundSettingsModal from "./components/MatrixSoundSettingsModal";
import MatrixScoreboardModal from "./components/MatrixScoreboardModal";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useAudioManager, SoundType } from "@/lib/audioManager";

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

const RARITY_RANK: Record<Rarity, number> = {
  ANOMALY: 7,
  LEGENDARY: 6,
  MYTHIC: 5,
  ULTRA_RARE: 4,
  EPIC: 3,
  RARE: 2,
  COMMON: 1,
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [inventory, setInventory] = useState<GachaItem[]>([]);
  const [currency, setCurrency] = useState(0);
  const [miningMultiplierLevel, setMiningMultiplierLevel] = useState(1);
  const [inventoryCapacityLevel, setInventoryCapacityLevel] = useState(1);
  const [yieldPulse, setYieldPulse] = useState<{ id: number; amount: number } | null>(null);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);

  const {
    playSound,
    startMusic,
    toggleMute,
    adjustSfxVolume,
    adjustBgmVolume,
    sfxVolume,
    bgmVolume,
    isMuted
  } = useAudioManager();

  // Initialize Music on first click
  useEffect(() => {
    const handleFirstClick = () => {
      startMusic();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, [startMusic]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setInventory([]);
        setCurrency(0);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let rawInventory = data.inventory ?? [];

        // Data Migration: Ensure location exists
        const migratedInventory = rawInventory.map((item: any) => ({
          ...item,
          location: item.location || (item.isMining ? "mining" : "storage")
        }));

        // Sort by Rarity Rank
        const sortedInventory = migratedInventory.sort((a: GachaItem, b: GachaItem) =>
          RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]
        );

        setInventory(sortedInventory);
        setCurrency(data.currency ?? 0);
        if (data.miningMultiplierLevel) setMiningMultiplierLevel(data.miningMultiplierLevel);
        if (data.inventoryCapacityLevel) setInventoryCapacityLevel(data.inventoryCapacityLevel);
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error("FIRESTORE_SNAPSHOT_ERROR:", error);
      }
    });

    return () => unsubscribeDoc();
  }, [user]);

  // Passive Mining Logic (Pulse: 2s)
  useEffect(() => {
    if (!user || inventory.length === 0) return;

    const interval = setInterval(async () => {
      const activeItems = inventory.filter(item => item.location === "mining");
      const totalRate = activeItems.reduce((sum, item) => sum + (item.miningRate || 0), 0);
      const multiplier = 1 + (miningMultiplierLevel - 1) * 0.2;
      const pulseYield = totalRate * multiplier * 3;

      if (pulseYield > 0) {
        setCurrency(prev => {
          const newTotal = prev + pulseYield;
          // Sync to Firestore
          const userRef = doc(db, "users", user.uid);
          import("firebase/firestore").then(({ setDoc }) => {
            setDoc(userRef, { currency: Math.floor(newTotal) }, { merge: true });
          });
          return newTotal;
        });
        setYieldPulse({ id: Date.now(), amount: pulseYield });
        setTimeout(() => setYieldPulse(null), 1500);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, inventory]);

  const handleToggleMining = async (id: string) => {
    if (!user) return;
    const newInventory = [...inventory];
    const itemIndex = newInventory.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const item = newInventory[itemIndex];
    const isActivating = item.location === "storage";

    if (isActivating) {
      const activeCount = inventory.filter(i => i.location === "mining").length;
      if (activeCount >= 5) return;
    }

    item.location = isActivating ? "mining" : "storage";

    try {
      const userRef = doc(db, "users", user.uid);
      const { setDoc } = await import("firebase/firestore");
      await setDoc(userRef, { inventory: newInventory }, { merge: true });
    } catch (error) {
      console.error("TOGGLE_MINING_FAILED", error);
    }
  };

  const handleSellItem = async (id: string) => {
    if (!user) return;
    const itemIndex = inventory.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const itemToSell = inventory[itemIndex];
    const sellBonus = itemToSell.sellValue || 0;
    const newInventory = inventory.filter(i => i.id !== id);

    try {
      const userRef = doc(db, "users", user.uid);
      const { setDoc } = await import("firebase/firestore");
      await setDoc(userRef, {
        inventory: newInventory,
        currency: Math.floor(currency + sellBonus)
      }, { merge: true });

      setCurrency(prev => prev + sellBonus);
      console.log(`%c[MATRIX_TRADE] ITEM_SOLD: +${sellBonus} BITS`, "color: #1ba51a; font-weight: bold;");
    } catch (error) {
      console.error("SELL_FAILED", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("LOGOUT_FAILED", error);
    }
  };

  return (
    <main className="min-h-screen w-screen relative overflow-hidden bg-black text-[#1ba51a] font-mono selection:bg-[#1ba51a] selection:text-black flex flex-col">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#1ba51a 1px, transparent 1px), linear-gradient(90deg, #1ba51a 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      </div>

      {/* Global Header */}
      <header className="relative z-20 px-6 py-3 flex justify-between items-center bg-black/40 backdrop-blur-sm border-b-2 border-[#1ba51a22]">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tighter italic text-[#1ba51a] drop-shadow-[0_0_10px_#1ba51a44]">
            MYCOOLSTUFF
          </h1>
          <div className="text-[9px] opacity-40 uppercase tracking-widest mt-1">
            Secure_Uplink: {user ? "AUTHORIZED_AGENT" : "GUEST_INIT"} // {new Date().getFullYear()}
          </div>
        </div>

        {/* Global Auth Controls */}
        {user ? (
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#1ba51a]">
                  AGENT: {user.displayName || user.email?.split('@')[0].toUpperCase()}
                </span>
                {/* Sound Settings Icon */}
                <button
                  onClick={() => {
                    playSound("CLICK");
                    setIsSoundSettingsOpen(true);
                  }}
                  className="w-5 h-5 border border-[#1ba51a44] flex items-center justify-center hover:bg-[#1ba51a] hover:text-black transition-all text-[10px] group"
                  title="Neural Calibration"
                >
                  <span className="group-hover:animate-pulse">🔊</span>
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="text-[9px] uppercase opacity-60 hover:opacity-100 hover:text-white transition-all underline underline-offset-4"
              >
                [DISCONNECT_SESSION]
              </button>
            </div>
            <div
              onClick={() => setIsProfileOpen(true)}
              className="w-12 h-12 border-2 border-[#1ba51a] bg-black overflow-hidden relative group shadow-[0_0_15px_#1ba51a22] cursor-pointer"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Agent" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl opacity-30 bg-[#1ba51a11]">⌬</div>
              )}
              <div className="absolute inset-0 bg-[#1ba51a22] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[8px] font-bold text-white bg-black/60 px-1 py-0.5 uppercase tracking-tighter">[EDIT]</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="border-2 border-[#1ba51a] px-8 py-2 uppercase font-bold text-sm tracking-[0.3em] hover:bg-[#1ba51a] hover:text-black transition-all shadow-[0_0_20px_#1ba51a33] active:scale-95 group relative overflow-hidden"
          >
            <span className="relative z-10">[INITIATE_UPLINK]</span>
            <div className="absolute inset-0 bg-[#1ba51a] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        )}
      </header>

      <div className="relative z-10 px-6 pt-4 flex-1 flex flex-row items-stretch gap-6 overflow-hidden w-full pb-6">
        {/* Left Column: Stats & Character */}
        <div className="flex flex-col items-start gap-3 w-[240px] flex-shrink-0">
          <div className="w-full space-y-2">
            {user && (
              <button
                onClick={() => setIsInventoryOpen(true)}
                className="w-full border border-[#1ba51a44] px-3 py-2.5 uppercase text-[10px] font-bold bg-[#1ba51a0a] hover:bg-[#1ba51a] hover:text-black transition-all group flex justify-between items-center relative overflow-hidden"
              >
                <div className="flex items-center gap-2 z-10">
                  <span className="text-base">⌬</span>
                  <span className="tracking-[0.15em]">INVENTORY</span>
                </div>
                <span className="z-10 text-[9px] opacity-60">[{inventory.length}]</span>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            )}
            {user && (
              <button
                onClick={() => { playSound("CLICK"); setIsScoreboardOpen(true); }}
                className="w-full border border-[#1ba51a44] px-3 py-2.5 uppercase text-[10px] font-bold bg-[#1ba51a0a] hover:bg-[#f4b400] hover:text-black hover:border-[#f4b400] transition-all group flex justify-between items-center relative overflow-hidden"
              >
                <div className="flex items-center gap-2 z-10">
                  <span className="text-base">◈</span>
                  <span className="tracking-[0.15em]">RANKINGS</span>
                </div>
                <span className="z-10 text-[9px] opacity-60">[LIVE]</span>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#f4b400] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            )}
          </div>

          {/* Character Component */}
          <div className="flex-shrink-0">
            <MatrixCharacterPanel />
          </div>

          <div className="mt-auto border-t border-[#1ba51a11] pt-3 w-full">
            <div className="text-[8px] opacity-20 italic leading-relaxed uppercase">
              "There is no spoon."
            </div>
          </div>
        </div>

        {/* Right Column: Status Panel (Full Height) */}
        <div className="flex-1 flex flex-col h-full">
          <MatrixStatusPanel
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onOpenShop={() => {
              playSound("CLICK");
              setIsShopOpen(true);
            }}
            currency={currency}
            inventory={inventory}
            miningMultiplierLevel={miningMultiplierLevel}
            inventoryCapacityLevel={inventoryCapacityLevel}
            sound={{ isMuted }}
          />
        </div>
      </div>


      {/* Mouse Trail */}
      <MouseTail />

      {/* Footer Info */}
      <div className="absolute bottom-4 right-4 text-[10px] opacity-40">
        SECURE_CONNECTION_ESTABLISHED // 1999
      </div>

      {/* Auth Modal */}
      <MatrixAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Inventory Modal */}
      <MatrixInventoryModal
        isOpen={isInventoryOpen}
        onClose={() => {
          playSound("CLICK");
          setIsInventoryOpen(false);
        }}
        items={inventory}
        currency={Math.floor(currency)}
        onDeleteItem={handleSellItem}
        onToggleMining={handleToggleMining}
        yieldPulse={yieldPulse}
        playSound={playSound}
      />

      {/* Shop Modal */}
      <MatrixShopModal
        isOpen={isShopOpen}
        onClose={() => {
          playSound("CLICK");
          setIsShopOpen(false);
        }}
        currency={Math.floor(currency)}
        inventory={inventory}
        miningMultiplierLevel={miningMultiplierLevel}
        inventoryCapacityLevel={inventoryCapacityLevel}
        playSound={playSound}
      />

      <MatrixSoundSettingsModal
        isOpen={isSoundSettingsOpen}
        onClose={() => setIsSoundSettingsOpen(false)}
        sound={{
          sfxVolume,
          bgmVolume,
          isMuted,
          toggleMute,
          adjustSfxVolume,
          adjustBgmVolume
        }}
      />

      {/* Profile Modal */}
      <MatrixProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Scoreboard Modal */}
      <MatrixScoreboardModal
        isOpen={isScoreboardOpen}
        onClose={() => setIsScoreboardOpen(false)}
        playSound={playSound}
      />
    </main>
  );
}
