
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'instance/asesoriaimss.db');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

const ApiConfig = sequelize.define('ApiConfig', {
    provider: DataTypes.STRING,
    section: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN,
    settings: DataTypes.JSON
}, { tableName: 'api_configs', underscored: true });

async function setModel() {
    try {
        const config = await ApiConfig.findOne({ where: { section: 'look', is_active: true } });
        if (!config) {
            console.log("No active key found for 'look'.");
            return;
        }

        // CORRECTION: The specific image generation model endpoint
        const targetModel = 'models/gemini-2.0-flash-exp-image-generation';

        await config.update({ settings: { model: targetModel } });
        console.log(`CORRECTED 'look' key to use model: ${targetModel}`);

    } catch (e) {
        console.error("Error:", e);
    }
}

setModel();
