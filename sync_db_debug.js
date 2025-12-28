import { sequelize } from './src/config/database.js';
import './src/models/index.js'; // Registers models

console.log("🔄 Starting manual DB sync...");

async function runSync() {
    try {
        await sequelize.sync({ alter: true });
        console.log("✅ Database synced successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to sync database:", err);
        process.exit(1);
    }
}

runSync();
