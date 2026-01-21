async function testWizard() {
    const BASE_URL = 'http://localhost:3000/api/generate';
    console.log('🧙 Testing Wizard Workflow...\n');

    // 1. Topics
    console.log('--- Step 1: Topics ---');
    const topicsRes = await fetch(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({ step: 'topics', input: 'Future of AI coding' })
    });
    const topics = await topicsRes.json();
    console.log('Result:', topics.result);
    const selectedTopic = topics.result?.[0] || 'AI Coding Future';
    console.log(`> Selected: ${selectedTopic}\n`);

    // 2. Hooks
    console.log('--- Step 2: Hooks ---');
    const hooksRes = await fetch(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({ step: 'hooks', input: selectedTopic })
    });
    const hooks = await hooksRes.json();
    console.log('Result:', hooks.result);
    const selectedHook = hooks.result?.[0] || 'Hook failed';
    console.log(`> Selected: ${selectedHook}\n`);

    // 3. Body
    console.log('--- Step 3: Body ---');
    const bodyRes = await fetch(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
            step: 'body',
            input: selectedHook,
            context: selectedTopic
        })
    });
    const body = await bodyRes.json();
    console.log('Result:', body.result);
    const selectedBody = body.result?.optionA || 'Body failed';
    console.log(`> Selected Option A\n`);

    // 4. Final
    console.log('--- Step 4: Final ---');
    const finalRes = await fetch(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
            step: 'final',
            input: selectedBody,
            context: selectedTopic,
            hook: selectedHook
        })
    });
    const final = await finalRes.json();
    console.log('Result:', final.result);
}

testWizard();
