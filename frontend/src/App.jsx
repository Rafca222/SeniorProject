import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
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
    <div className="min-h-screen" style={{ backgroundColor: '#F6EEE0' }}>
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
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
