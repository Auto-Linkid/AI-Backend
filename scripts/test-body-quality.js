const step = 'body';
const hook = "Why most developers will be unemployed by 2030 (and what you can do about it).";
const topic = "The Future of AI Coding";

async function testBody() {
    console.log("🧪 Testing Body Generation Quality...");
    const res = await fetch('http://127.0.0.1:3000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            step,
            input: hook, // In body step, input is the selected Hook? No, check route.ts
            // route.ts: input = text (hook), context = topic
            // Wait, looking at route.ts logic:
            // case 'body': 
            //    result = await generateBody(input, context);
            // So Input is Hook, Context is Topic.
            input: hook,
            context: topic
        })
    });

    const data = await res.json();
    console.log("Response Data:", JSON.stringify(data, null, 2)); // DEBUG
    console.log("\n--- Option A ---");
    console.log(data.optionA);
    console.log("\n--- Option B ---");
    console.log(data.optionB);
}

testBody();
