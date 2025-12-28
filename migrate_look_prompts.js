import { sequelize } from './src/config/database.js';

async function migrate() {
    try {
        console.log("🛠️ Starting manual migration for Look Containers...");

        for (let i = 1; i <= 4; i++) {
            try {
                await sequelize.query(`ALTER TABLE salon_configs ADD COLUMN look_sys_prompt_${i} TEXT;`);
                console.log(`✅ Added look_sys_prompt_${i} column`);
            } catch (e) {
                console.log(`ℹ️ look_sys_prompt_${i} might already exist or error:`, e.message);
            }
        }

        console.log("🏁 Look Migration finished.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
