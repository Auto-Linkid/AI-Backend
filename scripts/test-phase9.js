async function testPhase9() {
    console.log("🧪 Testing Phase 9: Magic Mode & Custom Draft\n");

    // Test 1: Magic Mode with TOPIC (normal flow)
    console.log("=== Test 1: Magic Mode with Topic ===");
    const topicInput = "AI in Healthcare 2026";

    const res1 = await fetch('http://localhost:3000/api/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: topicInput,
            intent: 'educational',
            length: 'medium',
            ctaType: 'value'
        })
    });

    const data1 = await res1.json();
    console.log("\n📦 Raw Response:", JSON.stringify(data1, null, 2).substring(0, 500));

    if (!data1.success) {
        console.error("❌ Error:", data1.error);
        return;
    }

    console.log("\n✅ Magic Mode (Topic) Result:");
    console.log("Input Type:", data1.metadata?.inputType);
    console.log("Steps Processed:", data1.metadata?.processingSteps);
    console.log("Topic:", data1.result?.topic);
    console.log("Hook:", data1.result?.hook?.substring(0, 80) + "...");
    console.log("Body (snippet):", data1.result?.body?.substring(0, 100) + "...");
    console.log("\n📝 Final Post:");
    console.log(data1.result?.finalPost);
    console.log("\n" + "=".repeat(80) + "\n");

    // Test 2: Magic Mode with DRAFT (custom draft flow)
    console.log("=== Test 2: Magic Mode with Custom Draft ===");
    const draftInput = `
Kenapa Game mobile itu lebih bikin candu dibandingkan game lainnya?

Aku sering banget main game, baik itu di mobile ato di desktop. Ya meskipun belakangan ini aku lagi usaha batesin sih… Masih usaha…

Cuman aku merasakan sesuatu yang perbedaan pas aku main game di kedua platform tsb. Seringkali aku main lebih lama di mobile. Buka sedikit, keterusan sampe 4 jam. Keluar dari app, aktivitas bentar, buka dikit lagi, keterusan sampe pagi.

Dari sini, aku tu bertanya-tanya, alesannya kenapa ya? Setelah aku merefleksikan habitku dan riset2 dikit, ini 3 alesan yang seringkali gak diperhatiin:

Access - Game mobile itu aksesnya gampang. Kamu tinggal Buka HP > Buka Game > Loading Dikit > Title Screen, Udah, tinggal main.

Convenience - Bisa dimainkan dengan posisi semaunya.

Instant - Proses masuknya gampang.
    `.trim();

    const res2 = await fetch('http://localhost:3000/api/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: draftInput,
            intent: 'viral',
            length: 'medium',
            ctaType: 'value'
        })
    });

    const data2 = await res2.json();
    console.log("\n✅ Magic Mode (Draft) Result:");
    console.log("Input Type:", data2.metadata?.inputType);
    console.log("Steps Processed:", data2.metadata?.processingSteps);
    console.log("Topic:", data2.result?.topic);
    console.log("Hook:", data2.result?.hook?.substring(0, 80) + "...");
    console.log("Body (snippet):", data2.result?.body?.substring(0, 100) + "...");
    console.log("\n📝 Final Post:");
    console.log(data2.result?.finalPost);
    console.log("\n" + "=".repeat(80) + "\n");

    // Test 3: Quick validation
    console.log("=== Validation ===");
    console.log("Test 1 detected as:", data1.metadata?.inputType, data1.metadata?.inputType === 'topic' ? "✅" : "❌");
    console.log("Test 2 detected as:", data2.metadata?.inputType, data2.metadata?.inputType === 'draft' ? "✅" : "❌");
    console.log("\n🎉 Phase 9 Testing Complete!");
}

testPhase9().catch(console.error);
