
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'instance/asesoriaimss.db');
console.log("Migrating DB at:", dbPath);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: console.log
});

async function migrate() {
    try {
        await sequelize.query("ALTER TABLE api_configs ADD COLUMN section VARCHAR(32) DEFAULT 'peinado' NOT NULL;");
        console.log("Migration successful: Added 'section' column.");
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log("Column 'section' already exists.");
        } else {
            console.error("Migration failed:", e);
        }
    }
}

migrate();
