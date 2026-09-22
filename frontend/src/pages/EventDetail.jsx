import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getEvent, getMyAttendance, getMySaved, getRoster,
  joinEvent, leaveEvent, saveEvent, unsaveEvent,
} from '../services/events-service';

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
  const [roster, setRoster] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [actionError, setActionError] = useState('');

  const isLoggedIn = !!localStorage.getItem('accessToken');

  function refreshRoster() {
    getRoster(id).then(setRoster).catch(() => {});
  }

  useEffect(() => {
    setStatus('loading');
    getEvent(id)
      .then((data) => {
        setEvent(data);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));

    refreshRoster();

    if (isLoggedIn) {
      getMyAttendance(id).then((data) => setGoing(data.status === 'going')).catch(() => {});
      getMySaved(id).then((data) => setSaved(data.saved)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isLoggedIn]);

  async function toggleGoing() {
    if (!isLoggedIn) return setActionError('Log in to RSVP to this event.');
    setActionError('');
    try {
      if (going) await leaveEvent(id); else await joinEvent(id);
      setGoing(!going);
      refreshRoster(); // roster membership just changed, so refetch it
    } catch {
      setActionError('Something went wrong — try again.');
    }
  }

  async function toggleSaved() {
    if (!isLoggedIn) return setActionError('Log in to save this event.');
    setActionError('');
    try {
      if (saved) await unsaveEvent(id); else await saveEvent(id);
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
        {going && (
          <Link
            to={`/events/${id}/chat`}
            className="px-4 py-2 rounded-md font-medium text-sm border border-slate-300 text-slate-700"
          >
            💬 Open chat
          </Link>
        )}
      </div>

      {actionError && <p className="text-sm text-red-500 mt-2">{actionError}</p>}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Who's going {roster.length > 0 && `(${roster.length})`}
        </h2>
        {roster.length === 0 ? (
          <p className="text-sm text-slate-400">
            No one visible on the roster yet — be the first to hit "I'm Going."
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {roster.map((person) => (
              <li
                key={person.id}
                className="px-3 py-1.5 rounded-full bg-slate-100 text-sm text-slate-700"
              >
                {person.name}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-400 mt-2">
          Only shows attendees who have kept their roster visibility on.
        </p>
      </div>
    </div>
  );
}
