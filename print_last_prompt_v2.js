import { SalonConfig } from './src/models/index.js';

// MOCK DATA for "Last Prompt" simulation
const mockData = {
    hairstyle: "Bob Corto Moderno", // Example selection
    color: "Rubio Ceniza",          // Example selection
    instructions: "Traje formal azul oscuro" // Example clothes
};

async function showPrompt() {
    try {
        // Wait a bit for DB to init if needed
        await new Promise(r => setTimeout(r, 2000));

        const config = await SalonConfig.findOne();
        if (!config) {
            console.error("❌ No SalonConfig found!");
            return;
        }

        console.log("\n\n>>> BEGIN PROMPT DUMP <<<\n");

        // 1. Core System
        if (config.hairstyle_sys_prompt) console.log(config.hairstyle_sys_prompt);
        if (config.color_sys_prompt) console.log(config.color_sys_prompt);

        console.log("\n--- TRANSFORMACIÓN VISUAL ---\n");

        // 2. P CARA
        if (config.look_sys_prompt_1) console.log(config.look_sys_prompt_1);

        // 3. P PEINADOS
        if (config.look_sys_prompt_2) {
            let p2 = config.look_sys_prompt_2;
            if (mockData.hairstyle) p2 = `[PEINADO SELECCIONADO: ${mockData.hairstyle}]`;
            console.log(p2);
        }

        // 4. P COLORES
        if (config.look_sys_prompt_3) {
            let p3 = config.look_sys_prompt_3;
            if (mockData.color) p3 = `[COLOR SELECCIONADO: ${mockData.color}]`;
            console.log(p3);
        }

        // 5. Instructions
        if (mockData.instructions) {
            console.log(`[DETALLES DE ROPA Y ESTILO]: ${mockData.instructions}`);
        }

        // 6. Combinación
        if (config.look_sys_prompt_4) console.log(config.look_sys_prompt_4);

        console.log("\n>>> END PROMPT DUMP <<<\n\n");

    } catch (e) {
        console.error(e);
    }
}

showPrompt();
