
import { sequelize } from './src/config/database.js';
import { ApiConfig } from './src/models/index.js';

async function checkConfig() {
    try {
        const configs = await ApiConfig.findAll();
        console.log("--- CONFIGURACIÓN ACTUAL EN BASE DE DATOS ---");
        configs.forEach(c => {
            console.log(`ID: ${c.id}`);
            console.log(`Provider: ${c.provider}`);
            console.log(`Section: ${c.section}`);
            console.log(`Alias: ${c.alias}`);
            console.log(`Active: ${c.is_active}`);
            console.log(`Settings:`, JSON.stringify(c.settings, null, 2));
            console.log("---------------------------------------------");
        });
    } catch (e) {
        console.error("Error checking config:", e);
    } finally {
        await sequelize.close();
    }
}

checkConfig();
