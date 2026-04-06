import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmail, generateReminderEmailHTML } from '@/lib/emailService';

interface TodoWithUser {
  id: number;
  user_id: number;
  title: string;
  due_date: string;
  category_name?: string;
  last_reminder_sent: string | null;
  email: string;
  name: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header with secret key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Running reminder job...');

    // Query for todos due in next 6 hours for Google-authenticated users
    // Only include todos where:
    // 1. Due date is within next 6 hours
    // 2. Not completed
    // 3. User authenticated via Google
    // 4. No reminder sent in the last 30 minutes (to avoid duplicates)
    const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await query(
      `SELECT 
        t.id,
        t.user_id,
        t.title,
        t.due_date,
        c.name as category_name,
        t.last_reminder_sent,
        u.email,
        u.name
      FROM todos t
      LEFT JOIN categories c ON t.category_id = c.id
      JOIN users u ON t.user_id = u.id
      WHERE 
        u.provider = 'google'
        AND t.completed = false
        AND t.due_date IS NOT NULL
        AND t.due_date <= $1
        AND t.due_date > now()
        AND (t.last_reminder_sent IS NULL OR t.last_reminder_sent < $2)
      ORDER BY t.due_date ASC`,
      [sixHoursFromNow, thirtyMinutesAgo]
    );

    const todos: TodoWithUser[] = result.rows;
    console.log(`Found ${todos.length} todos to send reminders for`);

    let sentCount = 0;
    let failedCount = 0;

    // Send emails for each todo
    for (const todo of todos) {
      try {
        const emailHTML = generateReminderEmailHTML(
          todo.name || 'User',
          todo.title,
          new Date(todo.due_date),
          todo.category_name
        );

        const emailSent = await sendEmail({
          to: todo.email,
          subject: `⏰ Reminder: "${todo.title}" is due in 6 hours`,
          html: emailHTML,
        });

        if (emailSent) {
          // Update last_reminder_sent timestamp
          await query(
            'UPDATE todos SET last_reminder_sent = NOW() WHERE id = $1',
            [todo.id]
          );
          sentCount++;
          console.log(`Reminder sent for todo ${todo.id} to ${todo.email}`);
        } else {
          failedCount++;
          console.error(`Failed to send reminder for todo ${todo.id}`);
        }
      } catch (error: any) {
        failedCount++;
        console.error(`Error processing todo ${todo.id}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminder job completed. Sent: ${sentCount}, Failed: ${failedCount}`,
      sentCount,
      failedCount,
      totalProcessed: todos.length,
    });
  } catch (error: any) {
    console.error('Reminder job error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing reminders' },
      { status: 500 }
    );
  }
}
