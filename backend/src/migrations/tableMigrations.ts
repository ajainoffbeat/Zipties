import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import '../config/env.js';
import { logger } from '../utils/logger.js';

// Create a unified table to track both functions and tables
const CREATE_MIGRATION_TRACKING_TABLE = `
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  object_name TEXT NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('function', 'table')),
  source_file TEXT NOT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(object_name, object_type)
);
`;

async function ensureMigrationTrackingTable(): Promise<void> {
  await pool.query(CREATE_MIGRATION_TRACKING_TABLE);
}

async function extractTablesFromSQL(content: string, filename: string): Promise<Array<{name: string, sql: string}>> {
  const tables: Array<{name: string, sql: string}> = [];
  
  // Match CREATE TABLE statements (including CREATE TABLE IF NOT EXISTS)
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["`]?(\w+)["`]?\s*\([^)]*\)/gi;
  
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    
    // Find the full CREATE TABLE statement
    const startIndex = match.index;
    let endIndex = startIndex + match[0].length;
    
    // Look for the semicolon that ends the CREATE TABLE statement
    const remainingContent = content.substring(endIndex);
    const semicolonIndex = remainingContent.indexOf(';');
    
    if (semicolonIndex !== -1) {
      endIndex += semicolonIndex + 1;
      const fullTableSQL = content.substring(startIndex, endIndex);
      
      tables.push({
        name: tableName,
        sql: fullTableSQL
      });
    }
  }
  
  return tables;
}

async function executeTable(tableName: string, sql: string, sourceFile: string): Promise<void> {
  logger.info(`🔄 Executing table: ${tableName}`);
  
  try {
    await pool.query('BEGIN');
    
    // Execute the table SQL
    await pool.query(sql);
    
    // Record the table execution
    await pool.query(
      'INSERT INTO migrations (object_name, object_type, source_file) VALUES ($1, $2, $3)',
      [tableName, 'table', sourceFile]
    );
    
    await pool.query('COMMIT');
    logger.info(`✅ Successfully executed: ${tableName}`);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    
    // If table already exists, check if it's tracked
    if (error.code === '42P07') {
      logger.info(`⚠️  Table ${tableName} already exists, checking if tracked...`);
      
      try {
        const trackingResult = await pool.query(
          'SELECT object_name FROM migrations WHERE object_name = $1 AND object_type = $2',
          [tableName, 'table']
        );
        
        if (trackingResult.rows.length === 0) {
          // Table exists but not tracked, add it to tracking
          await pool.query(
            'INSERT INTO migrations (object_name, object_type, source_file) VALUES ($1, $2, $3)',
            [tableName, 'table', sourceFile]
          );
          logger.info(`✅ Added existing table to tracking: ${tableName}`);
        } else {
          logger.info(`⏭️  Table already tracked: ${tableName}`);
        }
      } catch (trackingError) {
        logger.error(`❌ Failed to track existing table ${tableName}`, { error: trackingError });
        throw trackingError;
      }
    } else {
      logger.error(`❌ Failed to execute ${tableName}`, { error });
      throw error;
    }
  }
}

async function getExecutedTables(): Promise<Set<string>> {
  try {
    const result = await pool.query('SELECT object_name FROM migrations WHERE object_type = $1', ['table']);
    return new Set(result.rows.map((row: { object_name: string }) => row.object_name));
  } catch (error) {
    return new Set();
  }
}

async function runTableMigrations(): Promise<void> {
  logger.info('🚀 Starting table-level migrations...');
  
  try {
    // Test database connection first
    logger.info('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connection successful');
    
    // Ensure migration tracking table exists
    await ensureMigrationTrackingTable();
    
    // Get already executed tables
    const executedTables = await getExecutedTables();
    logger.info(`📋 Found ${executedTables.size} previously executed tables`);
    
    // Migration files to process
    const migrationFiles = [
      'Create_tables.sql',
    ];
    
    const migrationDir = path.join(process.cwd(), '..', 'migration-script');
    
    for (const filename of migrationFiles) {
      logger.info(`📄 Processing file: ${filename}`);
      
      const filePath = path.join(migrationDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract tables from the file
      const tables = await extractTablesFromSQL(content, filename);
      
      if (tables.length === 0) {
          continue;
      }
      
      // Execute each table that hasn't been executed yet
      for (const table of tables) {
        if (!executedTables.has(table.name)) {
          await executeTable(table.name, table.sql, filename);
        } else {
          logger.info(`⏭️  Skipping already executed table: ${table.name}`);
        }
      }
    }
    
    logger.info('🎉 All table migrations completed successfully!');
    
  } catch (error) {
    logger.error('💥 Migration failed', { error });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
runTableMigrations();

export { runTableMigrations };
