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
    const prompt = `
    Write 2 distinct LinkedIn post bodies for the hook: "${hook}" and context: "${context}".
    Intent: ${intent}. Length: ${length}.
    Return ONLY a valid JSON array of strings. Each string is a full body variation.
    Example: ["Body Option 1...", "Body Option 2..."]
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    try {
        const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
        if (Array.isArray(parsed)) return parsed;
        return [content];
    } catch {
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

// 5. Polish (Final) - UPDATED FOR LINKEDIN COPY-PASTE
export async function polishContent(content: string, tone: number, emojiDensity: number): Promise<string> {
    const prompt = `Polish this LinkedIn post for maximum engagement and readability.

Original post:
"${content}"

Tone Level (1-10, 10 is formal): ${tone}
Emoji Density (1-10): ${emojiDensity}

CRITICAL INSTRUCTIONS:
- Return PLAIN TEXT ONLY that can be directly copy-pasted to LinkedIn
- Use standard emojis that work on all platforms (✅ 🚀 💡 🔥 etc.)
- NO markdown formatting (no **, __, ##, etc.)
- NO special characters that break on paste
- Keep line breaks for readability
- Make it engaging and viral-worthy

Return only the polished post text, nothing else.`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
    });
    return completion.choices[0]?.message?.content || content;
}
