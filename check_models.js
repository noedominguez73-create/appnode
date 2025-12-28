
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
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

async function listModels() {
    try {
        const config = await ApiConfig.findOne({ where: { section: 'look', is_active: true } });
        if (!config) {
            console.log("No active key found for 'look'.");
            return;
        }

        console.log(`Checking models for key: ${config.alias} (${config.api_key.substring(0, 5)}...)`);

        // Fetch models via REST because SDK list_models might be different or I want the exact raw names
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.api_key}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("MODELS_START");
            data.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    // Just print name and methods
                    console.log(`${m.name}|${m.displayName}|${m.supportedGenerationMethods ? m.supportedGenerationMethods.join(',') : ''}`);
                }
            });
            console.log("MODELS_END");
        } else {
            console.log("No models returned or error:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

listModels();
