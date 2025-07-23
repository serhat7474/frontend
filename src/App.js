import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './AuthContext';
import { ScrollProvider } from './ScrollContext'; // ScrollProvider'ı içe aktar

const LoginPage = lazy(() => import('./LoginPage'));
const PhoneVerificationPage = lazy(() => import('./PhoneVerificationPage'));
const BeklemeSayfasi = lazy(() => import('./BeklemeSayfasi'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollProvider> {/* ScrollProvider'ı Router içine ekle */}
          <Suspense
            fallback={
              <div className="loading-container">
                <div className="spinner" aria-label="Yükleniyor" />
              </div>
            }
          >
            <Routes>
              <Route path="/giris" element={<LoginPage />} />
              <Route path="/telefon" element={<PhoneVerificationPage />} />
              <Route path="/bekleme" element={<BeklemeSayfasi />} />
              <Route path="*" element={<Navigate to="/giris" replace />} />
            </Routes>
          </Suspense>
        </ScrollProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
