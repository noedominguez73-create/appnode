import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    full_name: {
        type: DataTypes.STRING(100)
    },
    role: {
        type: DataTypes.STRING(20),
        defaultValue: 'user'
    },
    // OAuth and other fields can be added as needed, matching python schema
    subscription_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'inactive'
    },
    monthly_token_limit: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    current_month_tokens: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at', // match python column name
    updatedAt: false // python didn't have updatedAt on User explicitly in snippets shown, but we can enable if needed.
    // The python code showed `created_at`.
});
