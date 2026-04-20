import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DoctorPortal = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    // Fetch all patients assigned to this doctor
    axios.get('/api/doctor/my-patients').then(res => setPatients(res.data));
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* Sidebar: Patient List */}
      <div className="w-1/4 border-r border-slate-800 p-4">
        <h2 className="text-xl font-bold mb-4">Your Patients</h2>
        {patients.map(p => (
          <div 
            key={p._id} 
            onClick={() => setSelectedPatient(p)}
            className="p-3 mb-2 rounded-lg hover:bg-slate-800 cursor-pointer border border-transparent hover:border-blue-500 transition-all"
          >
            {p.name}
          </div>
        ))}
      </div>

      {/* Main Panel: History & Recording */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedPatient ? (
          <div>
            <h1 className="text-3xl font-bold mb-6">{selectedPatient.name}'s History</h1>
            {/* Component for Recording and History Timeline goes here */}
            <PatientHistoryTimeline patientId={selectedPatient._id} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            Select a patient to view history
          </div>
        )}
      </div>
    </div>
  );
};