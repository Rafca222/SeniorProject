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

// Visual metadata per category -- icon + Tailwind classes for badges,
// card placeholders, and the filter pills. Every category maps onto one
// of the app's seven brand hues (see tailwind.config.js) rather than a
// scattered rainbow of unrelated stock colors, so the whole app reads as
// one designed system. Arts & Culture and Beauty & Wellness deliberately
// share the "wine" family at different shades -- a related-but-distinct
// pairing, not an arbitrary leftover color.
//
// Every class string below is written out in full (never built with
// `${...}` interpolation), because Tailwind only generates CSS for class
// names it can literally see in a file matched by `content` in
// tailwind.config.js -- a dynamically built class name like
// `bg-${color}-100` would silently produce no styling at all in the
// production build.
export const CATEGORY_META = {
  'Outdoor & Hiking': {
    icon: '🥾',
    badge: 'bg-olive-100 text-olive-800',
    solid: 'bg-olive-600 text-white',
    gradient: 'bg-gradient-to-b from-olive-400 to-olive-600',
  },
  'Food & Dining': {
    icon: '🍽️',
    badge: 'bg-clay-100 text-clay-800',
    solid: 'bg-clay-600 text-white',
    gradient: 'bg-gradient-to-b from-clay-400 to-clay-600',
  },
  'Arts & Culture': {
    icon: '🎨',
    badge: 'bg-wine-100 text-wine-800',
    solid: 'bg-wine-600 text-white',
    gradient: 'bg-gradient-to-b from-wine-500 to-wine-700',
  },
  'Movies & Entertainment': {
    icon: '🎬',
    badge: 'bg-ink-100 text-ink-800',
    solid: 'bg-ink-700 text-white',
    gradient: 'bg-gradient-to-b from-ink-500 to-ink-700',
  },
  'Music & Concerts': {
    icon: '🎵',
    badge: 'bg-citrus-100 text-citrus-800',
    solid: 'bg-citrus-600 text-white',
    gradient: 'bg-gradient-to-b from-citrus-300 to-citrus-500',
  },
  'Nightlife & Parties': {
    icon: '🎉',
    badge: 'bg-coral-100 text-coral-800',
    solid: 'bg-coral-600 text-white',
    gradient: 'bg-gradient-to-b from-coral-400 to-coral-600',
  },
  'Sports & Fitness': {
    icon: '🏀',
    badge: 'bg-sea-100 text-sea-800',
    solid: 'bg-sea-600 text-white',
    gradient: 'bg-gradient-to-b from-sea-400 to-sea-600',
  },
  'Beauty & Wellness': {
    icon: '💆',
    badge: 'bg-wine-50 text-wine-700',
    solid: 'bg-wine-400 text-white',
    gradient: 'bg-gradient-to-b from-wine-200 to-wine-400',
  },
};

// Fallback for any category string that doesn't match the list above
// (shouldn't happen, but keeps the UI from breaking if it ever does).
export const DEFAULT_CATEGORY_META = {
  icon: '📌',
  badge: 'bg-ink-100 text-ink-700',
  solid: 'bg-ink-700 text-white',
  gradient: 'bg-gradient-to-b from-ink-400 to-ink-600',
};
