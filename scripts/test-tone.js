async function testToneParameter() {
    console.log("🎨 Testing Tone Parameter (Authority ↔ Social)\n");
    console.log("=".repeat(80));

    const topic = "Mobile Gaming Addiction";
    const intent = "storytelling";
    const length = "medium";

    // Test 1: Authoritative Tone (0)
    console.log("\n🎓 TEST 1: AUTHORITATIVE TONE (tone=0)");
    console.log("Expected: Formal language, numbered lists, frameworks, 'Saya menyimpulkan'\n");

    const res1 = await fetch('http://localhost:3000/api/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: topic,
            intent,
            length,
            ctaType: 'value',
            tone: 0  // Authoritative
        })
    });

    const data1 = await res1.json();
    if (data1.success) {
        console.log("📝 Generated Post (Authoritative):");
        console.log("-".repeat(80));
        console.log(data1.result.finalPost);
        console.log("-".repeat(80));
    } else {
        console.error("❌ Error:", data1.error);
    }

    console.log("\n" + "=".repeat(80));

    // Test 2: Social Tone (10)
    console.log("\n😊 TEST 2: SOCIAL TONE (tone=10)");
    console.log("Expected: Casual language, emoji bullets, 'aku banget', 'Ada yang relate?'\n");

    const res2 = await fetch('http://localhost:3000/api/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: topic,
            intent,
            length,
            ctaType: 'value',
            tone: 10  // Social
        })
    });

    const data2 = await res2.json();
    if (data2.success) {
        console.log("📝 Generated Post (Social):");
        console.log("-".repeat(80));
        console.log(data2.result.finalPost);
        console.log("-".repeat(80));
    } else {
        console.error("❌ Error:", data2.error);
    }

    console.log("\n" + "=".repeat(80));

    // Test 3: Balanced Tone (5)
    console.log("\n⚖️  TEST 3: BALANCED TONE (tone=5)");
    console.log("Expected: Mix of formal and casual, moderate emojis\n");

    const res3 = await fetch('http://localhost:3000/api/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: topic,
            intent,
            length,
            ctaType: 'value',
            tone: 5  // Balanced
        })
    });

    const data3 = await res3.json();
    if (data3.success) {
        console.log("📝 Generated Post (Balanced):");
        console.log("-".repeat(80));
        console.log(data3.result.finalPost);
        console.log("-".repeat(80));
    } else {
        console.error("❌ Error:", data3.error);
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n🎉 Tone Testing Complete!");
    console.log("\n📊 Summary:");
    console.log("- Tone 0 (Authoritative): Professional, analytical, formal");
    console.log("- Tone 5 (Balanced): Mix of both styles");
    console.log("- Tone 10 (Social): Casual, conversational, friendly");
}

testToneParameter().catch(console.error);
