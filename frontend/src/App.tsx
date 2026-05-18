import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Components
import Login from './components/Login';
import Register from './components/Register';
import Welcome from './components/Welcome';
import Dashboard from './components/Dashboard';
import ThemeSelection from './components/ThemeSelection';
import SpeechTest from './components/SpeechTest';
import AnalysisReport from './components/AnalysisReport';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
};

function WelcomeRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Welcome />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomeRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/theme" element={
        <ProtectedRoute>
          <ThemeSelection />
        </ProtectedRoute>
      } />
      
      <Route path="/test/:theme" element={
        <ProtectedRoute>
          <SpeechTest />
        </ProtectedRoute>
      } />

      <Route path="/report" element={
        <ProtectedRoute>
          <AnalysisReport />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
