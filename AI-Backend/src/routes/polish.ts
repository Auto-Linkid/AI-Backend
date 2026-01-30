import { Router, Request, Response } from 'express';
import { polishContent } from '../services/ai-service';

const router = Router();

router.post('/api/polish', async (req: Request, res: Response) => {
    try {
        const { content, tone, emojiDensity, language } = req.body;

        console.log(`[API] Polish request (${language})`);

        const response = await polishContent(content, tone, emojiDensity, language);

        res.json(response);
    } catch (error) {
        console.error('Polish Error:', error);
        res.status(500).json({ error: 'Failed to polish content' });
    }
});

export default router;
