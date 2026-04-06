require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration...');
    
    // Create categories table
    console.log('Creating categories table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      );
    `);
    
    console.log('Creating categories index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
    `);
    
    // Check if category_id column exists
    console.log('Checking if category_id column exists...');
    const checkColumn = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'todos' AND column_name = 'category_id'
      );
    `);
    
    if (!checkColumn.rows[0].exists) {
      console.log('Adding category_id column to todos table...');
      await client.query(`
        ALTER TABLE todos ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
      `);
      
      console.log('Creating category_id index...');
      await client.query(`
        CREATE INDEX idx_category_id ON todos(category_id);
      `);
    } else {
      console.log('category_id column already exists');
    }
    
    // Check if due_date column exists
    console.log('Checking if due_date column exists...');
    const checkDueDate = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'todos' AND column_name = 'due_date'
      );
    `);
    
    if (!checkDueDate.rows[0].exists) {
      console.log('Adding due_date column to todos table...');
      await client.query(`
        ALTER TABLE todos ADD COLUMN due_date TIMESTAMP NULL;
      `);
      
      console.log('Creating due_date index...');
      await client.query(`
        CREATE INDEX idx_due_date ON todos(due_date);
      `);
    } else {
      console.log('due_date column already exists');
    }

    // Check if last_reminder_sent column exists
    console.log('Checking if last_reminder_sent column exists...');
    const checkReminder = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'todos' AND column_name = 'last_reminder_sent'
      );
    `);
    
    if (!checkReminder.rows[0].exists) {
      console.log('Adding last_reminder_sent column to todos table...');
      await client.query(`
        ALTER TABLE todos ADD COLUMN last_reminder_sent TIMESTAMP NULL;
      `);
    } else {
      console.log('last_reminder_sent column already exists');
    }
    
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
