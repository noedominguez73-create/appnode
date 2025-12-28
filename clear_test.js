import fetch from 'node-fetch';

async function clear() {
    try {
        console.log("Clearing P CARA...");
        await fetch('http://localhost:5000/api/mirror/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                look_sys_prompt_1: ""
            })
        });
        console.log("Cleared.");
    } catch (e) { console.error(e); }
}

clear();
