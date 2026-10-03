import { Link } from 'react-router-dom';
import { CATEGORY_META, DEFAULT_CATEGORY_META } from '../constants/categories.js';
import { CalendarIcon, PinIcon } from './icons.jsx';

function formatCardDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function EventCard({ event, compact }) {
  const meta = CATEGORY_META[event.category] || DEFAULT_CATEGORY_META;

  return (
    <Link
      to={`/events/${event.id}`}
      className={`group block ${compact ? 'min-w-[240px] max-w-[240px] flex-shrink-0' : ''}`}
    >
      <div className="relative h-36 overflow-hidden arch">
        {event.cover_image_url ? (
          <>
            <img
              src={event.cover_image_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm ${meta.badge}`}>
              {meta.icon}
            </span>
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-4xl tile-pattern ${meta.gradient}`}>
            {meta.icon}
          </div>
        )}
      </div>
      <div className="pt-3">
        <h3 className="font-display font-semibold text-ink-900 leading-snug line-clamp-1">
          {event.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-ink-500 mt-1.5">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5 text-ink-400" />
            {formatCardDate(event.start_datetime)}
          </span>
          <span className="inline-flex items-center gap-1">
            <PinIcon className="w-3.5 h-3.5 text-ink-400" />
            {event.city}
          </span>
        </div>
        {!compact && (
          <p className="text-sm text-ink-600 mt-2 line-clamp-2">{event.description}</p>
        )}
      </div>
    </Link>
  );
}
