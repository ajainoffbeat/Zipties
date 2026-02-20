import { pool } from '../config/db.js';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    console.log('🔄 Running follow system migrations...');
    
    // Read and run the follow system migration
    const migrationPath = path.join(process.cwd(), 'src', 'sql', 'migrations', '002_add_follow_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Running 002_add_follow_system.sql...');
    await pool.query(migrationSQL);
    console.log('✅ 002_add_follow_system.sql completed');
    
    // Read and run the profile function update
    const profileFunctionPath = path.join(process.cwd(), 'src', 'sql', 'migrations', '003_update_user_profile_function.sql');
    const profileFunctionSQL = fs.readFileSync(profileFunctionPath, 'utf8');
    
    console.log('📝 Running 003_update_user_profile_function.sql...');
    await pool.query(profileFunctionSQL);
    console.log('✅ 003_update_user_profile_function.sql completed');
    
    console.log('🎉 All migrations completed successfully!');
    
    // Test the functions
    console.log('🧪 Testing follow functions...');
    
    // Test follower count function
    const followerCountResult = await pool.query('SELECT fn_get_follower_count($1::uuid) as count', ['00000000-0000-0000-0000-000000000000']);
    console.log('✅ fn_get_follower_count works:', followerCountResult.rows[0].count);
    
    // Test following count function
    const followingCountResult = await pool.query('SELECT fn_get_following_count($1::uuid) as count', ['00000000-0000-0000-0000-000000000000']);
    console.log('✅ fn_get_following_count works:', followingCountResult.rows[0].count);
    
    // Test is_following function
    const isFollowingResult = await pool.query('SELECT fn_is_following($1::uuid, $2::uuid) as is_following', [
      '00000000-0000-0000-0000-000000000000', 
      '00000000-0000-0000-0000-000000000001'
    ]);
    console.log('✅ fn_is_following works:', isFollowingResult.rows[0].is_following);
    
    console.log('🎉 All functions tested successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().catch(console.error);
