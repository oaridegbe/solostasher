import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { Resend } from "resend"

const prisma = new PrismaClient()

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY not configured")
  return new Resend(apiKey)
}

// Send Slack notification
async function sendSlackNotification(card: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.log("Slack webhook not configured")
    return
  }

  const message = {
    text: `🔔 Deal Reminder: *${card.title}* is due!`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🔔 Deal Due Today",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Deal:*\n${card.title}`
          },
          {
            type: "mrkdwn",
            text: `*Status:*\n${card.status}`
          },
          {
            type: "mrkdwn",
            text: `*Client:*\n${card.client_email || "N/A"}`
          },
          {
            type: "mrkdwn",
            text: `*Tags:*\n${card.tags || "None"}`
          }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View in Dashboard",
              emoji: true
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL || "https://solostasher.com"}/dashboard`,
            style: "primary"
          }
        ]
      }
    ]
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    })
    
    if (!response.ok) {
      throw new Error(`Slack error: ${response.status}`)
    }
    
    console.log("Slack notification sent")
  } catch (error) {
    console.error("Failed to send Slack:", error)
  }
}

export async function GET() {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 503 })
  }

  try {
    // Use NOW() directly in SQL
    const notifications = await prisma.$queryRawUnsafe(`
      SELECT n.*, c.title, c."client_email", c.status, c.color, c.tags
      FROM "NotificationQueue" n
      JOIN "Card" c ON n."cardId" = c.id
      WHERE n.status = 'pending' 
      AND n."dueDate" <= NOW()
    `)

    console.log("Found notifications:", (notifications as any[]).length)

    let sentCount = 0

    for (const row of notifications as any[]) {
      if (!row.client_email) continue

      try {
        // Send Email
        const resend = getResend()
        await resend.emails.send({
          from: process.env.FROM_EMAIL || "onboarding@resend.dev",
          to: row.client_email,
          subject: `Reminder: ${row.title} is due`,
          html: `
            <h2>Deal Reminder</h2>
            <p><strong>${row.title}</strong> is due.</p>
            <p>Status: ${row.status}</p>
            <br>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://solostasher.com"}/dashboard" 
               style="background:#3b82f6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
              View Deal
            </a>
          `
        })

        // Send Slack
        await sendSlackNotification(row)

        // Mark as sent
        await prisma.$executeRawUnsafe(`
          UPDATE "NotificationQueue" 
          SET status = 'sent', "sentAt" = NOW() 
          WHERE id = '${row.id}'
        `)

        // Log activity
        await prisma.$executeRawUnsafe(`
          INSERT INTO "ActivityLog" ("cardId", action, details, "createdAt")
          VALUES ('${row.cardId}', 'notification_sent', 'Email and Slack sent to ${row.client_email}', NOW())
        `)

        sentCount++
      } catch (err) {
        console.error("Notification error:", err)
        await prisma.$executeRawUnsafe(`
          UPDATE "NotificationQueue" 
          SET status = 'failed' 
          WHERE id = '${row.id}'
        `)
      }
    }

    return NextResponse.json({ 
      processed: (notifications as any[]).length, 
      sent: sentCount 
    })
  } catch (error: any) {
    console.error("Route error:", error)
    return NextResponse.json({ 
      error: "Failed to process notifications", 
      details: error.message 
    }, { status: 500 })
  }
}
