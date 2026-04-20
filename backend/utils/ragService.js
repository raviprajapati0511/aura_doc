const { GoogleGenerativeAI } = require("@google/generative-ai");
const Visit = require('../models/Visit');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const RAG_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const generateWithFallback = async (prompt) => {
  let lastErr;
  for (let m = 0; m < RAG_MODELS.length; m++) {
    const model = genAI.getGenerativeModel({ model: RAG_MODELS[m] });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await model.generateContent(prompt);
      } catch (err) {
        lastErr = err;
        if (err.status === 503 && attempt < 2) { await sleep(2000 * (attempt + 1)); continue; }
        if (err.status === 429 && m < RAG_MODELS.length - 1) break;
        throw err;
      }
    }
  }
  throw lastErr;
};

const buildContext = (visits) =>
  visits.map(v =>
    `Date: ${v.date.toDateString()}\n` +
    `Symptoms: ${(v.structuredData.Symptoms || []).join(', ')}\n` +
    `Meds: ${(v.structuredData.Medications || []).join(', ')}\n` +
    `Diagnosis: ${v.structuredData.Diagnosis || 'N/A'}\n` +
    (v.doctorNotes ? `Doctor Notes: ${v.doctorNotes}` : '')
  ).join("\n---\n");

exports.handleDoctorQuery = async (req, res) => {
  const { query, patientId } = req.body;
  try {
    const history = await Visit.find({ patientId }).sort({ date: -1 });
    const prompt = `
      You are a Medical Assistant AI. Answer the doctor's query concisely using ONLY the patient history below.
      If the answer is not in the history, say "No historical record of this found."

      PATIENT HISTORY:
      ${buildContext(history)}

      DOCTOR'S QUESTION: ${query}
    `;
    const result = await generateWithFallback(prompt);
    res.json({ answer: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: 'AI Assistant failed. Please try again.' });
  }
};

exports.handleGeneralChat = async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
  try {
    const prompt = `
      You are AURA, an intelligent medical AI assistant helping a physician.
      Answer the doctor's question concisely and professionally.
      You can help with: drug interactions, clinical guidelines, differential diagnoses,
      medical definitions, treatment protocols, or general medical knowledge.
      Always remind the doctor to apply their clinical judgment.

      Doctor's question: ${message}
    `;
    const result = await generateWithFallback(prompt);
    res.json({ answer: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: 'AI Assistant unavailable. Please try again.' });
  }
};

exports.getHealthSummary = async (req, res) => {
  const { patientId } = req.params;
  try {
    const history = await Visit.find({ patientId }).sort({ date: -1 }).limit(10);
    if (history.length === 0) {
      return res.json({ summary: 'No medical history available to summarize.' });
    }
    const prompt = `
      You are a clinical AI assistant. Based on the patient's visit history below, write a concise clinical summary (3-5 sentences) covering:
      - Recurring conditions or symptoms
      - Current medications
      - Any notable trends or concerns
      - Overall health status

      PATIENT HISTORY (most recent first):
      ${buildContext(history)}

      Write the summary in clear, professional medical language suitable for a doctor to read at a glance.
    `;
    const result = await generateWithFallback(prompt);
    res.json({ summary: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: 'Could not generate health summary.' });
  }
};
