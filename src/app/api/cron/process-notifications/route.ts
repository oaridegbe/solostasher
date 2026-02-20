import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { Resend } from "resend"

const prisma = new PrismaClient()

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY not configured")
  return new Resend(apiKey)
}

async function sendSlackNotification(card: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.log("Slack webhook not configured")
    return
  }

  const message = {
    text: `Deal Reminder: *${card.title}* is due!`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Deal Due Today",
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
      }
    ]
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    })
    console.log("Slack sent")
  } catch (error) {
    console.error("Slack failed:", error)
  }
}

export async function GET() {
  try {
    const notifications = await prisma.$queryRawUnsafe(`
      SELECT n.*, c.title, c."client_email", c.status, c.tags
      FROM "NotificationQueue" n
      JOIN "Card" c ON n."cardId" = c.id
      WHERE n.status = 'pending'
      AND n."dueDate" <= NOW()
    `)

    let sentCount = 0

    for (const row of notifications as any[]) {
      if (!row.client_email) continue

      try {
        // Email
        const resend = getResend()
        await resend.emails.send({
          from: process.env.FROM_EMAIL || "onboarding@resend.dev",
          to: row.client_email,
          subject: `Reminder: ${row.title} is due`,
          html: `<h2>${row.title}</h2><p>Status: ${row.status}</p>`
        })

        // Slack
        await sendSlackNotification(row)

        // Update status
        await prisma.$executeRawUnsafe(`
          UPDATE "NotificationQueue" 
          SET status = 'sent', "sentAt" = NOW() 
          WHERE id = '${row.id}'
        `)

        sentCount++
      } catch (err) {
        console.error("Error:", err)
      }
    }

    return NextResponse.json({ processed: (notifications as any[]).length, sent: sentCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
