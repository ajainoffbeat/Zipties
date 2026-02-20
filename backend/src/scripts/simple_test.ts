import { pool } from '../config/db.js';

async function simpleTest() {
  try {
    console.log('🔌 Testing database connection...');
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', result.rows[0].current_time);
    
    console.log('👥 Checking users...');
    const userResult = await pool.query('SELECT COUNT(*) as count FROM public."user"');
    console.log(`✅ Found ${userResult.rows[0].count} users`);
    
    console.log('📋 Checking follower table...');
    const followerResult = await pool.query('SELECT COUNT(*) as count FROM public.follower');
    console.log(`✅ Found ${followerResult.rows[0].count} follower relationships`);
    
    console.log('🔧 Checking if functions exist...');
    const functionResult = await pool.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN ('fn_get_user_profile', 'fn_follow_user', 'fn_unfollow_user')
    `);
    console.log('✅ Functions found:', functionResult.rows.map(r => r.proname));
    
    if (functionResult.rows.length === 3) {
      console.log('🧪 Testing profile function...');
      const testUser = await pool.query('SELECT id FROM public."user" LIMIT 1');
      if (testUser.rows.length > 0) {
        const userId = testUser.rows[0].id;
        const profileResult = await pool.query('SELECT * FROM fn_get_user_profile($1, $2)', [userId, userId]);
        const profile = profileResult.rows[0];
        console.log('📊 Profile fields:', Object.keys(profile));
        console.log('📊 Followers:', profile.followers_count);
        console.log('📊 Following:', profile.following_count);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

simpleTest();
