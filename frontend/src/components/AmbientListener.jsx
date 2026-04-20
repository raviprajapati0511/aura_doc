import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AmbientListener = ({ onProcessingComplete, selectedPatientId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      setRecordingTime(0);

      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        clearInterval(timerRef.current);
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch {
      alert('Please allow microphone access in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const sendAudioToBackend = async (blob) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = userInfo?.token;

    if (!token) {
      alert('Session expired. Please log in again.');
      setIsProcessing(false);
      return;
    }

    const formData = new FormData();
    formData.append('audio', blob, 'session.webm');
    if (selectedPatientId) formData.append('patientId', selectedPatientId);

    try {
      const response = await fetch('http://localhost:8080/api/process-audio', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      onProcessingComplete(data);
    } catch (error) {
      console.error('Audio upload failed:', error.message);
      alert(`Failed to process audio: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden">
      <AnimatePresence>
        {isRecording && (
          <>
            <motion.div
              key="ring1"
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
              className="absolute w-24 h-24 bg-red-500/20 rounded-full pointer-events-none"
            />
            <motion.div
              key="ring2"
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: 'easeOut' }}
              className="absolute w-24 h-24 bg-red-500/20 rounded-full pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`relative z-10 flex items-center gap-3 px-7 py-3.5 rounded-full text-white font-bold transition-all shadow-lg text-sm ${
          isRecording ? 'bg-red-600 hover:bg-red-700 shadow-red-900/40' :
          isProcessing ? 'bg-slate-700 cursor-not-allowed' :
          'bg-blue-600 hover:bg-blue-700 shadow-blue-900/40'
        }`}
      >
        {isProcessing
          ? <><Loader2 className="animate-spin" size={18} /> Processing…</>
          : isRecording
          ? <><Square fill="currentColor" size={16} /> Stop Recording</>
          : <><Mic size={18} /> Start Session</>}
      </button>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mt-4 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-400 font-mono">{formatTime(recordingTime)}</span>
            <span className="text-xs text-slate-600">Recording…</span>
          </motion.div>
        )}
        {isProcessing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-xs text-slate-500"
          >
            AI is analyzing your audio…
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AmbientListener;
