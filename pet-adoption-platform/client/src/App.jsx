import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PetListingPage from './pages/PetListingPage';
import PetDetailsPage from './pages/PetDetailsPage';
import AdopterDashboardPage from './pages/AdopterDashboardPage';
import NgoDashboardPage from './pages/NgoDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import PetCareDashboardPage from './pages/PetCareDashboardPage';
import NotificationCenterPage from './pages/NotificationCenterPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pets" element={<PetListingPage />} />
            <Route path="/pets/:id" element={<PetDetailsPage />} />

            <Route
              path="/dashboard/adopter"
              element={
                <ProtectedRoute allowedRoles={['adopter']}>
                  <AdopterDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/ngo"
              element={
                <ProtectedRoute allowedRoles={['ngo']}>
                  <NgoDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pet-care"
              element={
                <ProtectedRoute allowedRoles={['adopter', 'ngo', 'admin']}>
                  <PetCareDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationCenterPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
