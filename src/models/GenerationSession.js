const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GenerationSession = sequelize.define('GenerationSession', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    organization_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'organizations',
            key: 'id'
        }
    },
    mirror_id: {
        type: DataTypes.UUID,
        references: {
            model: 'mirror_devices',
            key: 'id'
        }
    },
    customer_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'end_customers',
            key: 'id'
        }
    },
    original_photo_url: DataTypes.STRING(500),
    generated_photo_url: DataTypes.STRING(500),
    prompt_used: DataTypes.TEXT,
    recommended_product_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    tokens_used: DataTypes.INTEGER
}, {
    tableName: 'generation_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = GenerationSession;
