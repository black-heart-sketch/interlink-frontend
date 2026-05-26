import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import PaymentStatus from '../pages/PaymentStatus';
import StudyLounge from '../pages/StudyLounge';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LiveClassRoom from '../pages/LiveClassRoom';

function AppRoutes() {
  const { i18n } = useTranslation();
  const langKey = i18n.language;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home key={`home-${langKey}`} />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/supervisor/dashboard" element={<ProtectedRoute allowedRoles={['supervisor']}><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Dashboard /></ProtectedRoute>} />
        <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager']}><Dashboard /></ProtectedRoute>} />
        <Route path="/login" element={<Login key={`login-${langKey}`} />} />
        <Route path="/register" element={<Register key={`register-${langKey}`} />} />
        <Route path="/payment/status" element={<PaymentStatus key={`payment-${langKey}`} />} />
        <Route path="/lounge" element={<ProtectedRoute><StudyLounge key={`lounge-${langKey}`} /></ProtectedRoute>} />
        <Route path="/live/:meetingId" element={<ProtectedRoute><LiveClassRoom /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
