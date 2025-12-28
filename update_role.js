
import { User, SalonConfig } from './src/models/index.js';
import { sequelize } from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function performUpdate() {
    try {
        console.log("Connecting to DB...");
        await sequelize.authenticate();

        console.log("Listing ALL Users:");
        const users = await User.findAll();
        users.forEach(u => console.log(` - ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`));

        const email = 'salon1@gmail.com';
        let target = users.find(u => u.email === email);

        if (target) {
            console.log(`✅ Found user ${email}. Updating role to 'salon'...`);
            target.role = 'salon';
            await target.save();
            console.log("✅ Role updated.");
        } else {
            console.log("⚠️ User not found. Creating it now...");
            const hashedPassword = await bcrypt.hash('102o3o4o', 10); // Password from screenshot
            target = await User.create({
                email,
                password_hash: hashedPassword,
                full_name: 'Salon Owner',
                role: 'salon'
            });
            console.log("✅ User created with role 'salon' and password from screenshot.");

            // Create default salon config
            await SalonConfig.create({
                user_id: target.id,
                stylist_name: 'Asesora Salon',
                is_active: true
            });
            console.log("✅ Default SalonConfig created.");
        }

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await sequelize.close();
    }
}

performUpdate();
