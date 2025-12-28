
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

async function dumpUsers() {
    try {
        const [results] = await sequelize.query("SELECT * FROM users LIMIT 1");
        console.log("User Data:", JSON.stringify(results, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

dumpUsers();
