import { NextResponse } from 'next/server';
import { generateTopics, generateHooks, generateBody, generateFinal } from '@/lib/ai-service';

export const runtime = 'nodejs'; // Force Node.js runtime for Tavily/Groq SDK compatibility if needed

// CORS Helper
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// Handle OPTIONS for Preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { step, input, context } = body;

        let result;

        switch (step) {
            case 'topics':
                // input = user idea
                result = await generateTopics(input);
                break;
            case 'hooks':
                // input = selected topic
                result = await generateHooks(input);
                break;
            case 'body':
                // input = selected hook, context = topic
                if (!context) throw new Error("Context (topic) required for body generation");
                result = await generateBody(input, context);
                break;
            case 'final':
                // input = selected body, context = topic, hook = from frontend
                const { hook } = body;
                if (!context || !hook) throw new Error("Context (topic) and Hook required for final assembly");
                result = await generateFinal(hook, input, context);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid step. Available: topics, hooks, body, final' },
                    { status: 400, headers: corsHeaders() }
                );
        }

        return NextResponse.json(
            { result },
            { status: 200, headers: corsHeaders() }
        );

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
