
import { sequelize } from './src/config/database.js';
import { SalonConfig } from './src/models/index.js';

sequelize.options.logging = false; // Silence SQL logs

async function checkConfig() {
    try {
        const config = await SalonConfig.findOne({ where: { user_id: 1 } });
        const fs = await import('fs');
        let output = "";

        if (config) {
            output += "✅ CURRENT CONFIGURATION (User 1):\n";
            output += `🗣️  Voice ID: ${config.stylist_voice_name}\n`;
            output += `🧠  Personality: ${config.stylist_personality_prompt ? config.stylist_personality_prompt.substring(0, 50) + "..." : "NONE"}\n`;
        } else {
            output += "❌ No config found for User 1\n";
        }

        fs.writeFileSync('config_result.txt', output);
        console.log("Written to config_result.txt");

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkConfig();
