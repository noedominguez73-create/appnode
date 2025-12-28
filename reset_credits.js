
import { sequelize } from './src/config/database.js';
import { User } from './src/models/index.js';

const resetCredits = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const user = await User.findByPk(1);
        if (!user) {
            console.error('User 1 not found!');
            return;
        }

        console.log(`Current tokens: ${user.current_month_tokens} / ${user.monthly_token_limit}`);

        user.current_month_tokens = 0;
        // Optionally increase limit if it was too low
        user.monthly_token_limit = 1000000;

        await user.save();
        console.log(`Reset successful. New tokens: ${user.current_month_tokens} / ${user.monthly_token_limit}`);

    } catch (error) {
        console.error('Error resetting credits:', error);
    } finally {
        await sequelize.close();
    }
};

resetCredits();
