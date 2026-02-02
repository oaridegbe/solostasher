import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { updatedAt: "desc" }
    })
    return NextResponse.json(cards)
  } catch (error) {
    console.error("Error fetching cards:", error)
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, email, color, tags, due_date, files } = await request.json()
    
    const card = await prisma.card.create({
      data: {
        title,
        client_email: email || null,
        color: color || "#3b82f6",
        tags: tags || "",
        due_date: due_date || null,
        files: files || "[]",
        status: "inquiry"
      }
    })
    
    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error("Error creating card:", error)
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 })
  }
}