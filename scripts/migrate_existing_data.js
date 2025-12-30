/**
 * Script de Migración de Datos Existentes
 * Fase 2: Asociar datos actuales a "Demo Salon"
 * 
 * Este script:
 * 1. Añade columna organization_id a tablas existentes
 * 2. Asigna todo a la organización Demo (ID: 1)
 * 3. Es seguro: solo añade, no elimina nada
 */

const sequelize = require('../src/config/database');
const { QueryTypes } = require('sequelize');

async function migrateExistingData() {
    try {
        console.log('🔗 Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión exitosa!\n');

        console.log('📦 Fase 2: Migrando datos existentes a Demo Salon...\n');

        // 1. Añadir organization_id a Users
        console.log('👤 Migrando tabla users...');
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS organization_id INT,
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'end_customer'
        `);
        await sequelize.query(`UPDATE users SET organization_id = 1 WHERE organization_id IS NULL`);
        console.log('✅ users migrada\n');

        // 2. Añadir organization_id a SalonConfigs
        console.log('⚙️  Migrando tabla salon_configs...');
        await sequelize.query(`ALTER TABLE salon_configs ADD COLUMN IF NOT EXISTS organization_id INT UNIQUE`);
        await sequelize.query(`UPDATE salon_configs SET organization_id = 1 WHERE organization_id IS NULL`);
        console.log('✅ salon_configs migrada\n');

        // 3. Añadir organization_id a MirrorItems
        console.log('🎨 Migrando tabla mirror_items...');
        await sequelize.query(`ALTER TABLE mirror_items ADD COLUMN IF NOT EXISTS organization_id INT`);
        await sequelize.query(`UPDATE mirror_items SET organization_id = 1 WHERE organization_id IS NULL`);
        console.log('✅ mirror_items migrada\n');

        // 4. Añadir organization_id a ApiConfigs
        console.log('🔑 Migrando tabla api_configs...');
        await sequelize.query(`ALTER TABLE api_configs ADD COLUMN IF NOT EXISTS organization_id INT`);
        await sequelize.query(`UPDATE api_configs SET organization_id = 1 WHERE organization_id IS NULL`);
        console.log('✅ api_configs migrada\n');

        // Verificación
        const userCount = await sequelize.query(
            `SELECT COUNT(*) as count FROM users WHERE organization_id = 1`,
            { type: QueryTypes.SELECT }
        );
        const itemCount = await sequelize.query(
            `SELECT COUNT(*) as count FROM mirror_items WHERE organization_id = 1`,
            { type: QueryTypes.SELECT }
        );

        console.log('📊 Resumen de migración:');
        console.log(`   - Usuarios migrados: ${userCount[0].count}`);
        console.log(`   - Items migrados: ${itemCount[0].count}\n`);

        console.log('🎉 Fase 2 completada exitosamente!');
        console.log('✅ Todos los datos existentes ahora pertenecen a "Demo Salon"\n');

    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

migrateExistingData()
    .then(() => {
        console.log('✨ Sistema listo para multi-tenant!');
        console.log('📝 Siguiente paso: Actualizar rutas para filtrar por organization_id');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n💥 Migración falló:', err);
        process.exit(1);
    });
