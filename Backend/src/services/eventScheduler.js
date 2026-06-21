import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExpiredEvents() {
  try {
    const result = await prisma.event.updateMany({
      where: {
        date: { lt: new Date() },
        status: 'active',
      },
      data: { status: 'past' },
    });
    if (result.count > 0) {
      console.log(`✅ Marked ${result.count} events as past`);
    }
  } catch (err) {
    console.error('❌ Event expiry check failed:', err.message);
  }
}

export function startEventScheduler() {
  checkExpiredEvents();
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running daily event expiry check...');
    await checkExpiredEvents();
  });

  console.log('📅 Event scheduler started — checks daily at midnight');
}