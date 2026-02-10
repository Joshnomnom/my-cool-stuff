"use client";

import React, { useEffect, useState, useRef } from "react";

interface Particle {
    id: number;
    x: number;
    y: number;
    value: string;
    opacity: number;
    scale: number;
}

export default function MouseTail() {
    const [particles, setParticles] = useState<Particle[]>([]);
    const requestRef = useRef<number>(null);
    const particleIdCounter = useRef(0);
    const lastPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Only spawn if mouse moved enough distance (e.g., 25px for clear spacing)
            if (distance < 25) return;

            lastPos.current = { x: e.clientX, y: e.clientY };

            const newParticle: Particle = {
                id: particleIdCounter.current++,
                x: e.clientX,
                y: e.clientY,
                value: Math.random() > 0.5 ? "1" : "0",
                opacity: 1,
                scale: 1,
            };

            setParticles((prev) => [...prev.slice(-40), newParticle]); // Longer trail limit
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        const updateParticles = () => {
            setParticles((prev) =>
                prev
                    .map((p) => ({
                        ...p,
                        opacity: p.opacity - 0.02, // Slower fade for longer tail
                        scale: p.scale - 0.005,    // Slower shrink
                    }))
                    .filter((p) => p.opacity > 0)
            );
            requestRef.current = requestAnimationFrame(updateParticles);
        };

        requestRef.current = requestAnimationFrame(updateParticles);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map((p) => (
                <span
                    key={p.id}
                    className="absolute font-mono text-[#1ba51a] pointer-events-none select-none"
                    style={{
                        left: p.x,
                        top: p.y,
                        opacity: p.opacity,
                        transform: `translate(-50%, -50%) scale(${p.scale})`,
                        textShadow: "0 0 8px rgba(27, 165, 26, 0.8)",
                        fontSize: "16px",
                        fontWeight: "bold",
                        transition: "none",
                    }}
                >
                    {p.value}
                </span>
            ))}
        </div>
    );
}
