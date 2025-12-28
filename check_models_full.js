
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

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
    alias: DataTypes.STRING,
    api_key: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN,
    settings: DataTypes.JSON
}, { tableName: 'api_configs', underscored: true });

async function listModelsToFile() {
    try {
        const config = await ApiConfig.findOne({ where: { section: 'look', is_active: true } });
        if (!config) {
            fs.writeFileSync('available_models.txt', "No active key found for 'look'.");
            return;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.api_key}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            const output = data.models.map(m => {
                return `Name: ${m.name}\nDisplay: ${m.displayName}\nMethods: ${m.supportedGenerationMethods ? m.supportedGenerationMethods.join(', ') : 'N/A'}\n-------------------`;
            }).join('\n');
            fs.writeFileSync('available_models.txt', output);
            console.log("Models written to available_models.txt");
        } else {
            console.log("No models returned:", data);
            fs.writeFileSync('available_models.txt', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.log("Error:", e);
        fs.writeFileSync('available_models.txt', e.toString());
    }
}

listModelsToFile();
