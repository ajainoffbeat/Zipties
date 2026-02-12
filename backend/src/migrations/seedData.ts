import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import '../config/env.js';
import { logger } from '../utils/logger.js';

async function runSeedData(): Promise<void> {
  logger.info('🌱 Starting data seeding...');
  
  try {
    // Test database connection first
    logger.info('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connection successful');
    
    // Check if seed data already exists
    const seedExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM sql_migrations 
        WHERE filename = 'Seed_data.sql'
      )
    `);
    
    if (seedExists.rows[0].exists) {
      logger.info('⏭️  Seed data already executed, skipping...');
      return;
    }
    
    // Read and execute Seed_data.sql (contains seed data)
    const functionsPath = path.join(process.cwd(), '..', 'migration-script', 'Seed_data.sql');
    const seedContent = fs.readFileSync(functionsPath, 'utf8');
    
    logger.info('📄 Executing seed data from Seed_data.sql...');
    
    await pool.query('BEGIN');
    await pool.query(seedContent);
    
    // Record seed execution
    await pool.query(`
      INSERT INTO sql_migrations (filename, executed_at) 
      VALUES ('Seed_data.sql', NOW())
    `);
    
    await pool.query('COMMIT');
    logger.info('✅ Seed data executed successfully');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('❌ Failed to execute seed data', { error });
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seeder
runSeedData().catch((error) => logger.error('Seed data execution failed', { error }));
