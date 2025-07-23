import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollContext = createContext();

export const ScrollProvider = ({ children }) => {
  const rightSectionRef = useRef(null);
  const location = useLocation();

  const scrollConfig = useMemo(() => ({
    tcOffset: 100,
    passwordOffset: 150,
    phoneOffset: 350,
  }), []);

  useEffect(() => {
    const scrollToTop = () => {
      if (rightSectionRef.current) {
        rightSectionRef.current.scrollTop = 0;
        rightSectionRef.current.dataset.loaded = 'true';
        console.log(`ScrollContext: ${location.pathname} için sayfa en üste kaydırıldı`);
      } else {
        setTimeout(scrollToTop, 100);
      }
    };

    setTimeout(() => {
      requestAnimationFrame(scrollToTop);
    }, 200);
  }, [location.pathname]);

  const handleInputFocus = (inputRef, offset) => {
    if (!inputRef.current || !rightSectionRef.current) {
      console.log('Hata: inputRef veya rightSectionRef null', {
        inputRef: !!inputRef.current,
        rightSectionRef: !!rightSectionRef.current,
      });
      return;
    }

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const rightSection = rightSectionRef.current;
    const input = inputRef.current;

    const inputRect = input.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const keyboardHeight = window.visualViewport?.offsetTop
      ? window.innerHeight - window.visualViewport.height
      : 250; // Varsayılan klavye yüksekliği

    console.log('Focus event tetiklendi:', {
      inputId: input.id,
      inputRectTop: inputRect.top,
      viewportHeight,
      keyboardHeight,
      currentScrollTop: rightSection.scrollTop,
    });

    if (isIOS) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.log('iOS: scrollIntoView çağrıldı', input.id);
        });
      }, 100);
      return;
    }

    if (isAndroid) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          const scrollTo =
            rightSection.scrollTop +
            inputRect.top -
            (viewportHeight - inputRect.height - keyboardHeight) / 2 +
            offset;
          rightSection.scrollTo({ top: scrollTo, behavior: 'smooth' });
          console.log('Android: Kaydırma uygulandı', { scrollTo });
        });
      }, 200); // Hızlandırılmış gecikme
    }
  };

  const value = {
    rightSectionRef,
    scrollConfig,
    handleInputFocus,
  };

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
};

export const useScroll = () => useContext(ScrollContext);
