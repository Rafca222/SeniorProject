import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, getMessages } from '../services/events-service';
import { getMyProfile } from '../services/users-service';
import { blockUser, reportUser, getMyBlockedIds } from '../services/safety-service';
import { createSocket } from '../lib/socket';
import { ArrowLeftIcon, SendIcon } from '../components/icons.jsx';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function initials(name) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

export default function Chat() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [myId, setMyId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [openMenuFor, setOpenMenuFor] = useState(null); // which message's block/report menu is open
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    Promise.all([getEvent(id), getMessages(id), getMyProfile(), getMyBlockedIds()])
      .then(([eventData, historyData, meData, blockedData]) => {
        setEvent(eventData);
        setMessages(historyData);
        setMyId(meData.id);
        setBlockedIds(blockedData);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));

    // Fresh connection every time this screen opens, authenticated with
    // whoever is logged in RIGHT NOW -- see lib/socket.js for why this
    // can't be a shared, long-lived connection.
    const socket = createSocket();
    socketRef.current = socket;
    socket.emit('join_event_room', id);

    function handleNewMessage(message) {
      if (message.eventId === id) {
        setMessages((prev) => [...prev, message]);
      }
    }
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !socketRef.current) return;
    socketRef.current.emit('new_message', { eventId: id, body });
    setDraft('');
  }

  async function handleBlock(userId) {
    await blockUser(userId);
    setBlockedIds((prev) => [...prev, userId]); // hides their messages immediately, no reload needed
    setOpenMenuFor(null);
  }

  async function handleReport(userId) {
    const reason = window.prompt('Briefly describe why you\'re reporting this person:');
    if (!reason) return;
    await reportUser(userId, reason, id);
    setOpenMenuFor(null);
    alert('Report submitted. Thanks for flagging this.');
  }

  if (status === 'loading') return <p className="p-10 text-center text-ink-400">Loading chat…</p>;
  if (status === 'error') {
    return (
      <p className="p-10 text-center text-clay-600 max-w-sm mx-auto">
        Couldn't load this chat. Make sure you're logged in and have RSVP'd to this event.
      </p>
    );
  }

  const visibleMessages = messages.filter((m) => !blockedIds.includes(m.userId));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b border-ink-100 py-4">
        <Link to={`/events/${id}`} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 mb-1">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> {event?.title}
        </Link>
        <h1 className="font-display font-semibold text-lg text-ink-900">Event chat</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-4">
        {visibleMessages.length === 0 && (
          <p className="text-sm text-ink-400 text-center mt-6">No messages yet — say hi to the group.</p>
        )}
        {visibleMessages.map((m) => {
          const mine = m.userId === myId;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'} group`}>
              {!mine && (
                <span className="w-7 h-7 rounded-full bg-ink-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mb-0.5">
                  {initials(m.userName)}
                </span>
              )}
              {!mine && (
                <div className="relative self-end">
                  <button
                    onClick={() => setOpenMenuFor(openMenuFor === m.id ? null : m.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-ink-500 text-xs px-1"
                  >
                    ⋯
                  </button>
                  {openMenuFor === m.id && (
                    <div className="absolute left-0 bottom-6 bg-white border border-ink-100 rounded-xl shadow-md text-xs whitespace-nowrap z-10 overflow-hidden">
                      <button
                        onClick={() => handleReport(m.userId)}
                        className="block w-full text-left px-3.5 py-2 hover:bg-ink-50 text-ink-700"
                      >
                        Report
                      </button>
                      <button
                        onClick={() => handleBlock(m.userId)}
                        className="block w-full text-left px-3.5 py-2 hover:bg-clay-50 text-clay-700"
                      >
                        Block
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                  mine
                    ? 'bg-clay-500 text-white rounded-br-md'
                    : 'bg-ink-50 text-ink-800 rounded-bl-md'
                }`}
              >
                {!mine && (
                  <p className="text-xs font-bold text-ink-500 mb-0.5">{m.userName}</p>
                )}
                <p className="text-sm">{m.body}</p>
                <p className={`text-[11px] mt-1 ${mine ? 'text-white/70' : 'text-ink-400'}`}>
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 py-4 border-t border-ink-100">
        <input
          className="input-field !rounded-full"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn-primary !px-4 shrink-0" aria-label="Send">
          <SendIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
