import { User } from './User.js';
import { SalonConfig } from './SalonConfig.js';
import { MirrorItem } from './MirrorItem.js';
import { MirrorUsage } from './MirrorUsage.js';
import { ApiConfig } from './ApiConfig.js';

// Associations
User.hasOne(SalonConfig, { foreignKey: 'user_id', as: 'salonConfig' });
SalonConfig.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(MirrorUsage, { foreignKey: 'user_id' });
MirrorUsage.belongsTo(User, { foreignKey: 'user_id' });

MirrorItem.hasMany(MirrorUsage, { foreignKey: 'item_id' });
MirrorUsage.belongsTo(MirrorItem, { foreignKey: 'item_id' });

export {
    User,
    SalonConfig,
    MirrorItem,
    MirrorUsage,
    ApiConfig
};
