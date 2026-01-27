"use client";

import { SessionProvider } from "next-auth/react";
import AuthBar from "./AuthBar";

export default function Home() {
  return (
    <SessionProvider>
      <main style={{ padding: "2rem" }}>
        <AuthBar />
        <h1>Welcome to SoloStasher</h1>
        <p>Your kanban board appears here…</p>
      </main>
    </SessionProvider>
  );
}





