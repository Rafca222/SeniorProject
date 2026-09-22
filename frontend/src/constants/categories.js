// The single source of truth for event categories.
// Keep this list identical to backend/src/constants/categories.js --
// if they drift, filtering breaks silently (a category string that doesn't
// match exactly just returns zero results, with no error).

export const CATEGORIES = [
  'Outdoor & Hiking',
  'Food & Dining',
  'Arts & Culture',
  'Movies & Entertainment',
  'Music & Concerts',
  'Nightlife & Parties',
  'Sports & Fitness',
  'Beauty & Wellness',
];
