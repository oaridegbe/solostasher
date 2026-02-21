import { Resend } from 'resend';

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');
  return new Resend(apiKey);
};

export async function GET(request: Request) {
  try {
    // Verify cron secret if you have one
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const resend = getResend();

    // Use onboarding@resend.dev until notifications@solostasher.com DNS propagates
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    // TODO: Fetch due cards from database
    // const dueCards = await prisma.card.findMany({
    //   where: {
    //     targetDate: {
    //       lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due within 24h
    //       gte: new Date()
    //     }
    //   },
    //   include: { board: { include: { user: true } } }
    // });

    // TODO: Send notifications for due cards
    // for (const card of dueCards) {
    //   await resend.emails.send({
    //     to: card.board.user.email,
    //     from: fromEmail,
    //     subject: `Reminder: "${card.title}" is due soon`,
    //     html: `
    //       <h2>Card Due Reminder</h2>
    //       <p>Your card <strong>${card.title}</strong> is due on ${card.targetDate}.</p>
    //       <a href="https://solostasher.com/boards/${card.boardId}">View Board</a>
    //     `
    //   });
    // }

    return Response.json({ 
      success: true, 
      from: fromEmail,
      message: 'Using onboarding@resend.dev until DNS propagates for notifications@solostasher.com',
      sent: 0 
    });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json({ error: 'Failed to process' }, { status: 500 });
  }
}