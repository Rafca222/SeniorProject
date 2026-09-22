import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/auth-service';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await register(form);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-slate-800">Create your account</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border rounded-md p-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="w-full border rounded-md p-2"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="w-full border rounded-md p-2"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="w-full bg-slate-800 text-white rounded-md p-2 font-medium">
          Sign up
        </button>
      </form>
    </div>
  );
}
