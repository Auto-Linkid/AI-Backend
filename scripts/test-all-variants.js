const fs = require('fs');
const path = require('path');

const intents = ['viral', 'storytelling', 'educational', 'promotional'];
const lengths = ['short', 'medium', 'long'];

const topic = "The Future of AI Coding";
const hook = "Coding as we know it is dead. Here is what comes next.";
const outputFile = path.join(__dirname, '../comparison_results.md');

let output = `# Test Results: Intent & Length Matrix\n\nTopic: ${topic}\nHook: ${hook}\n\n`;

function log(msg) {
    console.log(msg);
    output += msg + '\n';
}

async function testVariant(intent, length) {
    log(`\n### [${intent.toUpperCase()}] + [${length.toUpperCase()}]`);

    try {
        const res = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step: 'body',
                input: hook,
                context: topic,
                intent: intent,
                length: length
            })
        });

        const data = await res.json();
        const text = data.result?.optionA || data.optionA || data.result || "Error/Undefined";

        if (typeof text !== 'string') {
            log(`**FAILED**: Invalid response format`);
            return;
        }

        const wordCount = text.split(/\s+/).length;
        log(`- **Word Count**: ${wordCount}`);

        // Use full text block
        log(`- **Full Output**:\n\n${text}\n`);

        log(`\n---`);

    } catch (e) {
        log(`**ERROR**: ${e.message}`);
    }
}

async function testHooks(intent) {
    log(`\n## Hooks for [${intent.toUpperCase()}]`);
    try {
        const res = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            body: JSON.stringify({ step: 'hooks', input: topic, intent })
        });
        const data = await res.json();
        const hooks = Array.isArray(data) ? data : (data.result || []);

        if (Array.isArray(hooks) && hooks.length > 0) {
            hooks.forEach((h, i) => log(`${i + 1}. ${h}`));
        } else {
            log(`**FAILED**: Output not an array or empty: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        log(`**ERROR**: ${e.message}`);
    }
}

async function runMatrix() {
    log("# Starting Matrix Test...");

    // 1. Test Hooks per Intent
    for (const intent of intents) {
        await testHooks(intent);
    }

    // 2. Test Body per Intent + Length
    log("\n# BODY VARIATIONS");
    for (const intent of intents) {
        for (const length of lengths) {
            await testVariant(intent, length);
            await new Promise(r => setTimeout(r, 500));
        }
    }

    fs.writeFileSync(outputFile, output);
    console.log(`\nResults saved to ${outputFile}`);
}

runMatrix();
