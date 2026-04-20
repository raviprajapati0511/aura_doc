const { GoogleGenerativeAI } = require('@google/generative-ai');
const Visit = require('../models/Visit');
const ragService = require('../utils/ragService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const AUDIO_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const getRetryDelay = (err) => {
  const retryInfo = err.errorDetails?.find(d => d['@type']?.includes('RetryInfo'));
  if (!retryInfo?.retryDelay) return null;
  return parseInt(retryInfo.retryDelay) * 1000;
};

const generateWithFallback = async (models, buildRequest) => {
  let lastErr;
  for (let m = 0; m < models.length; m++) {
    const model = genAI.getGenerativeModel({ model: models[m] });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await model.generateContent(buildRequest());
      } catch (err) {
        lastErr = err;
        if (err.status === 503 && attempt < 2) {
          await sleep(2000 * (attempt + 1));
          continue;
        }
        if (err.status === 429 || err.status === 404) break; // quota or deprecated — try next model
        throw err;
      }
    }
  }
  throw lastErr;
};

exports.processAudio = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio data received' });

    const audioPart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype || 'audio/webm'
      }
    };

    const prompt = `
      You are a medical AI. Analyze this audio (English/Hindi/Marathi).
      Return ONLY valid JSON in this exact shape — no markdown, no extra text:
      {
        "transcript": "full transcribed text",
        "Symptoms": [],
        "Duration": "",
        "Diagnosis": "",
        "Medications": [],
        "DoctorAssist": ["suggestions"]
      }
    `;

    const result = await generateWithFallback(AUDIO_MODELS, () => [prompt, audioPart]);

    let aiData;
    try {
      const raw = result.response.text().replace(/```json|```/g, '').trim();
      aiData = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }

    const senderRole = req.user.role;
    const senderId = req.user._id;
    const targetPatientId = senderRole === 'patient' ? senderId : req.body.patientId;
    const targetDoctorId = senderRole === 'doctor' ? senderId : req.user.assignedDoctor;

    const visitData = {
      patientId: targetPatientId,
      rawTranscript: aiData.transcript,
      structuredData: {
        Symptoms: aiData.Symptoms || [],
        Duration: aiData.Duration || '',
        Diagnosis: aiData.Diagnosis || '',
        Medications: aiData.Medications || []
      },
      doctorAssistFlags: aiData.DoctorAssist || []
    };
    if (targetDoctorId) visitData.doctorId = targetDoctorId;

    const newVisit = await Visit.create(visitData);

    if (ragService.generateAndSaveEmbedding) {
      ragService.generateAndSaveEmbedding(newVisit._id, aiData.transcript, aiData);
    }

    res.status(200).json(newVisit);

  } catch (error) {
    console.error('❌ Audio Controller Error:', error);
    if (error.status === 429) {
      const delay = getRetryDelay(error);
      const wait = delay ? `Please wait ${Math.ceil(delay / 1000)}s and try again.` : 'Please wait a few minutes and try again.';
      return res.status(429).json({ error: `AI quota exceeded across all models. ${wait}` });
    }
    res.status(500).json({ error: 'Processing failed', details: error.message });
  }
};
