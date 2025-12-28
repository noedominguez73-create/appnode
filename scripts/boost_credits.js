
import { User } from '../src/models/index.js';

async function boostCredits() {
    try {
        console.log("🚀 Boosting Credits...");

        // 1. Boost Guest
        const guest = await User.findOne({ where: { email: 'guest@imagina.ia' } });
        if (guest) {
            await guest.update({
                monthly_token_limit: 1000000,
                current_month_tokens: 0
            });
            console.log("✅ Guest User (guest@imagina.ia) credits boosted!");
        } else {
            console.log("⚠️ Guest User not found.");
        }

        // 2. Boost Admin (ID 1)
        const admin = await User.findByPk(1);
        if (admin) {
            await admin.update({
                monthly_token_limit: 1000000,
                current_month_tokens: 0
            });
            console.log("✅ Admin User (ID 1) credits boosted!");
        } else {
            console.log("⚠️ Admin User (ID 1) not found.");
        }

    } catch (error) {
        console.error("❌ Error boosting credits:", error);
    } finally {
        process.exit();
    }
}

boostCredits();
