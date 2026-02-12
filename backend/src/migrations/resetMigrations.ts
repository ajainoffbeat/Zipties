import { pool } from '../config/db.js';
import '../config/env.js';
import { logger } from '../utils/logger.js';

async function resetMigrations(): Promise<void> {
  logger.info('🔄 Resetting database migrations...');
  
  try {
    // Test database connection first
    logger.info('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connection successful');
    
    await pool.query('BEGIN');
    
    // Drop all functions dynamically
    logger.info('🗑️  Dropping all functions...');
    const functionsResult = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      AND routine_name LIKE 'fn_%'
    `);
    
    for (const func of functionsResult.rows) {
      const dropStatement = `DROP FUNCTION IF EXISTS ${func.routine_name} CASCADE`;
      try {
        await pool.query(dropStatement);
      } catch (error) {
      }
    }
    
    // Drop all tables dynamically (in correct order to handle dependencies)
    logger.info('🗑️  Dropping all tables...');
    
    // First drop all tables with foreign key constraints
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY 
        CASE 
          WHEN table_name = 'sql_migrations' THEN 1
          WHEN table_name IN ('api_rate_limit', 'error_log', 'user_login_log', 'message') THEN 2
          WHEN table_name IN ('conversation_member', 'user_report', 'user_role_mapping') THEN 3
          WHEN table_name IN ('conversation', 'user_role', 'user_status', 'city', 'message_content_type', 'conversation_type', 'conversation_source_type') THEN 4
          WHEN table_name = 'user' THEN 5
          ELSE 6
        END
    `);
    
    for (const table of tablesResult.rows) {
      const dropStatement = `DROP TABLE IF EXISTS "${table.table_name}" CASCADE`;
      try {
        await pool.query(dropStatement);
      } catch (error) {
      }
    }
    
    await pool.query('COMMIT');
    logger.info('🎉 Database reset completed! All tables and functions dropped.');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('💥 Database reset failed', { error });
    throw error;
  } finally {
    await pool.end();
  }
}

resetMigrations();