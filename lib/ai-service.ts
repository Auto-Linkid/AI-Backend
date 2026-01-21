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
export async function generateBody(hook: string, topic: string, intent: string = 'viral', length: string = 'medium') {
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

    const dateContext = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `
    You are a LinkedIn Ghostwriter. Current Date: ${dateContext}. It is 2026.
    
    Write the MAIN BODY for a LinkedIn post using this Hook: "${hook}".
    Topic: "${topic}".
    Length: ${lengthInstruction}
    Intent: ${intent.toUpperCase()}
    
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
