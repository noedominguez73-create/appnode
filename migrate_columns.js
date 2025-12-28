import { sequelize } from './src/config/database.js';

async function migrate() {
    try {
        console.log("🛠️ Starting manual migration...");

        try {
            await sequelize.query("ALTER TABLE salon_configs ADD COLUMN hairstyle_sys_prompt TEXT;");
            console.log("✅ Added hairstyle_sys_prompt column");
        } catch (e) {
            console.log("ℹ️ hairstyle_sys_prompt might already exist or error:", e.message);
        }

        try {
            await sequelize.query("ALTER TABLE salon_configs ADD COLUMN color_sys_prompt TEXT;");
            console.log("✅ Added color_sys_prompt column");
        } catch (e) {
            console.log("ℹ️ color_sys_prompt might already exist or error:", e.message);
        }

        console.log("🏁 Migration finished.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
