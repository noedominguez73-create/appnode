const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organization = sequelize.define('Organization', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    // Branding
    logo_url: DataTypes.STRING(500),
    primary_color: {
        type: DataTypes.STRING(7),
        defaultValue: '#00ff88'
    },
    secondary_color: {
        type: DataTypes.STRING(7),
        defaultValue: '#00ccff'
    },
    // Business
    subscription_status: {
        type: DataTypes.STRING(50),
        defaultValue: 'active'
    },
    subscription_plan: {
        type: DataTypes.STRING(50),
        defaultValue: 'basic'
    },
    // Contact
    owner_email: DataTypes.STRING(255),
    owner_phone: DataTypes.STRING(50),
    address: DataTypes.TEXT
}, {
    tableName: 'organizations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Organization;
