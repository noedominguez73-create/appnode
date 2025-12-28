
import { sequelize } from './src/config/database.js';
import { ApiConfig } from './src/models/index.js';

async function checkConfig() {
    try {
        // Suppress SQL logging by overwriting console.log momentarily or just trusting the filter
        const configs = await ApiConfig.findAll({
            where: { section: 'look' },
            raw: true
        });

        console.log("\n\n====== RESULTS ======");
        if (configs.length === 0) {
            console.log("No config found for 'look' section.");
        } else {
            configs.forEach(c => {
                console.log(`ID: ${c.id} | Active: ${c.is_active}`);
                console.log(`Settings: ${c.settings}`); // It's stored as JSON string usually or text in SQLite
            });
        }
        console.log("=====================\n\n");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        // await sequelize.close(); // Close causes issues sometimes with internal pool, but ok for script
        process.exit(0);
    }
}

checkConfig();
