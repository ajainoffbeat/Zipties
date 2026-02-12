
import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

const inspect = async () => {
  try {
    const tables = ['user'];
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = ANY($1)
      ORDER BY table_name, ordinal_position
    `, [tables]);
    logger.info(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    logger.error('Database inspection failed', { error: err });
  } finally {
    pool.end();
  }
};

inspect();
