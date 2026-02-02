import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { cardId, dueDate, email } = await req.json()

    // Find existing pending notification for this card
    const existing = await prisma.notificationQueue.findFirst({
      where: { 
        cardId: cardId,
        status: "pending"
      }
    })

    if (existing) {
      // Update existing
      await prisma.notificationQueue.update({
        where: { id: existing.id },
        data: {
          dueDate: new Date(dueDate),
          type: email ? "email" : "notification"
        }
      })
    } else {
      // Create new
      await prisma.notificationQueue.create({
        data: {
          cardId: cardId,
          dueDate: new Date(dueDate),
          type: email ? "email" : "notification",
          status: "pending"
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error scheduling notification:", error)
    return NextResponse.json({ error: "Failed to schedule notification" }, { status: 500 })
  }
}