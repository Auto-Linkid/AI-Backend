import Groq from 'groq-sdk';
import { tavily } from '@tavily/core';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Initialize Clients
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || '' });

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
}

// 1. Generate Topics
export async function generateTopics(input: string, depth: number = 3): Promise<string[]> {
    const prompt = `
    Generate 6 distinct, viral-worthy LinkedIn post topics based on the user's input: "${input}".
    Focus on professional insights, personal growth, or industry trends.
    Return ONLY a valid JSON array of strings. No markdown, no "Here are...".
    Example: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6"]
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    try {
        return JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
        return [input];
    }
}

// 2. Generate Hooks
export async function generateHooks(topic: string, intent: string = 'viral'): Promise<string[]> {
    const prompt = `
    Write 4 powerful, scroll-stopping LinkedIn hooks for the topic: "${topic}".
    Intent: ${intent}.
    Return ONLY a valid JSON array of strings.
    Example: ["Hook 1...", "Hook 2...", "Hook 3...", "Hook 4..."]
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    try {
        return JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
        return [`${topic} is important because...`];
    }
}

// 3. Generate Body (Array of variations)
export async function generateBody(hook: string, context: string, intent: string, length: string): Promise<string[]> {
    const prompt = `Write 3 distinct LinkedIn post bodies for the hook: "${hook}" and context: "${context}".
Intent: ${intent}. Length: ${length}.
Return ONLY a valid JSON array of strings. Each string is a complete body variation.
Example: ["Body Option 1...", "Body Option 2...", "Body Option 3..."]`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    console.log('[AI Body] Response preview:', content.substring(0, 100));

    try {
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`[AI Body] Parsed ${parsed.length} options`);
            return parsed;
        }
        return [content];
    } catch (error) {
        console.error('[AI Body] Parse failed, returning raw content');
        return [content];
    }
}

// 4. Generate CTA (Call to Action)
export async function generateCTA(body: string, intent: string): Promise<string[]> {
    const prompt = `
    Write 2 compelling Call-To-Actions (CTAs) for a LinkedIn post with this body: "${body.substring(0, 50)}...".
    Intent: ${intent}.
    Return ONLY a valid JSON array of strings.
    Example: ["Agree?", "What do you think?"]
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    try {
        return JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
        return ["What are your thoughts?", "Let's discuss below 👇"];
    }
}

// 5. Polish (Final) - UPDATED FOR LINKEDIN COPY-PASTE WITH CONSISTENT STRUCTURE
export async function polishContent(content: string, tone: number, emojiDensity: number): Promise<string> {
    const prompt = `Polish this LinkedIn post following this EXACT structure for consistency:

Original post:
"${content}"

STRUCTURE TO FOLLOW:
1. Opening Hook (1-2 powerful sentences with ${emojiDensity > 5 ? '1-2' : '0-1'} emoji)
2. Main Body (2-4 paragraphs, each 2-3 sentences, separated by blank lines)
3. Call-to-Action (1-2 engaging sentences with ${emojiDensity > 5 ? '1' : '0-1'} emoji)

TONE GUIDELINES:
- Tone Level ${tone}/10 (1=casual/friendly, 10=formal/professional)
- ${tone <= 3 ? 'Use conversational language, contractions, personal stories' : tone <= 6 ? 'Balance professional insights with relatable examples' : 'Maintain professional tone, industry terminology, authoritative voice'}

EMOJI USAGE:
- Emoji Density ${emojiDensity}/10
- ${emojiDensity <= 3 ? 'Minimal emojis (0-2 total)' : emojiDensity <= 6 ? 'Moderate emojis (3-5 total)' : 'Liberal emoji use (6-8 total)'}
- Use only standard emojis: ✅ 🚀 💡 🔥 ⚡ 💪 🎯 📈 👉 🤔 💬 📊 🌟

CRITICAL FORMATTING RULES:
- PLAIN TEXT ONLY - no markdown (no **, __, ##, etc.)
- NO special characters that break on paste
- Use blank lines between paragraphs for readability
- Keep sentences punchy and scannable
- Make it viral-worthy and engagement-focused

Return ONLY the polished post text, nothing else.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3, // Lower temperature for more consistent output
    });
    return completion.choices[0]?.message?.content || content;
}

// 6. Tiered Generation Orchestrator
export async function generateTieredContent(tier: number, contentId: string): Promise<any> {
    console.log(`[AI] Generating content for Tier ${tier} (ID: ${contentId})`);

    // Default context
    const input = "AI in Marketing"; // In real usage, this should come from DB or params
    const intent = "educational";

    try {
        if (tier === 1) {
            // BASIC: Simple Flow
            const topics = await generateTopics(input);
            const selectedTopic = topics[0];
            const hooks = await generateHooks(selectedTopic, intent);
            const selectedHook = hooks[0];
            const bodies = await generateBody(selectedHook, selectedTopic, intent, "short");

            return {
                tier: 1,
                topic: selectedTopic,
                hook: selectedHook,
                body: bodies[0],
                status: "completed"
            };
        }
        else if (tier === 2) {
            // PRO: More Options
            const topics = await generateTopics(input);
            const selectedTopic = topics[0];
            const hooks = await generateHooks(selectedTopic, intent);
            // In a real app, user selects. Here we simulate 'best' match or return multiple.
            const bodies = await generateBody(hooks[0], selectedTopic, intent, "medium");

            return {
                tier: 2,
                topic: selectedTopic,
                hooks: hooks, // Return all hooks
                bodyOptions: bodies, // Return body variations
                status: "completed"
            };
        }
        else if (tier === 3) {
            // PREMIUM: Full Suite + Polish
            const topics = await generateTopics(input);
            const selectedTopic = topics[0];
            const hooks = await generateHooks(selectedTopic, intent);
            const bodies = await generateBody(hooks[0], selectedTopic, intent, "long");
            const ctas = await generateCTA(bodies[0], intent);
            const polished = await polishContent(bodies[0], 8, 5); // Auto-polish

            return {
                tier: 3,
                topic: selectedTopic,
                hooks: hooks,
                bodies: bodies,
                ctas: ctas,
                finalPolished: polished,
                status: "completed"
            };
        }
    } catch (error) {
        console.error("AI Generation Failed:", error);
        throw new Error("AI generation failed");
    }
}

