// Integration test for the actual core flow end to end: register, log in,
// become an organizer, create an event, RSVP to it, save it, check the
// roster. Unlike everything in src/**/*.spec.ts, this hits your REAL
// database (whatever DATABASE_URL in your .env points to) through the
// real Express app via supertest -- it is not mocked.
//
// Run with: npm run test:integration
// (kept separate from `npm test` on purpose -- the unit tests should run
// fast with zero setup; this one needs your backend/.env configured with
// a real, reachable DATABASE_URL first.)
//
// This creates one real user account and one real event in your database.
// The event is deleted in the cleanup step below; the test user account
// is deliberately left behind, the same way the seed script's
// "team@eventure.app" account is -- harmless, and avoids needing a
// dedicated "delete my account" endpoint just for test cleanup.

import request from 'supertest';
import { createApp } from '../../src/app';
import { AppDataSource } from '../../src/data-source';

const app = createApp();

// A fresh, collision-proof email every run, so re-running this test
// doesn't fail on "account already exists" from a previous run.
const testEmail = `integration-test-${Date.now()}@eventure.app`;
const testPassword = 'IntegrationTest123!';

let accessToken: string;
let createdEventId: string;

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('Core flow: register -> organize -> attend', () => {
  it('registers a new account', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Integration Tester', email: testEmail, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);

    accessToken = res.body.accessToken;
  });

  it('rejects creating an event before becoming an organizer', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Should Not Be Created',
        description: 'This request should be rejected by role, not by validation.',
        venue_name: 'Nowhere',
        category: 'Outdoor & Hiking',
        start_datetime: new Date(Date.now() + 86400000).toISOString(),
        lat: 33.9, lng: 35.5, city: 'Beirut',
      });

    expect(res.status).toBe(403);
  });

  it('upgrades to an organizer account', async () => {
    const res = await request(app)
      .post('/users/me/become-organizer')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('organizer');

    // The role is baked into the access token -- the old one still says
    // "user" until it naturally expires, so the test needs the freshly
    // issued token to actually exercise the organizer-only route next.
    accessToken = res.body.accessToken;
  });

  it('creates an event now that the account is an organizer', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Integration Test Event',
        description: 'Created automatically by the integration test suite.',
        venue_name: 'Test Venue',
        category: 'Outdoor & Hiking',
        start_datetime: new Date(Date.now() + 86400000).toISOString(),
        lat: 33.9, lng: 35.5, city: 'Beirut',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Integration Test Event');
    // Confirms the camelCase/snake_case mapping fix is actually working --
    // this field name broke silently once before.
    expect(res.body.start_datetime).toBeDefined();

    createdEventId = res.body.id;
  });

  it('lets the organizer RSVP to their own event', async () => {
    const res = await request(app)
      .post(`/events/${createdEventId}/attendance`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('going');
  });

  it('shows the organizer on the event roster after RSVPing', async () => {
    const res = await request(app).get(`/events/${createdEventId}/roster`);

    expect(res.status).toBe(200);
    expect(res.body.some((person: any) => person.name === 'Integration Tester')).toBe(true);
  });

  it('lets the user save the event for later', async () => {
    const res = await request(app)
      .post(`/events/${createdEventId}/save`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(201);
    expect(res.body.saved).toBe(true);
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    const res = await request(app).post(`/events/${createdEventId}/attendance`);
    expect(res.status).toBe(401);
  });

  // Cleanup: remove the event this test created, so repeated runs don't
  // leave a pile of "Integration Test Event" rows behind.
  it('cleans up the created event', async () => {
    const res = await request(app)
      .delete(`/events/${createdEventId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
  });
});
