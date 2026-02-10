import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import '../config/env.js';

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
  console.log(`🔄 Executing table: ${tableName}`);
  
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
    console.log(`✅ Successfully executed: ${tableName}`);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    
    // If table already exists, check if it's tracked
    if (error.code === '42P07') {
      console.log(`⚠️  Table ${tableName} already exists, checking if tracked...`);
      
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
          console.log(`✅ Added existing table to tracking: ${tableName}`);
        } else {
          console.log(`⏭️  Table already tracked: ${tableName}`);
        }
      } catch (trackingError) {
        console.error(`❌ Failed to track existing table ${tableName}:`, trackingError);
        throw trackingError;
      }
    } else {
      console.error(`❌ Failed to execute ${tableName}:`, error);
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
  console.log('🚀 Starting table-level migrations...');
  
  try {
    // Test database connection first
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Ensure migration tracking table exists
    await ensureMigrationTrackingTable();
    
    // Get already executed tables
    const executedTables = await getExecutedTables();
    console.log(`📋 Found ${executedTables.size} previously executed tables`);
    
    // Migration files to process
    const migrationFiles = [
      'Create_tables.sql',
    ];
    
    const migrationDir = path.join(process.cwd(), '..', 'migration-script');
    
    for (const filename of migrationFiles) {
      console.log(`📄 Processing file: ${filename}`);
      
      const filePath = path.join(migrationDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract tables from the file
      const tables = await extractTablesFromSQL(content, filename);
      
      if (tables.length === 0) {
        console.log(`ℹ️  No tables found in ${filename}`);
        continue;
      }
      
      // Execute each table that hasn't been executed yet
      for (const table of tables) {
        if (!executedTables.has(table.name)) {
          await executeTable(table.name, table.sql, filename);
        } else {
          console.log(`⏭️  Skipping already executed table: ${table.name}`);
        }
      }
    }
    
    console.log('🎉 All table migrations completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
runTableMigrations();

export { runTableMigrations };
