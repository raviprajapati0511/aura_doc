import React from 'react';
import { Activity, Clock, Stethoscope, Pill } from 'lucide-react';

const ExtractionCards = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 font-medium">
        Waiting for session data to extract...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Symptoms Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-colors">
        <div className="flex items-center gap-2 mb-3 text-red-400">
          <Activity size={20} />
          <h3 className="font-semibold text-lg">Symptoms</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.Symptoms?.map((sym, i) => (
            <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-md text-sm font-medium">{sym}</span>
          ))}
        </div>
      </div>

      {/* Duration Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-colors">
        <div className="flex items-center gap-2 mb-3 text-amber-400">
          <Clock size={20} />
          <h3 className="font-semibold text-lg">Duration</h3>
        </div>
        <p className="text-slate-300 font-medium">{data.Duration || 'Not mentioned'}</p>
      </div>

      {/* Diagnosis Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-colors col-span-2">
        <div className="flex items-center gap-2 mb-3 text-purple-400">
          <Stethoscope size={20} />
          <h3 className="font-semibold text-lg">Preliminary Diagnosis</h3>
        </div>
        <p className="text-slate-300 font-medium">{data.Diagnosis || 'Pending evaluation'}</p>
      </div>

      {/* Medications Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-colors col-span-2">
        <div className="flex items-center gap-2 mb-3 text-emerald-400">
          <Pill size={20} />
          <h3 className="font-semibold text-lg">Prescribed Meds</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.Medications?.map((med, i) => (
            <span key={i} className="bg-emerald-900/30 text-emerald-300 border border-emerald-800/50 px-3 py-1 rounded-md text-sm font-medium">{med}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExtractionCards;