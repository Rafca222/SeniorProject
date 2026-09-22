import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '../services/users-service';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, []);

  async function toggleRosterVisible() {
    setSaving(true);
    try {
      const updated = await updateMyProfile({ roster_visible: !profile.rosterVisible });
      setProfile(updated);
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading') return <p className="p-6 text-slate-400">Loading…</p>;
  if (status === 'error') return <p className="p-6 text-red-500">Log in to view settings.</p>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      <div className="flex items-center justify-between border rounded-lg p-4">
        <div>
          <p className="font-medium text-slate-800">Show me on event rosters</p>
          <p className="text-sm text-slate-500 mt-1">
            When on, your name is visible to other attendees who RSVP "Going" to the same event.
            When off, you still attend and can chat, but your name is hidden from the public roster.
          </p>
        </div>
        <button
          onClick={toggleRosterVisible}
          disabled={saving}
          className={`ml-4 flex-shrink-0 w-12 h-7 rounded-full transition-colors relative ${
            profile.rosterVisible ? 'bg-slate-800' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              profile.rosterVisible ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
