import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollContext = createContext();

export const ScrollProvider = ({ children }) => {
  const rightSectionRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Rota değiştiğinde veya sayfa yüklendiğinde scroll'u en üste kaydır
    const scrollToTop = () => {
      if (rightSectionRef.current) {
        rightSectionRef.current.scrollTop = 0;
        rightSectionRef.current.dataset.loaded = "true";
        console.log(`ScrollContext: ${location.pathname} için sayfa en üste kaydırıldı`);
      } else {
        setTimeout(scrollToTop, 100); // Ref mevcut değilse tekrar dene
      }
    };

    setTimeout(() => {
      requestAnimationFrame(scrollToTop);
    }, 200);
  }, [location.pathname]); // Rota değişimlerini dinle

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
