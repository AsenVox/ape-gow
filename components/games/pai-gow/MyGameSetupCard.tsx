"use client";

import React from "react";

// Template SetupCard (right panel). The platform will render this alongside MyGameWindow.
// We provide a stable host element that PaiGowTable can portal its desktop sidebar into.
export default function MyGameSetupCard() {
  return (
    <div style={{ height: "100%", minHeight: 0 }}>
      <div id="pai-gow-desktop-sidebar-host" style={{ height: "100%", minHeight: 0 }} />
    </div>
  );
}
