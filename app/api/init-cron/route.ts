import { NextRequest, NextResponse } from 'next/server';
import { startReminderCron } from '@/lib/cronScheduler';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize the cron job
    startReminderCron();

    return NextResponse.json({
      success: true,
      message: 'Reminder cron job initialized. Will run every hour.',
    });
  } catch (error: any) {
    console.error('Cron initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize cron job' },
      { status: 500 }
    );
  }
}
