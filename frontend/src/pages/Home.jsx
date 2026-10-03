import { useEffect, useState } from 'react';
import { listEvents, listTrending, listFeatured, getRecommendations } from '../services/events-service';
import { parseSearch } from '../services/ai-service';
import { CATEGORIES, CATEGORY_META } from '../constants/categories';
import EventCard from '../components/EventCard.jsx';

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
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  // Explicit flag for "an AI search is currently driving the results" --
  // NOT derived from aiCity/aiDateFrom/aiDateTo, because a category-only
  // search (e.g. "any music events") leaves all three of those empty,
  // which used to make the app think no search was active at all.
  const [aiSearchActive, setAiSearchActive] = useState(false);

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
      setAiSearchActive(true);
    } catch (err) {
      setSearchError(err.response?.data?.error || 'AI search is unavailable right now.');
    } finally {
      setSearching(false);
    }
  }

  function clearAiFilters() {
    setCategory('');
    setAiCity('');
    setAiDateFrom('');
    setAiDateTo('');
    setSearchText('');
    setAiSearchActive(false);
  }

  // True whenever the visible grid is a filtered subset rather than
  // "everything" -- drives hiding the Recommended/Featured/Trending rails
  // (showing curated picks next to a specific search is just noise) and
  // swaps the manual category/date controls out for the AI search summary.
  const isFiltered = Boolean(category || date || aiSearchActive);

  return (
    <div>
      {/* Hero -- a dusk-to-sunset gradient standing in for the Lebanese
          coast at golden hour, the one deliberately bold moment the rest
          of the page stays quiet around. */}
      <section className="sunset relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-20">
          <p className="text-citrus-200 text-sm font-semibold mb-3">
            Beirut, Byblos, Batroun, and everywhere between
          </p>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl text-white leading-[1.08] max-w-xl">
            Find what Lebanon is doing tonight
          </h1>
          <p className="text-white/80 mt-4 max-w-md text-base sm:text-lg">
            Hikes, dinners, concerts, and nights out — RSVP, see who's going, and show up.
          </p>

          <form onSubmit={handleSearch} className="mt-7 flex max-w-lg">
            <input
              className="flex-1 min-w-0 rounded-l-full px-5 py-3.5 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none"
              placeholder='Try "hikes near Byblos this weekend"'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button
              disabled={searching || !searchText.trim()}
              className="rounded-r-full bg-ink-900 text-white px-5 sm:px-6 font-semibold text-sm disabled:opacity-50 hover:bg-black transition-colors shrink-0"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>
          {searchError && (
            <p className="text-sm text-white bg-black/25 rounded-lg px-3 py-1.5 mt-3 inline-block">
              {searchError}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {aiSearchActive && (
          <div className="mb-8 flex flex-wrap items-center gap-2 text-sm bg-clay-50 border border-clay-100 text-clay-800 rounded-xl px-4 py-3">
            <span className="font-semibold">Showing:</span>
            <span>{category || 'any category'}</span>
            {aiCity && <span>{aiCity}</span>}
            {aiDateFrom && (
              <span>
                {aiDateFrom}{aiDateTo && aiDateTo !== aiDateFrom ? ` to ${aiDateTo}` : ''}
              </span>
            )}
            <button onClick={clearAiFilters} className="ml-auto underline font-semibold hover:text-clay-900">
              Clear search
            </button>
          </div>
        )}

        {!isFiltered && isLoggedIn && recommended.length > 0 && (
          <Rail title="Recommended for you" events={recommended} />
        )}
        {!isFiltered && featured.length > 0 && (
          <Rail title="Featured" events={featured} />
        )}
        {!isFiltered && trending.length > 0 && (
          <Rail title="Trending now" events={trending} />
        )}

        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            {isFiltered ? 'Matching events' : 'All events'}
          </h2>
          {status === 'ok' && (
            <span className="text-sm text-ink-400">
              {events.length} event{events.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {!aiSearchActive && (
          <div className="mb-7 flex flex-wrap items-center gap-2">
            <CategoryPill label="All" active={!category} onClick={() => setCategory('')} />
            {CATEGORIES.map((c) => (
              <CategoryPill
                key={c}
                label={c}
                icon={CATEGORY_META[c].icon}
                active={category === c}
                solidClass={CATEGORY_META[c].solid}
                onClick={() => setCategory(category === c ? '' : c)}
              />
            ))}
            <div className="ml-auto flex items-center gap-2">
              <input
                type="date"
                className="input-field !w-auto !py-2"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setAiDateFrom('');
                  setAiDateTo('');
                }}
              />
              {date && (
                <button onClick={() => setDate('')} className="text-sm text-ink-400 hover:text-ink-600">
                  Clear date
                </button>
              )}
            </div>
          </div>
        )}

        {status === 'loading' && <p className="text-ink-400 py-10 text-center">Loading events…</p>}
        {status === 'error' && (
          <p className="text-clay-600 py-10 text-center">
            Couldn't reach the backend. Is it running and is <code>VITE_API_URL</code> set correctly?
          </p>
        )}
        {status === 'ok' && events.length === 0 && (
          <div className="text-center py-14 panel">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-ink-500">
              No events match{category ? ` "${category}"` : ''}{isFiltered ? ' that search' : ''} yet.
            </p>
          </div>
        )}

        <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      </div>
    </div>
  );
}

function Rail({ title, events }) {
  return (
    <div className="mb-10">
      <h2 className="font-display text-2xl font-semibold text-ink-900 mb-4">{title}</h2>
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
        {events.map((e) => <EventCard key={e.id} event={e} compact />)}
      </div>
    </div>
  );
}

function CategoryPill({ label, icon, active, solidClass, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
        active
          ? `${solidClass || 'bg-ink-900 text-white'} border-transparent`
          : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
      }`}
    >
      {icon && <span>{icon}</span>} {label}
    </button>
  );
}
