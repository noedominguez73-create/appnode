import { SalonConfig } from './src/models/index.js';

// MOCK DATA for "Last Prompt" simulation
const mockData = {
    hairstyle: "Bob Corto Moderno", // Example selection
    color: "Rubio Ceniza",          // Example selection
    instructions: "Traje formal azul oscuro" // Example clothes
};

async function showPrompt() {
    try {
        const config = await SalonConfig.findOne();

        // --- LOGIC COPIED FROM mirrorService.js ---
        let finalPrompt = "";

        // 1. Core System Prompts
        if (config.hairstyle_sys_prompt) finalPrompt += config.hairstyle_sys_prompt + "\n\n";
        if (config.color_sys_prompt) finalPrompt += config.color_sys_prompt + "\n\n";
        finalPrompt += "--- TRANSFORMACIÓN VISUAL ---\n\n";

        // 2. P CARA (Look 1)
        if (config.look_sys_prompt_1) {
            finalPrompt += config.look_sys_prompt_1 + "\n\n";
        }

        // 3. P PEINADOS (Look 2) - Dynamic replacement
        if (config.look_sys_prompt_2) {
            let p2 = config.look_sys_prompt_2;
            if (mockData.hairstyle) {
                p2 = `[PEINADO SELECCIONADO: ${mockData.hairstyle}]`;
            }
            finalPrompt += p2 + "\n\n";
        }

        // 4. P COLORES (Look 3) - Dynamic replacement
        if (config.look_sys_prompt_3) {
            let p3 = config.look_sys_prompt_3;
            if (mockData.color) {
                p3 = `[COLOR SELECCIONADO: ${mockData.color}]`;
            }
            finalPrompt += p3 + "\n\n";
        }

        // 5. User Instructions
        if (mockData.instructions) {
            finalPrompt += `[DETALLES DE ROPA Y ESTILO]: ${mockData.instructions}\n\n`;
        }

        // 6. P COMBINACIÓN (Look 4)
        if (config.look_sys_prompt_4) {
            finalPrompt += config.look_sys_prompt_4;
        }

        console.log("---------------------------------------------------");
        console.log(">>> ÚLTIMO PROMPT GENERADO (SIMULADO) <<<");
        console.log("---------------------------------------------------");
        console.log(finalPrompt);
        console.log("---------------------------------------------------");

    } catch (e) {
        console.error(e);
    }
}

showPrompt();
