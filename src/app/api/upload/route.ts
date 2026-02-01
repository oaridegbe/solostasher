import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll("file") as File[];
  if (!files.length) return NextResponse.json([], { status: 400 });

  const urls = await Promise.all(
    files.map(async file => {
      const { url } = await put(file.name, file, { access: "public" });
      return { url, name: file.name };
    })
  );

  return NextResponse.json(urls);
}