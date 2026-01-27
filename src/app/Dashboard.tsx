"use client";

import { SessionProvider } from "next-auth/react";
import AuthBar from "./AuthBar";
import Dashboard from "./Dashboard"; // your kanban component

export default function Home() {
  return (
    <SessionProvider>
      <AuthBar />
      <Dashboard />
    </SessionProvider>
  );
}
