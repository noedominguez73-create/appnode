const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MirrorDevice = sequelize.define('MirrorDevice', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    organization_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'organizations',
            key: 'id'
        }
    },
    label: DataTypes.STRING(100),
    mac_address: {
        type: DataTypes.STRING(17),
        unique: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    last_ping: DataTypes.DATE
}, {
    tableName: 'mirror_devices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = MirrorDevice;
