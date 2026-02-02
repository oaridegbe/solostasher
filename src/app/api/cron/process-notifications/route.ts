import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function sendEmail(to: string, subject: string) {
  // Your email sending logic here
  console.log(`Sending email to ${to}: ${subject}`)
}

export async function GET() {
  try {
    const notifications = await prisma.notificationQueue.findMany({
      where: {
        status: "pending",
        dueDate: { lte: new Date() }
      },
      include: {
        card: true
      }
    })

    for (const notification of notifications) {
      if (notification.card?.client_email) {
        await sendEmail(notification.card.client_email, notification.card.title)
        
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: { 
            status: "sent",
            sentAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({ processed: notifications.length })
  } catch (error) {
    console.error("Error processing notifications:", error)
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 })
  }
}