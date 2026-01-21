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

// 1. Generate Topics (Brainstorming)
export async function generateTopics(input: string) {
    const groq = getGroqClient();
    const prompt = `
    Generate 6 short, catchy, and viral LinkedIn topic titles based on this idea: "${input}".
    Return ONLY a JSON array of strings. No markdown, no silence. 
    Example: ["The Future of AI", "Why Remote Work fails"]
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant', // Fast model
        temperature: 0.7,
    });

    try {
        const content = completion.choices[0]?.message?.content || '[]';
        // Clean markdown code blocks if any
        const CLEAN_JSON = content.replace(/```json|```/g, '').trim();
        return JSON.parse(CLEAN_JSON);
    } catch (e) {
        console.error("Failed to parse topics", e);
        return [];
    }
}

// 2. Generate Hooks (Commitment)
export async function generateHooks(topic: string) {
    const groq = getGroqClient();
    const prompt = `
    You are a viral LinkedIn Ghostwriter.
    Write 3 distinct, high-engagement "Hooks" (opening lines) for a post about: "${topic}".
    Styles:
    1. Controversial
    2. Storytelling
    3. Analogy
    
    Return ONLY a JSON array of strings.
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile', // Smart model
        temperature: 0.8,
    });

    try {
        const content = completion.choices[0]?.message?.content || '[]';
        const CLEAN_JSON = content.replace(/```json|```/g, '').trim();
        return JSON.parse(CLEAN_JSON);
    } catch (e) {
        return ["Hook 1 failed", "Hook 2 failed", "Hook 3 failed"];
    }
}

// Load Viral Data
import viralPosts from '@/data/viral_posts.json';

// Helper: Get Random Viral Posts for Context
const getViralContext = (count = 2) => {
    // In a real app, we would use Vector Search here (Milestone 5)
    // For now, random selection is sufficient for style mimicry
    const shuffled = [...viralPosts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// 3. Generate Body (The Meat)
export async function generateBody(hook: string, topic: string) {
    const groq = getGroqClient();

    // A. Research Layer (Content)
    let researchContext = '';
    try {
        const tvly = getTavilyClient();
        const search = await tvly.search(topic, { maxResults: 2 });
        researchContext = search.results.map((r: any) => `- ${r.title}: ${r.content}`).join('\n');
    } catch (e) { console.log('Research failed', e); }

    // B. Style Layer (Viral Engine RAG)
    const viralExamples = getViralContext(2).map((post, i) =>
        `[Example ${i + 1} - Style Reference]\n${post.body}`
    ).join('\n\n');

    const prompt = `
    Write the MAIN BODY for a LinkedIn post using this Hook: "${hook}".
    Topic: "${topic}".

    CONTEXT from Web Research (Use these facts):
    ${researchContext}

    STYLE REFERENCES (Mimic the sentence length, spacing, and tone of these):
    ${viralExamples}

    INSTRUCTIONS:
    - Write 2 different versions (Option A and Option B).
    - Mimic the "Viral" style: Short sentences. One line per paragraph. 
    - No big walls of text.
    - Use 1-2 emojis max.
    
    IMPORTANT: Return ONLY valid JSON.
    Format: { "optionA": "text...", "optionB": "text..." }
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: "json_object" }
    });

    try {
        const content = completion.choices[0]?.message?.content || '{}';
        return JSON.parse(content);
    } catch (e) {
        console.error("Body generation error:", e);
        return { optionA: "Generation failed.", optionB: "Gen failed." };
    }
}

// 4. Generate Final Polish (CTA + Hashtags + Assembly)
export async function generateFinal(hook: string, body: string, topic: string) {
    const groq = getGroqClient();
    const prompt = `
    You are assembling the final LinkedIn post.
    
    Context:
    - Topic: "${topic}"
    - Hook: "${hook}"
    - Body: "${body}"

    Task:
    1. Generate a strong Call To Action (CTA) relevant to the body.
    2. Generate 5 relevant hashtags.
    3. Assemble the FINAL COMPLETE POST by combining: Hook + \n\n + Body + \n\n + CTA + \n\n + Hashtags.

    Return ONLY valid JSON.
    Format: { "finalPost": "full string here...", "cta": "...", "hashtags": [...] }
    `;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile', // Use smart model for assembly 
        response_format: { type: "json_object" }
    });

    try {
        const content = completion.choices[0]?.message?.content || '{}';
        return JSON.parse(content);
    } catch (e) {
        return { finalPost: `${hook}\n\n${body}`, cta: "", hashtags: [] };
    }
}
