import { pool } from '../config/db.js';
import '../config/env.js';
import { logger } from '../utils/logger.js';

interface Migration {
  object_name: string;
  object_type: string;
  source_file: string;
  executed_at: string;
}

async function getUnifiedStatus(): Promise<void> {
  logger.info('📊 Unified Migration Status Report');
  logger.info('==================================');
  
  try {
    // Test database connection first
    logger.info('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connection successful\n');
    
    // Check and show table migrations
    logger.info('📋 TABLE MIGRATIONS');
    logger.info('-------------------');
    
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'migrations'
      )
    `);
    
    if (tableExists.rows[0].exists) {
      const tableResult = await pool.query(`
        SELECT object_name, source_file, executed_at 
        FROM migrations 
        WHERE object_type = 'table'
        ORDER BY executed_at ASC
      `);
      
      if (tableResult.rows.length > 0) {
        logger.info(`✅ Found ${tableResult.rows.length} migrated tables:\n`);
        
        tableResult.rows.forEach((row: Migration, index: number) => {
          const executedAt = new Date(row.executed_at).toLocaleString();
          logger.info(`${index + 1}. ${row.object_name}`);
          logger.info(`   Source: ${row.source_file}`);
          logger.info(`   Executed: ${executedAt}\n`);
        });
      } else {
        logger.info('⚠️  No tables have been migrated yet.\n');
      }
    } else {
      logger.info('❌ Migration tracking does not exist. Run migrations first.\n');
    }
    
    // Check and show function migrations
    logger.info('🔧 FUNCTION MIGRATIONS');
    logger.info('---------------------');
    
    const functionExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'migrations'
      )
    `);
    
    if (functionExists.rows[0].exists) {
      const functionResult = await pool.query(`
        SELECT object_name, source_file, executed_at 
        FROM migrations 
        WHERE object_type = 'function'
        ORDER BY executed_at ASC
      `);
      
      if (functionResult.rows.length > 0) {
        logger.info(`✅ Found ${functionResult.rows.length} migrated functions:\n`);
        
        functionResult.rows.forEach((row: Migration, index: number) => {
          const executedAt = new Date(row.executed_at).toLocaleString();
          logger.info(`${index + 1}. ${row.object_name}`);
          logger.info(`   Source: ${row.source_file}`);
          logger.info(`   Executed: ${executedAt}\n`);
        });
      } else {
        logger.info('⚠️  No functions have been migrated yet.\n');
      }
    } else {
      logger.info('❌ Migration tracking does not exist. Run function migrations first.\n');
    }
    
    // Show comparison with actual database objects
    logger.info('🔍 DATABASE OBJECTS COMPARISON');
    logger.info('------------------------------');
    
    // Get all tables in database
    const allTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    // Get all functions in database
    const allFunctionsResult = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      AND routine_name LIKE 'fn_%'
      ORDER BY routine_name
    `);
    
    logger.info(`📊 Database contains ${allTablesResult.rows.length} tables and ${allFunctionsResult.rows.length} functions\n`);
    
    // Show summary
    const trackedTables = tableExists.rows[0].exists ? 
      await pool.query('SELECT COUNT(*) FROM migrations WHERE object_type = $1', ['table']) : { rows: [{ count: 0 }] };
    const trackedFunctions = functionExists.rows[0].exists ? 
      await pool.query('SELECT COUNT(*) FROM migrations WHERE object_type = $1', ['function']) : { rows: [{ count: 0 }] };
    
    logger.info('📈 SUMMARY');
    logger.info('-----------');
    logger.info(`Tables: ${trackedTables.rows[0].count} tracked / ${allTablesResult.rows.length} total`);
    logger.info(`Functions: ${trackedFunctions.rows[0].count} tracked / ${allFunctionsResult.rows.length} total`);
    
    const untrackedTables = allTablesResult.rows.length - trackedTables.rows[0].count;
    const untrackedFunctions = allFunctionsResult.rows.length - trackedFunctions.rows[0].count;
    
    if (untrackedTables > 0 || untrackedFunctions > 0) {
      logger.info('\n⚠️  UNTRACKED OBJECTS');
      logger.info('---------------------');
      
      if (untrackedTables > 0) {
        logger.info(`Tables not tracked: ${untrackedTables}`);
        // Show untracked tables
        if (tableExists.rows[0].exists) {
          const trackedTableNames = await pool.query('SELECT object_name FROM migrations WHERE object_type = $1', ['table']);
          const trackedNames = new Set(trackedTableNames.rows.map((r: any) => r.object_name));
          const untracked = allTablesResult.rows.filter((r: any) => !trackedNames.has(r.table_name));
          untracked.forEach((t: any) => logger.info(`  - ${t.table_name}`));
        }
      }
      
      if (untrackedFunctions > 0) {
        logger.info(`Functions not tracked: ${untrackedFunctions}`);
        // Show untracked functions
        if (functionExists.rows[0].exists) {
          const trackedFunctionNames = await pool.query('SELECT object_name FROM migrations WHERE object_type = $1', ['function']);
          const trackedNames = new Set(trackedFunctionNames.rows.map((r: any) => r.object_name));
          const untracked = allFunctionsResult.rows.filter((r: any) => !trackedNames.has(r.routine_name));
          untracked.forEach((f: any) => logger.info(`  - ${f.routine_name}`));
        }
      }
    }
    
  } catch (error) {
    logger.error('💥 Failed to get unified status', { error });
  } finally {
    try {
      await pool.end();
      logger.info('\n🔌 Database connection closed');
    } catch (closeError) {
      // Ignore connection close errors
    }
  }
}

// Run status check if this file is executed directly
getUnifiedStatus();

export { getUnifiedStatus };
