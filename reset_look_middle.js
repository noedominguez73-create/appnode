import fetch from 'node-fetch';

async function reset_middle() {
    try {
        console.log("Resetting P PEINADOS and P COLORES to empty...");
        await fetch('http://localhost:5000/api/mirror/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                look_sys_prompt_2: "", // Empty to let raw hairstyle description pass
                look_sys_prompt_3: ""  // Empty to let raw color description pass
            })
        });
        console.log("Reset complete.");
    } catch (e) { console.error(e); }
}

reset_middle();
