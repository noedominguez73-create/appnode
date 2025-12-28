
import { Sequelize } from 'sequelize';
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

async function checkStructure() {
    try {
        const [results, metadata] = await sequelize.query("PRAGMA table_info(users);");
        console.log("Table Structure:", JSON.stringify(results, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

checkStructure();
