import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import '../config/env.js';

async function runSeedData(): Promise<void> {
  console.log('🌱 Starting data seeding...');
  
  try {
    // Test database connection first
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if seed data already exists
    const seedExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM sql_migrations 
        WHERE filename = 'Seed_data.sql'
      )
    `);
    
    if (seedExists.rows[0].exists) {
      console.log('⏭️  Seed data already executed, skipping...');
      return;
    }
    
    // Read and execute Seed_data.sql (contains seed data)
    const functionsPath = path.join(process.cwd(), '..', 'migration-script', 'Seed_data.sql');
    const seedContent = fs.readFileSync(functionsPath, 'utf8');
    
    console.log('📄 Executing seed data from Seed_data.sql...');
    
    await pool.query('BEGIN');
    await pool.query(seedContent);
    
    // Record seed execution
    await pool.query(`
      INSERT INTO sql_migrations (filename, executed_at) 
      VALUES ('Seed_data.sql', NOW())
    `);
    
    await pool.query('COMMIT');
    console.log('✅ Seed data executed successfully');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Failed to execute seed data:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
runSeedData().catch(console.error);
