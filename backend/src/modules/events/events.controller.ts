import { Router } from 'express';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { validateDto } from '../../middleware/validate-dto.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import * as eventsService from './events.service';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const rows = await eventsService.listEvents(req.query as { category?: string; city?: string; date?: string });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/trending', async (_req, res) => {
  try {
    res.json(await eventsService.listTrendingEvents());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trending events' });
  }
});

router.get('/featured', async (_req, res) => {
  try {
    res.json(await eventsService.listFeaturedEvents());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch featured events' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.get('/:id/attendance/me', requireAuth, async (req, res) => {
  try {
    const status = await eventsService.getMyAttendanceStatus(req.userId as string, req.params.id);
    res.json({ status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check attendance status' });
  }
});

router.get('/:id/save/me', requireAuth, async (req, res) => {
  try {
    const saved = await eventsService.getMySavedStatus(req.userId as string, req.params.id);
    res.json({ saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check saved status' });
  }
});

router.post('/', requireAuth, validateDto(CreateEventDto), async (req, res) => {
  try {
    const event = await eventsService.createEvent(req.body as CreateEventDto, req.userId as string);
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/:id', requireAuth, validateDto(UpdateEventDto), async (req, res) => {
  try {
    const event = await eventsService.updateEvent(
      req.params.id,
      req.body as UpdateEventDto,
      req.userId as string,
      req.userRole as string
    );
    res.json(event);
  } catch (err) {
    if (err instanceof eventsService.NotFoundError) return res.status(404).json({ error: err.message });
    if (err instanceof eventsService.ForbiddenError) return res.status(403).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await eventsService.deleteEvent(req.params.id, req.userId as string, req.userRole as string);
    res.status(204).send();
  } catch (err) {
    if (err instanceof eventsService.NotFoundError) return res.status(404).json({ error: err.message });
    if (err instanceof eventsService.ForbiddenError) return res.status(403).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

router.post('/:id/attendance', requireAuth, async (req, res) => {
  try {
    await eventsService.markGoing(req.userId as string, req.params.id);
    res.status(201).json({ status: 'going' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join event' });
  }
});

router.delete('/:id/attendance', requireAuth, async (req, res) => {
  try {
    await eventsService.unmarkGoing(req.userId as string, req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    res.json(await eventsService.listMessages(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/:id/roster', async (req, res) => {
  try {
    res.json(await eventsService.getRoster(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    await eventsService.saveEvent(req.userId as string, req.params.id);
    res.status(201).json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

router.delete('/:id/save', requireAuth, async (req, res) => {
  try {
    await eventsService.unsaveEvent(req.userId as string, req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unsave event' });
  }
});

export default router;
