
import { Sequelize } from 'sequelize';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'instance/asesoriaimss.db');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

async function fixUser() {
    try {
        // Find the user (likely ID 1)
        const [users] = await sequelize.query("SELECT * FROM users WHERE id = 1");
        if (users.length === 0) {
            console.log("User ID 1 not found.");
            return;
        }

        const user = users[0];
        console.log(`Found User: ${user.email}`);

        // Reset Password to '1234'
        const hashedPassword = await bcrypt.hash('1234', 10);

        // Update Password and RESET token usage to 0 (meaning FULL capacity usually, 
        // assuming tokens are counted as 'used tokens')
        await sequelize.query(
            `UPDATE users SET password = :pass, current_month_tokens = 0 WHERE id = 1`,
            { replacements: { pass: hashedPassword } }
        );

        console.log("Password reset: SUCCESS (1234)");
        console.log("Token usage reset: SUCCESS (0 used)");

    } catch (e) {
        console.error("Error:", e);
    }
}

fixUser();
