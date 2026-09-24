// Same idea as your internship's product-service.ts / warehouse-service.ts.
// Every call to the /events endpoints lives here, not scattered across
// individual page components.
import { api } from '../lib/api';

export function listEvents(filters = {}) {
  const params = {};
  if (filters.category) params.category = filters.category;
  if (filters.city) params.city = filters.city;
  if (filters.date) params.date = filters.date;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  return api.get('/events', { params }).then((res) => res.data);
}

export function getRoster(id) {
  return api.get(`/events/${id}/roster`).then((res) => res.data);
}

export function getMessages(id) {
  return api.get(`/events/${id}/messages`).then((res) => res.data);
}

export function createEvent(data) {
  return api.post('/events', data).then((res) => res.data);
}

export function listTrending() {
  return api.get('/events/trending').then((res) => res.data);
}

export function listFeatured() {
  return api.get('/events/featured').then((res) => res.data);
}

export function getRecommendations() {
  return api.get('/events/recommendations').then((res) => res.data);
}

export function getEvent(id) {
  return api.get(`/events/${id}`).then((res) => res.data);
}

export function getMyAttendance(id) {
  return api.get(`/events/${id}/attendance/me`).then((res) => res.data);
}

export function getMySaved(id) {
  return api.get(`/events/${id}/save/me`).then((res) => res.data);
}

export function joinEvent(id) {
  return api.post(`/events/${id}/attendance`);
}

export function leaveEvent(id) {
  return api.delete(`/events/${id}/attendance`);
}

export function saveEvent(id) {
  return api.post(`/events/${id}/save`);
}

export function unsaveEvent(id) {
  return api.delete(`/events/${id}/save`);
}
