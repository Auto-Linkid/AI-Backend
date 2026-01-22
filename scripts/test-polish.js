// Test the new Polish endpoint
async function testPolish() {
    console.log("💎 Testing Polish Endpoint\n");
    console.log("=".repeat(80));

    // Sample raw post (from screenshot - wall of text)
    const rawPost = `Saya selalu terpikir bahwa strategi bisnis sawit hanya tentang produksi dan keuntungan, tapi kini saya menyadari bahwa ada lebih dari itu. Saya dulu mikir bahwa strategi bisnis sawit itu hanya tentang produksi dan keuntungan, tapi sekarang saya sadar bahwa ada lebih dari itu. Industri sawit nasional harus siap menghadapi beragam tantangan, termasuk stagnasi produksi dan tekanan dari EUDR. Tapi, dengan memahami potensi bisnis perkebunan kelapa sawit, kita dapat mengembangkan strategi yang efektif untuk menghadapi tantangan tersebut. Beberapa strategi yang dapat dilakukan antara lain: ✅ optimalisasi dagang, ✅ perbaikan tata kelola, dan ✅ pemilihan lahan yang tepat. Dengan demikian, kita dapat meningkatkan produksi dan kualitas sawit, serta memenuhi standar internasional. Menurut saya, ada beberapa alasan mengapa strategi bisnis sawit harus lebih dari sekedar produksi dan keuntungan, yaitu karena industri sawit nasional harus dapat bersaing di pasar global dan memenuhi kebutuhan masyarakat akan produk sawit yang berkualitas. Berikutnya, bagaimana Anda melihat strategi bisnis sawit? Apakah perlu lebih dari sekedar produksi dan keuntungan? 🤔 #StrategiBisnisSawit #KelaPaSawit #BisnisSawit #IndustriSawitNasional #MencapaiKemajuan`;

    console.log("\n📝 RAW POST (Before Polish):");
    console.log("-".repeat(80));
    console.log(rawPost);
    console.log("-".repeat(80));
    console.log(`Character count: ${rawPost.length}`);
    console.log(`Line breaks: ${(rawPost.match(/\n/g) || []).length}`);

    console.log("\n\n🎨 Calling /api/polish...\n");

    const res = await fetch('http://localhost:3000/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            rawPost: rawPost,
            language: 'id',
            emojiLevel: 'moderate'
        })
    });

    const data = await res.json();

    if (data.success) {
        console.log("✅ Polish Successful!\n");
        console.log("💎 POLISHED POST (After Polish):");
        console.log("=".repeat(80));
        console.log(data.result.polishedPost);
        console.log("=".repeat(80));
        console.log(`\nCharacter count: ${data.result.polishedPost.length}`);
        console.log(`Line breaks: ${(data.result.polishedPost.match(/\n/g) || []).length}`);

        // Analysis
        console.log("\n\n📊 ANALYSIS:");
        console.log("-".repeat(80));
        const hasProperBreaks = (data.result.polishedPost.match(/\n\n/g) || []).length >= 2;
        const hasHashtagsOnNewLine = data.result.polishedPost.includes('\n\n#') || data.result.polishedPost.includes('\n#');
        const emojiCount = (data.result.polishedPost.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;

        console.log(`✅ Proper paragraph breaks: ${hasProperBreaks ? 'YES' : 'NO'}`);
        console.log(`✅ Hashtags on new line: ${hasHashtagsOnNewLine ? 'YES' : 'NO'}`);
        console.log(`✅ Emoji count: ${emojiCount}`);
        console.log(`✅ Readability improved: ${data.result.polishedPost.length > rawPost.length ? 'YES (added spacing)' : 'SAME'}`);

    } else {
        console.error("❌ Error:", data.error);
    }

    console.log("\n" + "=".repeat(80));
    console.log("🎉 Polish Test Complete!");
}

testPolish().catch(console.error);
