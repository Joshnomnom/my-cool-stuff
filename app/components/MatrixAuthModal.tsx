"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";

interface MatrixAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MatrixAuthModal({ isOpen, onClose }: MatrixAuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1); // 1: Auth, 2: Profile
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            setStep(1);
            setError("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "UPLOAD_FAILED");
            }

            const data = await response.json();
            setAvatarUrl(data.secure_url);
            console.log("%c[MATRIX_UPLINK] SNAPSHOT_UPLOADED", "color: #1ba51a; font-weight: bold;");
        } catch (err: any) {
            console.error("UPLOAD_ERROR", err);
            setError(`SNAP_UPLINK_FAILED: ${err.message || "Sector restricted."}`);
        } finally {
            setUploading(false);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (auth.currentUser) {
                const finalDisplayName = displayName || email.split('@')[0];
                const finalPhotoURL = avatarUrl || null;

                // 1. Update Firebase Auth Profile
                await updateProfile(auth.currentUser, {
                    displayName: finalDisplayName,
                    photoURL: finalPhotoURL
                });

                // 2. Initialize Firestore User Document
                const { db } = await import("@/lib/firebase");
                const { doc, setDoc } = await import("firebase/firestore");
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    displayName: finalDisplayName,
                    photoURL: finalPhotoURL,
                    currency: 600,
                    inventory: []
                });

                console.log("%c[MATRIX_PROFILE] SETUP_COMPLETE_&_SYNCED", "color: #1ba51a; font-weight: bold;");
                onClose();
            }
        } catch (err: any) {
            console.error("PROFILE_SETUP_FAILED", err);
            setError(`WRITE_FAILURE: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const mode = isLogin ? "SYSTEM_LOGIN" : "RECRUIT_INITIALIZATION";
        console.log(`%c[MATRIX_UPLINK] ATTEMPTING_${mode}...`, "color: #1ba51a; font-weight: bold;");

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                console.log("%c[MATRIX_UPLINK] CONNECTION_SUCCESSFUL", "color: #1ba51a;");
                onClose();
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                console.log("%c[MATRIX_UPLINK] RECRUIT_ACCEPTED", "color: #1ba51a;");
                setStep(2); // Move to profile setup
            }
        } catch (err: any) {
            console.error(`%c[MATRIX_UPLINK] ${mode}_FAILED`, "color: #ff0000; font-weight: bold;");
            let friendlyMessage = "AUTHENTICATION_FAILED";

            switch (err.code) {
                case "auth/invalid-credential":
                    friendlyMessage = isLogin
                        ? "INVALID_IDENTITY_OR_PHRASE"
                        : "REGISTRATION_DENIED: CHECK_CONSOLE";
                    break;
                case "auth/email-already-in-use":
                    friendlyMessage = "IDENTITY_ALREADY_EXISTS";
                    break;
                default:
                    friendlyMessage = err.message?.toUpperCase().replace(/\s+/g, '_') || "UNKNOWN_FAILURE";
            }

            setError(`${friendlyMessage} [${err.code || "N/A"}]`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md border-4 border-[#1ba51a] bg-black p-8 shadow-[0_0_50px_#1ba51a44] relative overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center border-b-2 border-[#1ba51a] mb-6 pb-2">
                    <h2 className="text-xl font-bold tracking-widest uppercase italic">
                        {step === 1 ? (isLogin ? "System_Login" : "Recruit_Initialization") : "Neural_Profile_Setup"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[#1ba51a] hover:text-white transition-colors uppercase text-[10px] font-bold"
                    >
                        [TERMINATE]
                    </button>
                </div>

                {/* Form Step 1: Auth */}
                {step === 1 && (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase opacity-60">Identity_Pointer (Email)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-[#051105] border-2 border-[#1ba51a44] p-3 text-[#1ba51a] focus:border-[#1ba51a] outline-none transition-all font-mono"
                                placeholder="neo@zion.net"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase opacity-60">Security_Phrase (Password)</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-[#051105] border-2 border-[#1ba51a44] p-3 text-[#1ba51a] focus:border-[#1ba51a] outline-none transition-all font-mono"
                                placeholder="********"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 border border-red-900 bg-red-950/20 p-4 relative overflow-hidden">
                                <div className="text-[10px] uppercase font-bold mb-1 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-600 animate-pulse rounded-full" />
                                    System_Alert: Error_Detected
                                </div>
                                <div className="text-[9px] opacity-80 leading-relaxed font-mono">
                                    {">"} {error}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full border-2 border-[#1ba51a] py-4 uppercase font-bold hover:bg-[#1ba51a] hover:text-black transition-all disabled:opacity-30 active:scale-95 shadow-[0_0_15px_#1ba51a33] relative group"
                        >
                            {loading ? "PROCESSING..." : (isLogin ? "INITIATE_CONNECTION" : "EXECUTE_ENROLLMENT")}
                        </button>
                    </form>
                )}

                {/* Form Step 2: Profile Setup */}
                {step === 2 && (
                    <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
                        <div className="text-[10px] opacity-60 mb-2 leading-relaxed">
                            {">"} RECRUIT_ACCEPTED. INITIALIZE_NEURAL_RECORDS.
                        </div>

                        {/* Portrait Upload */}
                        <div className="flex justify-center mb-2">
                            <div className="relative group">
                                <div className="w-24 h-24 border-2 border-[#1ba51a] bg-black overflow-hidden shadow-[0_0_15px_#1ba51a22]">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Neural Snapshot" className="w-full h-full object-cover grayscale" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">⌬</div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-[#1ba51a] border cursor-pointer"
                                >
                                    <span className="text-[8px] font-bold uppercase text-[#1ba51a]">[UPLINK_SNAPSHOT]</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase opacity-60">Agent_Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="bg-[#051105] border-2 border-[#1ba51a44] p-3 text-[#1ba51a] focus:border-[#1ba51a] outline-none transition-all font-mono"
                                placeholder="e.g. MORPHEUS"
                            />
                        </div>

                        {uploading && (
                            <div className="text-[8px] animate-pulse text-[#1ba51a] uppercase text-center">
                                {">"} UPLOADING_NEURAL_RECODS_TO_CLOUD...
                            </div>
                        )}

                        {error && (
                            <div className="text-red-500 border border-red-900 bg-red-950/20 p-3 text-[9px] uppercase italic">
                                {">"} ERROR: {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full border-2 border-[#1ba51a] py-4 uppercase font-bold hover:bg-[#1ba51a] hover:text-black transition-all disabled:opacity-30 shadow-[0_0_15px_#1ba51a33]"
                        >
                            {loading ? "CONFIGURING..." : "FINALIZE_UPLINK"}
                        </button>
                    </form>
                )}

                {/* Toggle (Only in Step 1) */}
                {step === 1 && (
                    <div className="mt-8 text-center border-t border-[#1ba51a22] pt-4">
                        <p className="text-[9px] uppercase opacity-40 mb-2">Operation_Switch:</p>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[10px] uppercase font-bold text-[#1ba51a] border border-[#1ba51a44] px-4 py-2 hover:bg-[#1ba51a22] hover:border-[#1ba51a] transition-all"
                        >
                            {isLogin ? ">> ENTER_INITIALIZATION_MODE" : "<< RETURN_TO_SYSTEM_LOGIN"}
                        </button>
                    </div>
                )}

                {/* Visual Overlays */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
                <div className="scanline" />
            </div>
        </div>
    );
}
