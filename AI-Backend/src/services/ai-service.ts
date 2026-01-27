import OpenAI from 'openai';
import { tavily } from '@tavily/core';
import dotenv from 'dotenv';
import viralPosts from '../data/viral_posts.json';

// Load environment variables first
dotenv.config();

// Initialize Clients
// Eigen AI (OpenAI Compatible)
const openai = new OpenAI({
    apiKey: process.env.EIGEN_API_KEY || 'placeholder',
    baseURL: process.env.EIGEN_BASE_URL || 'https://eigenai.eigencloud.xyz/v1',
    defaultHeaders: {
        'x-api-key': process.env.EIGEN_API_KEY || ''
    }
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || '' });
const MODEL_NAME = process.env.EIGEN_MODEL || 'gpt-oss-120b-f16';

// Types
export interface GenerateOptions {
    input?: string;
    context?: string;
    intent?: string;
    length?: string;
    tone?: number;
    emojiDensity?: number;
    language?: string;
    researchDepth?: number;
    model?: string;
}

export interface AIResponse<T> {
    result: T;
    signature?: string;
}

// --- Helpers from "Highly Modelled" Logic ---

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
    // Convert number (0-10) to string category
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
  - Examples:
  * ✅ "Unpopular opinion: Aku dulu mikir bahwa..."
  * ✅ "Ini adalah game-changer untuk bisnis kita"
            `.trim();

        default:
            return getLanguageInstruction('id');
    }
};

// Helper: Get Random Viral Posts for Context
const getViralContext = (count = 2, intent = 'viral', length = 'medium') => {
    let pool = viralPosts.filter((p: any) =>
        (!intent || p.intent === intent) &&
        (!length || p.length === length)
    );
    if (pool.length === 0) pool = viralPosts.filter((p: any) => !length || p.length === length);
    if (pool.length === 0) pool = viralPosts.filter((p: any) => !intent || p.intent === intent);
    if (pool.length === 0) pool = viralPosts;

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};


// --- Core Functions ---

// 1. Generate Topics
export async function generateTopics(input: string, depth: number = 3, model?: string): Promise<AIResponse<string[]>> {
    const prompt = `
    Generate 8 distinct, viral-worthy LinkedIn post topics based on the user's input: "${input}".
    Focus on professional insights, personal growth, or industry trends.
    Return ONLY a valid JSON array of strings. No markdown, no "Here are...".
    Example: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6", "Topic 7", "Topic 8"]
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model || MODEL_NAME,
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        const result = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
        const signature = (completion as any).signature;

        return { result, signature };
    } catch (e) {
        console.error("Eigen AI Error (Topics):", e);
        return { result: [input] };
    }
}

// 2. Generate Hooks
export async function generateHooks(topic: string, intent: string = 'viral', model?: string): Promise<AIResponse<string[]>> {
    const prompt = `
    Write 8 powerful, scroll-stopping LinkedIn hooks for the topic: "${topic}".
    Intent: ${intent}.
    Return ONLY a valid JSON array of strings.
    Example: ["Hook 1...", "Hook 2...", "Hook 3...", "Hook 4..."]
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model || MODEL_NAME,
            temperature: 0.8,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        const result = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
        const signature = (completion as any).signature;

        return { result, signature };
    } catch (e) {
        console.error("Eigen AI Error (Hooks):", e);
        return { result: [`${topic} is important because...`] };
    }
}

// 3. Generate Body (Array of variations) - THE ROBUST VERSION
export async function generateBody(hook: string, context: string, intent: string, length: string, model?: string): Promise<AIResponse<string[]>> {

    // A. Research Layer (Content)
    let researchContext = '';
    try {
        const search = await tvly.search(context || hook, { maxResults: 2 });
        researchContext = search.results.map((r: any) => `- ${r.title}: ${r.content}`).join('\n');
    } catch (e) { console.log('Research failed', e); }

    // B. Style Layer
    const viralExamples = getViralContext(2, intent, length).map((post: any, i: number) =>
        `[Example ${i + 1} - Style Reference]\n${post.body}`
    ).join('\n\n');

    // C. Instructions
    let lengthInstruction = "MEDIUM LENGTH. 100-200 words.";
    if (length === 'short') lengthInstruction = "COMPACT ESSAY. 50-100 words. At least 5 sentences.";
    else if (length === 'long') lengthInstruction = "LONG LENGTH. >200 words. Deep analysis.";

    const toneInstruction = getToneInstruction(5); // Default tone if not passed, TODO: propagate settings
    const emojiInstruction = getEmojiInstruction('moderate');
    const languageInstruction = getLanguageInstruction('id'); // Default ID, TODO: propagate settings

    const prompt = `
    You are a LinkedIn Ghostwriter. Expert at viral content.
    
    Write the MAIN BODY for a LinkedIn post using this Hook: "${hook}".
    Topic: "${context}".
    Length: ${lengthInstruction}
    Intent: ${intent.toUpperCase()}
    
    ${languageInstruction}
    ${toneInstruction}
    ${emojiInstruction}
    
    CONTEXT from Web Research:
    ${researchContext}

    STYLE REFERENCES (Mimic these):
    ${viralExamples}

    INSTRUCTIONS:
    - Write 4 distinct versions.
    - Mimic the "Viral" style: Short sentences. One line per paragraph. 
    - NO FLUFF.
    - Return ONLY valid JSON array of strings.
    Example: ["Option 1...", "Option 2...", "Option 3...", "Option 4..."]
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model || MODEL_NAME,
            temperature: 0.8,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        console.log('[AI Body] Response preview:', content.substring(0, 100));

        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const signature = (completion as any).signature;

        if (Array.isArray(parsed) && parsed.length > 0) {
            return { result: parsed, signature };
        }
        return { result: [content], signature };
    } catch (error) {
        console.error('[AI Body] Parse failed, returning raw content', error);
        return { result: ["Error generating body. Please try again."] };
    }
}

// 4. Generate CTA (Call to Action)
export async function generateCTA(body: string, intent: string, model?: string): Promise<AIResponse<string[]>> {
    const prompt = `
    Write 4 compelling Call-To-Actions (CTAs) for a LinkedIn post with this body: "${body.substring(0, 50)}...".
    Intent: ${intent}.
    Return ONLY a valid JSON array of strings.
    Example: ["Agree?", "What do you think?", "Discuss!", "Thoughts?"]
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model || MODEL_NAME,
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        const result = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
        const signature = (completion as any).signature;

        return { result, signature };
    } catch (e) {
        return { result: ["What are your thoughts?", "Let's discuss below 👇"] };
    }
}

// 5. Polish (Final) - ROBUST VERSION
export async function polishContent(content: string, tone: number, emojiDensity: number): Promise<AIResponse<string>> {
    const emojiInstruction = getEmojiInstruction(emojiDensity);
    const toneInstruction = getToneInstruction(tone);

    const prompt = `Polish this LinkedIn post following this EXACT structure for consistency:

Original post:
"${content}"

${toneInstruction}
${emojiInstruction}

FORMATTING RULES (CRITICAL):
1. **Line Breaks**: Add proper spacing between paragraphs (double newline).
2. **Visual Hierarchy**: Use CAPS for 1-2 key phrases.
3. **Readability**: Keep sentences short and punchy.
4. **Hashtags**: Add max 5 hashtags at the end.

Return ONLY the polished post text, nothing else.`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL_NAME,
            temperature: 0.3,
        });
        const result = completion.choices[0]?.message?.content || content;
        const signature = (completion as any).signature;
        return { result, signature };
    } catch (e) {
        console.error("Eigen AI Error (Polish):", e);
        return { result: content };
    }
}

// 6. Tiered Generation Orchestrator
export async function generateTieredContent(tier: number, contentId: string): Promise<any> {
    console.log(`[AI] Generating content for Tier ${tier} (ID: ${contentId})`);

    // Default context
    const input = "AI in Marketing";
    const intent = "educational";

    try {
        if (tier === 1) {
            const topicsRes = await generateTopics(input);
            const selectedTopic = topicsRes.result[0];
            const hooksRes = await generateHooks(selectedTopic, intent);
            const bodiesRes = await generateBody(hooksRes.result[0], selectedTopic, intent, "short");

            return {
                tier: 1,
                topic: selectedTopic,
                hook: hooksRes.result[0],
                body: bodiesRes.result[0],
                status: "completed"
            };
        }
        else if (tier === 2) {
            const topicsRes = await generateTopics(input);
            const selectedTopic = topicsRes.result[0];
            const hooksRes = await generateHooks(selectedTopic, intent);
            const bodiesRes = await generateBody(hooksRes.result[0], selectedTopic, intent, "medium");

            return {
                tier: 2,
                topic: selectedTopic,
                hooks: hooksRes.result,
                bodyOptions: bodiesRes.result,
                status: "completed"
            };
        }
        else if (tier === 3) {
            const topicsRes = await generateTopics(input);
            const selectedTopic = topicsRes.result[0];
            const hooksRes = await generateHooks(selectedTopic, intent);
            const bodiesRes = await generateBody(hooksRes.result[0], selectedTopic, intent, "long");
            const ctasRes = await generateCTA(bodiesRes.result[0], intent);
            const polishedRes = await polishContent(bodiesRes.result[0], 8, 5);

            return {
                tier: 3,
                topic: selectedTopic,
                hooks: hooksRes.result,
                bodies: bodiesRes.result,
                ctas: ctasRes.result,
                finalPolished: polishedRes.result,
                status: "completed"
            };
        }
    } catch (error) {
        console.error("AI Generation Failed:", error);
        throw new Error("AI generation failed");
    }
}
