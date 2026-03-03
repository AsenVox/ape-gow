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
          <div
            style={{
              width: "100%",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.20)",
              backdropFilter: "blur(8px)",
              padding: "12px 14px",
              color: "rgba(255,255,255,0.92)",
              textShadow: "0 1px 0 rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ fontWeight: 950, letterSpacing: 2.0, fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
              BREAKDOWN
            </div>

            {(() => {
              const pos = "rgba(140,255,0,0.95)";
              const neg = "rgba(255,90,90,0.95)";
              const dim = "rgba(255,255,255,0.85)";
              const line = (label: string, wager: number, payout?: number) => (
                <div
                  key={label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 14,
                    alignItems: "baseline",
                    fontWeight: 900,
                    fontSize: 20,
                    lineHeight: 1.1,
                    padding: "10px 0",
                    borderTop: label === "Total wager" ? "none" : "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <span style={{ opacity: 0.92 }}>{label}</span>
                  <span style={{ color: dim }}>{wager}</span>
                  <span style={{ color: payout == null ? "transparent" : payout > 0 ? pos : payout < 0 ? neg : dim }}>
                    {payout == null ? "—" : payout}
                  </span>
                </div>
              );

              return (
                <>
                  {line("Total wager", status.breakdown.totalWager)}
                  {line("Main bet", status.breakdown.main.wager, status.breakdown.main.payout)}
                  {line("Bonus bet", status.breakdown.bonus.wager, status.breakdown.bonus.payout)}
                  {line("Push bet", status.breakdown.push.wager, status.breakdown.push.payout)}
                  {line("Net payout", status.breakdown.totalWager, status.payout)}

                  <div style={{ marginTop: 8, opacity: 0.72, fontSize: 12, fontWeight: 800 }}>
                    Outcome: {status.breakdown.outcome}
                    {status.breakdown.dealerAceHighPaiGow ? " (Dealer Ace-High Push)" : ""}
                  </div>
                </>
              );
            })()}
          </div>
        ) : null
      }
    >
      <PaiGowTable ref={tableRef} onStatusChange={setStatus} hideHeader={false} />
    </GameWindow>
  );
}
