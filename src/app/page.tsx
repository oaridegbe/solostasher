"use client"; // must be a client component for useSession

import { SessionProvider } from "next-auth/react";
import { useSession, signIn, signOut } from "next-auth/react";

/* ---------- mini header that reacts to session ---------- */
function AuthBar() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading…</p>;

  if (session)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span>Signed in as <strong>{session.user?.email}</strong></span>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );

  return (
    <button onClick={() => signIn("google")}>Sign in with Google</button>
  );
}

/* ---------- root page ---------- */
export default function Home() {
  return (
    <SessionProvider>
      <main style={{ padding: "2rem" }}>
        <AuthBar />
        <h1>Welcome to Solostasher</h1>
        <p>Your kanban board appears here…</p>
      </main>
    </SessionProvider>
  );
}


