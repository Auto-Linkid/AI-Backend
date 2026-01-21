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

export async function generatePost(topic: string, model: ModelId = 'llama-3.3-70b-versatile') {
    let researchContext = '';

    // Validate model
    const selectedModel = Object.keys(ALLOWED_MODELS).includes(model) ? model : 'llama-3.3-70b-versatile';

    // A. Research Layer (Tavily)
    try {
        const tvly = getTavilyClient();
        const searchResult = await tvly.search(topic, {
            searchMode: 'news', // or 'general'
            maxResults: 3,
        });

        // Extract snippets for context
        const snippets = searchResult.results.map((res: any) => `title: ${res.title}\ncontent: ${res.content}`).join('\n\n');
        if (snippets) {
            researchContext = `RESEARCH CONTEXT:\n${snippets}\n\n`;
        }
    } catch (error) {
        console.error('Tavily search failed or skipped, proceeding without context:', error);
        // Proceed without research if it fails
    }

    // B. System Prompt Construction
    const systemPrompt = `
You are a WORLD-CLASS VIRAL LINKEDIN GHOSTWRITER.
Your goal is to write a high-engagement LinkedIn post about the user's topic.

RULES:
1. **Strong Hook**: The first line must grab attention immediately. Use a controversial statement, a surprising fact, or a strong question.
2. **Short Paragraphs**: Use 1-2 sentences per paragraph max. White space is key for readability.
3. **Tone**: Professional yet conversational. Authentic, not robotic.
4. **Emojis**: Use 1-2 distinct emojis to add flavor, but DO NOT overdo it.
5. **No Hashtags in Body**: Absolutely NO hashtags in the main text.
6. **Trending Format**: Use bullet points or numbered lists if explaining steps or insights.

STRUCTURE:
- Hook
- Value proposition / Insight (What did I learn?)
- Actionable advice
- Engagement question at the end
- (Double Line Break)
- Hashtags (at the very bottom)

${researchContext}
  `.trim();

    // C. Generation Layer (Groq)
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            {
                role: 'user',
                content: `Topic: ${topic}`,
            },
        ],
        model: selectedModel,
        temperature: 0.7, // Creativity balance
        max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || 'Failed to generate content.';
}
