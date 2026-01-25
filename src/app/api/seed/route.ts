import { createClient } from "@libsql/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { randomUUID } from "crypto";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function GET() {
  const session = await getServerSession();
  const userId = session?.user ? (session.user as any).id : "demo-user";

  const id = randomUUID();
const title = "Sample Deal";
const email = "client@example.com";
const status = "inquiry";

await db.execute(
  "INSERT OR IGNORE INTO cards (id, user_id, title, client_email, status) VALUES (?, ?, ?, ?, ?)",
  [String(id), String(userId), String(title), String(email), String(status)]
);
  return NextResponse.json({ ok: true });
}