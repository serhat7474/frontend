import { createContext, useContext, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollContext = createContext();

export const ScrollProvider = ({ children }) => {
  const rightSectionRef = useRef(null);
  const location = useLocation();

  const scrollConfig = useMemo(() => ({
    tcOffset: 100,
    passwordOffset: 150,
    phoneOffset: 350, // PhoneVerificationPage için offset
  }), []);

  // Rota değiştiğinde veya sayfa yüklendiğinde en üste kaydır
  useEffect(() => {
    const scrollToTop = () => {
      if (rightSectionRef.current) {
        rightSectionRef.current.scrollTop = 0;
        rightSectionRef.current.dataset.loaded = "true";
        console.log(`ScrollContext: ${location.pathname} için sayfa en üste kaydırıldı`);
      } else {
        setTimeout(scrollToTop, 100);
      }
    };

    setTimeout(() => {
      requestAnimationFrame(scrollToTop);
    }, 200);
  }, [location.pathname]);

  // Android ve iOS için input odaklanma scroll yönetimi
  useEffect(() => {
    const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = () => /Android/i.test(navigator.userAgent);

    const handleFocus = (e) => {
      const input = e.target;
      const rightSection = rightSectionRef.current;
      if (!rightSection) return;

      if (isIOS()) {
        rightSection.style.transition = 'none';
        setTimeout(() => {
          requestAnimationFrame(() => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        }, 100);
        return;
      }

      if (!isAndroid()) return;

      const inputRect = input.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      let offset = 0;

      console.log('Focus event triggered on:', input.id);

      if (input.id === 'tc-input') {
        offset = scrollConfig.tcOffset;
      } else if (input.id === 'password-input') {
        offset = scrollConfig.passwordOffset;
      } else if (input.id === 'phone-input') {
        offset = scrollConfig.phoneOffset;
      }

      if (offset > 0) {
        rightSection.style.transition = 'none';
        setTimeout(() => {
          requestAnimationFrame(() => {
            const scrollTo = rightSection.scrollTop + inputRect.top - (viewportHeight - inputRect.height) / 2 + offset;
            rightSection.scrollTo({ top: scrollTo, behavior: 'smooth' });
          });
        }, 100);
      }
    };

    const tcInput = document.getElementById('tc-input');
    const passwordInput = document.getElementById('password-input');
    const phoneInput = document.getElementById('phone-input');
    if (tcInput) tcInput.addEventListener('focus', handleFocus);
    if (passwordInput) passwordInput.addEventListener('focus', handleFocus);
    if (phoneInput) phoneInput.addEventListener('focus', handleFocus);

    return () => {
      if (tcInput) tcInput.removeEventListener('focus', handleFocus);
      if (passwordInput) passwordInput.removeEventListener('focus', handleFocus);
      if (phoneInput) phoneInput.removeEventListener('focus', handleFocus);
    };
  }, [scrollConfig]);

  const value = {
    rightSectionRef,
    scrollConfig,
  };

  return (
    <ScrollContext.Provider value={value}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => useContext(ScrollContext);
