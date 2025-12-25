require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'noi_tu_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

const migrationSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  words_contributed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dictionary table
CREATE TABLE IF NOT EXISTS dictionary (
  id SERIAL PRIMARY KEY,
  word1 VARCHAR(50) NOT NULL,
  word2 VARCHAR(50) NOT NULL,
  full_word VARCHAR(100) NOT NULL UNIQUE,
  meaning TEXT,
  category VARCHAR(50),
  frequency VARCHAR(20) DEFAULT 'common',
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on full_word for faster lookups
CREATE INDEX IF NOT EXISTS idx_dictionary_full_word ON dictionary(full_word);
CREATE INDEX IF NOT EXISTS idx_dictionary_word1 ON dictionary(word1);

-- Community words table
CREATE TABLE IF NOT EXISTS community_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word1 VARCHAR(50) NOT NULL,
  word2 VARCHAR(50) NOT NULL,
  full_word VARCHAR(100) NOT NULL,
  meaning TEXT,
  submitted_by_user_id UUID,
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(100) NOT NULL,
  winner_id UUID,
  players JSONB NOT NULL,
  words_chain JSONB NOT NULL,
  game_mode VARCHAR(50) DEFAULT 'classic',
  duration INTEGER,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  game_id UUID REFERENCES games(id),
  words_used INTEGER DEFAULT 0,
  new_words_contributed INTEGER DEFAULT 0,
  is_disabled BOOLEAN DEFAULT FALSE,
  disabled_reason VARCHAR(100),
  placement INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  requirement JSONB
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID,
  achievement_id INTEGER REFERENCES achievements(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
CREATE INDEX IF NOT EXISTS idx_games_winner_id ON games(winner_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_game_id ON player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_community_words_status ON community_words(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running database migrations...');
    
    await client.query(migrationSQL);
    
    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

