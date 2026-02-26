"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type ImageState = "normal" | "blink" | "wink" | "open_mouth" | "shock";

interface MatrixCharacterPanelProps {
}

const FRAME_WIDTH = 250;
const FRAME_HEIGHT = 250;
const IMAGE_SIZE = 200; // Match frame size

const MOVEMENT_STEP = 5; // Subtle movement
const FPS = 3; // Keep low FPS

export default function MatrixCharacterPanel() {
    // Start centered
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [direction, setDirection] = useState<Direction>("RIGHT");
    const [imageState, setImageState] = useState<ImageState>("normal");
    const [stateTimer, setStateTimer] = useState<number>(0);

    // Load assets
    const assets = {
        normal: "/assets/pixel_normal.png",
        blink: "/assets/pixel_blink.jpg",
        wink: "/assets/pixel_wink_one_eye.jpg",
        open_mouth: "/assets/pixel_open_mouth.jpg",
        shock: "/assets/pixel_shock.jpg",
    };


    // Game Loop (Low FPS)
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Handle State Reversion
            if (imageState !== "normal" && stateTimer > 0) {
                setStateTimer((prev) => prev - 1);
            } else if (imageState !== "normal" && stateTimer <= 0) {
                setImageState("normal");
            }

            // 2. Handle Expression Transitions (Randomly if normal)
            if (imageState === "normal") {
                const rand = Math.random();
                if (rand < 0.05) { // 5% Blink (Common-ish)
                    setImageState("blink");
                    setStateTimer(2);
                } else if (rand < 0.08) { // 3% Rare (Wink/Open Mouth)
                    const rareAction = Math.random() > 0.5 ? "wink" : "open_mouth";
                    setImageState(rareAction);
                    setStateTimer(2);
                } else if (rand < 0.10) { // 2% Ultra-Rare (Shock)
                    setImageState("shock");
                    setStateTimer(3); // Slightly longer for shock
                }
            }

            // 3. Handle Movement (Jittering)
            setPosition((prev) => {
                let newX = prev.x;
                let newY = prev.y;
                let newDirection = direction;

                switch (direction) {
                    case "UP": newY -= MOVEMENT_STEP; break;
                    case "DOWN": newY += MOVEMENT_STEP; break;
                    case "LEFT": newX -= MOVEMENT_STEP; break;
                    case "RIGHT": newX += MOVEMENT_STEP; break;
                }

                // Boundary Checks (Very tight bounds, just jittering around 0)
                // Allowed deviation from center: +/- 10px
                const MAX_DEVIATION = 10;

                let hitWall = false;

                if (newX <= -MAX_DEVIATION) { newX = -MAX_DEVIATION; hitWall = true; newDirection = "RIGHT"; }
                if (newX >= MAX_DEVIATION) { newX = MAX_DEVIATION; hitWall = true; newDirection = "LEFT"; }
                if (newY <= -MAX_DEVIATION) { newY = -MAX_DEVIATION; hitWall = true; newDirection = "DOWN"; }
                if (newY >= MAX_DEVIATION) { newY = MAX_DEVIATION; hitWall = true; newDirection = "UP"; }

                if (hitWall) {
                    setDirection(newDirection);
                } else if (Math.random() < 0.3) {
                    const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
                    setDirection(directions[Math.floor(Math.random() * directions.length)]);
                }

                return { x: newX, y: newY };
            });

        }, 1000 / FPS);

        return () => clearInterval(interval);
    }, [direction, imageState, stateTimer]);

    // User Interaction
    const handleClick = () => {
        if (imageState === "shock") return;

        const randomAction = Math.random() > 0.5 ? "wink" : "open_mouth";
        setImageState(randomAction);
        setStateTimer(2);
    };

    return (
        <div className="">
            {/* Frame */}
            <div
                className="relative border-4 border-[#1ba51a] bg-black cursor-pointer overflow-hidden shadow-[0_0_20px_#1ba51a33]"
                style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
                onClick={handleClick}
            >
                {/* Image */}
                <div
                    className="absolute transition-none"
                    style={{
                        left: position.x,
                        top: position.y,
                        width: '100%',
                        height: '100%',
                        transform: 'scale(1.1)' // Slight zoom to cover edges during movement
                    }}
                >
                    <Image
                        src={assets[imageState]}
                        alt="Matrix Character"
                        fill
                        className="object-cover pixelated" // Cover so it fills the zoomed container
                        draggable={false}
                    />
                </div>

                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-10" />
                <div className="noise-overlay" />
                <div className="scanline" />
            </div>
        </div>
    );
}
