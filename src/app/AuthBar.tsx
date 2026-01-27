// AuthBar component for NextAuth session
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthBar() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading…</p>;

  if (session)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span>Signed in as <strong>{session.user?.email}</strong></span>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );

  return <button onClick={() => signIn("google")}>Sign in with Google</button>;
}
