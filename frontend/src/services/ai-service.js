import { api } from '../lib/api';

export function polishEvent(notes) {
  return api.post('/ai/polish-event', { notes }).then((res) => res.data);
}

export function parseSearch(query) {
  return api.post('/ai/parse-search', { query }).then((res) => res.data);
}
