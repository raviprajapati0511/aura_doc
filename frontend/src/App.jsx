import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientPortal from './pages/PatientPortal';
import Register from './pages/Register';

const ProtectedRoute = ({ role, element }) => {
  const user = JSON.parse(localStorage.getItem('userInfo'));
  if (!user?.token) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/login" replace />;
  return element;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctor-dashboard" element={<ProtectedRoute role="doctor" element={<DoctorDashboard />} />} />
        <Route path="/patient-portal" element={<ProtectedRoute role="patient" element={<PatientPortal />} />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
