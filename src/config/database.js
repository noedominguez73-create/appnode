const { Sequelize } = require('sequelize');

/**
 * ==========================================
 * DATABASE CONFIGURATION - HARDCODED FOR DEBUGGING
 * ==========================================
 */

console.log('🔌 Initializing Database Connection...');
console.log('   FORCING HARDCODED CREDENTIALS (DEBUG MODE)');

const sequelize = new Sequelize(
    'u182581262_appnode',      // database
    'u182581262_terminal',      // username
    'WeK6#VY54+JU4Kn',         // password
    {
        host: '127.0.0.1',
        port: 3306,
        dialect: 'mysql',

        logging: false,

        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },

        dialectOptions: {
            family: 4,              // Force IPv4
            connectTimeout: 10000,
            ssl: false,
            charset: 'utf8mb4',
            timezone: '+00:00'
        },

        define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        },

        retry: {
            max: 3,
            match: [
                /ETIMEDOUT/,
                /ECONNRESET/,
                /ENOTFOUND/,
                /ENETUNREACH/,
                /EAI_AGAIN/
            ]
        }
    }
);

console.log('✅ Sequelize instance created with HARDCODED credentials');
console.log('   DB: u182581262_appnode');
console.log('   User: u182581262_terminal');
console.log('   Host: 127.0.0.1:3306');
console.log('   Password: ***HARDCODED***');

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

module.exports = { sequelize, testConnection };
