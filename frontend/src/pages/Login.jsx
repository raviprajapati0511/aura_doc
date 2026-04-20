import React, { useState } from 'react';
import API from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate(data.role === 'doctor' ? '/doctor-dashboard' : '/patient-portal');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/50">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">AURA</h1>
          <p className="text-slate-500 mt-1 text-sm">Automated Unified Medical Record Assistant</p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="relative mb-4">
            <Mail size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="email" placeholder="Email address" required
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative mb-6">
            <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="password" placeholder="Password" required
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading
              ? <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" /> Signing in...</>
              : <><LogIn size={18} /> Enter System</>}
          </button>
          <p className="text-center mt-5 text-slate-500 text-sm">
            No account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
