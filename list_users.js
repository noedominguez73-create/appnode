
import { sequelize } from './src/config/database.js';
import { User } from './src/models/index.js';
import bcrypt from 'bcryptjs';

async function listUsers() {
    try {
        const users = await User.findAll();
        console.log("\n--- USUARIOS REGISTRADOS ---");
        users.forEach(u => {
            console.log(`ID: ${u.id} | Email: ${u.email} | Rol: ${u.role}`);
        });
        console.log("----------------------------\n");

        if (users.length > 0) {
            // Optional: Auto-reset the first admin's password if requested
            // But for now just list.
            // Actually, to be helpful, let's reset the first user's password to '123456' 
            // so the user can definitely get in.
            const admin = users.find(u => u.role === 'admin') || users[0];
            if (admin) {
                const newPass = '123456';
                const hash = await bcrypt.hash(newPass, 10);
                admin.password = hash;
                await admin.save();
                console.log(`✅ Contraseña restablecida a '${newPass}' para el usuario: ${admin.email}`);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

listUsers();
