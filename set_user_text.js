import fetch from 'node-fetch';

async function set_user_text() {
    const p_peinado_text = "Dark brown, voluminous short-medium layered shag with chin-length, soft, face-framing layers and a tousled, slightly wavy texture.";
    // User said "y asi en color" but didn't give text. I'll put a placeholder they can edit, or a common one.
    // I'll leave color empty to avoid guessing wrong, or maybe use a generic one like the screenshot 'Blue Steel'.
    // Better to just set the one I have.

    try {
        console.log("Setting User Test Text...");
        await fetch('http://localhost:5000/api/mirror/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                look_sys_prompt_2: p_peinado_text,
                look_sys_prompt_3: "" // Resetting to blank so they can fill it or see it's blank
            })
        });
        console.log("Set P PEINADOS to user text.");
    } catch (e) { console.error(e); }
}

set_user_text();
