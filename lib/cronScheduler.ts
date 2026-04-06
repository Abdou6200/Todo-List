import cron from 'node-cron';

let cronJob: ReturnType<typeof cron.schedule> | null = null;

export function startReminderCron() {
  if (cronJob) {
    console.log('Reminder cron job already running');
    return;
  }

  // Run every hour at the top of the hour
  cronJob = cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running scheduled reminder check...');
    
    try {
      const response = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reminders`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✓ Reminder check completed:', data.message);
      } else {
        console.error('✗ Reminder check failed:', response.statusText);
      }
    } catch (error: any) {
      console.error('✗ Error running reminder cron:', error.message);
    }
  });

  console.log('✓ Reminder cron job started (runs hourly)');
}

export function stopReminderCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('✓ Reminder cron job stopped');
  }
}
