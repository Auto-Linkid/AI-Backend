const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const OUT_FILE = path.join(DATA_DIR, 'viral_posts.json');

function cleanText(text) {
    if (!text) return '';
    return text.trim();
}

function parsePost(rawPost) {
    const fullText = cleanText(rawPost['Post Content']);
    if (!fullText) return null;

    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l);

    // Heuristic: First line is hook, Last line is CTA, Rest is Body
    let hook = lines[0] || "";
    let cta = lines.length > 1 ? lines[lines.length - 1] : "";
    let body = lines.length > 2 ? lines.slice(1, lines.length - 1).join('\n\n') : "";

    // If body is empty (short post), put everything in body
    if (!body && lines.length === 2) {
        body = lines[1];
    }

    return {
        category: "Viral", // Default category
        hook: hook,
        body: body,
        cta: cta,
        metrics: {
            likes: rawPost['Like Count'] || 0,
            comments: rawPost['Comment Count'] || 0
        }
    };
}

function mergeData() {
    let combinedData = [];

    // 1. Read Existing
    if (fs.existsSync(OUT_FILE)) {
        const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
        combinedData = existing;
        console.log(`Loaded ${existing.length} existing posts.`);
    }

    // 2. Read New Datasets (1-5)
    for (let i = 1; i <= 5; i++) {
        const filename = `viral_posts_dataset ${i}.json`;
        const filePath = path.join(DATA_DIR, filename);

        if (fs.existsSync(filePath)) {
            try {
                const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const processed = rawData.map(parsePost).filter(p => p !== null);
                combinedData = combinedData.concat(processed);
                console.log(`Merged ${processed.length} posts from ${filename}`);
            } catch (err) {
                console.error(`Error reading ${filename}:`, err.message);
            }
        }
    }

    // 3. Write Back
    fs.writeFileSync(OUT_FILE, JSON.stringify(combinedData, null, 2));
    console.log(`\nSuccessfully saved ${combinedData.length} total posts to viral_posts.json`);
}

mergeData();
