"use client";

import React, { useMemo, useRef, useState } from "react";
import { bytesToHex } from "viem";
import { myGame } from "./myGameConfig";
import GameWindow from "@/components/shared/GameWindow";
import type { PaiGowTableHandle, PaiGowTableStatus } from "@/components/pai-gow/PaiGowTable";
import PaiGowTable from "@/components/pai-gow/PaiGowTable";

// Template-compliant entrypoint: GameWindow shell + our canvas.
export default function MyGameComponent() {
  const tableRef = useRef<PaiGowTableHandle | null>(null);
  const [status, setStatus] = useState<PaiGowTableStatus>({
    isLoading: false,
    isGameFinished: false,
    betAmount: 0,
    payout: 0,
  });

  // GameWindow requires a stable bigint game id for modal keying.
  const currentGameId = useMemo(
    () => BigInt(bytesToHex(new Uint8Array(globalThis.crypto.getRandomValues(new Uint8Array(32))))),
    [],
  );

  return (
    <GameWindow
      game={myGame}
      currentGameId={currentGameId}
      isLoading={status.isLoading}
      isGameFinished={status.isGameFinished}
      betAmount={status.betAmount}
      payout={status.payout}
      inReplayMode={false}
      isUserOriginalPlayer={true}
      showPNL={true}
      onReset={() => tableRef.current?.reset()}
      onPlayAgain={() => tableRef.current?.playAgain()}
      onRewatch={() => tableRef.current?.rewatch()}
      playAgainText={"Play Again"}
      // Prevent template fallback audio 404 during dev.
      disableBuiltInSong={true}
      resultModalDelayMs={250}
      resultsExtra={
        status.breakdown ? (
          <div style={{
            display: "grid",
            gap: 6,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(0,0,0,0.18)",
            color: "rgba(255,255,255,0.92)",
            textShadow: "0 1px 0 rgba(0,0,0,0.35)",
            fontWeight: 800,
            letterSpacing: 0.2,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.9 }}>
              <span>Total wager</span>
              <span>{status.breakdown.totalWager}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Main</span>
              <span>{status.breakdown.main.wager} → {status.breakdown.main.payout}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Bonus</span>
              <span>{status.breakdown.bonus.wager} → {status.breakdown.bonus.payout}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Push</span>
              <span>{status.breakdown.push.wager} → {status.breakdown.push.payout}</span>
            </div>
          </div>
        ) : null
      }
    >
      <PaiGowTable ref={tableRef} onStatusChange={setStatus} hideHeader={false} />
    </GameWindow>
  );
}
