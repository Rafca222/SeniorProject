import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEventDto } from './create-event.dto';

const VALID_EVENT = {
  title: 'Sunset Hike',
  description: 'A relaxed evening hike with a group, ending at sunset.',
  venue_name: 'Raouche Trailhead',
  category: 'Outdoor & Hiking',
  start_datetime: '2026-11-01T17:00:00.000Z',
  lat: 33.89,
  lng: 35.47,
  city: 'Beirut',
};

describe('CreateEventDto', () => {
  it('accepts a fully valid event', async () => {
    const dto = plainToInstance(CreateEventDto, VALID_EVENT);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts an event without the optional fields', async () => {
    const dto = plainToInstance(CreateEventDto, VALID_EVENT);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a title shorter than 3 characters', async () => {
    const dto = plainToInstance(CreateEventDto, { ...VALID_EVENT, title: 'Hi' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rejects a description shorter than 10 characters', async () => {
    const dto = plainToInstance(CreateEventDto, { ...VALID_EVENT, description: 'too short' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });

  it('rejects lat/lng that are not numbers', async () => {
    const dto = plainToInstance(CreateEventDto, { ...VALID_EVENT, lat: 'not-a-number' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'lat')).toBe(true);
  });

  it('rejects a join_policy outside open/approval', async () => {
    const dto = plainToInstance(CreateEventDto, { ...VALID_EVENT, join_policy: 'invite-only' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'join_policy')).toBe(true);
  });

  it('accepts a valid join_policy', async () => {
    const dto = plainToInstance(CreateEventDto, { ...VALID_EVENT, join_policy: 'approval' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
