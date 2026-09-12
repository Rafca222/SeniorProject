import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error

  useEffect(() => {
    api
      .get('/events')
      .then((res) => {
        setEvents(res.data);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Eventure</h1>
      <p className="text-slate-500 mb-6">Discover, join, and connect at local events.</p>

      {status === 'loading' && <p className="text-slate-400">Loading events…</p>}
      {status === 'error' && (
        <p className="text-red-500">
          Couldn't reach the backend. Is it running and is <code>VITE_API_URL</code> set correctly?
        </p>
      )}
      {status === 'ok' && events.length === 0 && (
        <p className="text-slate-400">No events yet — seed some in the database to see them here.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border border-slate-200 p-4 shadow-sm">
            <h2 className="font-semibold text-slate-800">{event.title}</h2>
            <p className="text-sm text-slate-500">{event.category} · {event.city}</p>
            <p className="text-sm text-slate-600 mt-2">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
