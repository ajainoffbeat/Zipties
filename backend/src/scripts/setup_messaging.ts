
import { pool } from "../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger.js";

const applySql = async () => {
  try {
    const dirPath = path.join(process.cwd(), "src/db/functions");
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".sql")).sort();
    
    for (const file of files) {
        const sqlPath = path.join(dirPath, file);
        const sql = fs.readFileSync(sqlPath, "utf-8");
        logger.info(`Applying SQL from: ${file}`);
        await pool.query(sql);
    }
    
    logger.info("Successfully applied all messaging schema and functions.");
  } catch (err) {
    logger.error("Error applying SQL:", { error: err });
  } finally {
    pool.end();
  }
};

applySql();
