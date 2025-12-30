const express = require('express'); // Restart Triggered: v1.0.5
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { sequelize } = require('./src/config/database.js');
const { setupRoutes } = require('./src/routes/index.js');
const { User, SalonConfig } = require('./src/models/index.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use('/static', express.static(path.join(__dirname, 'app/static')));
app.use('/', express.static(path.join(__dirname, 'app/templates')));

// Health Check (Enhanced)
global.DB_STATUS = 'Starting...';
app.get('/health', (req, res) => {
    res.json({
        status: 'ALIVE',
        mode: 'PRODUCTION_CJS',
        db_status: global.DB_STATUS,
        time: new Date().toISOString()
    });
});

// TEMP: Database Configuration Debug Endpoint
app.get('/debug-db', (req, res) => {
    const dbConfig = require('./src/config/database.js');
    res.json({
        message: 'Database Configuration (Diagnostic)',
        config: {
            host: sequelize.config.host,
            port: sequelize.config.port,
            database: sequelize.config.database,
            username: sequelize.config.username,
            password_set: !!sequelize.config.password,
            password_length: sequelize.config.password?.length || 0,
            dialect: sequelize.config.dialect
        },
        status: global.DB_STATUS
    });
});

// Setup API Routes
setupRoutes(app);

// Start Server IMMEDIATELY (Optimistic Startup)
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

// Connect Database in Background
(async () => {
    global.DB_STATUS = 'Connecting...';
    try {
        console.log("⏳ Connecting to Database...");
        await sequelize.authenticate();
        console.log("✅ Database Connection ESTABLISHED.");

        console.log("⏳ Syncing Models...");
        await sequelize.sync({ alter: true });
        console.log("✅ Models Synced.");
        global.DB_STATUS = 'CONNECTED';

        // Seeder
        const userCount = await User.count();
        if (userCount === 0) {
            console.log("🌱 Seeding Admin...");
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = await User.create({
                email: 'admin@imagina.ia',
                password_hash: hashedPassword,
                full_name: 'Admin Mirror',
                role: 'admin',
                monthly_token_limit: 1000,
                current_month_tokens: 0
            });
            await SalonConfig.create({
                user_id: admin.id,
                stylist_name: 'Asesora IA',
                primary_color: '#00ff88',
                secondary_color: '#00ccff',
                is_active: true
            });
            console.log("✅ Seeding Complete.");
        }
    } catch (dbError) {
        console.error("❌ DB ERROR:", dbError.message);
        global.DB_STATUS = 'ERROR: ' + dbError.message;
    }
})();

// HTML Page Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/registro.html')));
app.get('/mirror', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/mirror.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/admin.html')));
app.get('/perfil-usuario', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/perfil-usuario.html')));
app.get('/closet', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/closet.html')));
app.get('/tienda', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/tienda.html')));
app.get('/creditos', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/creditos.html')));
app.get('/referrals', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/referrals.html')));
app.get('/avatar', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/avatar.html')));
app.get('/cambio-de-imagen', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/cambio_de_imagen.html')));
app.get('/fotografia', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/fotografia.html')));
app.get('/profesional', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/profesional.html')));
app.get('/mis-finanzas', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas.html')));
app.get('/mis-finanzas/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_dashboard.html')));
app.get('/mis-finanzas/ingresos', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_ingresos.html')));
app.get('/mis-finanzas/pagos', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_pagos.html')));
app.get('/mis-finanzas/facturas', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_facturas.html')));
app.get('/mis-finanzas/pendientes', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_pendientes.html')));
app.get('/mis-finanzas/reportes', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/mis_finanzas_reportes.html')));
app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/admin-login.html')));
app.get('/admin-mirror', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/admin_mirror.html')));
app.get('/api/mirror/control-pantalla', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/control_pantalla.html')));
app.get('/api/mirror/imagina-ia', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/imagina_ia.html')));
app.get('/api/mirror/admin', (req, res) => res.sendFile(path.join(__dirname, 'app/templates/admin_mirror.html')));

// Fallback
app.get('/:page', (req, res) => {
    const safePath = path.join(__dirname, 'app/templates', `${req.params.page}.html`);
    if (fs.existsSync(safePath)) {
        res.sendFile(safePath);
    } else {
        res.status(404).send('Página no encontrada');
    }
});
