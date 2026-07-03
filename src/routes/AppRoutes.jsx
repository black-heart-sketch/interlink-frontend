import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import ProtectedRoute from '../components/auth/ProtectedRoute';

const Home = lazy(() => import('../pages/Home'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const PaymentStatus = lazy(() => import('../pages/PaymentStatus'));
const StudyLounge = lazy(() => import('../pages/StudyLounge'));
const LiveClassRoom = lazy(() => import('../pages/LiveClassRoom'));

function RouteLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
      Loading
    </div>
  );
}

function AppRoutes() {
  const { i18n } = useTranslation();
  const langKey = i18n.language;

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;
