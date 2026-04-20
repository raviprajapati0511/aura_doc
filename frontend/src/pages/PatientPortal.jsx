import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import AmbientListener from '../components/AmbientListener';
import { Pill, Clock, Activity, LogOut, Stethoscope, ChevronDown, ChevronUp, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PatientPortal = () => {
  const [history, setHistory]           = useState([]);
  const [stats, setStats]               = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [expandedVisits, setExpandedVisits] = useState({});
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const fetchHistory = () =>
    API.get(`/history/${user._id}`).then(res => setHistory(res.data)).catch(console.error);

  const fetchStats = () =>
    API.get(`/stats/${user._id}`).then(res => setStats(res.data)).catch(() => {});

  useEffect(() => { fetchHistory(); fetchStats(); }, []);

  const handleRecordingComplete = () => { fetchHistory(); fetchStats(); };

  const toggleTranscript = (id) =>
    setExpandedVisits(prev => ({ ...prev, [id]: !prev[id] }));

  const logout = () => { localStorage.removeItem('userInfo'); navigate('/login'); };

  const filtered = history.filter(v => {
    const q = searchQuery.toLowerCase();
    return !q
      || (v.structuredData?.Diagnosis || '').toLowerCase().includes(q)
      || (v.structuredData?.Symptoms || []).some(s => s.toLowerCase().includes(q))
      || (v.structuredData?.Medications || []).some(m => m.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow shadow-blue-900/50">
              <Activity size={18}/>
            </div>
            <div>
              <span className="text-xl font-black text-blue-500 tracking-tighter">AURA</span>
              <span className="text-slate-600 text-xs ml-2">Patient Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                  <p className="text-[10px] text-emerald-400 font-medium">Verified</p>
                </div>
              </div>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all" title="Logout">
              <LogOut size={17}/>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">

          {/* Recorder */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-base font-bold mb-1 text-white">Record Symptoms</h2>
            <p className="text-slate-500 text-xs mb-5 leading-relaxed">
              Describe how you're feeling in English, Hindi, or Marathi. AI will summarize it for your doctor.
            </p>
            <AmbientListener selectedPatientId={user._id} onProcessingComplete={handleRecordingComplete}/>
          </div>

          {/* Overview stats */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Overview</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Visits</span>
                <span className="font-bold text-white">{stats?.totalVisits ?? history.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Last Visit</span>
                <span className="font-bold text-white text-sm">
                  {stats?.lastVisit ? new Date(stats.lastVisit).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Active Meds</span>
                <span className="font-bold text-emerald-400">{history[0]?.structuredData?.Medications?.length ?? 0}</span>
              </div>
            </div>

            {/* Top symptoms */}
            {stats?.topSymptoms?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Frequent Symptoms</p>
                <div className="space-y-1.5">
                  {stats.topSymptoms.map(({ symptom, count }) => (
                    <div key={symptom} className="flex items-center justify-between">
                      <span className="text-xs text-slate-300 truncate">#{symptom}</span>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, (count / (stats.topSymptoms[0]?.count || 1)) * 100)}%` }}/>
                        </div>
                        <span className="text-[10px] text-slate-500 w-4 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent meds */}
            {stats?.recentMeds?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Pill size={10}/> Recent Medications
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.recentMeds.map((m, i) => (
                    <span key={i} className="text-xs bg-emerald-900/30 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800/50">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock size={17} className="text-blue-500"/> Medical History
            </h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={13} className="absolute left-3 top-2.5 text-slate-500"/>
            <input type="text" placeholder="Search by diagnosis, symptom, or medication…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600">
              <Stethoscope size={40} className="mx-auto mb-3 opacity-40"/>
              <p className="font-medium">{searchQuery ? 'No matching records' : 'No records yet'}</p>
              <p className="text-xs mt-1 text-slate-700">
                {searchQuery ? 'Try a different search term.' : 'Use the recorder on the left to start tracking.'}
              </p>
            </div>
          ) : filtered.map(v => (
            <div key={v._id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-4 hover:border-slate-700 transition-all">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 text-sm flex items-center gap-1.5">
                    <Clock size={12}/>
                    {new Date(v.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  {v.structuredData?.Medications?.length > 0 && (
                    <span className="bg-emerald-900/30 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-800 uppercase tracking-widest">
                      Prescription
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-5 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Diagnosis</p>
                    <p className="text-white font-semibold text-lg leading-snug">
                      {v.structuredData?.Diagnosis || 'Symptom Logging'}
                    </p>
                    {v.structuredData?.Duration && (
                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><Clock size={10}/> {v.structuredData.Duration}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {v.structuredData?.Symptoms?.map((s, i) => (
                        <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">#{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Pill size={10}/> Prescribed Meds
                    </p>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {v.structuredData?.Medications?.length > 0
                        ? v.structuredData.Medications.join(', ')
                        : 'Awaiting doctor review'}
                    </p>
                  </div>
                </div>

                {/* Doctor notes (read-only for patient) */}
                {v.doctorNotes && (
                  <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-3 mb-4">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <FileText size={10}/> Doctor's Notes
                    </p>
                    <p className="text-sm text-blue-100/80 leading-relaxed">{v.doctorNotes}</p>
                  </div>
                )}

                {v.rawTranscript && (
                  <button onClick={() => toggleTranscript(v._id)}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                    {expandedVisits[v._id] ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                    {expandedVisits[v._id] ? 'Hide' : 'View'} transcript
                  </button>
                )}
              </div>

              {expandedVisits[v._id] && v.rawTranscript && (
                <div className="border-t border-slate-800 bg-slate-950/60 px-5 py-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Your Recording — Transcript</p>
                  <p className="text-sm text-slate-400 leading-relaxed italic">"{v.rawTranscript}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;
