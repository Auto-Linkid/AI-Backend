import { Router, Request, Response } from 'express';
import { generateTopics, generateHooks, generateBody, generateCTA } from '../services/ai-service';

const router = Router();

router.post('/api/generate', async (req: Request, res: Response) => {
    try {
        const { step, ...params } = req.body;

        console.log(`[API] Generate request - step: ${step}`);

        let result;

        switch (step) {
            case 'topics':
                result = await generateTopics(params.input, params.researchDepth);
                break;
            case 'hooks':
                result = await generateHooks(params.input, params.intent);
                break;
            case 'body':
                console.log('[API] Body step called with:', params);
                result = await generateBody(params.input, params.context, params.intent, params.length);
                console.log('[API] Body result:', result);
                break;
            case 'cta':
                result = await generateCTA(params.input, params.intent);
                break;
            default:
                return res.status(400).json({ error: 'Invalid step' });
        }

        res.json({ result });
    } catch (error) {
        console.error('Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

export default router;
