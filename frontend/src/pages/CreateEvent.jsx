import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createEvent } from '../services/events-service';
import { polishEvent } from '../services/ai-service';
import { CATEGORIES } from '../constants/categories';

const EMPTY_FORM = {
  title: '', description: '', venue_name: '', venue_description: '',
  category: '', start_datetime: '', minimum_age: '', lat: '', lng: '', city: '',
};

// The organizer side of the app gets its own dark "studio" sidebar shell
// (the consumer-facing Discover/browse pages stay on the light top-nav
// layout) -- "My events" and "Analytics" are shown as upcoming so the
// sidebar reads as a real product section, but they aren't wired to a
// route yet, so they're intentionally non-clickable rather than 404ing.
const SIDEBAR_ITEMS = [
  { label: 'Create event', icon: '✎', active: true },
  { label: 'My events', icon: '▤', comingSoon: true },
  { label: 'Analytics', icon: '▲', comingSoon: true },
];

export default function CreateEvent() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [aiPolishing, setAiPolishing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiApplied, setAiApplied] = useState(false);
  const navigate = useNavigate();

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAiPolish() {
    if (!aiNotes.trim()) return;
    setAiPolishing(true);
    setAiError('');
    setAiApplied(false);
    try {
      const result = await polishEvent(aiNotes);
      setForm((prev) => ({
        ...prev,
        description: result.description || prev.description,
        category: result.category || prev.category,
      }));
      setAiApplied(true);
    } catch (err) {
      setAiError(err.response?.data?.error || 'AI assistant is unavailable right now.');
    } finally {
      setAiPolishing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        minimum_age: form.minimum_age ? parseInt(form.minimum_age, 10) : undefined,
        start_datetime: new Date(form.start_datetime).toISOString(),
        venue_description: form.venue_description || undefined,
      };
      const event = await createEvent(payload);
      navigate(`/events/${event.id}`);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Only organizer accounts can create events — upgrade in Settings first.');
      } else {
        setError(err.response?.data?.error || 'Failed to create event. Check every field is filled in correctly.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-[210px_1fr] gap-6">
        <aside className="bg-ink-900 rounded-2xl p-4 h-fit lg:sticky lg:top-24">
          <p className="text-xs font-semibold text-ink-400 px-2 mb-3">Organizer Studio</p>
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  item.active ? 'bg-clay-500 text-white' : 'text-ink-400'
                }`}
              >
                <span className="w-4 text-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.comingSoon && (
                  <span className="text-[9px] font-bold bg-ink-800 text-ink-400 px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <div>
          <h1 className="font-display font-semibold text-3xl text-ink-900 mb-1">Create an event</h1>
          <p className="text-sm text-ink-500 mb-7">
            Needs an organizer account.{' '}
            <Link to="/settings" className="underline font-medium">Not one yet? Upgrade in Settings.</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border-2 border-dashed border-clay-200 bg-clay-50/60 p-4">
              <label className="text-xs font-bold text-clay-700">
                Rough notes (optional) — let AI draft your description and category
              </label>
              <textarea
                className="input-field mt-2"
                placeholder="e.g. sunset hike at the corniche, casual, bring water, meet at 6"
                rows={2}
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAiPolish}
                disabled={aiPolishing || !aiNotes.trim()}
                className="btn-secondary !py-2 !px-4 text-sm mt-2.5"
              >
                {aiPolishing ? 'Polishing…' : 'Polish with AI'}
              </button>
              {aiApplied && (
                <p className="text-xs text-olive-700 font-medium mt-2">
                  Description and category filled in below — feel free to edit before publishing.
                </p>
              )}
              {aiError && <p className="text-xs text-clay-600 mt-2">{aiError}</p>}
            </div>

            <div className="panel p-5 space-y-3">
              <h2 className="font-display text-base font-semibold text-ink-900">The basics</h2>
              <input
                className="input-field"
                placeholder="Title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
              />
              <textarea
                className="input-field"
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                required
              />
              <select
                className="input-field"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                required
              >
                <option value="" disabled>Category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="panel p-5 space-y-3">
              <h2 className="font-display text-base font-semibold text-ink-900">Where & when</h2>
              <input
                className="input-field"
                placeholder="Venue name"
                value={form.venue_name}
                onChange={(e) => set('venue_name', e.target.value)}
                required
              />
              <input
                className="input-field"
                placeholder="Venue description (optional)"
                value={form.venue_description}
                onChange={(e) => set('venue_description', e.target.value)}
              />
              <input
                className="input-field"
                placeholder="City"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                required
              />

              <div>
                <label className="text-xs font-medium text-ink-500">Date & time</label>
                <input
                  type="datetime-local"
                  className="input-field mt-1"
                  value={form.start_datetime}
                  onChange={(e) => set('start_datetime', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-500">
                    Latitude {/* Manual entry until the Maps key is live -- swaps for a map-pin picker then */}
                  </label>
                  <input
                    type="number" step="any"
                    className="input-field mt-1"
                    placeholder="e.g. 33.8938"
                    value={form.lat}
                    onChange={(e) => set('lat', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-500">Longitude</label>
                  <input
                    type="number" step="any"
                    className="input-field mt-1"
                    placeholder="e.g. 35.5018"
                    value={form.lng}
                    onChange={(e) => set('lng', e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-ink-400">
                Look up coordinates on Google Maps (right-click a spot → click the lat/lng that appears) until the map-pin picker is wired up.
              </p>

              <input
                type="number"
                className="input-field"
                placeholder="Minimum age (optional)"
                value={form.minimum_age}
                onChange={(e) => set('minimum_age', e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-clay-600">{error}</p>}

            <button disabled={submitting} className="btn-primary w-full !py-3 text-base">
              {submitting ? 'Publishing…' : 'Publish event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
