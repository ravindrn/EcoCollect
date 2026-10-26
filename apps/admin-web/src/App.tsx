import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { colors } from './theme/colors';
import { LiveMapPage } from './pages/LiveMapPage';
import { TestMapPage } from './pages/TestMapPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AreasPage } from './pages/AreasPage';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  if (initializing)
    return <div style={{ padding: 40, color: colors.textSecondary }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return <div style={{ padding: 40 }}>Loading…</div>;
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function Placeholder({ title }: { title: string }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 32,
        textAlign: 'center',
        color: colors.textSecondary,
      }}
    >
      <h2 style={{ color: colors.textPrimary, margin: 0 }}>{title}</h2>
      <p style={{ marginTop: 8 }}>Coming soon — this section is under construction.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="areas" element={<AreasPage />} />
            <Route path="live-map" element={<LiveMapPage />} />
            <Route path="test-map" element={<TestMapPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            
<Route path="complaints/:id" element={<ComplaintDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}