import { pool } from '../config/db.js';

async function testDB() {
  try {
    const result = await pool.query('SELECT NOW() as time, version() as version');
    console.log(JSON.stringify({
      success: true,
      time: result.rows[0].time,
      version: result.rows[0].version.substring(0, 50) + '...'
    }));
    
    const userCount = await pool.query('SELECT COUNT(*) as count FROM public."user"');
    console.log(JSON.stringify({
      users: userCount.rows[0].count
    }));
    
    const followerCount = await pool.query('SELECT COUNT(*) as count FROM public.follower');
    console.log(JSON.stringify({
      followers: followerCount.rows[0].count
    }));
    
    const functions = await pool.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname IN ('fn_get_user_profile', 'fn_follow_user', 'fn_unfollow_user')
    `);
    console.log(JSON.stringify({
      functions: functions.rows.map(r => r.proname)
    }));
    
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      error: error.message
    }));
  } finally {
    await pool.end();
  }
}

testDB();
