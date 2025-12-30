/**
 * Script de Sincronización de Base de Datos
 * Fase 1: Multi-Tenant
 * 
 * Este script:
 * 1. Crea las nuevas tablas multi-tenant
 * 2. Crea la organización "Demo Salon"
 * 3. NO modifica tablas existentes
 */

const sequelize = require('../src/config/database');

// Importar modelos nuevos
const Organization = require('../src/models/Organization');
const MirrorDevice = require('../src/models/MirrorDevice');
const Product = require('../src/models/Product');
const EndCustomer = require('../src/models/EndCustomer');
const GenerationSession = require('../src/models/GenerationSession');

async function syncDatabase() {
    try {
        console.log('🔗 Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión exitosa!\n');

        console.log('📦 Sincronizando nuevas tablas multi-tenant...');

        // Sync solo las nuevas tablas (alter: false para no modificar existentes)
        await Organization.sync({ alter: false });
        console.log('✅ organizations');

        await MirrorDevice.sync({ alter: false });
        console.log('✅ mirror_devices');

        await Product.sync({ alter: false });
        console.log('✅ products');

        await EndCustomer.sync({ alter: false });
        console.log('✅ end_customers');

        await GenerationSession.sync({ alter: false });
        console.log('✅ generation_sessions\n');

        console.log('🏢 Creando organización Demo...');
        const [demoOrg, created] = await Organization.findOrCreate({
            where: { id: 1 },
            defaults: {
                id: 1,
                name: 'Demo Salon',
                slug: 'demo',
                owner_email: 'admin@imagina.ia',
                subscription_status: 'active',
                subscription_plan: 'enterprise'
            }
        });

        if (created) {
            console.log('✅ Organización Demo creada con ID:', demoOrg.id);
        } else {
            console.log('ℹ️  Organización Demo ya existe');
        }

        console.log('\n🎉 Fase 1 completada exitosamente!');
        console.log('📊 Nuevas tablas creadas:');
        console.log('   - organizations');
        console.log('   - mirror_devices');
        console.log('   - products');
        console.log('   - end_customers');
        console.log('   - generation_sessions\n');

    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

syncDatabase()
    .then(() => {
        console.log('✨ ¡Listo! El sistema ahora es multi-tenant.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n💥 Sincronización falló:', err.message);
        process.exit(1);
    });
