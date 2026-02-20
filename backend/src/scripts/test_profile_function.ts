import { pool } from '../config/db.js';

async function testProfileFunction() {
  try {
    console.log('🧪 Testing profile function with follow data...');
    
    // Get a sample user ID first (you may need to adjust this)
    const userResult = await pool.query('SELECT id FROM public."user" LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`👤 Testing with user ID: ${userId}`);
    
    // Test the profile function
    const profileResult = await pool.query('SELECT * FROM fn_get_user_profile($1, $2)', [userId, userId]);
    
    if (profileResult.rows.length === 0) {
      console.log('❌ No profile data returned');
      return;
    }
    
    const profile = profileResult.rows[0];
    console.log('📊 Profile data:');
    console.log('- ID:', profile.id);
    console.log('- Username:', profile.username);
    console.log('- Followers count:', profile.followers_count);
    console.log('- Following count:', profile.following_count);
    console.log('- Is following (self):', profile.is_following);
    console.log('- Is blocked:', profile.isblocked);
    
    // Test following someone
    console.log('\n🔄 Testing follow functionality...');
    
    // Get another user to test following
    const otherUserResult = await pool.query('SELECT id FROM public."user" WHERE id != $1 LIMIT 1', [userId]);
    
    if (otherUserResult.rows.length > 0) {
      const otherUserId = otherUserResult.rows[0].id;
      console.log(`👥 Following user: ${otherUserId}`);
      
      // Follow the user
      const followResult = await pool.query('SELECT * FROM fn_follow_user($1, $2)', [userId, otherUserId]);
      console.log('✅ Follow result:', followResult.rows[0]);
      
      // Check profile again
      const newProfileResult = await pool.query('SELECT * FROM fn_get_user_profile($1, $2)', [userId, userId]);
      const newProfile = newProfileResult.rows[0];
      
      console.log('\n📊 Updated profile data:');
      console.log('- Followers count:', newProfile.followers_count);
      console.log('- Following count:', newProfile.following_count);
      
      // Check other user's profile
      const otherProfileResult = await pool.query('SELECT * FROM fn_get_user_profile($1, $2)', [userId, otherUserId]);
      const otherProfile = otherProfileResult.rows[0];
      
      console.log('\n📊 Other user profile data:');
      console.log('- Followers count:', otherProfile.followers_count);
      console.log('- Following count:', otherProfile.following_count);
      console.log('- Is following:', otherProfile.is_following);
      
      // Unfollow
      console.log('\n🔄 Testing unfollow...');
      const unfollowResult = await pool.query('SELECT * FROM fn_unfollow_user($1, $2)', [userId, otherUserId]);
      console.log('✅ Unfollow result:', unfollowResult.rows[0]);
      
    } else {
      console.log('⚠️ Only one user in database, cannot test follow functionality');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testProfileFunction().catch(console.error);
