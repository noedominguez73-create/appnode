import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup DB
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'instance', 'asesoriaimss.db'),
    logging: false
});

const SalonConfig = sequelize.define('SalonConfig', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true },
    hairstyle_sys_prompt: DataTypes.TEXT,
    color_sys_prompt: DataTypes.TEXT,
    look_sys_prompt_1: DataTypes.TEXT,
    look_sys_prompt_2: DataTypes.TEXT,
    look_sys_prompt_3: DataTypes.TEXT,
    look_sys_prompt_4: DataTypes.TEXT
}, { tableName: 'salon_configs', timestamps: false });

async function check() {
    try {
        const config = await SalonConfig.findOne({ where: { user_id: 1 } });
        if (!config) {
            console.log("No config found for user 1");
            return;
        }

        console.log("\n=== CORE SYSTEM PROMPTS ===");
        console.log("---------------------------");
        console.log("[HAIRSTYLE SYS PROMPT]:\n", config.hairstyle_sys_prompt);
        console.log("\n[COLOR SYS PROMPT]:\n", config.color_sys_prompt);

        console.log("\n=== LOOK PROMPTS ===");
        console.log("--------------------");
        console.log("[P1 - CARA]:\n", config.look_sys_prompt_1);
        console.log("\n[P2 - PEINADOS (Default)]:\n", config.look_sys_prompt_2);
        console.log("\n[P3 - COLORES (Default)]:\n", config.look_sys_prompt_3);
        console.log("\n[P4 - COMBINACIÓN]:\n", config.look_sys_prompt_4);

    } catch (e) {
        console.error(e);
    }
}

check();
