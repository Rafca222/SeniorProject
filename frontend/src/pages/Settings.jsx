import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile, becomeOrganizer } from '../services/users-service';
import { UsersIcon, CheckIcon } from '../components/icons.jsx';

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

  if (status === 'loading') return <p className="p-10 text-center text-ink-400">Loading…</p>;
  if (status === 'error') return <p className="p-10 text-center text-clay-600">Log in to view settings.</p>;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-semibold text-3xl text-ink-900 mb-6">Settings</h1>

      <div className="panel p-5 flex items-center justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <UsersIcon className="w-5 h-5 text-clay-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-ink-900">Show me on event rosters</p>
            <p className="text-sm text-ink-500 mt-1">
              When on, your name is visible to other attendees who RSVP "Going" to the same event.
              When off, you still attend and can chat, but your name is hidden from the public roster.
            </p>
          </div>
        </div>
        <button
          onClick={toggleRosterVisible}
          disabled={saving}
          className={`ml-2 flex-shrink-0 w-12 h-7 rounded-full transition-colors relative ${
            profile.rosterVisible ? 'bg-clay-500' : 'bg-ink-200'
          }`}
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              profile.rosterVisible ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="panel p-5">
        <p className="font-semibold text-ink-900 mb-1">Organizer account</p>
        {profile.role === 'user' ? (
          <>
            <p className="text-sm text-ink-500 mb-3">
              Upgrade to an organizer account to create and manage your own events.
            </p>
            <button onClick={handleBecomeOrganizer} disabled={upgrading} className="btn-primary">
              {upgrading ? 'Upgrading…' : 'Become an organizer'}
            </button>
          </>
        ) : (
          <p className="text-sm text-ink-600 flex items-center gap-1.5">
            <CheckIcon className="w-4 h-4 text-olive-600" />
            You're currently an <span className="font-semibold text-ink-900">{profile.role}</span> — you can create events.
          </p>
        )}
      </div>
    </div>
  );
}
