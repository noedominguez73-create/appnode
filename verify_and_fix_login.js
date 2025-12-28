
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'instance/asesoriaimss.db');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
    // We confirmed the column is password_hash
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    full_name: { type: DataTypes.STRING(100) },
    role: { type: DataTypes.STRING(20), defaultValue: 'user' }
}, {
    tableName: 'users',
    timestamps: false
});

async function checkUser() {
    try {
        const user = await User.findOne({ where: { email: 'prof@test.com' } });
        if (!user) {
            console.log('User prof@test.com NOT FOUND');
            return;
        }
        console.log(`User found: ${user.email}, Role: ${user.role}`);
        console.log(`Stored Hash: ${user.password_hash}`);

        const isMatch = await bcrypt.compare('1234', user.password_hash);
        console.log(`Password '1234' match: ${isMatch}`);

        if (!isMatch) {
            console.log('Resetting password to 1234...');
            const newHash = await bcrypt.hash('1234', 10);
            user.password_hash = newHash;
            await user.save();
            console.log('Password reset successfully.');
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkUser();
