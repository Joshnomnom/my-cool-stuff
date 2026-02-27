"use client";

import { useEffect, useState } from "react";
import MatrixCharacterPanel from "./components/MatrixCharacterPanel";
import MatrixStatusPanel from "./components/MatrixStatusPanel";
import MatrixAuthModal from "./components/MatrixAuthModal";
import MatrixInventoryModal from "./components/MatrixInventoryModal";
import MatrixProfileModal from "./components/MatrixProfileModal";
import MouseTail from "./components/MouseTail";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

interface GachaItem {
  id: string;
  name: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "ULTRA_RARE" | "MYTHIC" | "LEGENDARY" | "ANOMALY";
  description: string;
  miningRate: number;
  sellValue: number;
  isMining?: boolean;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [inventory, setInventory] = useState<GachaItem[]>([]);
  const [currency, setCurrency] = useState(0);

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
        setInventory(data.inventory ?? []);
        setCurrency(data.currency ?? 0);
      }
    }, (error) => {
      // Silence permission-denied errors that happen during the brief window of logout
      if (error.code !== 'permission-denied') {
        console.error("FIRESTORE_SNAPSHOT_ERROR:", error);
      }
    });

    return () => unsubscribeDoc();
  }, [user]);

  // Passive Mining Logic
  useEffect(() => {
    if (!user || inventory.length === 0) return;

    const interval = setInterval(() => {
      const totalRate = inventory
        .filter(item => item.isMining)
        .reduce((sum, item) => sum + (item.miningRate || 0), 0);

      if (totalRate > 0) {
        setCurrency(prev => prev + totalRate);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, inventory]);

  const handleToggleMining = async (index: number) => {
    if (!user) return;
    const newInventory = [...inventory];
    const item = newInventory[index];

    // Check limit (Max 5)
    if (!item.isMining) {
      const activeCount = inventory.filter(i => i.isMining).length;
      if (activeCount >= 5) {
        console.warn("MAX_MINING_SLOTS_REACHED");
        return;
      }
    }

    item.isMining = !item.isMining;

    try {
      const userRef = doc(db, "users", user.uid);
      const { setDoc } = await import("firebase/firestore");
      await setDoc(userRef, { inventory: newInventory }, { merge: true });
      console.log(`%c[MATRIX_UPLINK] ITEM_${item.isMining ? 'LINKED' : 'UNLINKED'}`, "color: #1ba51a; font-weight: bold;");
    } catch (error) {
      console.error("TOGGLE_MINING_FAILED", error);
    }
  };

  // Periodic Firestore Sync for Mined BITS
  useEffect(() => {
    if (!user) return;

    const syncInterval = setInterval(async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const { setDoc } = await import("firebase/firestore");
        await setDoc(userRef, { currency: Math.floor(currency) }, { merge: true });
        console.log("%c[MATRIX_SYNC] MINED_BITS_PERSISTED", "color: #1ba51a; opacity: 0.5;");
      } catch (error) {
        console.error("SYNC_FAILED", error);
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(syncInterval);
  }, [user, currency]);

  const handleSellItem = async (index: number) => {
    if (!user) return;
    const itemToSell = inventory[index];
    const sellBonus = itemToSell.sellValue || 0;
    const newInventory = [...inventory];
    newInventory.splice(index, 1);

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
      <header className="relative z-20 px-[100px] py-6 flex justify-between items-center bg-black/40 backdrop-blur-sm border-b-2 border-[#1ba51a22]">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tighter italic text-[#1ba51a] drop-shadow-[0_0_10px_#1ba51a44]">
            GrxxnTxa308
          </h1>
          <div className="text-[9px] opacity-40 uppercase tracking-widest mt-1">
            Secure_Uplink: {user ? "AUTHORIZED_AGENT" : "GUEST_INIT"} // {new Date().getFullYear()}
          </div>
        </div>

        {/* Global Auth Controls */}
        {user ? (
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-[#1ba51a]">
                AGENT: {user.displayName || user.email?.split('@')[0].toUpperCase()}
              </span>
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

      <div className="relative z-10 px-[100px] pt-8 flex-1 flex flex-row items-stretch gap-12 overflow-hidden w-full pb-12">
        {/* Left Column: Stats & Character */}
        <div className="flex flex-col items-start gap-8 min-w-[350px]">
          <div className="w-full space-y-4">
            <div className="text-[10px] opacity-70 space-y-1 bg-[#1ba51a08] p-4 border-l-2 border-[#1ba51a44]">
              <p className="flex justify-between"><span>CONNECTION_STATUS:</span> <span>STABLE</span></p>
              <p className="flex justify-between"><span>ENCRYPTION:</span> <span>AES-256</span></p>
              <p className="flex justify-between"><span>SECTOR:</span> <span>ZION_MAIN_GATE</span></p>
            </div>

            {user && (
              <button
                onClick={() => setIsInventoryOpen(true)}
                className="w-full border border-[#1ba51a44] px-4 py-4 uppercase text-xs font-bold bg-[#1ba51a0a] hover:bg-[#1ba51a] hover:text-black transition-all group flex justify-between items-center relative overflow-hidden"
              >
                <div className="flex items-center gap-3 z-10">
                  <span className="text-xl">⌬</span>
                  <span className="tracking-[0.2em]">PERSONAL_INVENTORY</span>
                </div>
                <span className="z-10 text-[9px] opacity-60">[{inventory.length}]</span>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            )}
          </div>

          {/* Character Component */}
          <div className="flex-shrink-0">
            <MatrixCharacterPanel />
          </div>

          <div className="mt-auto border-t border-[#1ba51a11] pt-4 w-full">
            <div className="text-[9px] opacity-30 italic leading-relaxed uppercase">
              "The Matrix is all around us. It is the world that has been pulled over your eyes to blind you from the truth."
            </div>
          </div>
        </div>

        {/* Right Column: Status Panel (Full Height) */}
        <div className="flex-1 flex flex-col h-full">
          <MatrixStatusPanel
            onRequireAuth={() => setIsAuthModalOpen(true)}
            currency={currency}
            inventory={inventory}
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
        onClose={() => setIsInventoryOpen(false)}
        items={inventory}
        currency={Math.floor(currency)}
        onDeleteItem={handleSellItem}
        onToggleMining={handleToggleMining}
      />

      {/* Profile Modal */}
      <MatrixProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </main>
  );
}
