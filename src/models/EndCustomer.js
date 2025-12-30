const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EndCustomer = sequelize.define('EndCustomer', {
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
    phone: DataTypes.STRING(20),
    email: DataTypes.STRING(255),
    full_name: DataTypes.STRING(255),
    last_visit: DataTypes.DATE
}, {
    tableName: 'end_customers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = EndCustomer;
