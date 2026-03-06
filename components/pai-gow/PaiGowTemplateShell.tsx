"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";

import GameWindow from "@/components/shared/GameWindow";
import { paiGow } from "@/components/pai-gow/paiGowConfig";
import PaiGowTable, { type PaiGowTableHandle, type PaiGowTableStatus } from "@/components/pai-gow/PaiGowTable";

function BreakdownExtra({ status }: { status: PaiGowTableStatus | null }) {
  const b = status?.breakdown;
  if (!b) return null;

  const fmt = (n: number) => (Number.isFinite(n) ? n.toString() : "0");

  return (
    <div className="pgBreakdownOverlay">
      <div className="pgBreakdownCard" aria-label="Pai Gow breakdown">
        <div className="pgBreakdownTitle">RESULT BREAKDOWN</div>
        <div className="pgBreakdownGrid">
          <div className="pgLine">
            <div>MAIN</div>
            <div className="pgWager">{fmt(b.main.wager)}</div>
            <div className={b.main.payout >= 0 ? "pgPos" : "pgNeg"}>{fmt(b.main.payout)}</div>
          </div>
          <div className="pgLine">
            <div>BONUS</div>
            <div className="pgWager">{fmt(b.bonus.wager)}</div>
            <div className={b.bonus.payout >= 0 ? "pgPos" : "pgNeg"}>{fmt(b.bonus.payout)}</div>
          </div>
          <div className="pgLine">
            <div>PUSH</div>
            <div className="pgWager">{fmt(b.push.wager)}</div>
            <div className={b.push.payout >= 0 ? "pgPos" : "pgNeg"}>{fmt(b.push.payout)}</div>
          </div>
          <div className="pgLine pgNet">
            <div>NET</div>
            <div className="pgWager">{fmt(b.totalWager)}</div>
            <div className={(status?.payout ?? 0) >= 0 ? "pgPos" : "pgNeg"}>{fmt(status?.payout ?? 0)}</div>
          </div>
        </div>
        <div className="pgBreakdownFine">
          {b.outcome ? `Outcome: ${b.outcome}` : ""}
          {b.dealerAceHighPaiGow ? " • Dealer Ace High Pai Gow" : ""}
        </div>
      </div>
    </div>
  );
}

export default function PaiGowTemplateShell() {
  const tableRef = useRef<PaiGowTableHandle | null>(null);
  const [status, setStatus] = useState<PaiGowTableStatus | null>(null);
  const [gameId, setGameId] = useState<bigint>(() => BigInt(Date.now()));

  const onStatusChange = useCallback((s: PaiGowTableStatus) => {
    setStatus(s);
  }, []);

  const onReset = useCallback(() => {
    tableRef.current?.reset();
    setGameId(BigInt(Date.now()));
  }, []);

  const onPlayAgain = useCallback(() => {
    tableRef.current?.playAgain();
    setGameId(BigInt(Date.now()));
  }, []);

  const onRewatch = useCallback(() => {
    tableRef.current?.rewatch();
    setGameId(BigInt(Date.now()));
  }, []);

  const betAmount = status?.betAmount ?? 0;
  const payout = status?.payout ?? 0;

  const resultsExtra = useMemo(() => <BreakdownExtra status={status} />, [status]);

  return (
    <GameWindow
      game={paiGow}
      isLoading={!!status?.isLoading}
      isGameFinished={!!status?.isGameFinished}
      betAmount={betAmount}
      payout={payout}
      inReplayMode={true}
      isUserOriginalPlayer={true}
      showPNL={false}
      onReset={onReset}
      onPlayAgain={onPlayAgain}
      onRewatch={onRewatch}
      currentGameId={gameId}
      // Make the result modal feel like an end-of-hand animation beat.
      resultModalDelayMs={350}
      // Pai Gow has its own UI soundscape; keep template music off.
      disableBuiltInSong={true}
      resultsExtra={resultsExtra}
    >
      <PaiGowTable ref={tableRef} onStatusChange={onStatusChange} />
    </GameWindow>
  );
}
