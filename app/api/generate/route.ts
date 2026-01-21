import { NextResponse } from 'next/server';
import { generatePost } from '@/lib/ai-service';

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
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid JSON body. Please ensure you are sending a JSON object with a "topic" field.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const { topic, model } = body;

        if (!topic) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const postContent = await generatePost(topic, model);

        return NextResponse.json(
            { result: postContent },
            { status: 200, headers: corsHeaders() }
        );
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500, headers: corsHeaders() }
        );
    }
}
