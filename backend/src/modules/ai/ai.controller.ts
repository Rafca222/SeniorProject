import { Router } from 'express';
import { PolishEventDto } from './dto/polish-event.dto';
import { ParseSearchDto } from './dto/parse-search.dto';
import { validateDto } from '../../middleware/validate-dto.middleware';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import * as aiService from './ai.service';

const router = Router();

// Organizer/admin only -- this is a tool for the event-creation flow,
// not a general-purpose endpoint, and it costs a real (if tiny) API call
// each time it's used.
router.post('/polish-event', requireAuth, requireRole('organizer', 'admin'), validateDto(PolishEventDto), async (req, res) => {
  try {
    const { notes } = req.body as PolishEventDto;
    const result = await aiService.polishEventDescription(notes);
    res.json(result);
  } catch (err) {
    console.error('AI polish failed:', err);
    res.status(502).json({ error: 'AI assistant is unavailable right now — you can still write the description yourself.' });
  }
});

// No auth required -- browsing and searching is open to visitors too
// (see the use-case diagram), same as the plain category/date filters.
// Rate-limited instead, at the server.ts level, since each call is a
// real external API cost regardless of who's logged in.
router.post('/parse-search', validateDto(ParseSearchDto), async (req, res) => {
  try {
    const { query } = req.body as ParseSearchDto;
    const filters = await aiService.parseSearchQuery(query);
    res.json(filters);
  } catch (err) {
    console.error('AI search parse failed:', err);
    res.status(502).json({ error: 'AI search is unavailable right now — try the manual filters instead.' });
  }
});

export default router;
