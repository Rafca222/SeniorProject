import { callGroqJSON } from './groq.client';

const CATEGORIES = [
  'Outdoor & Hiking', 'Food & Dining', 'Arts & Culture', 'Movies & Entertainment',
  'Music & Concerts', 'Nightlife & Parties', 'Sports & Fitness', 'Beauty & Wellness',
];

export async function polishEventDescription(notes: string) {
  const systemPrompt = `You help organizers turn rough notes into a polished event listing. Respond in JSON with exactly two fields: "description" (a friendly, clear 2-3 sentence description, written for people deciding whether to attend) and "category" (must be EXACTLY one of these ${CATEGORIES.length} options, copied verbatim: ${CATEGORIES.join(', ')}). Do not invent details the notes don't support.`;

  const result = await callGroqJSON(systemPrompt, notes);

  // Never trust an LLM's output blindly -- if it drifts outside the
  // allowed category list, fall back rather than saving a bad value.
  const category = CATEGORIES.includes(result.category) ? result.category : null;

  return {
    description: typeof result.description === 'string' ? result.description : '',
    category,
  };
}

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(value).getTime());
}

export async function parseSearchQuery(query: string) {
  // Computed fresh on every request -- "this weekend" means something
  // different depending on what day it actually is when someone searches,
  // so the model needs today's real date each time, not a value baked in
  // once at server startup.
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });

  const systemPrompt = `You convert a natural-language event search into structured filters. Today is ${weekday}, ${today}. Respond in JSON with exactly these fields: "category" (must be EXACTLY one of: ${CATEGORIES.join(', ')} -- or null if no category is clearly implied), "city" (a city name if one is mentioned, else null), "date_from" and "date_to" (both "YYYY-MM-DD", resolving relative phrases like "this weekend", "tomorrow", "next week" against today's real date above; use the same value for both if it's a single day; both null if no date or time is mentioned at all).`;

  const result = await callGroqJSON(systemPrompt, query);

  return {
    category: CATEGORIES.includes(result.category) ? result.category : null,
    city: typeof result.city === 'string' && result.city.trim() ? result.city.trim() : null,
    date_from: isValidDateString(result.date_from) ? result.date_from : null,
    date_to: isValidDateString(result.date_to) ? result.date_to : null,
  };
}
