import Groq from 'groq-sdk';
import { tavily } from '@tavily/core';
import dotenv from 'dotenv';
import path from 'path';
import viralPosts from '../data/viral_posts.json';

// Load environment variables robustly
const envPath = path.resolve(__dirname, '../../.env');
console.log('[AI Service] Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Initialize Clients
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || '' });

// Types
export interface GrantAuth {
    grantMessage: string;
    grantSignature: string;
    walletAddress: string;
}

export interface AIResponse<T> {
    result: T;
    signature?: string;
}

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

// ============================================
// TONE & STYLE HELPERS
// ============================================

export const getToneInstruction = (toneValue: number = 5): string => {
    if (toneValue <= 2) {
        return `CRITICAL TONE INSTRUCTION: STRICTLY FORMAL & AUTHORITATIVE. Use academic/corporate vocabulary. No slang. Zero casualness.`;
    }
    if (toneValue <= 4) {
        return `TONE: Professional & Structured. Clear, concise, and business-focused.`;
    }
    if (toneValue <= 6) {
        return `TONE: Balanced Professional. Friendly but credible. Approachable expert voice.`;
    }
    if (toneValue <= 8) {
        return `TONE: Casual & Conversational. Write like you're talking to a friend. Use contractions (I'm, It's).`;
    }
    return `CRITICAL TONE INSTRUCTION: HIGHLY CASUAL & FUN. Use slang, idioms, and loose grammar. extremely personal and emotional.`;
};

export const getEmojiInstruction = (emojiLevel: string | number = 'moderate'): string => {
    let level: string;
    if (typeof emojiLevel === 'number') {
        if (emojiLevel <= 1) level = 'none';
        else if (emojiLevel <= 3) level = 'minimal';
        else if (emojiLevel <= 7) level = 'moderate';
        else level = 'rich';
    } else {
        level = emojiLevel;
    }

    switch (level) {
        case 'none': return `STRICT RULE: DO NOT USE ANY EMOJIS. ZERO EMOJIS.`;
        case 'minimal': return `EMOJI USAGE: Use exactly 1-2 emojis total. Preferred at the end of paragraphs.`;
        case 'moderate': return `EMOJI USAGE: Use 3-5 emojis. Good for bullet points or emphasis.`;
        case 'rich': return `EMOJI USAGE: Heavy emoji usage (5+). Use them in bullet points, headers, and for emotion.`;
        default: return getEmojiInstruction('moderate');
    }
};

export const getLanguageInstruction = (language: string = 'id'): string => {
    if (language === 'en') {
        return `**LANGUAGE: ENGLISH** - Write entirely in English.`;
    }
    return `**LANGUAGE: INDONESIAN** - Write in Bahasa Indonesia, keep English idioms/terms (e.g. "game-changer", "mindset").`;
};

// ============================================
// CORE FUNCTIONS
// ============================================

// 1. Generate Topics
export async function generateTopics(input: string, depth: number = 3, model?: string, grant?: GrantAuth): Promise<AIResponse<string[]>> {
    console.log(`[Groq] Generating topics for: "${input}"`);

    const prompt = `
    Generate distinct, engaging LinkedIn post topics based on the idea: "${input}".
    
    Research Depth: ${depth} (1=Simple, 5=Deep Dive)
    
    REQUIREMENTS:
    - Generate EXACTLY 10 distinct topics.
    - Each topic must be a short phrase or sentence (max 15 words).
    - Focus on viral angles: Personal stories, Contrarian views, How-to guides, Industry insights.
    
    Return a STRICT JSON ARRAY of strings.
    Example: ["Topic 1...", "Topic 2...", "Topic 3...", "Topic 4...", "Topic 5...", "Topic 6...", "Topic 7...", "Topic 8...", "Topic 9...", "Topic 10..."]
    
    NO intro text. NO markdown. JUST the array.
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        const cleanJson = content.replace(/```json|```/g, '').trim();

        let topics: string[] = [];
        try {
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed)) {
                topics = parsed.map(p => typeof p === 'string' ? p : p.content || JSON.stringify(p));
            }
        } catch {
            topics = cleanJson.split('\n').filter(l => l.length > 5).slice(0, 10);
        }

        // Ensure we have exactly 10 topics if possible, or at least return what we found
        return { result: topics, signature: 'groq-signature-v1' };
    } catch (error: any) {
        console.error("Groq Topics Error:", error);
        return { result: [input], signature: 'error' };
    }
}

// 2. Generate Hooks
export async function generateHooks(topic: string, intent: string = 'viral', model?: string, grant?: GrantAuth): Promise<AIResponse<string[]>> {
    console.log(`[Groq] Generating hooks for: "${topic}"`);

    // Get viral context
    const viralContext = getViralContext(3, intent).map((p: any) => `- "${p.hook}"`).join('\n');
    console.log(`[Groq] Using ${viralContext.length} chars of viral context`);

    const dateContext = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const prompt = `
    You are a viral LinkedIn Ghostwriter.
    Current Date: ${dateContext}.
    
    Write 8 distinct, high-engagement "Hooks" (opening lines) for a post about: "${topic}".
    
    INTENT: ${intent.toUpperCase()}
    
    REFERENCE VIRAL HOOKS:
    ${viralContext}
    
    RULES:
    1. Keep it punchy and scroll-stopping.
    2. Use psychological triggers (curiosity, fear of missing out, contrarian).
    3. NO generic openers.

    Return a STRICT JSON ARRAY of strings.
    Example: ["Hook 1...", "Hook 2...", "Hook 3...", "Hook 4...", "Hook 5...", "Hook 6...", "Hook 7...", "Hook 8..."]
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.8,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        const cleanJson = content.replace(/```json|```/g, '').trim();

        let hooks: string[] = [];
        try {
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed)) {
                hooks = parsed.map(p => typeof p === 'string' ? p : p.content || JSON.stringify(p));
            }
        } catch {
            const matches = content.match(/"([^"]+)"/g);
            if (matches) hooks = matches.map(m => m.replace(/"/g, ''));
            else hooks = [content];
        }

        return { result: hooks.slice(0, 8), signature: 'groq-signature-v1' };
    } catch (error: any) {
        console.error("Groq Hooks Error:", error);
        return { result: [`${topic} is important...`], signature: 'error' };
    }
}

// 3. Generate Body
export async function generateBody(
    hook: string,
    context: string,
    intent: string,
    length: string,
    model?: string,
    grant?: GrantAuth
): Promise<AIResponse<string[]>> {
    console.log(`[Groq] Generating body for hook: "${hook.substring(0, 30)}..."`);

    // Research Layer (Tavily)
    let researchContext = '';
    try {
        const search = await tvly.search(context || hook, { maxResults: 2 });
        researchContext = search.results.map((r: any) => `- ${r.title}: ${r.content}`).join('\n');
        console.log(`[AI Service] Tavily research found ${search.results.length} results`);
    } catch (e) {
        console.log('[AI Service] Research failed or skipped', e);
    }

    let lengthInstruction = '';
    switch (length) {
        case 'short': lengthInstruction = "50-100 words, compact."; break;
        case 'long': lengthInstruction = "200+ words, detailed."; break;
        default: lengthInstruction = "100-200 words, balanced.";
    }

    const prompt = `
    You are a LinkedIn Ghostwriter. It is 2026.
    
    Write the MAIN BODY for a LinkedIn post.
    Hook: "${hook}"
    Topic: "${context}"
    Length: ${lengthInstruction}
    Intent: ${intent.toUpperCase()}
    
    RESEARCH CONTEXT (Integrate if relevant):
    ${researchContext}
    
    ${getLanguageInstruction('id')}
    ${getToneInstruction(5)}
    
    FORMATTING RULES (STRICT):
    1. **NO huge blocks of text**. Break content into short 1-2 sentence paragraphs.
    2. **Use Bullet Points** (• or -) for lists to make it scannable.
    3. **NO STAR (**)** or **MARKDOWN BOLD**. Do NOT use asterisks. Plain text only.
    4. **White Space**: Double newlines between sections.
    
    TASK: Write 4 distinct versions.
    
    OUTPUT FORMAT:
    - Pure plain text (NO JSON).
    - MENDATORY: Separate distinct versions with "|||".
    - Example: Body 1 text... ||| Body 2 text... ||| Body 3 text...
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content || '';
        console.log('[Groq] Raw Body:', content.substring(0, 100));

        let bodies = content.split('|||').map(b => b.trim()).filter(b => b.length > 20);

        // Fallback: If split failed (AI forgot delimiter), try newline split if it looks like independent blocks
        if (bodies.length < 2) {
            bodies = content.split(/\n\n\n+/).filter(b => b.length > 50);
        }
        if (bodies.length === 0) bodies = [content];

        return { result: bodies.slice(0, 4), signature: 'groq-signature-v1' };
    } catch (error: any) {
        console.error("Groq Body Error:", error);
        return { result: ["Error generating body."], signature: 'error' };
    }
}

// 4. Generate CTA
export async function generateCTA(body: string, intent: string, model?: string, grant?: GrantAuth): Promise<AIResponse<string[]>> {
    const prompt = `
    Generate 4 distinct Call-to-Actions (CTAs) for this LinkedIn post body:
    "${body.substring(0, 300)}..."
    
    Intent: ${intent}
    
    Types: Engagement, Value, Debate, Soft Sell.
    
    Return a STRICT JSON ARRAY of strings.
    Example: ["Thoughts?", "Agree?", "Link in bio 👇", "Tag a friend"]
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        const cleanJson = content.replace(/```json|```/g, '').trim();

        let ctas: string[] = [];
        try {
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed)) {
                ctas = parsed.map(p => typeof p === 'string' ? p : p.content);
            }
        } catch {
            ctas = ["Thoughts?", "Agree? 👇", "What's your take?", "Share your thoughts!"];
        }

        return { result: ctas, signature: 'groq-signature-v1' };
    } catch (error) {
        return { result: ["Thoughts?"], signature: 'error' };
    }
}

// 5. Polish (Final)
export async function polishContent(content: string, tone: number = 5, emojiDensity: number = 5): Promise<AIResponse<string>> {
    const prompt = `
    You are an expert Editor. Polish this LinkedIn post.
    
    Content:
    "${content}"
    
    instructions:
    ${getToneInstruction(tone)}
    ${getEmojiInstruction(emojiDensity)}
    ${getLanguageInstruction('id')}
    
    Steps:
    1. Fix grammar and flow.
    2. Improve readability with line breaks.
    3. Add 3 relevant hashtags at the bottom.
    4. STRICTLY REMOVE ALL BOLDING (**). Do not use asterisks. Plain text only.
    
    Return ONLY the polished post text, nothing else.
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
        });

        const result = completion.choices[0]?.message?.content || content;
        return { result, signature: 'groq-signature-v1' };
    } catch (error) {
        return { result: content, signature: 'error' };
    }
}

// 6. Tiered Generation Orchestrator (Restored for Payment Compatibility)
export async function generateTieredContent(tier: number, contentId: string): Promise<any> {
    console.log(`[Groq] Generating tiered content (Tier ${tier}) for ID: ${contentId}`);

    // Default context if none provided (since this is triggered by payment)
    const input = "Future of AI";
    const intent = "educational";

    try {
        const topicsRes = await generateTopics(input);
        const selectedTopic = topicsRes.result[0];

        if (tier === 1) {
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

        // Tier 2 & 3 Logic (Simplified for Groq)
        const hooksRes = await generateHooks(selectedTopic, intent);
        const bodiesRes = await generateBody(hooksRes.result[0], selectedTopic, intent, "long");

        let finalResult: any = {
            tier: tier,
            topic: selectedTopic,
            hooks: hooksRes.result,
            bodies: bodiesRes.result,
            status: "completed"
        };

        if (tier === 3) {
            const ctasRes = await generateCTA(bodiesRes.result[0], intent);
            const polishedRes = await polishContent(bodiesRes.result[0], 8, 5);
            finalResult.ctas = ctasRes.result;
            finalResult.finalPolished = polishedRes.result;
        }

        return finalResult;
    } catch (error) {
        console.error("Tiered Generation Failed:", error);
        throw new Error("Tiered AI generation failed");
    }
}
