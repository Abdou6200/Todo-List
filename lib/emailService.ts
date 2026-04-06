import nodemailer from 'nodemailer';

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Failed to send email:', error.message);
    return false;
  }
}

export function generateReminderEmailHTML(
  userName: string,
  taskTitle: string,
  dueDate: Date,
  category?: string
): string {
  const dueTime = dueDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9f9f9; border-radius: 8px; margin-top: 20px; }
          .task { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 10px 0; }
          .task-title { font-size: 18px; font-weight: bold; color: #333; }
          .task-meta { font-size: 14px; color: #666; margin-top: 10px; }
          .category { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
          .due-time { font-weight: bold; color: #e74c3c; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          a { color: #667eea; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Task Reminder</h1>
            <p>Hi ${userName}, you have a task that's about to be due!</p>
          </div>
          
          <div class="content">
            <p>Your task is due in the next 6 hours:</p>
            
            <div class="task">
              <div class="task-title">${taskTitle}</div>
              ${category ? `<div class="category">${category}</div>` : ''}
              <div class="task-meta">
                <strong>Due:</strong> <span class="due-time">${dueTime}</span>
              </div>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/todos" 
                 style="background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; display: inline-block;">
                View Your Tasks
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated reminder from your Todo App.</p>
            <p>© ${new Date().getFullYear()} Todo App. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
