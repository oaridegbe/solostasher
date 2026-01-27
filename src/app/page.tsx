import { getServerSession } from "next-auth/next";
import { SessionProvider } from "next-auth/react";
import AuthBar from "./AuthBar";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <SessionProvider session={session}>
      <main style={{ padding: "2rem" }}>
        <AuthBar />
        <h1>Welcome to Solostasher</h1>
        <p>Your kanban board appears here…</p>
      </main>
    </SessionProvider>
  );
}




