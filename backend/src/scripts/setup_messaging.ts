
import { pool } from "../config/db.js";
import fs from "fs";
import path from "path";

const applySql = async () => {
  try {
    const dirPath = path.join(process.cwd(), "src/db/functions");
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".sql")).sort();
    
    for (const file of files) {
        const sqlPath = path.join(dirPath, file);
        const sql = fs.readFileSync(sqlPath, "utf-8");
        console.log(`Applying SQL from: ${file}`);
        await pool.query(sql);
    }
    
    console.log("Successfully applied all messaging schema and functions.");
  } catch (err) {
    console.error("Error applying SQL:", err);
  } finally {
    pool.end();
  }
};

applySql();
