import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import {
  Calendar, MessageSquare, Send, Sparkles, Activity, X, LogOut,
  Search, Stethoscope, Pill, AlertCircle, ChevronDown, ChevronUp,
  Clock, Trash2, Edit3, Check, FileText, BarChart2, RefreshCw, Bot
} from 'lucide-react';
import AmbientListener from '../components/AmbientListener';
import { useNavigate } from 'react-router-dom';

/* ── tiny toast ── */
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border ${
      type === 'error' ? 'bg-red-900/90 border-red-700 text-red-100' : 'bg-emerald-900/90 border-emerald-700 text-emerald-100'
    }`}>{msg}</div>
  );
};

/* ── inline edit form for a single visit ── */
const EditVisitForm = ({ visit, onSave, onCancel }) => {
  const [form, setForm] = useState({
    diagnosis:   visit.structuredData?.Diagnosis  || '',
    medications: (visit.structuredData?.Medications || []).join(', '),
    symptoms:    (visit.structuredData?.Symptoms   || []).join(', '),
    duration:    visit.structuredData?.Duration    || '',
    doctorNotes: visit.doctorNotes || '',
  });

  return (
    <div className="border-t border-slate-700 bg-slate-950/70 p-5 space-y-3">
      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Edit Visit</p>
      {[
        { label: 'Diagnosis',    key: 'diagnosis' },
        { label: 'Medications (comma-separated)', key: 'medications' },
        { label: 'Symptoms (comma-separated)',    key: 'symptoms' },
        { label: 'Duration',     key: 'duration' },
      ].map(({ label, key }) => (
        <div key={key}>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</label>
          <input
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      ))}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-widest">Doctor Notes</label>
        <textarea
          rows={3}
          value={form.doctorNotes}
          onChange={e => setForm(f => ({ ...f, doctorNotes: e.target.value }))}
          className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-all">
          <Check size={14} /> Save
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
};

/* ── health summary modal ── */
const SummaryModal = ({ patientName, summary, loading, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
      <div className="flex justify-between items-center p-5 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2"><BarChart2 size={16} className="text-blue-400"/> AI Health Summary</h3>
          <p className="text-xs text-slate-500 mt-0.5">{patientName}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 transition-all"><X size={17}/></button>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-400 text-sm py-4">
            <RefreshCw size={16} className="animate-spin" /> Generating summary…
          </div>
        ) : (
          <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
        )}
      </div>
    </div>
  </div>
);

/* ════════════════════════════════ MAIN ════════════════════════════════ */
const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedVisits, setExpandedVisits] = useState({});
  const [editingVisit, setEditingVisit] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [toast, setToast] = useState(null);
  // General AI assistant (sidebar, no patient context needed)
  const [auraOpen, setAuraOpen] = useState(false);
  const [auraInput, setAuraInput] = useState('');
  const [auraMessages, setAuraMessages] = useState([]);
  const [auraTyping, setAuraTyping] = useState(false);
  const chatEndRef = useRef(null);
  const auraEndRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  useEffect(() => {
    API.get('/doctor/patients')
      .then(res => { setPatients(res.data); setFilteredPatients(res.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredPatients(patients.filter(p =>
      p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    ));
  }, [searchQuery, patients]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isTyping]);
  useEffect(() => { auraEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [auraMessages, auraTyping]);

  const handleAuraChat = async (e) => {
    e.preventDefault();
    if (!auraInput.trim()) return;
    const msg = auraInput.trim();
    setAuraInput('');
    setAuraMessages(prev => [...prev, { role: 'user', text: msg }]);
    setAuraTyping(true);
    try {
      const { data } = await API.post('/chat', { message: msg });
      setAuraMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
    } catch {
      setAuraMessages(prev => [...prev, { role: 'ai', text: 'AI unavailable. Please try again.' }]);
    } finally {
      setAuraTyping(false);
    }
  };

  const selectPatient = (p) => {
    setSelectedPatient(p);
    setChatMessages([]);
    setExpandedVisits({});
    setEditingVisit(null);
    setSummary('');
    API.get(`/history/${p._id}`).then(res => setHistory(res.data)).catch(() => {});
  };

  const handleNewRecording = (data) => {
    setHistory(prev => [data, ...prev]);
    showToast('Visit recorded and saved.');
  };

  const handleSaveEdit = async (visitId, form) => {
    try {
      const payload = {
        diagnosis:   form.diagnosis,
        medications: form.medications.split(',').map(s => s.trim()).filter(Boolean),
        symptoms:    form.symptoms.split(',').map(s => s.trim()).filter(Boolean),
        duration:    form.duration,
        doctorNotes: form.doctorNotes,
      };
      const { data } = await API.put(`/visit/${visitId}`, payload);
      setHistory(prev => prev.map(v => v._id === visitId ? data : v));
      setEditingVisit(null);
      showToast('Visit updated.');
    } catch {
      showToast('Failed to save changes.', 'error');
    }
  };

  const handleDeleteVisit = async (visitId) => {
    if (!window.confirm('Delete this visit? This cannot be undone.')) return;
    try {
      await API.delete(`/visit/${visitId}`);
      setHistory(prev => prev.filter(v => v._id !== visitId));
      showToast('Visit deleted.');
    } catch {
      showToast('Failed to delete visit.', 'error');
    }
  };

  const handleHealthSummary = async () => {
    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummary('');
    try {
      const { data } = await API.get(`/summary/${selectedPatient._id}`);
      setSummary(data.summary);
    } catch {
      setSummary('Could not generate summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const userMsg = query.trim();
    setQuery('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    try {
      const { data } = await API.post('/ask', { query: userMsg, patientId: selectedPatient._id });
      setChatMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'AI error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleTranscript = (id) => setExpandedVisits(prev => ({ ...prev, [id]: !prev[id] }));
  const logout = () => { localStorage.removeItem('userInfo'); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {summaryOpen && (
        <SummaryModal
          patientName={selectedPatient?.name}
          summary={summary}
          loading={summaryLoading}
          onClose={() => setSummaryOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div className="w-72 shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-black text-blue-500 tracking-tighter">AURA</span>
            <button onClick={logout} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all" title="Logout">
              <LogOut size={17} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">Physician</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-800">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
            <input type="text" placeholder="Search patients…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patients</p>
            <span className="text-[10px] bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full font-bold">{filteredPatients.length}</span>
          </div>
          {filteredPatients.length === 0
            ? <p className="text-sm text-slate-600 italic text-center py-10">No patients found.</p>
            : filteredPatients.map(p => (
              <div key={p._id} onClick={() => selectPatient(p)}
                className={`p-3 mb-1.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPatient?._id === p._id
                    ? 'bg-blue-600/20 border-blue-600/50'
                    : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-600'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {p.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 truncate">{p.email}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* ── AURA General AI button ── */}
        <div className="p-3 border-t border-slate-800">
          <button onClick={() => setAuraOpen(o => !o)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              auraOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-blue-400 hover:bg-slate-800'
            }`}>
            <Bot size={16}/> AURA Medical AI
            {auraMessages.length > 0 && !auraOpen && (
              <span className="ml-auto w-2 h-2 rounded-full bg-blue-400"/>
            )}
          </button>
        </div>
      </div>

      {/* ── AURA General Chat Panel ── */}
      {auraOpen && (
        <div className="w-80 shrink-0 border-r border-slate-800 bg-slate-900/60 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2"><Bot size={15} className="text-blue-400"/> AURA AI</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">General medical assistant</p>
            </div>
            <button onClick={() => setAuraOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all"><X size={15}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {auraMessages.length === 0 && (
              <div className="text-center mt-8 px-3">
                <Sparkles size={28} className="mx-auto text-slate-700 mb-2"/>
                <p className="text-slate-500 text-xs leading-relaxed">Ask about drug interactions, clinical guidelines, differential diagnoses, or any medical question.</p>
              </div>
            )}
            {auraMessages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 border border-blue-600/30 text-blue-100 ml-4'
                  : 'bg-slate-800 border border-slate-700 text-slate-200 mr-4'
              }`}>{msg.text}</div>
            ))}
            {auraTyping && (
              <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl mr-4 flex gap-1 items-center">
                {[0,150,300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }}/>
                ))}
              </div>
            )}
            <div ref={auraEndRef}/>
          </div>

          <form onSubmit={handleAuraChat} className="p-3 border-t border-slate-800 shrink-0">
            <div className="relative">
              <input value={auraInput} onChange={e => setAuraInput(e.target.value)}
                placeholder="Ask any medical question…"
                className="w-full bg-slate-950 border border-slate-800 py-2.5 pl-3 pr-10 rounded-xl text-white text-xs outline-none focus:border-blue-500 transition-colors placeholder-slate-600"
              />
              <button type="submit" disabled={auraTyping || !auraInput.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg text-white transition-all">
                <Send size={13}/>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {selectedPatient ? (
          <>
            {/* Patient header */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-800 bg-slate-900/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-lg font-bold text-blue-400">
                    {selectedPatient.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">{selectedPatient.name}</h1>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span>{selectedPatient.email}</span>
                      <span className="text-slate-700">·</span>
                      <span className="flex items-center gap-1"><Activity size={11}/> {history.length} visit{history.length !== 1 ? 's' : ''}</span>
                      {history[0] && <>
                        <span className="text-slate-700">·</span>
                        <span className="flex items-center gap-1"><Clock size={11}/> Last: {new Date(history[0].date).toLocaleDateString()}</span>
                      </>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleHealthSummary}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-all">
                    <BarChart2 size={14}/> Summary
                  </button>
                  <button onClick={() => setChatOpen(o => !o)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      chatOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700'
                    }`}>
                    <Sparkles size={14}/> AI Chat
                  </button>
                  <AmbientListener selectedPatientId={selectedPatient._id} onProcessingComplete={handleNewRecording} />
                </div>
              </div>
            </div>

            {/* Visit list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {history.length === 0
                ? <div className="flex flex-col items-center justify-center h-full opacity-20 select-none">
                    <Stethoscope size={64}/><p className="mt-4 text-lg font-medium">No visits recorded yet</p>
                  </div>
                : history.map(visit => (
                  <div key={visit._id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all">
                    <div className="p-5">
                      {/* header row */}
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-blue-400 font-medium text-sm flex items-center gap-1.5">
                          <Calendar size={13}/>
                          {new Date(visit.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2">
                          {visit.structuredData?.Medications?.length > 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-900/30 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800">Rx Issued</span>
                          )}
                          <button onClick={() => setEditingVisit(editingVisit === visit._id ? null : visit._id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 transition-all" title="Edit visit">
                            <Edit3 size={14}/>
                          </button>
                          <button onClick={() => handleDeleteVisit(visit._id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all" title="Delete visit">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>

                      {/* data grid */}
                      <div className="grid grid-cols-3 gap-5 mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Diagnosis</p>
                          <p className="text-white font-semibold leading-snug">{visit.structuredData?.Diagnosis || '—'}</p>
                          {visit.structuredData?.Duration && (
                            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><Clock size={10}/> {visit.structuredData.Duration}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Symptoms</p>
                          <div className="flex flex-wrap gap-1">
                            {visit.structuredData?.Symptoms?.map((s, i) => (
                              <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">#{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Pill size={10}/> Medications</p>
                          <p className="text-emerald-400 text-sm">{visit.structuredData?.Medications?.join(', ') || 'None prescribed'}</p>
                        </div>
                      </div>

                      {/* doctor notes */}
                      {visit.doctorNotes && (
                        <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-3 mb-4">
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={10}/> Doctor Notes</p>
                          <p className="text-sm text-blue-100/80 leading-relaxed">{visit.doctorNotes}</p>
                        </div>
                      )}

                      {/* AI suggestions */}
                      {visit.doctorAssistFlags?.length > 0 && (
                        <div className="bg-amber-900/15 border border-amber-800/40 rounded-xl p-3 mb-4">
                          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1"><AlertCircle size={10}/> AI Suggestions</p>
                          <ul className="space-y-1">
                            {visit.doctorAssistFlags.map((flag, i) => (
                              <li key={i} className="text-xs text-amber-200/80 flex items-start gap-1.5">
                                <span className="text-amber-500 mt-0.5 shrink-0">•</span>{flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {visit.rawTranscript && (
                        <button onClick={() => toggleTranscript(visit._id)}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                          {expandedVisits[visit._id] ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                          {expandedVisits[visit._id] ? 'Hide' : 'Show'} transcript
                        </button>
                      )}
                    </div>

                    {expandedVisits[visit._id] && visit.rawTranscript && (
                      <div className="border-t border-slate-800 bg-slate-950/60 px-5 py-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Raw Transcript</p>
                        <p className="text-sm text-slate-400 leading-relaxed">{visit.rawTranscript}</p>
                      </div>
                    )}

                    {editingVisit === visit._id && (
                      <EditVisitForm
                        visit={visit}
                        onSave={(form) => handleSaveEdit(visit._id, form)}
                        onCancel={() => setEditingVisit(null)}
                      />
                    )}
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
            <Activity size={72}/><p className="mt-4 text-lg font-medium">Select a patient to view records</p>
          </div>
        )}

        {/* ── AI Chat drawer ── */}
        {chatOpen && selectedPatient && (
          <div className="absolute top-0 right-0 w-96 h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-20">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold flex items-center gap-2 text-blue-400"><Sparkles size={15}/> AI Assistant</h3>
                <p className="text-xs text-slate-500 mt-0.5">Context: {selectedPatient.name} · {history.length} visits</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all"><X size={17}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center mt-10 px-4">
                  <MessageSquare size={32} className="mx-auto text-slate-700 mb-3"/>
                  <p className="text-slate-500 text-sm">Ask about symptoms, medications, visit history…</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600/20 border border-blue-600/30 text-blue-100 ml-6'
                    : 'bg-slate-800 border border-slate-700 text-slate-200 mr-6'
                }`}>{msg.text}</div>
              ))}
              {isTyping && (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl mr-6 flex gap-1 items-center">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }}/>
                  ))}
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            <form onSubmit={handleChat} className="p-4 border-t border-slate-800 shrink-0">
              <div className="relative">
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask about this patient…"
                  className="w-full bg-slate-950 border border-slate-800 py-3 pl-4 pr-12 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors placeholder-slate-600"
                />
                <button type="submit" disabled={isTyping || !query.trim()}
                  className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg text-white transition-all">
                  <Send size={16}/>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
