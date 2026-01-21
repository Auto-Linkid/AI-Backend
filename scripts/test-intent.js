async function testIntent() {
    console.log("🧪 Testing Intent & Length Controls...");

    const topic = "Remote Work";

    // 1. Test Hooks (Storytelling vs Promotional)
    console.log("\n--- Testing Hooks (Intent) ---");

    async function getHooks(intent) {
        console.log(`> Requesting ${intent.toUpperCase()} hooks...`);
        const res = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            body: JSON.stringify({ step: 'hooks', input: topic, intent })
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
        if (data[0]) console.log(`  Output: ${data[0].substring(0, 60)}...`);
    }

    await getHooks('storytelling');
    await getHooks('promotional');

    // 2. Test Body (Storytelling/Long vs Viral/Short)
    console.log("\n--- Testing Body (Intent + Length) ---");
    const testHook = "Remote work isn't just a trend, it's a survival strategy.";

    async function getBody(intent, length) {
        console.log(`> Requesting ${intent.toUpperCase()} / ${length.toUpperCase()} body...`);
        const res = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                step: 'body',
                input: testHook,
                context: topic,
                intent,
                length
            })
        });
        const data = await res.json();
        const text = data.optionA || data.result?.optionA || "Error";
        console.log(`  Length Approx: ${text.split(' ').length} words.`);
        console.log(`  Snippet: ${text.substring(0, 100)}...`);
    }

    await getBody('storytelling', 'long');
    await getBody('viral', 'short');
}

testIntent();
