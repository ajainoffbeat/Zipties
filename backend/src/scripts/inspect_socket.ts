import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

const inspectSocketFields = async () => {
  try {

    // Check if socket fields exist
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user'
      AND column_name IN ('socket_id', 'socket_connected_at')
      ORDER BY column_name;
    `);


    // Check if socket functions exist
    const functionsResult = await pool.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name LIKE 'fn_%socket%'
      ORDER BY routine_name;
    `);


    // Test updating socket
    
    // Create a test user
    const userResult = await pool.query(`
      INSERT INTO "user" (id, email, username, password, created_at)
      VALUES (uuid_generate_v4(), $1, $2, 'test', NOW())
      RETURNING id, username
    `, [`test_socket_${Date.now()}@example.com`, `test_socket_${Date.now()}`]);
    
    const testUser = userResult.rows[0];

    // Update socket
    await pool.query("SELECT fn_update_user_socket($1, $2)", [testUser.id, 'test-socket-123']);

    // Verify socket was stored
    const verifyResult = await pool.query(`
      SELECT id, username, socket_id, socket_connected_at
      FROM "user"
      WHERE id = $1
    `, [testUser.id]);


    // Clear socket
    await pool.query("SELECT fn_clear_user_socket($1)", ['test-socket-123']);

    // Verify socket was cleared
    const clearResult = await pool.query(`
      SELECT id, username, socket_id, socket_connected_at
      FROM "user"
      WHERE id = $1
    `, [testUser.id]);


  } catch (error: any) {
    logger.error('❌ Socket inspection error', { error: error.message });
    logger.error('Socket inspection failed', { error });
  } finally {
    await pool.end();
  }
};

inspectSocketFields();
