import { MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { Event } from './entities/event.entity';
import { Attendance } from './entities/attendance.entity';
import { SavedEvent } from './entities/saved-event.entity';
import type { CreateEventDto } from './dto/create-event.dto';

const eventRepository = () => AppDataSource.getRepository(Event);
const attendanceRepository = () => AppDataSource.getRepository(Attendance);
const savedEventRepository = () => AppDataSource.getRepository(SavedEvent);

export async function listEvents(filters: { category?: string; city?: string; date?: string }) {
  // QueryBuilder rather than a plain .find() here because of the date::date
  // cast (matching a calendar day, not an exact timestamp) -- the same
  // reason the original raw-SQL version needed it.
  const qb = eventRepository().createQueryBuilder('event').orderBy('event.startDatetime', 'ASC');

  if (filters.category) qb.andWhere('event.category = :category', { category: filters.category });
  if (filters.city) qb.andWhere('event.city = :city', { city: filters.city });
  if (filters.date) qb.andWhere('event.startDatetime::date = :date', { date: filters.date });

  return qb.getMany();
}

export async function listTrendingEvents() {
  return eventRepository()
    .createQueryBuilder('event')
    .leftJoin('attendance', 'a', 'a.event_id = event.id AND a.status = :status', { status: 'going' })
    .addSelect('COUNT(a.id)', 'attendee_count')
    .where('event.startDatetime >= NOW()')
    .groupBy('event.id')
    .orderBy('attendee_count', 'DESC')
    .limit(10)
    .getMany();
}

export async function listFeaturedEvents() {
  return eventRepository().find({
    where: { isPromoted: true, startDatetime: MoreThanOrEqual(new Date()) },
    order: { startDatetime: 'ASC' },
    take: 10,
  });
}

export async function getEventById(id: string) {
  return eventRepository().findOne({ where: { id } });
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
  return eventRepository().save(event);
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

export async function saveEvent(userId: string, eventId: string) {
  // SavedEvent's primary key IS (userId, eventId), so a plain .save()
  // upserts automatically -- no separate upsert() call needed here.
  await savedEventRepository().save({ userId, eventId });
}

export async function unsaveEvent(userId: string, eventId: string) {
  await savedEventRepository().delete({ userId, eventId });
}
