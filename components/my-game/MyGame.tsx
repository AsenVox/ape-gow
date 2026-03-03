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
    >
      <PaiGowTable ref={tableRef} onStatusChange={setStatus} />
    </GameWindow>
  );
}
