import { api } from '../lib/api';

export function reportUser(reportedUserId, reason, eventId) {
  return api.post('/reports', {
    reported_user_id: reportedUserId,
    reason,
    event_id: eventId,
  }).then((res) => res.data);
}

export function blockUser(blockedId) {
  return api.post('/blocks', { blocked_id: blockedId }).then((res) => res.data);
}

export function unblockUser(blockedId) {
  return api.delete(`/blocks/${blockedId}`);
}

export function getMyBlockedIds() {
  return api.get('/blocks/me').then((res) => res.data.blockedIds);
}
