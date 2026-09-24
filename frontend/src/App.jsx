import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Chat from './pages/Chat.jsx';
import Settings from './pages/Settings.jsx';
import CreateEvent from './pages/CreateEvent.jsx';

export default function App() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('accessToken');

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  }

  return (
    <div>
      <nav className="border-b border-slate-200 p-4 flex gap-4 text-sm font-medium text-slate-600">
        <Link to="/">Directory</Link>
        {isLoggedIn ? (
          <>
            <Link to="/events/new">Create event</Link>
            <Link to="/settings">Settings</Link>
            <button onClick={handleLogout} className="text-slate-600">Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events/new" element={<CreateEvent />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/chat" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
