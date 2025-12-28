import fetch from 'node-fetch';

async function test() {
    try {
        console.log("Sending test request...");
        const res = await fetch('http://localhost:5000/api/mirror/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                look_sys_prompt_1: "TEST_VALUE_JS_123"
            })
        });
        const data = await res.json();
        console.log("Response:", res.status);
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
