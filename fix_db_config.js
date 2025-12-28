
import { sequelize } from './src/config/database.js';
import { ApiConfig } from './src/models/index.js';

async function fixConfig() {
    try {
        const idToDelete = 7;
        console.log(`Searching for config ID ${idToDelete}...`);

        const config = await ApiConfig.findByPk(idToDelete);
        if (!config) {
            console.log("Config not found (maybe already deleted).");
        } else {
            console.log("Found config:", JSON.stringify(config.toJSON(), null, 2));
            await config.destroy();
            console.log("✅ DELETED SUCCESSFULLY.");
        }

    } catch (e) {
        console.error("Error deleting:", e);
    } finally {
        process.exit(0);
    }
}

fixConfig();
