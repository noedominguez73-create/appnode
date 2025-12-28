import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const models = [];
        for await (const model of genAI.listModels()) {
            if (model.supportedGenerationMethods.includes('generateContent')) {
                models.push({
                    name: model.name,
                    displayName: model.displayName,
                    description: model.description,
                    isImage: model.name.toLowerCase().includes('image')
                });
            }
        }

        console.log('\n=== IMAGE GENERATION MODELS ===');
        const imageModels = models.filter(m => m.isImage);
        imageModels.forEach(m => {
            console.log(`✅ ${m.name}`);
            console.log(`   Display: ${m.displayName}`);
            console.log(`   Desc: ${m.description}\n`);
        });

        console.log('\n=== ALL MODELS (generateContent) ===');
        models.forEach(m => console.log(m.name));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

listModels();
