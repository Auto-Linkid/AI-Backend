async function testEmojiControl() {
    console.log("😀 Testing Emoji Control Parameter\n");
    console.log("=".repeat(80));

    const topic = "Mobile Gaming Habits";
    const intent = "storytelling";
    const length = "medium";
    const tone = 8; // Social tone

    // Test 1: No Emojis (Professional/Anti-Detection)
    console.log("\n🚫 TEST 1: NO EMOJIS (emojiLevel='none')");
    console.log("Expected: Zero emojis, plain bullets, serious tone\n");

    const res1 = await fetch('http://localhost:3000/api/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: topic,
            intent,
            length,
            ctaType: 'value',
            tone,
            emojiLevel: 'none'  // No emojis
        })
    });

    const data1 = await res1.json();
    if (data1.success) {
        console.log("📝 Generated Post (No Emojis):");
        console.log("-".repeat(80));
        console.log(data1.result.finalPost);
        console.log("-".repeat(80));

        // Count emojis
        const emojiCount1 = (data1.result.finalPost.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
        console.log(`\n🔢 Emoji Count: ${emojiCount1} ${emojiCount1 === 0 ? '✅ PASS' : '❌ FAIL'}`);
    } else {
        console.error("❌ Error:", data1.error);
    }

    console.log("\n" + "=".repeat(80));

    // Test 2: Minimal Emojis (Subtle)
    console.log("\n😊 TEST 2: MINIMAL EMOJIS (emojiLevel='minimal')");
    console.log("Expected: 1-2 emojis total, very subtle\n");

    const res2 = await fetch('http://localhost:3000/api/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: topic,
            intent,
            length,
            ctaType: 'value',
            tone,
            emojiLevel: 'minimal'  // Minimal emojis
        })
    });

    const data2 = await res2.json();
    if (data2.success) {
        console.log("📝 Generated Post (Minimal Emojis):");
        console.log("-".repeat(80));
        console.log(data2.result.finalPost);
        console.log("-".repeat(80));

        const emojiCount2 = (data2.result.finalPost.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
        console.log(`\n🔢 Emoji Count: ${emojiCount2} ${emojiCount2 >= 1 && emojiCount2 <= 2 ? '✅ PASS' : '⚠️ CHECK'}`);
    } else {
        console.error("❌ Error:", data2.error);
    }

    console.log("\n" + "=".repeat(80));

    // Test 3: Moderate Emojis (Balanced)
    console.log("\n🎯 TEST 3: MODERATE EMOJIS (emojiLevel='moderate')");
    console.log("Expected: 3-5 emojis, balanced\n");

    const res3 = await fetch('http://localhost:3000/api/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: topic,
            intent,
            length,
            ctaType: 'value',
            tone,
            emojiLevel: 'moderate'  // Moderate emojis (default)
        })
    });

    const data3 = await res3.json();
    if (data3.success) {
        console.log("📝 Generated Post (Moderate Emojis):");
        console.log("-".repeat(80));
        console.log(data3.result.finalPost);
        console.log("-".repeat(80));

        const emojiCount3 = (data3.result.finalPost.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
        console.log(`\n🔢 Emoji Count: ${emojiCount3} ${emojiCount3 >= 3 && emojiCount3 <= 5 ? '✅ PASS' : '⚠️ CHECK'}`);
    } else {
        console.error("❌ Error:", data3.error);
    }

    console.log("\n" + "=".repeat(80));

    // Test 4: Rich Emojis (Very Lively)
    console.log("\n🎉 TEST 4: RICH EMOJIS (emojiLevel='rich')");
    console.log("Expected: 5+ emojis, very lively\n");

    const res4 = await fetch('http://localhost:3000/api/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: topic,
            intent,
            length,
            ctaType: 'value',
            tone,
            emojiLevel: 'rich'  // Rich emojis
        })
    });

    const data4 = await res4.json();
    if (data4.success) {
        console.log("📝 Generated Post (Rich Emojis):");
        console.log("-".repeat(80));
        console.log(data4.result.finalPost);
        console.log("-".repeat(80));

        const emojiCount4 = (data4.result.finalPost.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
        console.log(`\n🔢 Emoji Count: ${emojiCount4} ${emojiCount4 >= 5 ? '✅ PASS' : '⚠️ CHECK'}`);
    } else {
        console.error("❌ Error:", data4.error);
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n🎉 Emoji Control Testing Complete!");
    console.log("\n📊 Summary:");
    console.log("- none: 0 emojis (professional, anti-AI-detection)");
    console.log("- minimal: 1-2 emojis (subtle)");
    console.log("- moderate: 3-5 emojis (balanced)");
    console.log("- rich: 5+ emojis (very lively)");
}

testEmojiControl().catch(console.error);
