
import { Sequelize, DataTypes } from 'sequelize';
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

async function checkUsers() {
    try {
        const [results, metadata] = await sequelize.query("SELECT id, email, password, tokens, full_name FROM users");
        console.log("Users found:", results.length);
        results.forEach(u => {
            console.log(`------------------------------`);
            console.log(`ID: ${u.id}`);
            console.log(`Email: ${u.email}`);
            console.log(`Name: ${u.full_name}`);
            console.log(`Tokens: ${u.tokens}`);
            console.log(`Password (Hash/Plain): ${u.password}`);
            console.log(`------------------------------`);
        });
    } catch (e) {
        console.error("Error reading users:", e);
    }
}

checkUsers();
