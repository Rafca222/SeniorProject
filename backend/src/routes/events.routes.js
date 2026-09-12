import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  venue_name: z.string().min(2),
  venue_description: z.string().optional(),
  category: z.string().min(2),
  start_datetime: z.string(), // ISO string
  minimum_age: z.number().int().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
  city: z.string().min(2),
  cover_image_url: z.string().url().optional(),
  join_policy: z.enum(['open', 'approval']).optional(),
});

// GET /events?category=&city=&date=  -- public directory with filters
router.get('/', async (req, res) => {
  const { category, city, date } = req.query;
  const conditions = [];
  const values = [];

  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }
  if (city) {
    values.push(city);
    conditions.push(`city = $${values.length}`);
  }
  if (date) {
    values.push(date);
    conditions.push(`start_datetime::date = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const { rows } = await pool.query(
      `SELECT * FROM events ${where} ORDER BY start_datetime ASC`,
      values
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /events/trending -- ordered by attendance count
router.get('/trending', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, COUNT(a.id) AS attendee_count
      FROM events e
      LEFT JOIN attendance a ON a.event_id = e.id AND a.status = 'going'
      WHERE e.start_datetime >= NOW()
      GROUP BY e.id
      ORDER BY attendee_count DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trending events' });
  }
});

// GET /events/featured -- admin-promoted events
router.get('/featured', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM events WHERE is_promoted = true AND start_datetime >= NOW() ORDER BY start_datetime ASC LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch featured events' });
  }
});

// GET /events/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /events -- create (organizer/admin in practice; role check can be added via requireRole)
router.post('/', requireAuth, async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const d = parsed.data;

  try {
    const { rows } = await pool.query(
      `INSERT INTO events
        (title, description, venue_name, venue_description, category, start_datetime,
         minimum_age, lat, lng, city, cover_image_url, join_policy, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [d.title, d.description, d.venue_name, d.venue_description ?? null, d.category,
       d.start_datetime, d.minimum_age ?? null, d.lat, d.lng, d.city,
       d.cover_image_url ?? null, d.join_policy ?? 'open', req.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// POST /events/:id/attendance -- "I'm Going"
router.post('/:id/attendance', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO attendance (user_id, event_id, status)
       VALUES ($1, $2, 'going')
       ON CONFLICT (user_id, event_id) DO UPDATE SET status = 'going'`,
      [req.userId, req.params.id]
    );
    res.status(201).json({ status: 'going' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join event' });
  }
});

// DELETE /events/:id/attendance -- undo "I'm Going"
router.delete('/:id/attendance', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM attendance WHERE user_id = $1 AND event_id = $2', [
      req.userId,
      req.params.id,
    ]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// GET /events/:id/roster -- only opted-in attendees are shown
router.get('/:id/roster', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       WHERE a.event_id = $1 AND a.status = 'going' AND u.roster_visible = true`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

// POST /events/:id/save and DELETE -- "Save / Interested" bookmark
router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO saved_events (user_id, event_id) VALUES ($1, $2)
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [req.userId, req.params.id]
    );
    res.status(201).json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

router.delete('/:id/save', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM saved_events WHERE user_id = $1 AND event_id = $2', [
      req.userId,
      req.params.id,
    ]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unsave event' });
  }
});

export default router;
