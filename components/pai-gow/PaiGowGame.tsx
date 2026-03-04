"use client";

import React from "react";
import { Game } from "@/lib/games";
import PaiGowTable from "./PaiGowTable";

interface PaiGowGameProps {
    game: Game;
}

// Pai Gow uses its own full-screen table UI (ported from the gold master build).
// We intentionally do NOT render the template SetupCard or slot-demo logic.
export default function PaiGowGame(_props: PaiGowGameProps) {
    void _props;
    return <PaiGowTable />;
}
