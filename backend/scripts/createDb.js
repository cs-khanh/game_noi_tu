require('dotenv').config();
const { Pool } = require('pg');

const DB_NAME = process.env.DB_NAME || 'noi_tu_db';

// Connect to default postgres database to create our database
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function createDatabase() {
  const client = await pool.connect();
  
  try {
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );
    
    if (result.rows.length > 0) {
      console.log(`Database '${DB_NAME}' already exists`);
    } else {
      // Create database
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database '${DB_NAME}' created successfully!`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createDatabase();

