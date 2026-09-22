// Same idea as your internship's auth-service.ts: every call to the
// /auth endpoints lives here. Components import these functions instead
// of calling `api` directly, so if an endpoint's shape ever changes,
// there's exactly one place to fix it.
import { api } from '../lib/api';

export function register({ name, email, password }) {
  return api.post('/auth/register', { name, email, password }).then((res) => res.data);
}

export function login({ email, password }) {
  return api.post('/auth/login', { email, password }).then((res) => res.data);
}
