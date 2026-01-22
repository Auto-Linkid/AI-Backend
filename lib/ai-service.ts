import { Groq } from 'groq-sdk';
import { tavily } from '@tavily/core';

// Helper to get clients lazily (prevents build-time errors if env vars are missing)
const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not set");
    }
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const getTavilyClient = () => {
    if (!process.env.TAVILY_API_KEY) { // Tavily might not throw on init but good to check
        throw new Error("TAVILY_API_KEY is not set");
    }
    return tavily({ apiKey: process.env.TAVILY_API_KEY });
};

// Helper: Detect if input is a custom draft or just a topic
export const detectInputType = (input: string): 'draft' | 'topic' => {
    const wordCount = input.split(/\s+/).length;
    const hasMultipleSentences = (input.match(/[.!?]+/g) || []).length > 2;
    const hasNewlines = input.includes('\n');

    // If input is long (>50 words) or has structure (paragraphs), it's a draft
    if (wordCount > 50 || hasNewlines || hasMultipleSentences) {
        return 'draft';
    }

    return 'topic';
};


// Available models
export const ALLOWED_MODELS = {
    'llama-3.3-70b-versatile': 'Llama 3.3 70B (Versatile)',
    'llama-3.1-8b-instant': 'Llama 3.1 8B (Instant)',
};

export type ModelId = keyof typeof ALLOWED_MODELS;



// Helper for model selection
const getModel = (modelId?: string, defaultModel = 'llama-3.3-70b-versatile') => {
    return Object.keys(ALLOWED_MODELS).includes(modelId || '') ? modelId : defaultModel;
}

// Helper: Get tone/voice instruction based on slider value (0-10)
export const getToneInstruction = (toneValue: number = 5): string => {
    // 0-3: Authoritative (Analytical & Insightful)
    if (toneValue <= 3) {
        return `
**TONE: AUTHORITATIVE & ANALYTICAL**
- Use professional, formal language
- Structure: Numbered lists (1️⃣, 2️⃣, 3️⃣)
- Include frameworks/concepts (e.g., "Atomic Habits", "Law of Least Effort")
- Longer, more detailed explanations
- Vocabulary: "Saya menyimpulkan", "fenomena ini terjadi", "observasi", "refleksi"
- Avoid casual slang ("aku", "banget", "gak")
- End with thought-provoking question
- Example: "Apakah teman-teman setuju dengan observasi ini?"
        `.trim();
    }

    // 4-6: Balanced (Mix of both)
    if (toneValue <= 6) {
        return `
**TONE: BALANCED (PROFESSIONAL YET APPROACHABLE)**
- Mix formal and casual language
- Structure: Mix of numbered lists and emoji bullets
- Moderate detail level
- Vocabulary: Mix "saya" and "aku", professional but not stiff
- Some emojis (1-2 max)
- Example: "Menurut saya, ada 3 alasan utama..."
        `.trim();
    }

    // 7-10: Social (Relatable & Conversational)
    return `
**TONE: SOCIAL & CONVERSATIONAL (CLOSE FRIEND)**
- Use casual, everyday language
- Structure: Emoji bullets (✅, 🎯, 💡)
- Shorter, punchier sentences
- Vocabulary: "aku", "banget", "gak", "gimana", "relate"
- Lots of emojis (2-3 per section)
- Personal anecdotes: "Jujur aku...", "Ada yang relate?"
- Rhetorical questions: "Gimana menurut kalian?"
- Example: "Niatnya cuma login sebentar, sadar-sadar sudah 4 jam. Ada yang relate? 😅"
    `.trim();
};

// Helper: Get emoji usage instruction based on user preference
export const getEmojiInstruction = (emojiLevel: string | number = 'moderate'): string => {
    // Convert number (0-10) to string category for backward compatibility
    let level: string;
    if (typeof emojiLevel === 'number') {
        if (emojiLevel <= 2) level = 'none';
        else if (emojiLevel <= 4) level = 'minimal';
        else if (emojiLevel <= 7) level = 'moderate';
        else level = 'rich';
    } else {
        level = emojiLevel;
    }

    switch (level) {
        case 'none':
            return `
**EMOJI USAGE: NONE (SERIOUS/PROFESSIONAL)**
- **CRITICAL**: Do NOT use ANY emojis at all
- No emoji bullets, no emoji in text, no emoji anywhere
- This is for professional/corporate tone or to avoid AI detection
- Use plain text bullets: "•" or "-" or numbered lists
            `.trim();

        case 'minimal':
            return `
**EMOJI USAGE: MINIMAL (SUBTLE)**
- Use ONLY 1-2 emojis in the ENTIRE post
- Place at the very end as a closing touch (e.g., "Thoughts? 💭")
- OR use one emoji in the hook only
- Avoid emoji bullets
- Keep it very subtle and professional
            `.trim();

        case 'moderate':
            return `
**EMOJI USAGE: MODERATE (BALANCED)**
- Use 3-5 emojis total
- Can use emoji bullets for lists (✅, 🎯, 💡)
- 1-2 emojis in body text for emphasis
- Avoid overuse - keep it tasteful
- Example: "3 reasons: ✅ Access ✅ Convenience ✅ Instant"
            `.trim();

        case 'rich':
            return `
**EMOJI USAGE: RICH (VERY LIVELY)**
- Use 5+ emojis throughout the post
- Emoji bullets for all list items
- Emojis in hook, body, and CTA
- Make it visually engaging and fun
- Example: "Niatnya cuma login sebentar 📱, sadar-sadar sudah 4 jam ⏰. Ada yang relate? 😅"
            `.trim();

        default:
            return getEmojiInstruction('moderate');
    }
};

// Helper: Get language instruction based on user preference
export const getLanguageInstruction = (language: string = 'id'): string => {
    switch (language) {
        case 'en':
            return `
**LANGUAGE: ENGLISH**
- Write the ENTIRE post in English
- Use English vocabulary, grammar, and idioms
- Examples: "I used to think...", "Here's why...", "Thoughts?"
- Do NOT mix Indonesian words
            `.trim();

        case 'id':
            return `
**LANGUAGE: INDONESIAN (BAHASA INDONESIA)**
- Write the ENTIRE post in Bahasa Indonesia
- Use Indonesian vocabulary, grammar, and expressions
- **CRITICAL EXCEPTION**: Keep these in ENGLISH (do NOT translate):
  * English idioms: "Unpopular opinion", "game-changer", "mindset", "plot twist"
  * Technical terms: "AI", "machine learning", "blockchain", "SaaS"
  * Brand names: "Korean BBQ", "Bulgogi", "LinkedIn", "ChatGPT"
  * Proper nouns: Names of people, places, products
- Examples of correct usage:
  * ✅ "Unpopular opinion: Aku dulu mikir bahwa..."
  * ✅ "Ini adalah game-changer untuk bisnis kita"
  * ❌ "Pendapat tidak populer: Aku dulu mikir..." (WRONG!)
- General structure: "Aku dulu mikir...", "Ini alasannya...", "Gimana menurut kalian?"
            `.trim();

        default:
            return getLanguageInstruction('id'); // Default to Indonesian
    }
};

// Helper: Polish post for LinkedIn formatting
export async function polishForLinkedIn(
    rawPost: string,
    language: string = 'id',
    emojiLevel: string = 'moderate'
) {
    const groq = getGroqClient();

    const emojiInstruction = getEmojiInstruction(emojiLevel);
    const languageInstruction = getLanguageInstruction(language);

    const prompt = `
    You are a LinkedIn Post Formatter. Your ONLY job is to make this post visually perfect for LinkedIn.
    
    ${languageInstruction}
    ${emojiInstruction}
    
    RAW POST:
    """
    ${rawPost}
    """
    
    FORMATTING RULES (CRITICAL):
    1. **Line Breaks**: Add proper spacing between paragraphs (double newline).
       - Hook: 1-2 lines, standalone paragraph.
       - Body: Break into 2-3 short paragraphs (max 3-4 lines each).
       - Each paragraph separated by blank line.
    
    2. **Emoji Placement**: 
       - Place emojis at START of sentences or bullet points (not mid-sentence).
       - Use emoji bullets for lists (e.g., "✅ Point 1", "🔥 Point 2", "💡 Point 3").
       - **CRITICAL**: Each bullet point MUST be on a NEW LINE.
       - Do NOT scatter emojis randomly in middle of words.
    
    3. **Visual Hierarchy**:
       - Use CAPS for 1-2 key phrases (max 5 words total).
       - Example: "This is GAME-CHANGING for your business."
    
    4. **Hashtags**: 
       - Place hashtags on a NEW LINE after the post body.
       - Add one blank line before hashtags.
       - Max 5 hashtags, space-separated.
       - Format: #HashtagOne #HashtagTwo #HashtagThree
    
    5. **Readability**:
       - Keep sentences short and punchy.
       - Use bullet points with emoji if listing items.
       - Ensure mobile-friendly formatting (short paragraphs).
    
    **CRITICAL OUTPUT RULES**:
    - Return ONLY the polished post text
    - NO introductory phrases like "Here's the formatted post:" or "Here is..."
    - NO explanations, NO JSON, NO markdown code blocks
    - Start DIRECTLY with the post content
    - Each emoji bullet point MUST be on its own line
    
    EXAMPLE OF CORRECT FORMAT:
    I used to think leadership was about grand gestures. 🤔
    
    But it's the simple decisions we make every day that can be a game-changer.
    
    Here's why:
    ✅ It's about being authentic and true to ourselves.
    🎯 It's about making choices that align with our values.
    💡 It's about being a leader who inspires others.
    
    #Leadership #Authenticity
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant', // Fast model for formatting
        temperature: 0.3, // Low temp for consistent formatting
        max_tokens: 1000
    });

    let polished = completion.choices[0]?.message?.content?.trim() || rawPost;

    // Post-process: Remove common AI prefixes
    const prefixesToRemove = [
        /^Here'?s? the formatted post:?\s*/i,
        /^Here'?s? the polished post:?\s*/i,
        /^Here is the formatted post:?\s*/i,
        /^Here is the polished post:?\s*/i,
        /^Formatted post:?\s*/i,
        /^Polished post:?\s*/i,
    ];

    for (const prefix of prefixesToRemove) {
        polished = polished.replace(prefix, '');
    }

    // Ensure emoji bullets are on separate lines
    // Replace patterns like "✅ Text 🎯 Text" with "✅ Text\n🎯 Text"
    polished = polished.replace(/([.!?])\s+([\u{1F300}-\u{1F9FF}])/gu, '$1\n$2');

    return polished.trim();
}

// 1. Generate Topics (Brainstorming)
export async function generateTopics(input: string, researchDepth: number = 3) {
    const groq = getGroqClient();
    const prompt = `
    Generate 6 short, catchy, and viral LinkedIn topic titles based on this idea: "${input}".
    
    Make them engaging and relevant to the input keyword.
    Use proven frameworks: "5 Lessons", "3 Strategies", "Why X Matters", "How to..."
    
    Return ONLY a JSON array of strings. No markdown, no explanations.
    Example: ["The Future of AI", "Why Remote Work Fails", "5 Lessons from..."]
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant', // Fast model
        temperature: 0.7,
    });

    try {
        const content = completion.choices[0]?.message?.content || '[]';
        console.log("DEBUG: generateTopics RAW content:", content);
        // Clean markdown code blocks if any
        const CLEAN_JSON = content.replace(/```json|```/g, '').trim();
        return JSON.parse(CLEAN_JSON);
    } catch (e) {
        console.error("Failed to parse topics", e);
        return [];
    }
}

// 2. Generate Hooks (Commitment)
export async function generateHooks(topic: string, intent: string = 'viral') {
    const groq = getGroqClient();
    const dateContext = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `
    You are a viral LinkedIn Ghostwriter.
    Current Date: ${dateContext}.
    
    Write 3 distinct, high-engagement "Hooks" (opening lines) for a post about: "${topic}".
    
    INTENT: ${intent.toUpperCase()}
    
    RULES:
    1. **NO FABRICATED STORIES**: Do NOT invent specific past events (e.g. "In 2018 I..."). Unless the user provides a specific story, keep it general or present tense.
    2. **Styles**:
       - Storytelling: "I used to think...", "The biggest lie in [Industry]...", "Why I changed my mind on...".
       - Educational: "How to...", "5 ways to...", "Stop doing this...".
       - Promotional: "Breaking news...", "The best way to...", highlighting opportunity.
       - Viral: "Unpopular opinion...", "Stop scrolling...", high contrast.

    Return ONLY a JSON array of strings.
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile', // Production model
        temperature: 0.8,
    });

    try {
        const content = completion.choices[0]?.message?.content || '[]';
        console.log("DEBUG: generateHooks RAW content:", content);
        const CLEAN_JSON = content.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(CLEAN_JSON);
        return Array.isArray(parsed) ? parsed : (parsed.result || []);
    } catch (e) {
        return ["Hook 1 failed", "Hook 2 failed", "Hook 3 failed"];
    }
}

// Load Viral Data
import viralPosts from '@/data/viral_posts.json';

// Helper: Get Random Viral Posts for Context
// Helper: Get Random Viral Posts for Context
const getViralContext = (count = 2, intent = 'viral', length = 'medium') => {
    // 1. Filter by Intent AND Length (Best Match)
    let pool = viralPosts.filter((p: any) =>
        (!intent || p.intent === intent) &&
        (!length || p.length === length)
    );

    // 2. Fallback: Filter by Length only (Structure matters more for length)
    if (pool.length === 0) {
        pool = viralPosts.filter((p: any) => !length || p.length === length);
    }

    // 3. Fallback: Filter by Intent only
    if (pool.length === 0) {
        pool = viralPosts.filter((p: any) => !intent || p.intent === intent);
    }

    // 4. Final Fallback: All posts
    if (pool.length === 0) pool = viralPosts;

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// 3. Generate Body (The Meat)
export async function generateBody(
    hook: string,
    topic: string,
    intent: string = 'viral',
    length: string = 'medium',
    tone: number = 5,  // 0-10 slider: 0=Authoritative, 10=Social
    emojiLevel: string = 'moderate',  // none/minimal/moderate/rich
    language: string = 'id'  // NEW: en/id
) {
    const groq = getGroqClient();

    // A. Research Layer (Content)
    let researchContext = '';
    try {
        const tvly = getTavilyClient();
        const search = await tvly.search(topic, { maxResults: 2 });
        researchContext = search.results.map((r: any) => `- ${r.title}: ${r.content}`).join('\n');
    } catch (e) { console.log('Research failed', e); }

    // B. Style Layer (Viral Engine RAG)
    const viralExamples = getViralContext(2, intent).map((post: any, i: number) =>
        `[Example ${i + 1} - Style Reference]\n${post.body}`
    ).join('\n\n');

    let lengthInstruction = '';
    switch (length) {
        case 'short':
            // STRICT: 50-100 words
            lengthInstruction = "COMPACT ESSAY. STRICTLY between 50 and 100 words. Must contain at least 5 sentences. Structure: 1. Context (2 sentences). 2. Problem (2 sentences). 3. Insight (1-2 sentences). UNDER 50 WORDS IS A CRITICAL FAILURE.";
            break;
        case 'long':
            // STRICT: > 200 words
            lengthInstruction = "LONG LENGTH. MUST BE OVER 200 WORDS. Go deep. Detailed analysis, multiple sections, or full story. Do NOT make it short.";
            break;
        case 'medium':
        default:
            // STRICT: 100-200 words
            lengthInstruction = "MEDIUM LENGTH. STRICTLY between 100 and 200 words. Balanced depth. More than 100 words, less than 200.";
            break;
    }

    // D. Tone Instruction
    const toneInstruction = getToneInstruction(tone);

    // E. Emoji Instruction
    const emojiInstruction = getEmojiInstruction(emojiLevel);

    // F. Language Instruction (NEW!)
    const languageInstruction = getLanguageInstruction(language);

    const dateContext = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `
    You are a LinkedIn Ghostwriter. Current Date: ${dateContext}. It is 2026.
    
    Write the MAIN BODY for a LinkedIn post using this Hook: "${hook}".
    Topic: "${topic}".
    Length: ${lengthInstruction}
    Intent: ${intent.toUpperCase()}
    
    ${languageInstruction}
    
    ${toneInstruction}
    
    ${emojiInstruction}
    
    CRITICAL TRUTHFULNESS RULES:
    1. **NO FAKE TIMELINES**: It is 2026. Do NOT say "In 2018" or reference old years as if they are recent.
    2. **NO FABRICATED PERSONAL STORIES**: Do NOT invent "I once..." anecdotes unless the user provided them. Use general observations or "Many people..." instead.
    3. **FACTUAL GROUNDING**: If citing stats/news, keep it generic ("Studies show...") or verifiable

    CONTEXT from Web Research (Use these facts to add SUBSTANCE):
    ${researchContext}

    STYLE REFERENCES (Mimic the sentence length, spacing, and tone of these):
    ${viralExamples}

    INSTRUCTIONS:
    - Write 2 different versions (Option A and Option B).
    - Mimic the "Viral" style: Short sentences. One line per paragraph. 
    - **NO FLUFF/YAPPING**: Every sentence must add value or move the story forward.
    - **NO PROMOTION**: Do not ask them to join a newsletter, click a link, or buy a course.
    - **NO GENERIC ADVICE**: Be specific, actionable, and insightful.
    - Use 1-2 emojis max.
    - Tone: Professional, authentic, slightly contrarian or insightful. NOT "hype-bro".

    CRITICAL LENGTH CONSTRAINT: ${lengthInstruction}
    NOTE: Ensure the content is substantive. Do not write empty fluff.

    IMPORTANT: Return ONLY valid JSON.
    Format: { "optionA": "text...", "optionB": "text..." }
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile', // Production model
        response_format: { type: "json_object" }
    });

    try {
        const content = completion.choices[0]?.message?.content || '{}';
        // Cleanup: remove potential markdown fences
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '');
        const parsed = JSON.parse(cleanContent);

        // Handle model wrapping response in "result" key
        if (parsed.result) {
            return parsed.result;
        }
        return parsed;
    } catch (e) {
        console.error("Body generation error:", e);
        return { optionA: "Generation failed.", optionB: "Gen failed." };
    }
}

// 4. Generate Final Polish (CTA + Hashtags + Assembly)
// 4. Generate Final Polish (CTA + Hashtags + Assembly)
export async function generateFinal(hook: string, body: string, context: string, ctaType: 'value' | 'promotional' | 'none' = 'value') {
    const groq = getGroqClient();

    // Define CTA Instruction
    let ctaInstruction = '';
    if (ctaType === 'none') {
        ctaInstruction = '- NO CTA. Do not ask for engagement. Do not sell anything. Just end the post definitively.';
    } else if (ctaType === 'promotional') {
        ctaInstruction = '- TYPE: PROMOTIONAL. Write a CTA inviting them to a specific offer (Newsletter/Course/Services). Keep it classy, not desperate. You MAY use placeholders like [Link in Bio].';
    } else {
        // value / default
        ctaInstruction = '- TYPE: VALUE. Write a CTA asking for engagement (e.g., "Thoughts?", "Agree?"). NO LINKS. NO SALES.';
    }

    const prompt = `
    You are a viral LinkedIn Ghostwriter. Assemble the final post.

    **Context**:
    Topic: ${context}
    Hook: ${hook}
    Body: ${body}

    **Task**:
    1.  Create a strict Call to Action (CTA) based on instruction:
        ${ctaInstruction}
    2.  Generate 3-5 relevant hashtags.
    3.  Return JSON: { "finalPost": "Full text combining Hook + Body + CTA (if any) + Hashtags" }
    
    **Rules**:
    - Ensure logical flow between Body and CTA.
    - If "none", the post should just end.
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        response_format: { type: "json_object" }
    });

    try {
        const content = completion.choices[0]?.message?.content || '{}';
        // Debug
        console.log("DEBUG: generateFinal RAW:", content);

        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '');
        const parsed = JSON.parse(cleanContent);

        if (parsed.result) return parsed.result; // Unwrap if needed
        return parsed;
    } catch (e) {
        console.error("Final assembly error:", e);
        return { finalPost: `${hook}\n\n${body}\n\nThoughts?\n\n#AI #Tech` };
    }
}

// 5. Generate from Custom Draft (Phase 9)
export async function generateFromDraft(
    draft: string,
    intent: string = 'viral',
    length: string = 'medium'
) {
    const groq = getGroqClient();
    const dateContext = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `
    You are a LinkedIn Ghostwriter. Current Date: ${dateContext}. It is 2026.
    
    The user has provided a DRAFT/NOTES for a LinkedIn post. Your job:
    1. **Extract the core message/hook** from the draft.
    2. **Rewrite the content** in viral LinkedIn format while keeping the original substance.
    3. **Do NOT fabricate new information**. Use only what's in the draft.
    
    Draft:
    """
    ${draft}
    """
    
    Target Intent: ${intent.toUpperCase()}
    Target Length: ${length}
    
    REWRITE RULES:
    - Break into short paragraphs (2-3 sentences max)
    - One line per paragraph (LinkedIn viral style)
    - Use 1-2 emoji max
    - Keep the user's original examples, anecdotes, data points
    - Maintain the author's voice and perspective
    - NO FAKE STORIES: If the draft mentions "In 2018 I...", keep it. But don't ADD new fake stories.
    
    Return JSON:
    {
        "hook": "Opening line extracted from draft",
        "body": "Rewritten content in viral format",
        "originalTopic": "What the draft is about (1-2 words)"
    }
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile', // Production model
        response_format: { type: "json_object" }
    });

    try {
        const content = completion.choices[0]?.message?.content || '{}';
        console.log("DEBUG: generateFromDraft RAW:", content);
        const cleanContent = content.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        return {
            hook: parsed.hook || draft.split('\n')[0],
            body: parsed.body || draft,
            topic: parsed.originalTopic || 'Custom Topic'
        };
    } catch (e) {
        console.error("Draft processing error:", e);
        // Fallback: Use first line as hook, rest as body
        const lines = draft.split('\n');
        return {
            hook: lines[0] || draft.substring(0, 100),
            body: lines.slice(1).join('\n') || draft,
            topic: 'Custom Draft'
        };
    }
}
