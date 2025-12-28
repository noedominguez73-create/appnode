import { sequelize } from './src/config/database.js';

async function check() {
    try {
        const [results] = await sequelize.query("PRAGMA table_info(salon_configs);");
        console.log("Columns in salon_configs:");
        results.forEach(col => console.log(`- ${col.name} (${col.type})`));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

check();
