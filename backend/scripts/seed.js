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

async function seedDictionary() {
  const client = await pool.connect();
  
  try {
    console.log('Seeding dictionary...');
    
    // Load dictionary data
    const dictionaryPath = path.join(__dirname, '../data/vietnamese-words.json');
    const dictionaryData = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
    
    console.log(`Found ${dictionaryData.length} words to seed`);
    
    // Clear existing dictionary
    await client.query('DELETE FROM dictionary');
    console.log('Cleared existing dictionary');
    
    // Insert words
    let inserted = 0;
    for (const word of dictionaryData) {
      try {
        await client.query(
          `INSERT INTO dictionary (word1, word2, full_word, meaning, category, frequency)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (full_word) DO NOTHING`,
          [
            word.word1,
            word.word2,
            word.full_word,
            word.meaning || '',
            word.category || 'general',
            word.frequency || 'common'
          ]
        );
        inserted++;
        
        if (inserted % 20 === 0) {
          process.stdout.write(`\rInserted ${inserted}/${dictionaryData.length} words...`);
        }
      } catch (error) {
        console.error(`\nError inserting word ${word.full_word}:`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully seeded ${inserted} words to dictionary!`);
    
    // Show some stats
    const result = await client.query('SELECT COUNT(*), category FROM dictionary GROUP BY category');
    console.log('\nDictionary statistics:');
    result.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} words`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding dictionary:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDictionary();

