import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CATEGORIES } from '../constants/categories';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [category, setCategory] = useState('');

  useEffect(() => {
    setStatus('loading');
    const params = category ? { category } : {};
    api
      .get('/events', { params })
      .then((res) => {
        setEvents(res.data);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [category]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Eventure</h1>
      <p className="text-slate-500 mb-6">Discover, join, and connect at local events.</p>

      <div className="mb-6">
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
      </div>

      {status === 'loading' && <p className="text-slate-400">Loading events…</p>}
      {status === 'error' && (
        <p className="text-red-500">
          Couldn't reach the backend. Is it running and is <code>VITE_API_URL</code> set correctly?
        </p>
      )}
      {status === 'ok' && events.length === 0 && (
        <p className="text-slate-400">
          No events {category ? `in "${category}" ` : ''}yet — run <code>node scripts/seed.js</code> in the backend to add some.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow block"
          >
            <h2 className="font-semibold text-slate-800">{event.title}</h2>
            <p className="text-sm text-slate-500">{event.category} · {event.city}</p>
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{event.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}