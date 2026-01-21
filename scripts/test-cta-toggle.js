const fs = require('fs');

async function testCTA() {
    console.log("🧪 Testing CTA Toggle & Strict Short Length...");

    // 1. Test Strict Short Length (Must be > 50 words)
    console.log("\n--- Test 1: PROMOTIONAL / SHORT (Strict > 50, < 100) ---");
    const topic = "AI Coding";
    const hook = "Coding is dead.";

    try {
        const res = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                step: 'body',
                input: hook,
                context: topic,
                intent: 'promotional',
                length: 'short'
            })
        });
        const data = await res.json();
        const text = data.result?.optionA || data.optionA || "Error";
        const wordCount = text.split(/\s+/).length;

        console.log(`Word Count: ${wordCount}`);
        console.log(`Matches Constraint (50-100)? ${wordCount >= 50 && wordCount <= 100 ? "✅ YES" : "❌ NO"}`);
        console.log(`Snippet: ${text.substring(0, 100)}...`);
    } catch (e) { console.error(e); }

    // 2. Test CTA Options (None vs Value vs Promotional)
    const bodyText = "This is a dummy body text for testing final assembly.";

    async function testFinal(type) {
        console.log(`\n--- Test 2: Final Assembly with CTA = [${type}] ---`);
        try {
            const res = await fetch('http://localhost:3000/api/generate', {
                method: 'POST',
                body: JSON.stringify({
                    step: 'final',
                    hook: hook,
                    input: bodyText,
                    context: topic,
                    ctaType: type
                })
            });
            const data = await res.json();
            const result = data.result?.finalPost || JSON.stringify(data);
            console.log(`Output: ${result}`);
        } catch (e) { console.error(e); }
    }

    await testFinal('none');
    await testFinal('value');
    await testFinal('promotional');
}

testCTA();
