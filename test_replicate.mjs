import Replicate from 'replicate';
import dotenv from 'dotenv';
dotenv.config();

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function testReplicate() {
    console.log("Testing Replicate Connection...");
    console.log("Token:", process.env.REPLICATE_API_TOKEN ? "Found" : "Missing");

    try {
        console.log("Running SDXL...");
        // Using a known working version of SDXL or default
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: "A professional photo of a cat",
                }
            }
        );
        console.log("TEST_RESULT:SUCCESS");
        console.log("OUTPUT:", output);
    } catch (error) {
        console.error("TEST_RESULT:FAILED");
        console.error("ERROR_MSG:", error.message);
        if (error.response) {
            console.error("STATUS:", error.response.status);
        }
        process.exit(1);
    }
}

testReplicate();
