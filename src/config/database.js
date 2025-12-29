import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const dbPath = process.env.DATABASE_URL ?
    path.resolve(__dirname, '../../', process.env.DATABASE_URL) :
    path.resolve(__dirname, '../../database/mirror.db');

console.log("Database Path resolved to:", dbPath);
console.log("-----------------------------------------");
console.log("DEBUG: DB_DIALECT is:", process.env.DB_DIALECT);
console.log("DEBUG: DB_HOST is:", process.env.DB_HOST);
console.log("DEBUG: DB_USER is:", process.env.DB_USER);
console.log("-----------------------------------------");

// Ensure directory exists
import fs from 'fs';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    console.log("Creating directory:", dbDir);
    fs.mkdirSync(dbDir, { recursive: true });
}

export const sequelize = new Sequelize(
    process.env.DB_NAME || 'database',
    process.env.DB_USER || 'user',
    process.env.DB_PASS || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'sqlite', // 'mysql' or 'sqlite'
        storage: dbPath, // Only used for SQLite
        logging: false, // Reduce noise
        dialectOptions: process.env.DB_DIALECT === 'mysql' ? {
            // MySQL specific options if needed (e.g. ssl)
        } : {},
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Force journal mode to DELETE to avoid locking issues on shared hosting
sequelize.afterConnect((connection) => {
    // For SQLite, we must be careful. 
    // Sequelize exposes the raw node-sqlite3 database object in 'connection' usually,
    // or we can run a raw query through sequelize if the hook doesn't provide it directly in a standard way.
    // Safest cross-platform way in Sequelize for SQLite pragma:
    if (sequelize.options.dialect === 'sqlite') {
        // Run async param
        try {
            // node-sqlite3 API: connection.run(sql)
            // But 'connection' might be wrapped.
            // Let's use sequelize.query instead to be safe, but afterConnect implies we have a raw connection.
            // Investigating: Sequelize for sqlite, 'connection' is the database instance.
            // We can try:
            if (typeof connection.run === 'function') {
                connection.run('PRAGMA journal_mode = DELETE;');
                console.log("🔧 Power-User: Forced SQLite Journal Mode to DELETE");
            }
        } catch (e) {
            console.error("Failed to set journal_mode:", e);
        }
    } else {
        console.log("✅ Using MySQL/MariaDB - Skipping SQLite pragmas.");
    }
});
