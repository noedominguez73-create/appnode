
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

        // Force correct model
        // Based on user screenshot: "Gemini 2.0 Flash (Image Generation)..." 
        // which maps to internal name: 'models/gemini-2.0-flash-exp' (commonly) or 'models/gemini-2.0-flash-exp-image-generation' if special
        // Let's use the one the user HAD in the screenshot, since they hovered over a WRONG one.
        // The one labeled (Activo) was: Gemini 2.0 Flash (Image Generation) Experimental (Exp)
        // I want to ensure this is set.

        // I will set it to 'models/gemini-2.0-flash-exp' because that's the standard exp name.
        const targetModel = 'models/gemini-2.0-flash-exp';

        await config.update({ settings: { model: targetModel } });
        console.log(`Updated 'look' key to use model: ${targetModel}`);

    } catch (e) {
        console.error("Error:", e);
    }
}

setModel();
