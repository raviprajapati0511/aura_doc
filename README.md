# AURA — Automated Unified Medical Record Assistant

An AI-powered medical consultation platform that enables voice-based symptom recording, automated medical data extraction, and AI-assisted patient history management for doctors and patients.

## Features

**For Doctors**
- View and manage all patient records and visit history
- Edit visit details: symptoms, diagnosis, medications, and clinical notes
- Query patient history with AI-assisted answers
- Generate AI health summaries for any patient

**For Patients**
- Record symptoms by voice in **English, Hindi, or Marathi**
- AI automatically extracts structured medical data from the audio
- View personal visit history and health statistics

**AI Capabilities**
- Audio transcription and structured data extraction via Google Gemini
- Retrieval-augmented generation (RAG) for patient history queries
- Clinical health summary generation
- Fallback across multiple Gemini models with retry logic for rate limits

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose ODM) |
| AI | Google Gemini API (2.0-flash, 2.0-flash-lite, 2.5-flash) |
| Auth | JWT + bcryptjs |
| File Upload | Multer (in-memory storage) |

## Project Structure

```
med-ai-capstone/
├── backend/
│   ├── controllers/      # audioController, authController, doctorController
│   ├── middleware/        # JWT auth & role-based access
│   ├── models/            # User, Patient, Visit schemas
│   ├── routes/            # API route definitions
│   ├── utils/             # ragService (AI interactions)
│   └── server.js          # Express entry point
│
└── frontend/
    └── src/
        ├── pages/         # Login, Register, DoctorDashboard, PatientPortal
        ├── components/    # AmbientListener, CommandBar, ExtractionCards
        └── api/           # Axios configuration
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account (or local MongoDB instance)
- Google Gemini API key

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=8080
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/<dbname>
GEMINI_API_KEY=<your_google_gemini_api_key>
JWT_SECRET=<your_jwt_secret>
```

Start the server:

```bash
npm start
# Server runs at http://localhost:8080
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Dev server runs at http://localhost:5173
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/process-audio` | Upload audio, get structured medical data |
| GET | `/api/doctor/patients` | Get all patients (doctor only) |
| GET | `/api/doctor/patients/:id/visits` | Get patient visit history |
| PUT | `/api/doctor/visits/:id` | Edit a visit record |
| DELETE | `/api/doctor/visits/:id` | Delete a visit |
| POST | `/api/doctor/patients/:id/query` | AI query on patient history |
| GET | `/api/doctor/patients/:id/summary` | AI health summary |
| GET | `/api/patient/me` | Get own patient profile |
| GET | `/api/patient/me/visits` | Get own visit history |

## Data Models

**User** — `name`, `email`, `password (hashed)`, `role (doctor | patient)`, `assignedDoctor`

**Patient** — `name`, `age`, `gender`, `primaryLanguage`

**Visit** — `patientId`, `doctorId`, `date`, `rawTranscript`, `structuredData` (symptoms, duration, diagnosis, medications), `doctorAssistFlags`, `doctorNotes`

## Authentication

- JWT tokens with 30-day expiration stored in `localStorage`
- Protected routes enforce role-based access (doctors cannot access patient-only routes and vice versa)
- Passwords hashed with bcryptjs

## Notes

- Never commit the `.env` file — it contains sensitive credentials
- CORS is configured for `http://localhost:5173`; update if deploying to a different origin
- Audio is uploaded as `audio/webm` and processed in-memory (not persisted to disk)
