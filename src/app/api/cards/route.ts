import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { getServerSession } from "next-auth/next";
import crypto from "crypto";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ ok: false });
  const body = await req.json();
  const id = crypto.randomUUID();
  await db.execute(
  "INSERT INTO cards (id, user_id, title, client_email, status) VALUES (?, ?, ?, ?, ?)",
  [String(id), String((session.user as any).id), String(body.title), String(body.email), "inquiry"]
);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json([]);
  const rs = await db.execute(
    "SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC",
    [String((session.user as any).id)]
  );
  return NextResponse.json(rs.rows);
}
