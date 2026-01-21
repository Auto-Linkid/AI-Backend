async function testDateContext() {
    console.log("🧪 Testing Date Context & Anti-Hallucination...");

    const res = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
            step: 'hooks',
            input: 'Team Loyalty',
            intent: 'storytelling'
        })
    });
    const data = await res.json();

    console.log("\n✅ Generated Hooks:");
    data.result.forEach((hook, i) => {
        console.log(`${i + 1}. ${hook}`);

        // Check for hallucination patterns
        if (hook.includes('2018') || hook.includes('In 20')) {
            console.warn(`⚠️  WARNING: Hook ${i + 1} contains specific year reference!`);
        }
        if (hook.match(/I (once|remember|was on)/i)) {
            console.warn(`⚠️  WARNING: Hook ${i + 1} might be fabricating a personal story!`);
        }
    });
}

testDateContext();
