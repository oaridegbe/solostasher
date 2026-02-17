import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { Resend } from "resend"

const prisma = new PrismaClient()

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY not configured")
  return new Resend(apiKey)
}

export async function GET() {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 503 })
  }

  try {
    // Use simple raw query
    const notifications = await prisma.$queryRawUnsafe(`
      SELECT * FROM "NotificationQueue" 
      WHERE status = 'pending' 
      AND "dueDate" <= NOW()
    `)

    console.log("Found notifications:", notifications)

    let sentCount = 0

    for (const notification of notifications as any[]) {
      // Get card separately
      const card = await prisma.card.findUnique({
        where: { id: notification.cardId }
      })

      if (!card?.client_email) continue

      try {
        const resend = getResend()
        
        await resend.emails.send({
          from: process.env.FROM_EMAIL || "onboarding@resend.dev",
          to: card.client_email,
          subject: `Reminder: ${card.title} is due`,
          html: `<h2>Reminder: ${card.title}</h2><p>Status: ${card.status}</p>`
        })

        // Update status
        await prisma.$executeRawUnsafe(`
          UPDATE "NotificationQueue" 
          SET status = 'sent', "sentAt" = NOW() 
          WHERE id = '${notification.id}'
        `)

        sentCount++
      } catch (err) {
        console.error("Email error:", err)
        await prisma.$executeRawUnsafe(`
          UPDATE "NotificationQueue" 
          SET status = 'failed' 
          WHERE id = '${notification.id}'
        `)
      }
    }

    return NextResponse.json({ processed: (notifications as any[]).length, sent: sentCount })
  } catch (error: any) {
    console.error("Route error:", error)
    return NextResponse.json({ 
      error: "Failed to process notifications", 
      details: error.message 
    }, { status: 500 })
  }
}