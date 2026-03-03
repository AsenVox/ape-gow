"use client";

import React, { useMemo, useState } from "react";
import { Game } from "@/lib/games";
import { CardFace } from "./CardFace";

type Card = { rank: string; suit: string };

interface PaiGowGameWindowProps {
    game: Game;
    // Keep template props for now; we ignore them in this Pai Gow demo window.
    isSpinning: boolean;
    currentSpinIndex: number;
    gameCompleted: boolean;
    spinResults: number[][];
    betAmount: number;
    payoutAmount: number;
}

function makeDeck(): Card[] {
    const suits = ["C", "D", "H", "S"] as const;
    const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
    const deck: Card[] = [];
    for (const s of suits) {
        for (const r of ranks) deck.push({ rank: r, suit: s });
    }
    // Joker (we represent as suit 'J' like the original UI)
    deck.push({ rank: "X", suit: "J" });
    return deck;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const r = new Uint32Array(1);
        crypto.getRandomValues(r);
        const j = r[0] % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const PaiGowGameWindow: React.FC<PaiGowGameWindowProps> = ({ game }) => {
    const [handId, setHandId] = useState(1);
    const [revealDealer, setRevealDealer] = useState(false);

    const { player7, dealer7 } = useMemo(() => {
        const deck = shuffle(makeDeck());
        return {
            player7: deck.slice(0, 7),
            dealer7: deck.slice(7, 14),
        };
    }, [handId]);

    return (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center text-white p-4">
            <div className="w-full max-w-3xl grid gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-lg font-semibold">{game.title}</div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-2 rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
                            onClick={() => setRevealDealer((x) => !x)}
                        >
                            {revealDealer ? "Hide dealer" : "Reveal dealer"}
                        </button>
                        <button
                            className="px-3 py-2 rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
                            onClick={() => {
                                setRevealDealer(false);
                                setHandId((x) => x + 1);
                            }}
                        >
                            Deal new hand
                        </button>
                    </div>
                </div>

                <div className="grid gap-2">
                    <div className="text-sm opacity-80 font-semibold tracking-wide">DEALER</div>
                    <div className="flex gap-2 flex-wrap">
                        {dealer7.map((c, i) => (
                            <CardFace key={`d-${handId}-${i}`} card={c} faceDown={!revealDealer} />
                        ))}
                    </div>
                </div>

                <div className="grid gap-2">
                    <div className="text-sm opacity-80 font-semibold tracking-wide">PLAYER</div>
                    <div className="flex gap-2 flex-wrap">
                        {player7.map((c, i) => (
                            <CardFace key={`p-${handId}-${i}`} card={c} faceDown={false} />
                        ))}
                    </div>
                </div>

                <div className="text-xs opacity-60">
                    Note: this is a visual Pai Gow hand-deal demo inside the Ape Church template. Full split + settle flow is next.
                </div>
            </div>
        </div>
    );
};

export default PaiGowGameWindow;
