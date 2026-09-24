import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, getMessages } from '../services/events-service';
import { getMyProfile } from '../services/users-service';
import { blockUser, reportUser, getMyBlockedIds } from '../services/safety-service';
import { createSocket } from '../lib/socket';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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

  if (status === 'loading') return <p className="p-6 text-slate-400">Loading chat…</p>;
  if (status === 'error') {
    return (
      <p className="p-6 text-red-500">
        Couldn't load this chat. Make sure you're logged in and have RSVP'd to this event.
      </p>
    );
  }

  const visibleMessages = messages.filter((m) => !blockedIds.includes(m.userId));

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-[calc(100vh-4rem)]">
      <Link to={`/events/${id}`} className="text-sm text-slate-500 hover:underline mb-1">
        &larr; {event?.title}
      </Link>
      <h1 className="text-lg font-bold text-slate-800 mb-4">Event chat</h1>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {visibleMessages.length === 0 && (
          <p className="text-sm text-slate-400">No messages yet — say hi to the group.</p>
        )}
        {visibleMessages.map((m) => {
          const mine = m.userId === myId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
              {!mine && (
                <div className="relative mr-1 self-end">
                  <button
                    onClick={() => setOpenMenuFor(openMenuFor === m.id ? null : m.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 text-xs px-1"
                  >
                    ⋯
                  </button>
                  {openMenuFor === m.id && (
                    <div className="absolute left-0 bottom-6 bg-white border border-slate-200 rounded-md shadow-md text-xs whitespace-nowrap z-10">
                      <button
                        onClick={() => handleReport(m.userId)}
                        className="block w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        Report
                      </button>
                      <button
                        onClick={() => handleBlock(m.userId)}
                        className="block w-full text-left px-3 py-2 hover:bg-slate-50 text-red-600"
                      >
                        Block
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  mine ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {!mine && (
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">{m.userName}</p>
                )}
                <p className="text-sm">{m.body}</p>
                <p className={`text-[11px] mt-1 ${mine ? 'text-slate-300' : 'text-slate-400'}`}>
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
        <input
          className="flex-1 border rounded-md p-2 text-sm"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium">
          Send
        </button>
      </form>
    </div>
  );
}
