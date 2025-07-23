import { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollContext = createContext();

export const ScrollProvider = ({ children }) => {
  const rightSectionRef = useRef(null);
  const location = useLocation();

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

  const value = {
    rightSectionRef,
  };

  return (
    <ScrollContext.Provider value={value}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => useContext(ScrollContext);
