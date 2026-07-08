import mysql from "mysql2/promise";

const globalForPool = globalThis;

const pool =
  globalForPool.__mysqlPool ||
  mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "omsokcom_gargdental",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 1),
    maxIdle: 1,
    idleTimeout: 10000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

if (!globalForPool.__mysqlPool) {
  globalForPool.__mysqlPool = pool;
}

export default pool;
