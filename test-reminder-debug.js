// save as: test-reminder-debug.js
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function debug() {
  console.log('\n🔍 DEBUGGING EMAIL REMINDER SYSTEM\n');
  console.log('=' .repeat(60));
  
  // Check 1: Environment Variables
  console.log('\n✓ Checking Environment Variables...\n');
  
  const envVars = {
    'GMAIL_USER': process.env.GMAIL_USER,
    'GMAIL_APP_PASSWORD': process.env.GMAIL_APP_PASSWORD ? '✓ SET (length: ' + process.env.GMAIL_APP_PASSWORD.length + ')' : '❌ NOT SET',
    'CRON_SECRET': process.env.CRON_SECRET ? '✓ SET' : '❌ NOT SET',
    'DATABASE_URL': process.env.DATABASE_URL ? '✓ SET' : '❌ NOT SET',
  };
  
  Object.entries(envVars).forEach(([key, val]) => {
    console.log(`  ${key}: ${val}`);
  });
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('\n❌ GMAIL credentials not set! Stopping.');
    process.exit(1);
  }
  
  // Check 2: Test Gmail Connection
  console.log('\n✓ Testing Gmail SMTP Connection...\n');
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  
  try {
    await transporter.verify();
    console.log('  ✅ Gmail SMTP connection successful!');
  } catch (error) {
    console.log(`  ❌ Gmail SMTP connection failed: ${error.message}`);
    console.log('\n  Solutions:');
    console.log('  1. Check if 2-Factor Authentication is enabled');
    console.log('  2. Verify app password is 16 characters');
    console.log('  3. Re-generate app password from https://myaccount.google.com/apppasswords');
    process.exit(1);
  }
  
  // Check 3: Database Connection
  console.log('\n✓ Checking Database...\n');
  
  const client = await pool.connect();
  
  try {
    // Check users table
    const usersResult = await client.query(
      'SELECT id, email, name, provider FROM users WHERE provider = $1 LIMIT 5',
      ['google']
    );
    
    console.log(`  Found ${usersResult.rows.length} Google-authenticated users:`);
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach(user => {
        console.log(`    - ${user.email} (${user.name})`);
      });
    } else {
      console.log('  ⚠️  No Google users found! Make sure to log in with Google first.');
    }
    
    // Check for todos that should trigger reminders
    console.log('\n✓ Checking Tasks Eligible for Reminders...\n');
    
    const todosResult = await client.query(`
      SELECT 
        t.id,
        t.title,
        t.due_date,
        t.completed,
        t.last_reminder_sent,
        u.email,
        u.provider
      FROM todos t
      JOIN users u ON t.user_id = u.id
      WHERE 
        u.provider = 'google'
        AND t.completed = false
        AND t.due_date IS NOT NULL
        AND t.due_date <= NOW() + INTERVAL '6 hours'
        AND t.due_date > NOW()
      ORDER BY t.due_date ASC
    `);
    
    if (todosResult.rows.length > 0) {
      console.log(`  ✅ Found ${todosResult.rows.length} task(s) ready for reminders:\n`);
      todosResult.rows.forEach(todo => {
        console.log(`    Task: "${todo.title}"`);
        console.log(`      Email: ${todo.email}`);
        console.log(`      Due: ${new Date(todo.due_date).toLocaleString()}`);
        console.log(`      Reminder Sent: ${todo.last_reminder_sent ? new Date(todo.last_reminder_sent).toLocaleString() : 'Never'}`);
        console.log('');
      });
    } else {
      console.log('  ⚠️  No tasks found that qualify for reminders.');
      console.log('\n  This means:');
      console.log('  - No Google-logged-in users with tasks');
      console.log('  - Tasks not set to due within next 6 hours');
      console.log('  - Or tasks are already completed\n');
      
      // Check ALL todos to help debug
      const allTodos = await client.query(
        'SELECT t.id, t.title, t.due_date, t.completed, u.provider, u.email FROM todos t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT 5'
      );
      
      if (allTodos.rows.length > 0) {
        console.log('  📋 Recent tasks (for reference):');
        allTodos.rows.forEach(todo => {
          console.log(`    - "${todo.title}" (Provider: ${todo.provider}, Due: ${todo.due_date ? new Date(todo.due_date).toLocaleString() : 'None'}, Completed: ${todo.completed})`);
        });
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Database error: ${error.message}`);
  } finally {
    client.release();
  }
  
  // Check 4: Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY:\n');
  
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log('✅ Gmail credentials configured correctly');
  }
  
  console.log('\n✨ If everything is green, your reminders should work!');
  console.log('\n   Next step: Create a task due within 6 hours and trigger reminders');
  console.log('   $ curl -X GET http://localhost:3000/api/reminders -H "Authorization: Bearer YOUR_CRON_SECRET"');
  
  await pool.end();
}

debug().catch(err => {
  console.error('Debug error:', err.message);
  process.exit(1);
});
