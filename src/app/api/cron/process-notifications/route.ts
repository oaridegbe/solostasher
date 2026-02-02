import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { Resend } from "resend"

const prisma = new PrismaClient()

// Lazy init Resend to avoid build-time errors
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured")
  }
  return new Resend(apiKey)
}

export async function GET() {
  // Check for API key at runtime
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ 
      error: "Email service not configured. Add RESEND_API_KEY to .env.local" 
    }, { status: 503 })
  }

  try {
    const resend = getResend()
    
    const notifications = await prisma.notificationQueue.findMany({
      where: {
        status: "pending",
        dueDate: { lte: new Date() }
      },
      include: {
        card: true
      }
    })

    let sentCount = 0

    for (const notification of notifications) {
      if (!notification.card?.client_email) continue

      try {
        await resend.emails.send({
          from: process.env.FROM_EMAIL || "onboarding@resend.dev",
          to: notification.card.client_email,
          subject: `Reminder: ${notification.card.title} is due`,
          html: `
            <h2>Deal Reminder</h2>
            <p><strong>${notification.card.title}</strong> is due.</p>
            <p>Status: ${notification.card.status}</p>
            <br>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" 
               style="background:#3b82f6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
              View Deal
            </a>
          `
        })

        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: { 
            status: "sent",
            sentAt: new Date()
          }
        })

        await prisma.activityLog.create({
          data: {
            cardId: notification.cardId,
            action: "notification_sent",
            details: `Email sent to ${notification.card.client_email}`
          }
        })

        sentCount++
      } catch (emailError) {
        console.error("Failed to send email:", emailError)
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: { status: "failed" }
        })
      }
    }

    return NextResponse.json({ 
      processed: notifications.length, 
      sent: sentCount 
    })
  } catch (error) {
    console.error("Error processing notifications:", error)
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 })
  }
}