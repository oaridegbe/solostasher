import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { getServerSession } from "next-auth/next";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ ok: false });
  const { cardId, tags } = await req.json();
  await db.execute(
    "UPDATE cards SET tags = ? WHERE id = ? AND user_id = ?",
    [String(tags), String(cardId), String((session.user as any).id)]
  );
  return NextResponse.json({ ok: true });
}