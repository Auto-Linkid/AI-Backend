import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Initialize Groq Client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

// Types required by routes/generate.ts
export interface GrantAuth {
    grantMessage: string;
    grantSignature: string;
    walletAddress: string;
}

export interface AIResponse<T> {
    result: T;
    signature?: string;
}

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
    Generate 6 distinct, engaging LinkedIn post topics based on the idea: "${input}".
    
    Research Depth: ${depth} (1=Simple, 5=Deep Dive)
    
    Return a STRICT JSON ARRAY of strings.
    Example: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6"]
    
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
            // Handle array of objects (if model drifts) or strings
            if (Array.isArray(parsed)) {
                topics = parsed.map(p => typeof p === 'string' ? p : p.content || JSON.stringify(p));
            }
        } catch {
            // Fallback split
            topics = cleanJson.split('\n').filter(l => l.length > 5).slice(0, 6);
        }

        return { result: topics, signature: 'groq-signature' };
    } catch (error: any) {
        console.error("Groq Topics Error:", error);
        return { result: [input], signature: 'error' };
    }
}

// 2. Generate Hooks
export async function generateHooks(topic: string, intent: string = 'viral', model?: string, grant?: GrantAuth): Promise<AIResponse<string[]>> {
    console.log(`[Groq] Generating hooks for: "${topic}"`);

    const dateContext = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const prompt = `
    You are a viral LinkedIn Ghostwriter.
    Current Date: ${dateContext}.
    
    Write 4 distinct, high-engagement "Hooks" (opening lines) for a post about: "${topic}".
    
    INTENT: ${intent.toUpperCase()}
    
    RULES:
    1. Keep it punchy and scroll-stopping.
    2. Use psychological triggers (curiosity, fear of missing out, contrarian).
    3. NO generic openers like "In today's world...".

    Return a STRICT JSON ARRAY of strings.
    Example: ["Hook option 1...", "Hook option 2...", "Hook option 3..."]
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
                // Handle object format from reference just in case, but map to strings for frontend
                hooks = parsed.map(p => typeof p === 'string' ? p : p.content || JSON.stringify(p));
            }
        } catch {
            const matches = content.match(/"([^"]+)"/g);
            if (matches) hooks = matches.map(m => m.replace(/"/g, ''));
            else hooks = [content];
        }

        return { result: hooks.slice(0, 5), signature: 'groq-signature' };
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
    
    ${getLanguageInstruction('id')}
    ${getToneInstruction(5)}
    ${getEmojiInstruction('moderate')}
    
    Write 2 distinct versions (Option A and Option B).
    
    Return a STRICT JSON ARRAY of strings.
    Example: ["First body variation...", "Second body variation..."]
    
    NO intro. NO explanations.
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content || '[]';
        console.log('[Groq] Raw Body:', content.substring(0, 100));

        const cleanJson = content.replace(/```json|```/g, '').trim();
        let bodies: string[] = [];

        try {
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed)) {
                bodies = parsed.map(p => typeof p === 'string' ? p : p.content || JSON.stringify(p));
            } else if (typeof parsed === 'object') {
                bodies = Object.values(parsed).map((v: any) => typeof v === 'string' ? v : v.content);
            }
        } catch {
            // Fallback: split by double newlines or numbered lists
            bodies = content.split(/\n\n+/).filter(b => b.length > 50);
            if (bodies.length === 0) bodies = [content];
        }

        return { result: bodies.slice(0, 3), signature: 'groq-signature' };
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
            ctas = ["Thoughts?", "Agree? 👇", "What's your take?"];
        }

        return { result: ctas, signature: 'groq-signature' };
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
    
    Return ONLY the final polished text.
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
        });

        const result = completion.choices[0]?.message?.content || content;
        return { result, signature: 'groq-signature' };
    } catch (error) {
        return { result: content, signature: 'error' };
    }
}
