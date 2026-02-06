import { pool } from "../config/db.js";

const inspectSocketFields = async () => {
  try {
    console.log("🔍 Inspecting user table for socket fields...\n");

    // Check if socket fields exist
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user'
      AND column_name IN ('socket_id', 'socket_connected_at')
      ORDER BY column_name;
    `);

    console.log("Socket-related columns in user table:");
    console.log(JSON.stringify(columnsResult.rows, null, 2));
    console.log();

    // Check if socket functions exist
    console.log("🔍 Checking socket functions...\n");
    const functionsResult = await pool.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name LIKE 'fn_%socket%'
      ORDER BY routine_name;
    `);

    console.log("Socket functions:");
    console.log(JSON.stringify(functionsResult.rows, null, 2));
    console.log();

    // Test updating socket
    console.log("🧪 Testing socket update...\n");
    
    // Create a test user
    const userResult = await pool.query(`
      INSERT INTO "user" (id, email, username, password, created_at)
      VALUES (uuid_generate_v4(), $1, $2, 'test', NOW())
      RETURNING id, username
    `, [`test_socket_${Date.now()}@example.com`, `test_socket_${Date.now()}`]);
    
    const testUser = userResult.rows[0];
    console.log(`Created test user: ${testUser.username} (${testUser.id})`);

    // Update socket
    await pool.query("SELECT fn_update_user_socket($1, $2)", [testUser.id, 'test-socket-123']);
    console.log("✅ Called fn_update_user_socket");

    // Verify socket was stored
    const verifyResult = await pool.query(`
      SELECT id, username, socket_id, socket_connected_at
      FROM "user"
      WHERE id = $1
    `, [testUser.id]);

    console.log("\nUser record after socket update:");
    console.log(JSON.stringify(verifyResult.rows[0], null, 2));

    // Clear socket
    await pool.query("SELECT fn_clear_user_socket($1)", ['test-socket-123']);
    console.log("\n✅ Called fn_clear_user_socket");

    // Verify socket was cleared
    const clearResult = await pool.query(`
      SELECT id, username, socket_id, socket_connected_at
      FROM "user"
      WHERE id = $1
    `, [testUser.id]);

    console.log("\nUser record after socket clear:");
    console.log(JSON.stringify(clearResult.rows[0], null, 2));

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
};

inspectSocketFields();
