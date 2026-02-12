
import { pool } from "./src/config/db.js";
import fs from 'fs';

async function debug() {
    let output = "--- DB DEBUG ---\n";
    try {
        const colsRes = await pool.query("SELECT * FROM \"user\" LIMIT 0");
        output += "User Columns:\n" + JSON.stringify(Object.keys(colsRes.fields.reduce((acc, f) => ({ ...acc, [f.name]: 1 }), {})), null, 2) + "\n\n";

        const sampleRes = await pool.query("SELECT * FROM \"user\" LIMIT 1");
        output += "Sample User:\n" + JSON.stringify(sampleRes.rows[0], null, 2) + "\n\n";

        fs.writeFileSync('debug_out.txt', output);
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('debug_out.txt', output + "\nERROR:\n" + err.stack);
        process.exit(1);
    }
}

debug();
