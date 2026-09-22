import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [going, setGoing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [actionError, setActionError] = useState('');

  const isLoggedIn = !!localStorage.getItem('accessToken');

  useEffect(() => {
    setStatus('loading');
    api.get(`/events/${id}`)
      .then((res) => {
        setEvent(res.data);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));

    if (isLoggedIn) {
      api.get(`/events/${id}/attendance/me`).then((res) => setGoing(res.data.status === 'going')).catch(() => {});
      api.get(`/events/${id}/save/me`).then((res) => setSaved(res.data.saved)).catch(() => {});
    }
  }, [id, isLoggedIn]);

  async function toggleGoing() {
    if (!isLoggedIn) return setActionError('Log in to RSVP to this event.');
    setActionError('');
    try {
      if (going) {
        await api.delete(`/events/${id}/attendance`);
      } else {
        await api.post(`/events/${id}/attendance`);
      }
      setGoing(!going);
    } catch {
      setActionError('Something went wrong — try again.');
    }
  }

  async function toggleSaved() {
    if (!isLoggedIn) return setActionError('Log in to save this event.');
    setActionError('');
    try {
      if (saved) {
        await api.delete(`/events/${id}/save`);
      } else {
        await api.post(`/events/${id}/save`);
      }
      setSaved(!saved);
    } catch {
      setActionError('Something went wrong — try again.');
    }
  }

  if (status === 'loading') return <p className="p-6 text-slate-400">Loading…</p>;
  if (status === 'error' || !event) return <p className="p-6 text-red-500">Couldn't load this event.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/" className="text-sm text-slate-500 hover:underline">&larr; Back to directory</Link>

      <h1 className="text-2xl font-bold text-slate-800 mt-3">{event.title}</h1>
      <p className="text-sm text-slate-500 mb-4">{event.category} · {event.city}</p>

      <div className="space-y-2 text-sm text-slate-700 mb-6">
        <p><span className="font-medium">When:</span> {formatDate(event.start_datetime)}</p>
        <p><span className="font-medium">Where:</span> {event.venue_name}</p>
        {event.venue_description && <p className="text-slate-500">{event.venue_description}</p>}
        {event.minimum_age && <p><span className="font-medium">Minimum age:</span> {event.minimum_age}+</p>}
      </div>

      <p className="text-slate-700 mb-6">{event.description}</p>

      <div className="flex gap-3 mb-2">
        <button
          onClick={toggleGoing}
          className={`px-4 py-2 rounded-md font-medium text-sm ${
            going ? 'bg-green-600 text-white' : 'bg-slate-800 text-white'
          }`}
        >
          {going ? "✓ I'm Going" : "I'm Going"}
        </button>
        <button
          onClick={toggleSaved}
          className={`px-4 py-2 rounded-md font-medium text-sm border ${
            saved ? 'border-slate-800 text-slate-800' : 'border-slate-300 text-slate-500'
          }`}
        >
          {saved ? '★ Saved' : '☆ Save for later'}
        </button>
      </div>

      {actionError && <p className="text-sm text-red-500 mt-2">{actionError}</p>}

      {/* Roster and chat land here once those screens are built */}
    </div>
  );
}