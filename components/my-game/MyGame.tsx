"use client";

import React from "react";
import { myGame } from "./myGameConfig";
import PaiGowGame from "@/components/pai-gow/PaiGowGame";

// Template entrypoint component (kept for compliance).
export default function MyGameComponent() {
  return <PaiGowGame game={myGame} />;
}
