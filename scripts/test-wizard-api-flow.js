async function testWizardFlow() {
    const topic = "Remote Work";
    const intent = "viral";
    const length = "medium";
    const ctaType = "value";

    console.log("🧙‍♂️ Testing Wizard API Flow...");

    // 1. Generate Topics
    console.log("\n--- Step 1: Topics ---");
    const r1 = await fetch('http://localhost:3000/api/generate', {
        method: 'POST', body: JSON.stringify({ step: 'topics', input: topic })
    });
    const d1 = await r1.json();
    console.log("Topics:", d1.result?.slice(0, 2));

    // 2. Generate Hooks (using topic)
    console.log("\n--- Step 2: Hooks ---");
    const r2 = await fetch('http://localhost:3000/api/generate', {
        method: 'POST', body: JSON.stringify({ step: 'hooks', input: topic, intent })
    });
    const d2 = await r2.json();
    const selectedHook = d2.result[0];
    console.log("Selected Hook:", selectedHook);

    // 3. Generate Body
    console.log("\n--- Step 3: Body ---");
    const r3 = await fetch('http://localhost:3000/api/generate', {
        method: 'POST', body: JSON.stringify({
            step: 'body',
            input: selectedHook,
            context: topic,
            intent,
            length
        })
    });
    const d3 = await r3.json();
    const selectedBody = d3.result.optionA;
    console.log("Selected Body (Snippet):", selectedBody.substring(0, 50) + "...");

    // 4. Final Polish
    console.log("\n--- Step 4: Final ---");
    const r4 = await fetch('http://localhost:3000/api/generate', {
        method: 'POST', body: JSON.stringify({
            step: 'final',
            hook: selectedHook,
            input: selectedBody,
            context: topic,
            ctaType
        })
    });
    const d4 = await r4.json();
    console.log("\n✨ Final Output:\n", d4.result.finalPost);
}

testWizardFlow();
