import { NextRequest, NextResponse } from 'next/server';
import { polishForLinkedIn } from '@/lib/ai-service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            rawPost,
            language = 'id',
            emojiLevel = 'moderate'
        } = body;

        if (!rawPost) {
            return NextResponse.json(
                { success: false, error: 'rawPost is required' },
                { status: 400 }
            );
        }

        console.log('🎨 Polishing post...');
        const polishedPost = await polishForLinkedIn(rawPost, language, emojiLevel);

        return NextResponse.json({
            success: true,
            result: {
                originalPost: rawPost,
                polishedPost: polishedPost
            }
        });
    } catch (error: any) {
        console.error('❌ Polish API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
