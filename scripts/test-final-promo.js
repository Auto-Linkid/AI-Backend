const step = 'final';
const hook = "Why most developers will be unemployed by 2030.";
const body = "The truth is, AI will write 80% of code. But the top 1% will simply direct the AI. Focus on architecture, not syntax.";
const context = "Future of Coding";

async function testFinal(type) {
    console.log(`\n🧪 Testing Final Generation (${type})...`);
    try {
        const res = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step,
                input: body,
                context: context,
                hook: hook,
                ctaType: type
            })
        });

        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

async function run() {
    await testFinal('value');
    await testFinal('promotional');
}

run();
