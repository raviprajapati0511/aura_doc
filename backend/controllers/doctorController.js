const User = require('../models/User');
const Visit = require('../models/Visit');

exports.getDoctorList = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('_id name email');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyPatients = async (req, res) => {
  try {
    // Return all patients — either explicitly assigned to this doctor
    // or any patient who has recorded a visit in the system
    const assigned = await User.find({ assignedDoctor: req.user._id, role: 'patient' });
    const visitPatientIds = await Visit.find({}).distinct('patientId');
    const allIds = [...new Set([
      ...assigned.map(p => p._id.toString()),
      ...visitPatientIds.map(id => id.toString())
    ])];
    const patients = await User.find({ _id: { $in: allIds }, role: 'patient' });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPatientHistory = async (req, res) => {
  try {
    const requesterId = req.user._id.toString();
    const patientId = req.params.patientId;
    if (req.user.role === 'patient' && requesterId !== patientId) {
      return res.status(403).json({ error: 'Not authorized to view this history' });
    }
    const visits = await Visit.find({ patientId }).sort({ date: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update visit: diagnosis, medications, doctorNotes
exports.updateVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    // Allow edit if: visit has no doctorId (patient self-recorded) OR doctorId matches
    if (visit.doctorId && visit.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this visit' });
    }

    const { diagnosis, medications, doctorNotes, symptoms, duration } = req.body;
    if (diagnosis !== undefined)   visit.structuredData.Diagnosis   = diagnosis;
    if (medications !== undefined) visit.structuredData.Medications = medications;
    if (symptoms !== undefined)    visit.structuredData.Symptoms    = symptoms;
    if (duration !== undefined)    visit.structuredData.Duration    = duration;
    if (doctorNotes !== undefined) visit.doctorNotes                = doctorNotes;

    await visit.save();
    res.json(visit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a visit (doctor only)
exports.deleteVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    if (visit.doctorId && visit.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this visit' });
    }
    await visit.deleteOne();
    res.json({ message: 'Visit deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Patient stats: visit count, symptom frequency, recent meds
exports.getPatientStats = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const visits = await Visit.find({ patientId }).sort({ date: -1 });

    const symptomCount = {};
    visits.forEach(v => {
      (v.structuredData.Symptoms || []).forEach(s => {
        symptomCount[s] = (symptomCount[s] || 0) + 1;
      });
    });

    const topSymptoms = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));

    const recentMeds = [...new Set(
      visits.flatMap(v => v.structuredData.Medications || [])
    )].slice(0, 6);

    res.json({
      totalVisits: visits.length,
      lastVisit: visits[0]?.date || null,
      topSymptoms,
      recentMeds,
      diagnosisHistory: visits.slice(0, 5).map(v => ({
        date: v.date,
        diagnosis: v.structuredData.Diagnosis || 'N/A'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
