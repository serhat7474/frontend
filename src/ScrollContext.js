// ScrollContext.js
import React, { createContext, useContext, useEffect, useRef } from 'react';

const ScrollContext = createContext();

export const ScrollProvider = ({ children }) => {
  const rightSectionRef = useRef(null);

  useEffect(() => {
    // Sayfa yüklendiğinde scroll'u en üste kaydır
    if (rightSectionRef.current) {
      rightSectionRef.current.scrollTop = 0;
    }
  }, []);

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
