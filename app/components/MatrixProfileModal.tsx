"use client";

import React, { useState, useRef } from "react";
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";

interface MatrixProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MatrixProfileModal({ isOpen, onClose }: MatrixProfileModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || "");
    const [photoURL, setPhotoURL] = useState(auth.currentUser?.photoURL || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);

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
            setPhotoURL(data.secure_url);
            console.log("%c[MATRIX_UPLINK] SNAPSHOT_UPLOADED", "color: #1ba51a; font-weight: bold;");
        } catch (err: any) {
            console.error("UPLOAD_ERROR", err);
            setError(`SNAP_UPLINK_FAILED: ${err.message || "Sector restricted."}`);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (auth.currentUser) {
                // 1. Update Firebase Auth Profile
                await updateProfile(auth.currentUser, {
                    displayName: displayName,
                    photoURL: photoURL
                });

                // 2. Sync to Firestore
                const { db } = await import("@/lib/firebase");
                const { doc, setDoc } = await import("firebase/firestore");
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    displayName: displayName,
                    photoURL: photoURL
                }, { merge: true });

                console.log("%c[MATRIX_PROFILE] RE-WRITE_SUCCESS", "color: #1ba51a; font-weight: bold;");
                onClose();
            }
        } catch (err: any) {
            console.error("PROFILE_UPDATE_FAILED", err);
            setError(`WRITE_FAILURE: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div className="w-full max-w-md border-4 border-[#1ba51a] bg-black p-8 shadow-[0_0_40px_#1ba51a66] relative overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center border-b-2 border-[#1ba51a] mb-8 pb-3">
                    <h2 className="text-2xl font-bold tracking-[0.2em] uppercase italic">
                        Agent_Profile
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[#1ba51a] hover:text-white transition-colors uppercase text-[10px] font-bold"
                    >
                        [TERMINATE]
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                    {/* Portrait Preview */}
                    <div className="flex justify-center mb-4">
                        <div className="relative group">
                            <div className="w-32 h-32 border-2 border-[#1ba51a] bg-black overflow-hidden shadow-[0_0_20px_#1ba51a33]">
                                {photoURL ? (
                                    <img src={photoURL} alt="Agent Portrait" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">⌬</div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-[#1ba51a] border"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1ba51a]">
                                    [UPLINK_NEW_SNAPSHOT]
                                </span>
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
                        <label className="text-[10px] uppercase opacity-60 tracking-widest">Agent_Alias</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            className="bg-[#051105] border-2 border-[#1ba51a44] p-3 text-[#1ba51a] focus:border-[#1ba51a] outline-none transition-all font-mono uppercase"
                            placeholder="MORPH_ID"
                        />
                    </div>


                    {uploading && (
                        <div className="text-[10px] animate-pulse text-[#1ba51a] italic">
                            {">"} UPLOADING_NEURAL_RECODS_TO_CLOUD_SECTOR...
                        </div>
                    )}

                    {error && (
                        <div className="text-red-500 text-[10px] uppercase border border-red-900/50 bg-red-950/20 p-2 italic leading-relaxed">
                            {">"} ERROR: {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="w-full border-2 border-[#1ba51a] py-4 uppercase font-bold hover:bg-[#1ba51a] hover:text-black transition-all disabled:opacity-30 active:scale-95 shadow-[0_0_15px_#1ba51a33]"
                    >
                        {loading ? "WRITING_TO_MATRIX..." : "COMMIT_PROFILE_REWRITE"}
                    </button>
                </form>

                {/* Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#1ba51a33] animate-[scan_3s_linear_infinite]" />
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(1000%); }
                }
            `}</style>
        </div>
    );
}
