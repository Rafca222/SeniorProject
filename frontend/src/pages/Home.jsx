import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents, listTrending, listFeatured } from '../services/events-service';
import { CATEGORIES } from '../constants/categories';

function formatCardDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function EventCard({ event, compact }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className={`rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow block ${
        compact ? 'min-w-[220px] max-w-[220px] flex-shrink-0' : ''
      }`}
    >
      {event.cover_image_url ? (
        <img src={event.cover_image_url} alt="" className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-slate-100 flex items-center justify-center text-slate-300 text-xs">
          No cover image
        </div>
      )}
      <div className="p-4">
        <h2 className="font-semibold text-slate-800">{event.title}</h2>
        <p className="text-sm text-slate-500">
          {event.category} · {event.city} · {formatCardDate(event.start_datetime)}
        </p>
        {!compact && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{event.description}</p>
        )}
      </div>
    </Link>
  );
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);

  // Trending/Featured are dashboard highlights -- independent of the
  // filters below, so they're fetched once on mount, not tied to
  // `category`/`date`.
  useEffect(() => {
    listTrending().then(setTrending).catch(() => {});
    listFeatured().then(setFeatured).catch(() => {});
  }, []);

  useEffect(() => {
    setStatus('loading');
    listEvents({ category, date })
      .then((data) => {
        setEvents(data);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [category, date]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Eventure</h1>
      <p className="text-slate-500 mb-6">Discover, join, and connect at local events.</p>

      {featured.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            ⭐ Featured
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {featured.map((e) => <EventCard key={e.id} event={e} compact />)}
          </div>
        </div>
      )}

      {trending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            🔥 Trending
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {trending.map((e) => <EventCard key={e.id} event={e} compact />)}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        All events
      </h2>

      <div className="mb-6 flex gap-3">
        <select
          className="border rounded-md p-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="date"
          className="border rounded-md p-2 text-sm text-slate-600"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {date && (
          <button
            onClick={() => setDate('')}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            Clear date
          </button>
        )}
      </div>

      {status === 'loading' && <p className="text-slate-400">Loading events…</p>}
      {status === 'error' && (
        <p className="text-red-500">
          Couldn't reach the backend. Is it running and is <code>VITE_API_URL</code> set correctly?
        </p>
      )}
      {status === 'ok' && events.length === 0 && (
        <p className="text-slate-400">
          No events {category ? `in "${category}" ` : ''}yet — run <code>npm run seed</code> in the backend to add some.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </div>
  );
}
