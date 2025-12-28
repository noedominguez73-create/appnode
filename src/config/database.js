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
    path.resolve(__dirname, '../../instance/asesoriaimss.db');

console.log("Database Path resolved to:", dbPath);

// Ensure directory exists
import fs from 'fs';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    console.log("Creating directory:", dbDir);
    fs.mkdirSync(dbDir, { recursive: true });
}

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});
