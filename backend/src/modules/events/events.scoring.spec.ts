import { scoreEventsByCategory } from './events.service';
import type { Event } from './entities/event.entity';

// Minimal fake events -- only the two fields the scoring function actually
// reads (category, startDatetime) are populated. Cast to Event since this
// is deliberately a lightweight test fixture, not a real entity.
function fakeEvent(id: string, category: string, daysFromNow: number): Event {
  const startDatetime = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return { id, category, startDatetime } as Event;
}

describe('scoreEventsByCategory', () => {
  it('ranks events from a preferred category above others', () => {
    const events = [
      fakeEvent('a', 'Food & Dining', 3),
      fakeEvent('b', 'Outdoor & Hiking', 3),
      fakeEvent('c', 'Music & Concerts', 3),
    ];
    // This user has attended 3 hiking events before, and nothing else.
    const categoryCounts = { 'Outdoor & Hiking': 3 };

    const result = scoreEventsByCategory(events, categoryCounts);

    expect(result[0].id).toBe('b'); // the hiking event should rank first
  });

  it('breaks ties between equally-scored events by soonest date', () => {
    const events = [
      fakeEvent('later', 'Outdoor & Hiking', 10),
      fakeEvent('sooner', 'Outdoor & Hiking', 1),
    ];
    const categoryCounts = { 'Outdoor & Hiking': 5 };

    const result = scoreEventsByCategory(events, categoryCounts);

    expect(result[0].id).toBe('sooner');
    expect(result[1].id).toBe('later');
  });

  it('treats an unseen category as score 0, not an error', () => {
    const events = [fakeEvent('a', 'Beauty & Wellness', 2)];
    const categoryCounts = { 'Outdoor & Hiking': 5 }; // user has never attended Beauty & Wellness

    const result = scoreEventsByCategory(events, categoryCounts);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('preserves every input event -- scoring never drops results', () => {
    const events = [
      fakeEvent('a', 'Food & Dining', 1),
      fakeEvent('b', 'Sports & Fitness', 2),
      fakeEvent('c', 'Nightlife & Parties', 3),
    ];
    const result = scoreEventsByCategory(events, {});
    expect(result).toHaveLength(3);
  });
});
