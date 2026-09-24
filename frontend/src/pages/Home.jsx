import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvents, listTrending, listFeatured, getRecommendations } from '../services/events-service';
import { parseSearch } from '../services/ai-service';
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

  // AI-search-derived filters -- separate from the manual controls above
  // so using one clearly doesn't silently fight with the other.
  const [aiCity, setAiCity] = useState('');
  const [aiDateFrom, setAiDateFrom] = useState('');
  const [aiDateTo, setAiDateTo] = useState('');
  const [aiSearchActive, setAiSearchActive] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [recommended, setRecommended] = useState([]);

  const isLoggedIn = !!localStorage.getItem('accessToken');

  useEffect(() => {
    listTrending().then(setTrending).catch(() => {});
    listFeatured().then(setFeatured).catch(() => {});
    if (isLoggedIn) {
      getRecommendations().then(setRecommended).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStatus('loading');
    listEvents({ category, date, city: aiCity, date_from: aiDateFrom, date_to: aiDateTo })
      .then((data) => {
        setEvents(data);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [category, date, aiCity, aiDateFrom, aiDateTo]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchText.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const parsed = await parseSearch(searchText);
      // AI search replaces the active filter set -- manual date and AI
      // date range would otherwise silently AND together into something
      // confusing (e.g. an exact day that falls outside a "this weekend"
      // range would return nothing, with no visible reason why).
      setCategory(parsed.category || '');
      setAiCity(parsed.city || '');
      setAiDateFrom(parsed.date_from || '');
      setAiDateTo(parsed.date_to || '');
      setDate('');
      // A search happened, full stop -- true regardless of whether the AI
      // filled in a city/date, a category, or nothing at all recognizable.
      // The earlier version only checked city/date, so a category-only
      // search like "hikes" fell through and looked like no search had
      // run at all.
      setAiSearchActive(true);
    } catch (err) {
      setSearchError(err.response?.data?.error || 'AI search is unavailable right now.');
    } finally {
      setSearching(false);
    }
  }

  function clearAiFilters() {
    setAiCity('');
    setAiDateFrom('');
    setAiDateTo('');
    setSearchText('');
    setCategory(''); // was left untouched before -- the dropdown would
                      // silently keep showing the AI's category even
                      // after "clearing" the search
    setAiSearchActive(false);
  }

  const hasAiFilters = aiCity || aiDateFrom || aiDateTo;
  const isFiltered = category || date || aiSearchActive;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Eventure</h1>
      <p className="text-slate-500 mb-6">Discover, join, and connect at local events.</p>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          className="flex-1 border rounded-md p-2 text-sm"
          placeholder='Try "hikes near Byblos this weekend"'
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button
          disabled={searching || !searchText.trim()}
          className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {searching ? 'Searching…' : '✨ AI Search'}
        </button>
      </form>
      {searchError && <p className="text-sm text-red-500 mb-4">{searchError}</p>}
      {aiSearchActive && (
        <p className="text-sm text-slate-500 mb-4">
          Showing: {category || 'any category'}
          {aiCity && ` · ${aiCity}`}
          {aiDateFrom && ` · ${aiDateFrom}${aiDateTo && aiDateTo !== aiDateFrom ? ` to ${aiDateTo}` : ''}`}
          {' · '}
          <button onClick={clearAiFilters} className="underline text-slate-600">Clear search</button>
        </p>
      )}

      {!isFiltered && isLoggedIn && recommended.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            ✨ Recommended for you
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recommended.map((e) => <EventCard key={e.id} event={e} compact />)}
          </div>
        </div>
      )}

      {!isFiltered && featured.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            ⭐ Featured
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {featured.map((e) => <EventCard key={e.id} event={e} compact />)}
          </div>
        </div>
      )}

      {!isFiltered && trending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            🔥 Trending
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {trending.map((e) => <EventCard key={e.id} event={e} compact />)}
          </div>
        </div>
      )}

      {!aiSearchActive && (
        <>
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
              onChange={(e) => {
                setDate(e.target.value);
                setAiDateFrom('');
                setAiDateTo('');
              }}
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
        </>
      )}

      {status === 'loading' && <p className="text-slate-400">Loading events…</p>}
      {status === 'error' && (
        <p className="text-red-500">
          Couldn't reach the backend. Is it running and is <code>VITE_API_URL</code> set correctly?
        </p>
      )}
      {status === 'ok' && events.length === 0 && (
        <p className="text-slate-400">
          No events match{category ? ` "${category}"` : ''}{aiSearchActive ? ' that search' : ''} yet — run <code>npm run seed</code> in the backend to add some.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </div>
  );
}
