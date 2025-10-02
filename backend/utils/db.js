// backend/utils/db.js
import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2";

const pool = mysql.createPool({
  connectionLimit: 300, // max parallel connections
  host: process.env.DB_HOST, // e.g. 93.127.208.1
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Optional: test the pool on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL pool connection error:", err.code, err.message);
    process.exit(1); // exit if you want to fail-fast
  }
  console.log("MySQL pool connected successfully");
  connection.release();
});

// Export the promise-based pool API
export default pool.promise();
