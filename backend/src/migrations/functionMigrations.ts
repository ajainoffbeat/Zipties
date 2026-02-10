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

async function extractFunctionsFromSQL(content: string, filename: string): Promise<Array<{name: string, sql: string}>> {
  const functions: Array<{name: string, sql: string}> = [];
  
  // Remove all spaces and newlines for regex matching
  const compactContent = content.replace(/\s+/g, ' ').trim();
  
  // Find all CREATE OR REPLACE FUNCTION statements with robust parameter matching
  // This regex handles the compacted content
  const createFunctionRegex = /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(?:public\.)?(\w+)\s*\([^)]*\)/gis;
  
  let match;
  while ((match = createFunctionRegex.exec(compactContent)) !== null) {
    const functionName = match[1];
    
    // Find the function in the original content using the function name
    // This regex captures the entire function from CREATE to the final semicolon
    // It handles both AS $$ and LANGUAGE plpgsql AS $$ patterns, and $$ LANGUAGE plpgsql; endings
    const originalFunctionRegex = new RegExp(`CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+(?:public\\.)?${functionName}\\s*\\([^)]*\\)[\\s\\S]*?\\bAS\\s+\\$\\$[\\s\\S]*?\\$\\$(?:\\s+LANGUAGE\\s+plpgsql)?\\s*;`, 'gis');
    const originalMatch = originalFunctionRegex.exec(content);
    
    if (originalMatch) {
      const startIndex = originalMatch.index;
      const fullFunctionSQL = originalMatch[0];
      
      // Check if we already have this function (avoid duplicates)
      if (!functions.find(f => f.name === functionName)) {
        functions.push({
          name: functionName,
          sql: fullFunctionSQL
        });
        console.log(`🔍 Found function "${functionName}"`);
      }
    }
  }
  
  return functions;
}

async function executeFunction(functionName: string, sql: string, sourceFile: string): Promise<void> {
  console.log(`🔄 Executing function: ${functionName}`);
  
  try {
    await pool.query('BEGIN');
    
    // Execute the function SQL
    await pool.query(sql);
    
    // Record the function execution
    await pool.query(
      'INSERT INTO migrations (object_name, object_type, source_file) VALUES ($1, $2, $3)',
      [functionName, 'function', sourceFile]
    );
    
    await pool.query('COMMIT');
    console.log(`✅ Successfully executed: ${functionName}`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`❌ Failed to execute ${functionName}:`, error);
    throw error;
  }
}

async function getExecutedFunctions(): Promise<Set<string>> {
  try {
    const result = await pool.query('SELECT object_name FROM migrations WHERE object_type = $1', ['function']);
    return new Set(result.rows.map((row: { object_name: string }) => row.object_name));
  } catch (error) {
    return new Set();
  }
}

async function runFunctionMigrations(): Promise<void> {
  console.log('🚀 Starting function-level migrations...');
  
  try {
    // Test database connection first
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Ensure migration tracking table exists
    await ensureMigrationTrackingTable();
    
    // Get already executed functions
    const executedFunctions = await getExecutedFunctions();
    console.log(`📋 Found ${executedFunctions.size} previously executed functions`);
    
    // Migration files to process
    const migrationFiles = [
      'Auth_functions.sql',
      'User_functions.sql', 
      'Logs_functions.sql',
      'Messaging_functions.sql'
    ];
    
    const migrationDir = path.join(process.cwd(), '..', 'migration-script');
    
    for (const filename of migrationFiles) {
      console.log(`📄 Processing file: ${filename}`);
      
      const filePath = path.join(migrationDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract functions from the file
      const functions = await extractFunctionsFromSQL(content, filename);
      console.log(filename,functions)
      
      if (functions.length === 0) {
        console.log(`ℹ️  No functions found in ${filename}, executing as table migration`);
        
        // If no functions (like Create_tables.sql), execute the whole file if not already done
        if (filename === 'Create_tables.sql' || filename === 'Functions.sql') {
          try {
            const migrationResult = await pool.query('SELECT filename FROM sql_migrations WHERE filename = $1', [filename]);
            if (migrationResult.rows.length === 0) {
              await pool.query('BEGIN');
              await pool.query(content);
              await pool.query('INSERT INTO sql_migrations (filename) VALUES ($1)', [filename]);
              await pool.query('COMMIT');
              console.log(`✅ Executed table migration: ${filename}`);
            } else {
              console.log(`⏭️  Skipping already executed: ${filename}`);
            }
          } catch (error: any) {
            // Table doesn't exist or already exists, handle gracefully
            if (error.code === '42P07') {
              console.log(`⚠️  Tables already exist, checking if tracked...`);
              
              try {
                const migrationResult = await pool.query('SELECT filename FROM sql_migrations WHERE filename = $1', [filename]);
                if (migrationResult.rows.length === 0) {
                  await pool.query('INSERT INTO sql_migrations (filename) VALUES ($1)', [filename]);
                  console.log(`✅ Added existing file to tracking: ${filename}`);
                } else {
                  console.log(`⏭️  File already tracked: ${filename}`);
                }
              } catch (trackingError) {
                console.error(`❌ Failed to track existing file ${filename}:`, trackingError);
              }
            } else {
              // Table doesn't exist, so execute the file
              await pool.query('BEGIN');
              await pool.query(content);
              await pool.query('INSERT INTO sql_migrations (filename) VALUES ($1)', [filename]);
              await pool.query('COMMIT');
              console.log(`✅ Executed table migration (first time): ${filename}`);
            }
          }
        }
        continue;
      }
      
      // Execute each function that hasn't been executed yet
      for (const func of functions) {
        if (!executedFunctions.has(func.name)) {
          await executeFunction(func.name, func.sql, filename);
        } else {
          console.log(`⏭️  Skipping already executed function: ${func.name}`);
        }
      }
    }
    
    console.log('🎉 All function migrations completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
runFunctionMigrations();

export { runFunctionMigrations };
