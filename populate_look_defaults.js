import fetch from 'node-fetch';

async function populate() {
    const p_peinados = `[INSTRUCTION: HAIRSTYLE APPLICATION]
You will receive a specific hairstyle description below.
TASK: Apply this exact hairstyle structure to the subject.
- Maintain the length, texture, and cut style described.
- Ensure the hair interacts naturally with the subject's face shape (gravity, shadows).
- If the description specifies bangs or layers, render them with high fidelity.
- IGNORE previous hair structure; REPLACE it with this new design.`;

    const p_colores = `[INSTRUCTION: COLOR APPLICATION]
You will receive a specific hair color description below.
TASK: Apply this exact coloration to the hair.
- Replicate the hues, tones, and highlights described.
- Maintain professional dying techniques (balayage, root shadow, ombre) if mentioned.
- Ensure lighting effects (shine, reflection) match the requested color depth.`;

    const p_combinacion = `[FINAL SYNTHESIS]
Combine the face (preserved), the new hairstyle, and the new color into a single cohesive photorealistic image.
- Lighting must be consistent across face and hair.
- Resolution: 8k, highly detailed, cinematic lighting.
- NO artifacts, NO smearing, NO double heads.
- The result must look like a high-end salon after-photo.`;

    try {
        console.log("Populating Look Rule Prompts...");
        await fetch('http://localhost:5000/api/mirror/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                look_sys_prompt_2: p_peinados, // P PEINADOS
                look_sys_prompt_3: p_colores,  // P COLORES
                look_sys_prompt_4: p_combinacion // COMBINACION
            })
        });
        console.log("Done. Expert Rules applied.");
    } catch (e) { console.error(e); }
}

populate();
