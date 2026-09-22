import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Chat from './pages/Chat.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const isLoggedIn = !!localStorage.getItem('accessToken');

  return (
    <div>
      <nav className="border-b border-slate-200 p-4 flex gap-4 text-sm font-medium text-slate-600">
        <Link to="/">Directory</Link>
        {isLoggedIn ? (
          <Link to="/settings">Settings</Link>
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
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/chat" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
