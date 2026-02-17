import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { Resend } from "resend"

const prisma = new PrismaClient()

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured")
  }
  return new Resend(apiKey)
}

export async function GET() {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ 
      error: "Email service not configured" 
    }, { status: 503 })
  }

  try {
    const now = new Date().toISOString()
    
    // Use raw query that we know works
    const notifications: any = await prisma.$queryRaw`
      SELECT n.*, c.id as "card.id", c.title as "card.title", 
             c."client_email" as "card.client_email", c.status as "card.status",
             c.color as "card.color", c.tags as "card.tags"
      FROM "NotificationQueue" n
      LEFT JOIN "Card" c ON n."cardId" = c.id
      WHERE n.status = 'pending' 
      AND n."dueDate" <= ${now}
    `

    let sentCount = 0

    for (const notification of notifications) {
      const cardEmail = notification["card.client_email"]
      
      if (!cardEmail) {
        console.log("Skipping - no client email")
        continue
      }

      try {
        const resend = getResend()
        
        const result = await resend.emails.send({
          from: process.env.FROM_EMAIL || "onboarding@resend.dev",
          to: cardEmail,
          subject: `Reminder: ${notification["card.title"]} is due`,
          html: `
            <h2>Deal Reminder</h2>
            <p><strong>${notification["card.title"]}</strong> is due.</p>
            <p>Status: ${notification["card.status"]}</p>
            <br>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://solostasher.com"}/dashboard" 
               style="background:#3b82f6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
              View Deal
            </a>
          `
        })

        // Mark as sent
        await prisma.$executeRaw`
          UPDATE "NotificationQueue" 
          SET status = 'sent', "sentAt" = NOW() 
          WHERE id = ${notification.id}
        `

        // Log activity
        await prisma.$executeRaw`
          INSERT INTO "ActivityLog" ("cardId", action, details, "createdAt")
          VALUES (${notification.cardId}, 'notification_sent', ${`Email sent to ${cardEmail}`}, NOW())
        `

        sentCount++
      } catch (emailError) {
        console.error("Failed to send email:", emailError)
        await prisma.$executeRaw`
          UPDATE "NotificationQueue" 
          SET status = 'failed' 
          WHERE id = ${notification.id}
        `
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