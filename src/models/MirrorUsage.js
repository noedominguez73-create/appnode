import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const MirrorUsage = sequelize.define('MirrorUsage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usage_type: {
        type: DataTypes.STRING(50),
        defaultValue: 'generation'
    },
    user_id: DataTypes.INTEGER,
    item_id: DataTypes.INTEGER,
    prompt_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    completion_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'mirror_usages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});
