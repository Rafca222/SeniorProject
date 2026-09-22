import { api } from '../lib/api';

export function getMyProfile() {
  return api.get('/users/me').then((res) => res.data);
}

export function updateMyProfile(data) {
  return api.put('/users/me', data).then((res) => res.data);
}
