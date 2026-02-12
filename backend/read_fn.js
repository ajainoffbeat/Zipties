
import { pool } from "./src/config/db.js";
import fs from 'fs';

async function debug() {
    try {
        const res = await pool.query("SELECT prosrc FROM pg_proc WHERE proname = 'fn_search_users_by_name'");
        fs.writeFileSync('fn_def.txt', res.rows[0]?.prosrc || "NOT FOUND");
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('fn_def.txt', err.stack);
        process.exit(1);
    }
}

debug();
