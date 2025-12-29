const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * ==========================================
 * DATABASE CONFIGURATION (MySQL + Sequelize)
 * ==========================================
 * 
 * Production-ready configuration for Hostinger MySQL.
 * All credentials should be defined in environment variables.
 * 
 * Required ENV Variables:
 * - DB_HOST: Database host (e.g., 127.0.0.1)
 * - DB_USER: Database username
 * - DB_NAME: Database name
 * - DB_PASS: Database password
 * - DB_PORT: (Optional) Database port, defaults to 3306
 */

// ==========================================
// CONFIGURATION VALIDATION
// ==========================================

// TEMPORARY: Hardcoded credentials to test bypassing env vars
const config = {
    host: '127.0.0.1',
    user: 'u182581262_terminal',
    name: 'u182581262_appnode',
    pass: 'WeK6#VY54+JU4Kn',
    port: 3306
};

// Log configuration (without password)
console.log('🔌 MySQL Configuration:');
console.log(`   Host: ${config.host}:${config.port}`);
console.log(`   User: ${config.user}`);
console.log(`   Database: ${config.name}`);
console.log(`   Password: ${config.pass ? '***SET***' : '***NOT SET***'}`);

// ==========================================
// SEQUELIZE INSTANCE
// ==========================================

const sequelize = new Sequelize(
    config.name,
    config.user,
    config.pass,
    {
        host: config.host,
        port: config.port,
        dialect: 'mysql',

        // Logging: Disable in production, enable for debugging
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

        // Connection Pool Configuration
        pool: {
            max: 10,           // Maximum connections
            min: 0,            // Minimum connections
            acquire: 30000,    // Max time (ms) to acquire connection
            idle: 10000        // Max idle time before release
        },

        // MySQL-specific options
        dialectOptions: {
            // FORCE IPv4 (prevents Node.js from using ::1 instead of 127.0.0.1)
            family: 4,

            connectTimeout: 10000,  // 10 seconds timeout

            // SSL Configuration (disabled for local/Hostinger shared)
            ssl: false,

            // Character set for proper UTF-8 support
            charset: 'utf8mb4',

            // Timezone handling
            timezone: '+00:00'
        },

        // Query options
        define: {
            timestamps: true,           // Adds createdAt/updatedAt
            underscored: false,         // Use camelCase (not snake_case)
            freezeTableName: true,      // Don't pluralize table names
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        },

        // Retry configuration
        retry: {
            max: 3,                     // Max retry attempts
            match: [                    // Retry on these errors
                /ETIMEDOUT/,
                /ECONNRESET/,
                /ENOTFOUND/,
                /ENETUNREACH/,
                /EAI_AGAIN/
            ]
        }
    }
);

// ==========================================
// CONNECTION TESTING (Optional)
// ==========================================

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('   Check your DB_HOST, DB_USER, DB_PASS, and DB_NAME environment variables.');
        return false;
    }
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    sequelize,
    testConnection
};
