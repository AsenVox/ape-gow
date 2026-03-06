"use client";

import React from "react";
import PaiGowTable from "./PaiGowTable";

// Pai Gow uses its own full-screen table UI (ported from the gold master build).
// We intentionally do NOT render the template SetupCard or slot-demo logic.
export default function PaiGowGame() {
    return <PaiGowTable />;
}
