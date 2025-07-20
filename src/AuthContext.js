import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

const AuthContext = createContext();

const initialState = {
  inputValue: '',
  passwordValue: '',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_INPUT_VALUE':
      return { ...state, inputValue: action.payload };
    case 'SET_PASSWORD_VALUE':
      return { ...state, passwordValue: action.payload };
    case 'CLEAR_TC':
      return { ...state, inputValue: '' };
    case 'CLEAR_PASSWORD':
      return { ...state, passwordValue: '' };
    case 'RESET_AUTH':
      return { ...initialState }; // State'i sıfırla
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Scroll davranışını useMemo ile sabit bir nesne olarak tanımla
  const scrollConfig = useMemo(() => ({
    tcOffset: 100, // TC inputu için 100px aşağı kaydırma
    passwordOffset: 150, // Şifre inputu için 150px aşağı kaydırma
  }), []);

  useEffect(() => {
    const handleFocus = (e) => {
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (!isAndroid) return;

      const rightSection = document.querySelector('.right-section');
      if (!rightSection) return;

      const input = e.target;
      const inputRect = input.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      let offset = 0;

      console.log('Focus event triggered on:', input.id); // Test için log

      if (input.id === 'tc-input') {
        offset = scrollConfig.tcOffset;
      } else if (input.id === 'password-input' && state.inputValue.length === 11) {
        offset = scrollConfig.passwordOffset;
      }

      if (offset > 0) {
        rightSection.style.transition = 'none';
        setTimeout(() => {
          requestAnimationFrame(() => {
            const scrollTo = rightSection.scrollTop + inputRect.top - (viewportHeight - inputRect.height) / 2 + offset;
            rightSection.scrollTo({ top: scrollTo, behavior: 'smooth' });
          });
        }, 100); // Klavye animasyonunu beklemek için gecikme
      }
    };

    const tcInput = document.getElementById('tc-input');
    const passwordInput = document.getElementById('password-input');
    if (tcInput) tcInput.addEventListener('focus', handleFocus);
    if (passwordInput) passwordInput.addEventListener('focus', handleFocus);

    return () => {
      if (tcInput) tcInput.removeEventListener('focus', handleFocus);
      if (passwordInput) passwordInput.removeEventListener('focus', handleFocus);
    };
  }, [state.inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ state, dispatch, scrollConfig }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
