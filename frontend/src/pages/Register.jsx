import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, User, Mail, Lock, UserCheck } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient', assignedDoctor: '' });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/doctors').then(res => setDoctors(res.data)).catch(() => {});
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password) {
      return setError('All fields are required.');
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', formData);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate(data.role === 'doctor' ? '/doctor-dashboard' : '/patient-portal');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
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
          <p className="text-slate-500 mt-1 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">{error}</div>
          )}

          <div className="relative mb-4">
            <User size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input type="text" placeholder="Full Name" required
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div className="relative mb-4">
            <Mail size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input type="email" placeholder="Email address" required
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>

          <div className="relative mb-4">
            <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input type="password" placeholder="Password" required
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>

          <select
            className="w-full py-3 px-4 mb-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value, assignedDoctor: '' })}>
            <option value="patient">I am a Patient</option>
            <option value="doctor">I am a Doctor</option>
          </select>

          {formData.role === 'patient' && (
            <div className="relative mb-4">
              <UserCheck size={15} className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" />
              <select
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                value={formData.assignedDoctor}
                onChange={(e) => setFormData({ ...formData, assignedDoctor: e.target.value })}>
                <option value="">Select your doctor (optional)</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>Dr. {d.name}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
            {loading
              ? <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" /> Creating account...</>
              : 'Create Account'}
          </button>

          <p className="text-center mt-5 text-slate-500 text-sm">
            Have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
