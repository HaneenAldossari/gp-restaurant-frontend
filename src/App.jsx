import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import RequireAccess, { defaultRouteFor } from './components/RequireAccess';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import MenuEngineering from './pages/MenuEngineering';
import Forecasting from './pages/Forecasting';
import Settings from './pages/Settings';

// Index redirector: a write_only cashier has no dashboard access, so
// the root URL must send them to /upload instead of /dashboard.
const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={defaultRouteFor(user)} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<MainLayout />}>
              <Route index element={<RootRedirect />} />

              {/* Read views — sub-users need read_only or read_write to enter */}
              <Route path="dashboard" element={
                <RequireAccess
                  roles={['Admin', 'Manager']}
                  subUserPerm={['read_only', 'read_write']}
                ><Dashboard /></RequireAccess>
              } />
              <Route path="forecasting" element={
                <RequireAccess
                  roles={['Admin', 'Manager']}
                  subUserPerm={['read_only', 'read_write']}
                ><Forecasting /></RequireAccess>
              } />
              <Route path="menu-engineering" element={
                <RequireAccess
                  roles={['Admin', 'Manager']}
                  subUserPerm={['read_only', 'read_write']}
                ><MenuEngineering /></RequireAccess>
              } />

              {/* Upload — managers + sub-users with any write permission */}
              <Route path="upload" element={
                <RequireAccess
                  roles={['Admin', 'Manager']}
                  subUserPerm={['write_only', 'read_write']}
                ><Upload /></RequireAccess>
              } />

              {/* Settings — open to managers and to read-capable sub-users
                  (Viewer + Full access). Write-only cashiers don't get
                  Settings; their interface is just the Upload page.
                  Inside Settings the Upload Data and Team tabs are
                  hidden per-permission (see Settings.jsx). */}
              <Route path="settings" element={
                <RequireAccess
                  roles={['Admin', 'Manager']}
                  subUserPerm={['read_only', 'read_write']}
                ><Settings /></RequireAccess>
              } />
            </Route>

            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
