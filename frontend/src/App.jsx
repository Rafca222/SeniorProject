import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  return (
    <div>
      <nav className="border-b border-slate-200 p-4 flex gap-4 text-sm font-medium text-slate-600">
        <Link to="/">Directory</Link>
        <Link to="/login">Log in</Link>
        <Link to="/register">Sign up</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}
