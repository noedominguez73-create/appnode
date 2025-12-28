import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const SalonConfig = sequelize.define('SalonConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    logo_url: DataTypes.STRING(500),
    promo_video_url: DataTypes.STRING(500),
    primary_color: {
        type: DataTypes.STRING(20),
        defaultValue: '#00ff88'
    },
    secondary_color: {
        type: DataTypes.STRING(20),
        defaultValue: '#00ccff'
    },
    stylist_name: {
        type: DataTypes.STRING(100),
        defaultValue: 'Asesora IA'
    },
    stylist_voice_name: {
        type: DataTypes.STRING(100),
        field: 'stylist_voice_id'
    },
    stylist_personality_prompt: DataTypes.TEXT,
    welcome_message: DataTypes.STRING(500),

    // New fields
    salon_name: DataTypes.STRING(200),
    address: DataTypes.TEXT,
    city: DataTypes.STRING(100),
    state: DataTypes.STRING(100),
    country: { type: DataTypes.STRING(100), defaultValue: 'México' },
    is_active_salon: { type: DataTypes.BOOLEAN, defaultValue: true },

    // System Prompts for Item Generation
    hairstyle_sys_prompt: DataTypes.TEXT,
    color_sys_prompt: DataTypes.TEXT,

    // Look Container Prompts (Transformation)
    look_sys_prompt_1: DataTypes.TEXT,
    look_sys_prompt_2: DataTypes.TEXT,
    look_sys_prompt_3: DataTypes.TEXT,
    look_sys_prompt_4: DataTypes.TEXT
}, {
    tableName: 'salon_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});
