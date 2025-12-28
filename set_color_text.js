import fetch from 'node-fetch';

async function set_color_text() {
    // Description taken from the "Blue Steel Waves_remix" card in the user's screenshot
    const p_color_text = "Color aesthetic 1: mix 2, medium brown base with cool, inky blue overtones. Global color application with slight root shadow highlights. Cool shadow tones level 5.";

    try {
        console.log("Setting P COLORES to Blue Steel text...");
        await fetch('http://localhost:5000/api/mirror/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                look_sys_prompt_3: p_color_text
            })
        });
        console.log("Set P COLORES.");
    } catch (e) { console.error(e); }
}

set_color_text();
