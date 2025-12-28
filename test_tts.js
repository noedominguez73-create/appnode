
import { generateSpeech } from './src/services/geminiService.js';
import fs from 'fs';

async function testTTS() {
    console.log("WAITING... 🕒 Testing TTS (Aoede)...");
    try {
        const audioBase64 = await generateSpeech("Hola, confirmando sistema de voz operativo.", "Aoede");
        if (audioBase64) {
            console.log("\n✅ ÉXITO TOTAL: La API de voz ya responde correctamente.");
            console.log("ℹ️  Puedes recargar la página y usar el chat.");
        }
    } catch (error) {
        console.error("\n⏳ Aún no listo. Error:", error.message);
        console.log("ℹ️  Google sigue propagando los cambios. Espera unos minutos más.");
    }
}

testTTS();
