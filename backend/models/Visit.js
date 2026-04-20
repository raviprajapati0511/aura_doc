const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  rawTranscript: String,
  structuredData: {
    Symptoms:    [String],
    Duration:    String,
    Diagnosis:   String,
    Medications: [String]
  },
  doctorAssistFlags: [String],
  doctorNotes: { type: String, default: '' },
  vectorEmbedding: [Number]
});

module.exports = mongoose.model('Visit', visitSchema);
