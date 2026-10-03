import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth-service';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(form);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-7">
        <span className="font-display italic font-semibold text-3xl text-clay-600">Eventure</span>
        <p className="text-sm text-ink-500 mt-2">Log in to RSVP, chat, and get recommendations.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-6 space-y-3">
        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {error && <p className="text-clay-600 text-sm">{error}</p>}
        <button disabled={submitting} className="btn-primary w-full !py-2.5">
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500 mt-4">
        New to Eventure?{' '}
        <Link to="/register" className="font-semibold text-clay-600 hover:text-clay-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}
