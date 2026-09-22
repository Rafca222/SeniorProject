import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, getMessages } from '../services/events-service';
import { getMyProfile } from '../services/users-service';
import { getSocket } from '../lib/socket';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function Chat() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [myId, setMyId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([getEvent(id), getMessages(id), getMyProfile()])
      .then(([eventData, historyData, meData]) => {
        setEvent(eventData);
        setMessages(historyData);
        setMyId(meData.id);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));

    const socket = getSocket();
    socket.emit('join_event_room', id);

    function handleNewMessage(message) {
      if (message.eventId === id) {
        setMessages((prev) => [...prev, message]);
      }
    }
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    getSocket().emit('new_message', { eventId: id, body });
    setDraft('');
  }

  if (status === 'loading') return <p className="p-6 text-slate-400">Loading chat…</p>;
  if (status === 'error') {
    return (
      <p className="p-6 text-red-500">
        Couldn't load this chat. Make sure you're logged in and have RSVP'd to this event.
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-[calc(100vh-4rem)]">
      <Link to={`/events/${id}`} className="text-sm text-slate-500 hover:underline mb-1">
        &larr; {event?.title}
      </Link>
      <h1 className="text-lg font-bold text-slate-800 mb-4">Event chat</h1>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">No messages yet — say hi to the group.</p>
        )}
        {messages.map((m) => {
          const mine = m.userId === myId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  mine ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
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
