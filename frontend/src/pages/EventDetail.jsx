import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getEvent, getMyAttendance, getMySaved, getRoster,
  joinEvent, leaveEvent, saveEvent, unsaveEvent, deleteEvent,
} from '../services/events-service';
import { getMyProfile } from '../services/users-service';
import { CATEGORY_META, DEFAULT_CATEGORY_META } from '../constants/categories';
import { ArrowLeftIcon, CalendarIcon, PinIcon, UsersIcon, ChatIcon, CheckIcon, StarIcon, TrashIcon } from '../components/icons.jsx';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function initials(name) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [going, setGoing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [roster, setRoster] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [actionError, setActionError] = useState('');
  const [myId, setMyId] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      getMyProfile().then((me) => setMyId(me.id)).catch(() => {});
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

  async function handleDelete() {
    const sure = window.confirm(
      `Delete "${event.title}"? This removes it for everyone, along with its RSVPs, saves, and chat. This can't be undone.`
    );
    if (!sure) return;
    setDeleting(true);
    setActionError('');
    try {
      await deleteEvent(id);
      navigate('/');
    } catch {
      setActionError("Couldn't delete this event — try again.");
      setDeleting(false);
    }
  }

  if (status === 'loading') {
    return <p className="p-10 text-center text-ink-400">Loading…</p>;
  }
  if (status === 'error' || !event) {
    return <p className="p-10 text-center text-clay-600">Couldn't load this event.</p>;
  }

  const meta = CATEGORY_META[event.category] || DEFAULT_CATEGORY_META;
  const isOwner = isLoggedIn && myId && event.created_by === myId;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 mb-5">
        <ArrowLeftIcon className="w-4 h-4" /> Back to directory
      </Link>

      {/* The same arch "window" used for cards, sized narrower here so the
          dome stays a clean semicircle rather than a flattened wide band. */}
      <div className="relative h-56 overflow-hidden arch mb-6">
        {event.cover_image_url ? (
          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-6xl tile-pattern ${meta.gradient}`}>
            {meta.icon}
          </div>
        )}
      </div>

      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${meta.badge}`}>
        {meta.icon} {event.category}
      </span>

      <h1 className="font-display font-semibold text-3xl text-ink-900 mt-3 leading-tight">
        {event.title}
      </h1>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-600 mt-3">
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-clay-500" /> {formatDate(event.start_datetime)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <PinIcon className="w-4 h-4 text-clay-500" /> {event.venue_name}
        </span>
      </div>
      {event.venue_description && (
        <p className="text-sm text-ink-500 mt-1.5">{event.venue_description}</p>
      )}
      {event.minimum_age && (
        <p className="text-sm text-ink-500 mt-1.5">Minimum age: {event.minimum_age}+</p>
      )}

      <p className="text-ink-700 leading-relaxed mt-5">{event.description}</p>

      <div className="flex flex-wrap gap-2.5 mt-6">
        <button
          onClick={toggleGoing}
          className={going ? 'btn-secondary bg-olive-600 hover:bg-olive-700' : 'btn-primary'}
        >
          {going && <CheckIcon className="w-4 h-4" />}
          I'm Going
        </button>
        <button
          onClick={toggleSaved}
          className={saved ? 'btn-outline !border-clay-300 !text-clay-600' : 'btn-outline'}
        >
          <StarIcon filled={saved} className="w-4 h-4" />
          {saved ? 'Saved' : 'Save for later'}
        </button>
        {going && (
          <Link to={`/events/${id}/chat`} className="btn-outline">
            <ChatIcon className="w-4 h-4" /> Open chat
          </Link>
        )}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-outline !border-clay-300 !text-clay-600 ml-auto disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4" />
            {deleting ? 'Deleting…' : 'Delete event'}
          </button>
        )}
      </div>

      {actionError && <p className="text-sm text-clay-600 mt-3">{actionError}</p>}

      <div className="panel p-5 mt-8">
        <h2 className="font-display text-lg font-semibold text-ink-900 mb-3 flex items-center gap-1.5">
          <UsersIcon className="w-4 h-4 text-ink-400" />
          Who's going {roster.length > 0 && `(${roster.length})`}
        </h2>
        {roster.length === 0 ? (
          <p className="text-sm text-ink-400">
            No one visible on the roster yet — be the first to hit "I'm Going."
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2.5">
            {roster.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-sand border border-ink-100 text-sm text-ink-700"
              >
                <span className="w-6 h-6 rounded-full bg-clay-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {initials(person.name)}
                </span>
                {person.name}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink-400 mt-3">
          Only shows attendees who have kept their roster visibility on.
        </p>
      </div>
    </div>
  );
}