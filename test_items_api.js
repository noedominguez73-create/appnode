const fetch = require('node-fetch');

async function test() {
    try {
        console.log("Fetching items...");
        const res = await fetch('http://localhost:5000/api/mirror/items');
        console.log("Status:", res.status);
        if (res.ok) {
            const data = await res.json();
            console.log("Items found:", data.length);
            console.log("Sample:", data[0]);
        } else {
            console.log("Error body:", await res.text());
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

test();
