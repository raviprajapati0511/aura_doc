import React, { useState } from 'react';
import { Search, Send, Sparkles, Loader2, X } from 'lucide-react';

const CommandBar = ({ patientId }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    setAnswer(null);

    try {
      const res = await fetch('http://localhost:8080/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, patientId })
      });
      
      const data = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      setAnswer("Connection error. Could not reach the AI database.");
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 flex flex-col items-center">
      
      {/* AI Response Popup */}
      {answer && (
        <div className="mb-4 bg-blue-900/90 border border-blue-500/50 backdrop-blur-md text-blue-50 p-4 rounded-xl shadow-2xl relative w-full flex items-start gap-3 animate-fade-in-up">
          <Sparkles className="text-blue-400 shrink-0 mt-1" size={20} />
          <p className="text-sm leading-relaxed flex-1">{answer}</p>
          <button onClick={() => setAnswer(null)} className="text-blue-300 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-slate-900 border border-slate-700 rounded-full shadow-2xl p-2 flex items-center gap-2 backdrop-blur-md bg-opacity-90 w-full">
        <Search className="text-slate-400 ml-3" size={20} />
        <form onSubmit={handleSubmit} className="flex-1 flex items-center">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Ask AI about past visits (e.g., 'What medications were prescribed last time?')" 
            className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none px-2 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white p-3 rounded-full transition-colors flex items-center justify-center"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommandBar;