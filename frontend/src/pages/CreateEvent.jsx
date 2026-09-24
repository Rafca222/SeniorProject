import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createEvent } from '../services/events-service';
import { polishEvent } from '../services/ai-service';
import { CATEGORIES } from '../constants/categories';

const EMPTY_FORM = {
  title: '', description: '', venue_name: '', venue_description: '',
  category: '', start_datetime: '', minimum_age: '', lat: '', lng: '', city: '',
};

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
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Create an event</h1>
      <p className="text-sm text-slate-500 mb-6">
        Needs an organizer account.{' '}
        <Link to="/settings" className="underline">Not one yet? Upgrade in Settings.</Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="border border-dashed border-slate-300 rounded-md p-3 bg-slate-50">
          <label className="text-xs font-medium text-slate-600">
            ✨ Rough notes (optional) — let AI draft your description and category
          </label>
          <textarea
            className="w-full border rounded-md p-2 text-sm mt-1 bg-white"
            placeholder="e.g. sunset hike at the corniche, casual, bring water, meet at 6"
            rows={2}
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
          />
          <button
            type="button"
            onClick={handleAiPolish}
            disabled={aiPolishing || !aiNotes.trim()}
            className="mt-2 text-sm bg-slate-800 text-white px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
          >
            {aiPolishing ? 'Polishing…' : '✨ Polish with AI'}
          </button>
          {aiApplied && (
            <p className="text-xs text-green-700 mt-1">
              Description and category filled in below — feel free to edit before publishing.
            </p>
          )}
          {aiError && <p className="text-xs text-red-500 mt-1">{aiError}</p>}
        </div>

        <input
          className="w-full border rounded-md p-2 text-sm"
          placeholder="Title"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />
        <textarea
          className="w-full border rounded-md p-2 text-sm"
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          required
        />
        <input
          className="w-full border rounded-md p-2 text-sm"
          placeholder="Venue name"
          value={form.venue_name}
          onChange={(e) => set('venue_name', e.target.value)}
          required
        />
        <input
          className="w-full border rounded-md p-2 text-sm"
          placeholder="Venue description (optional)"
          value={form.venue_description}
          onChange={(e) => set('venue_description', e.target.value)}
        />

        <select
          className="w-full border rounded-md p-2 text-sm"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          required
        >
          <option value="" disabled>Category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div>
          <label className="text-xs text-slate-500">Date & time</label>
          <input
            type="datetime-local"
            className="w-full border rounded-md p-2 text-sm"
            value={form.start_datetime}
            onChange={(e) => set('start_datetime', e.target.value)}
            required
          />
        </div>

        <input
          type="number"
          className="w-full border rounded-md p-2 text-sm"
          placeholder="Minimum age (optional)"
          value={form.minimum_age}
          onChange={(e) => set('minimum_age', e.target.value)}
        />

        <input
          className="w-full border rounded-md p-2 text-sm"
          placeholder="City"
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">
              Latitude {/* Manual entry until the Maps key is live -- swaps for a map-pin picker then */}
            </label>
            <input
              type="number" step="any"
              className="w-full border rounded-md p-2 text-sm"
              placeholder="e.g. 33.8938"
              value={form.lat}
              onChange={(e) => set('lat', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Longitude</label>
            <input
              type="number" step="any"
              className="w-full border rounded-md p-2 text-sm"
              placeholder="e.g. 35.5018"
              value={form.lng}
              onChange={(e) => set('lng', e.target.value)}
              required
            />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Look up coordinates on Google Maps (right-click a spot → click the lat/lng that appears) until the map-pin picker is wired up.
        </p>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          disabled={submitting}
          className="w-full bg-slate-800 text-white rounded-md p-2 font-medium text-sm"
        >
          {submitting ? 'Publishing…' : 'Publish event'}
        </button>
      </form>
    </div>
  );
}
