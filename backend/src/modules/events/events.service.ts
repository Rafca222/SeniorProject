import { MoreThanOrEqual, Not, In } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { Event } from './entities/event.entity';
import { Attendance } from './entities/attendance.entity';
import { SavedEvent } from './entities/saved-event.entity';
import { Message } from './entities/message.entity';
import { getBlockedUserIds } from '../safety/safety.service';
import type { CreateEventDto } from './dto/create-event.dto';

const eventRepository = () => AppDataSource.getRepository(Event);
const attendanceRepository = () => AppDataSource.getRepository(Attendance);
const savedEventRepository = () => AppDataSource.getRepository(SavedEvent);
const messageRepository = () => AppDataSource.getRepository(Message);

// TypeORM entities use camelCase properties (startDatetime, venueName, ...)
// but the rest of the API -- the create/update DTOs, docs/api.md, and every
// frontend page -- was built against the original snake_case shape from
// before the TypeORM migration. Every GET endpoint below needs this, or
// fields silently come back as undefined (start_datetime showed as
// "Invalid Date"; venue_description, minimum_age, and cover_image_url
// were just as broken, only less visibly so).
function toEventJSON(e: Event) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    venue_name: e.venueName,
    venue_description: e.venueDescription,
    category: e.category,
    start_datetime: e.startDatetime,
    minimum_age: e.minimumAge,
    lat: e.lat,
    lng: e.lng,
    city: e.city,
    cover_image_url: e.coverImageUrl,
    is_promoted: e.isPromoted,
    join_policy: e.joinPolicy,
    created_by: e.createdBy,
    created_at: e.createdAt,
  };
}

export async function listMessages(eventId: string, requesterId: string) {
  const blockedIds = await getBlockedUserIds(requesterId);

  const messages = await messageRepository().find({
    where: blockedIds.length
      ? { eventId, userId: Not(In(blockedIds)) }
      : { eventId },
    order: { createdAt: 'ASC' },
    take: 100, // most recent 100 in the room; older history is a future-work item
    relations: ['user'], // to attach the sender's display name below
  });

  return messages.map((m) => ({
    id: m.id,
    eventId: m.eventId,
    userId: m.userId,
    userName: m.user?.name ?? 'Unknown',
    body: m.body,
    createdAt: m.createdAt,
  }));
}

export async function listEvents(filters: {
  category?: string; city?: string; date?: string; date_from?: string; date_to?: string;
}) {
  // QueryBuilder rather than a plain .find() here because of the date::date
  // cast (matching a calendar day, not an exact timestamp) -- the same
  // reason the original raw-SQL version needed it.
  const qb = eventRepository().createQueryBuilder('event').orderBy('event.startDatetime', 'ASC');

  if (filters.category) qb.andWhere('event.category = :category', { category: filters.category });
  if (filters.city) qb.andWhere('event.city = :city', { city: filters.city });
  if (filters.date) qb.andWhere('event.startDatetime ::date = :date', { date: filters.date });
  // date_from/date_to is a RANGE -- used by AI search, since "this weekend"
  // means two days, not one exact date like the manual date picker sends.
  if (filters.date_from) qb.andWhere('event.startDatetime ::date >= :dateFrom', { dateFrom: filters.date_from });
  if (filters.date_to) qb.andWhere('event.startDatetime ::date <= :dateTo', { dateTo: filters.date_to });

  const events = await qb.getMany();
  return events.map(toEventJSON);
}

export async function listTrendingEvents() {
  const trending = await eventRepository()
    .createQueryBuilder('event')
    .leftJoin('attendance', 'a', 'a.event_id = event.id AND a.status = :status', { status: 'going' })
    .addSelect('COUNT(a.id)', 'attendee_count')
    .where('event.startDatetime >= NOW()')
    .groupBy('event.id')
    .orderBy('attendee_count', 'DESC')
    .limit(10)
    .getMany();
  return trending.map(toEventJSON);
}

export async function listFeaturedEvents() {
  const featured = await eventRepository().find({
    where: { isPromoted: true, startDatetime: MoreThanOrEqual(new Date()) },
    order: { startDatetime: 'ASC' },
    take: 10,
  });
  return featured.map(toEventJSON);
}

export async function getEventById(id: string) {
  const event = await eventRepository().findOne({ where: { id } });
  return event ? toEventJSON(event) : null;
}

export async function getMyAttendanceStatus(userId: string, eventId: string) {
  const row = await attendanceRepository().findOne({ where: { userId, eventId } });
  return row?.status ?? null;
}

export async function getMySavedStatus(userId: string, eventId: string) {
  const row = await savedEventRepository().findOne({ where: { userId, eventId } });
  return !!row;
}

export async function createEvent(data: CreateEventDto, userId: string) {
  const event = eventRepository().create({
    title: data.title,
    description: data.description,
    venueName: data.venue_name,
    venueDescription: data.venue_description,
    category: data.category,
    startDatetime: new Date(data.start_datetime),
    minimumAge: data.minimum_age,
    lat: data.lat,
    lng: data.lng,
    city: data.city,
    coverImageUrl: data.cover_image_url,
    joinPolicy: data.join_policy ?? 'open',
    createdBy: userId,
  });
  const saved = await eventRepository().save(event);
  return toEventJSON(saved);
}

export async function markGoing(userId: string, eventId: string) {
  // upsert() with the unique-constraint columns as the conflict target is
  // the Repository equivalent of the old raw SQL's
  // "ON CONFLICT (user_id, event_id) DO UPDATE SET status = 'going'".
  await attendanceRepository().upsert(
    { userId, eventId, status: 'going' },
    ['userId', 'eventId']
  );
}

export async function unmarkGoing(userId: string, eventId: string) {
  await attendanceRepository().delete({ userId, eventId });
}

export async function getRoster(eventId: string) {
  return attendanceRepository()
    .createQueryBuilder('a')
    .innerJoin('users', 'u', 'u.id = a.user_id')
    .select(['u.id AS id', 'u.name AS name'])
    .where('a.event_id = :eventId', { eventId })
    .andWhere('a.status = :status', { status: 'going' })
    .andWhere('u.roster_visible = true')
    .getRawMany();
}

export class ForbiddenError extends Error {}
export class NotFoundError extends Error {}

async function assertOwnerOrAdmin(eventId: string, userId: string, userRole: string) {
  const event = await eventRepository().findOne({ where: { id: eventId } });
  if (!event) throw new NotFoundError('Event not found');
  if (event.createdBy !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the event owner or an admin can do this');
  }
  return event;
}

export async function updateEvent(
  id: string,
  data: Partial<CreateEventDto>,
  userId: string,
  userRole: string
) {
  await assertOwnerOrAdmin(id, userId, userRole);

  const patch: Record<string, unknown> = { ...data };
  if (data.venue_name !== undefined) { patch.venueName = data.venue_name; delete patch.venue_name; }
  if (data.venue_description !== undefined) { patch.venueDescription = data.venue_description; delete patch.venue_description; }
  if (data.start_datetime !== undefined) { patch.startDatetime = new Date(data.start_datetime); delete patch.start_datetime; }
  if (data.minimum_age !== undefined) { patch.minimumAge = data.minimum_age; delete patch.minimum_age; }
  if (data.cover_image_url !== undefined) { patch.coverImageUrl = data.cover_image_url; delete patch.cover_image_url; }
  if (data.join_policy !== undefined) { patch.joinPolicy = data.join_policy; delete patch.join_policy; }

  await eventRepository().update(id, patch);
  const updated = await eventRepository().findOne({ where: { id } });
  return updated ? toEventJSON(updated) : null;
}

export async function deleteEvent(id: string, userId: string, userRole: string) {
  await assertOwnerOrAdmin(id, userId, userRole);
  await eventRepository().delete(id);
}

// Pure function, deliberately separated from the database calls around it
// in getRecommendations below -- this is the actual "scoring algorithm"
// for the recommendation feature, and keeping it pure (no I/O) is what
// makes it possible to unit-test the logic itself without needing a real
// database connection. See events.scoring.spec.ts.
export function scoreEventsByCategory(events: Event[], categoryCounts: Record<string, number>): Event[] {
  return events
    .map((event) => ({ event, score: categoryCounts[event.category] ?? 0 }))
    .sort((a, b) => b.score - a.score || a.event.startDatetime.getTime() - b.event.startDatetime.getTime())
    .map((s) => s.event);
}

export async function getRecommendations(userId: string, limit = 10) {
  // Pull this user's "going" history along with each event's category.
  const history = await attendanceRepository().find({
    where: { userId, status: 'going' },
    relations: ['event'],
  });

  const attendedEventIds = history.map((a) => a.eventId);
  const categoryCounts: Record<string, number> = {};
  for (const a of history) {
    if (a.event) categoryCounts[a.event.category] = (categoryCounts[a.event.category] ?? 0) + 1;
  }

  const hasHistory = Object.keys(categoryCounts).length > 0;

  // Cold start: a brand-new user has no history to score against, so
  // there's nothing meaningful to personalize yet. Trending is a
  // reasonable, honest fallback rather than returning nothing.
  if (!hasHistory) {
    return listTrendingEvents();
  }

  const qb = eventRepository()
    .createQueryBuilder('event')
    .where('event.startDatetime >= NOW()');

  if (attendedEventIds.length) {
    qb.andWhere('event.id NOT IN (:...ids)', { ids: attendedEventIds });
  }

  const upcoming = await qb.getMany();

  // Transparent scoring, not a model: an event scores higher the more
  // times this user has attended its category before. Ties break by
  // soonest date, so the list stays useful even with a shallow history.
  const scored = scoreEventsByCategory(upcoming, categoryCounts);

  return scored.slice(0, limit).map(toEventJSON);
}

export async function saveEvent(userId: string, eventId: string) {
  // SavedEvent's primary key IS (userId, eventId), so a plain .save()
  // upserts automatically -- no separate upsert() call needed here.
  await savedEventRepository().save({ userId, eventId });
}

export async function unsaveEvent(userId: string, eventId: string) {
  await savedEventRepository().delete({ userId, eventId });
}
