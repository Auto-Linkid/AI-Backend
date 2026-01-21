import { NextRequest, NextResponse } from 'next/server';
import {
    generateTopics,
    generateHooks,
    generateBody,
    generateFinal,
    generateFromDraft,
    detectInputType
} from '@/lib/ai-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            input,          // Topic or custom draft
            intent = 'viral',
            length = 'medium',
            ctaType = 'value'
        } = body;

        if (!input) {
            return NextResponse.json({ error: 'Input is required' }, { status: 400 });
        }

        // Detect if input is custom draft or topic
        const inputType = detectInputType(input);
        const isCustomDraft = inputType === 'draft';

        console.log('🪄 Magic Mode activated:', {
            inputType,
            input: input.substring(0, 50) + '...',
            intent,
            length,
            ctaType
        });

        let topic = input;
        let selectedHook = '';
        let selectedBody = '';

        // CUSTOM DRAFT PATH
        if (isCustomDraft) {
            console.log('✏️ Processing custom draft...');

            // Use generateFromDraft to extract hook + rewrite body
            const draftResult = await generateFromDraft(input, intent, length);

            topic = draftResult.topic;
            selectedHook = draftResult.hook;
            selectedBody = draftResult.body;

            console.log('✅ Draft processed:', {
                topic,
                hook: selectedHook.substring(0, 50),
                body: selectedBody.substring(0, 100)
            });
        }
        // NORMAL TOPIC PATH
        else {
            // Step 1: Generate topics
            console.log('📋 Generating topics...');
            const topics = await generateTopics(input);
            topic = topics[0]; // Auto-select first topic
            console.log('✅ Auto-selected topic:', topic);

            // Step 2: Generate hooks
            console.log('🎣 Generating hooks...');
            const hooks = await generateHooks(topic, intent);
            selectedHook = hooks[0]; // Auto-select first hook
            console.log('✅ Auto-selected hook:', selectedHook.substring(0, 50));

            // Step 3: Generate body
            console.log('✍️ Generating body...');
            const bodyOptions = await generateBody(selectedHook, topic, intent, length);
            selectedBody = bodyOptions.optionA; // Auto-select option A
            console.log('✅ Auto-selected body (snippet):', selectedBody.substring(0, 100));
        }

        // Final step (same for both paths)
        console.log('✨ Polishing final post...');
        const finalResult = await generateFinal(selectedHook, selectedBody, topic, ctaType);
        console.log('✅ Magic complete!');

        return NextResponse.json({
            success: true,
            result: {
                topic,
                hook: selectedHook,
                body: selectedBody,
                finalPost: finalResult.finalPost,
                hashtags: finalResult.hashtags || []
            },
            metadata: {
                inputType,
                intent,
                length,
                ctaType,
                processingSteps: isCustomDraft ? 2 : 4 // Draft: 2 steps, Topic: 4 steps
            }
        });

    } catch (error: any) {
        console.error('❌ Magic Mode error:', error);
        return NextResponse.json(
            { error: 'Generation failed', details: error.message },
            { status: 500 }
        );
    }
}
