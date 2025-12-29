import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// ==========================================
// 🛡️ SOLID MYSQL CONFIGURATION
// ==========================================
// No filesystem operations, no directory creation.
// Pure Environment Variable configuration.

console.log("🔌 Initializing Database Connection (MySQL)...");
console.log("   Target Host:", process.env.DB_HOST || 'localhost');
console.log("   Target User:", process.env.DB_USER || 'u182581262_terminal');
console.log("   Target DB:  ", process.env.DB_NAME || 'u182581262_appnode');

export const sequelize = new Sequelize(
    process.env.DB_NAME || 'u182581262_appnode', // Database Name
    process.env.DB_USER || 'u182581262_terminal', // User
    process.env.DB_PASS || 'WeK6#VY54+JU4Kn',    // Password
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false, // Keep logs clean
        port: process.env.DB_PORT || 3306,
        dialectOptions: {
            ssl: {
                require: false,
                rejectUnauthorized: false
            },
            // Timeout settings to prevent hanging if DB is unreachable
            connectTimeout: 10000
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Verify Connection Logic is handled in server.js initialization
// This file is now purely Configuration.
