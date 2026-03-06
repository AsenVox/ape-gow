"use client";

import React from "react";
import PaiGowTable from "./PaiGowTable";

// Optional template window component hookpoint.
// For Pai Gow, the "window" is the table itself.
export default function MyGameWindow() {
  return <PaiGowTable />;
}
