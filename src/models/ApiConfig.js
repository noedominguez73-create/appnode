import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ApiConfig = sequelize.define('ApiConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    provider: {
        type: DataTypes.STRING(50),
        allowNull: false
        // Removed unique: true to allow multiple keys
    },
    section: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'peinado' // 'peinado' or 'look'
    },
    alias: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Default'
    },
    api_key: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    settings: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
}, {
    tableName: 'api_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});
