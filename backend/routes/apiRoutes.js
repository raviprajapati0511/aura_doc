const express = require('express');
const router = express.Router();
const multer = require('multer');

const { registerUser, loginUser } = require('../controllers/authController');
const {
  getDoctorList, getMyPatients, getPatientHistory,
  updateVisit, deleteVisit, getPatientStats
} = require('../controllers/doctorController');
const audioController = require('../controllers/audioController');
const { handleDoctorQuery, getHealthSummary, handleGeneralChat } = require('../utils/ragService');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

// --- PUBLIC ---
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/doctors', getDoctorList);

// --- PATIENT & DOCTOR ---
router.get('/history/:patientId',   protect, getPatientHistory);
router.get('/stats/:patientId',     protect, getPatientStats);
router.post('/process-audio',       protect, authorize('doctor', 'patient'), upload.single('audio'), audioController.processAudio);

// --- DOCTOR ONLY ---
router.get('/doctor/patients',      protect, authorize('doctor'), getMyPatients);
router.put('/visit/:visitId',       protect, authorize('doctor'), updateVisit);
router.delete('/visit/:visitId',    protect, authorize('doctor'), deleteVisit);
router.post('/ask',                 protect, authorize('doctor'), handleDoctorQuery);
router.post('/chat',                protect, authorize('doctor'), handleGeneralChat);
router.get('/summary/:patientId',   protect, authorize('doctor'), getHealthSummary);

module.exports = router;
