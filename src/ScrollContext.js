import { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollContext = createContext();

export const ScrollProvider = ({ children }) => {
  const rightSectionRef = useRef(null);
  const location = useLocation();

  // Rota değiştiğinde veya sayfa yüklendiğinde en üste kaydır
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

  // Input odaklanma için scroll yönetimi
  const handleInputFocus = (inputRef, targetScrollTo) => {
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
      : 350; // Varsayılan klavye yüksekliği

    console.log('Focus event tetiklendi:', {
      inputId: input.id,
      inputRectTop: inputRect.top,
      inputRectHeight: inputRect.height,
      viewportHeight,
      keyboardHeight,
      currentScrollTop: rightSection.scrollTop,
      targetScrollTo,
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
          rightSection.scrollTo({ top: targetScrollTo, behavior: 'smooth' });
          console.log('Android: Kaydırma uygulandı', { scrollTo: targetScrollTo });
        });
      }, 200);
    }
  };

  const value = {
    rightSectionRef,
    handleInputFocus,
  };

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
};

export const useScroll = () => useContext(ScrollContext);
