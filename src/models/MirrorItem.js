import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const MirrorItem = sequelize.define('MirrorItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    image_url: DataTypes.STRING(500),
    color_code: DataTypes.STRING(20),
    prompt: DataTypes.TEXT,
    order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'mirror_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});
