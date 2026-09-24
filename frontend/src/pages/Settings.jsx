import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile, becomeOrganizer } from '../services/users-service';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

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

  async function handleBecomeOrganizer() {
    setUpgrading(true);
    try {
      const data = await becomeOrganizer();
      // The role is baked into the access token, so this endpoint returns
      // fresh tokens along with the updated profile -- storing them here
      // is what makes the new "organizer" permissions take effect
      // immediately, without needing to log out and back in.
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setProfile(data.user);
    } finally {
      setUpgrading(false);
    }
  }

  if (status === 'loading') return <p className="p-6 text-slate-400">Loading…</p>;
  if (status === 'error') return <p className="p-6 text-red-500">Log in to view settings.</p>;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>

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

      <div className="border rounded-lg p-4">
        <p className="font-medium text-slate-800">Organizer account</p>
        {profile.role === 'user' ? (
          <>
            <p className="text-sm text-slate-500 mt-1 mb-3">
              Upgrade to an organizer account to create and manage your own events.
            </p>
            <button
              onClick={handleBecomeOrganizer}
              disabled={upgrading}
              className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {upgrading ? 'Upgrading…' : 'Become an organizer'}
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-500 mt-1">
            You're currently an <span className="font-medium">{profile.role}</span> — you can create events.
          </p>
        )}
      </div>
    </div>
  );
}
