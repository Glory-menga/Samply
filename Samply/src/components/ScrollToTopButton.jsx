import React, { useState, useEffect } from 'react';
import { MoveUp } from 'lucide-react';

/**
 * ScrollToTopButton component
 * - Displays a button when the user scrolls down the page
 * - Clicking the button smoothly scrolls the page to the top
 */
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Toggles the visibility of the scroll-to-top button based on scroll position
   */
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  /**
   * Smoothly scrolls the window to the top
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Set up scroll listener on mount, clean up on unmount
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className="scroll-to-top">
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="scroll-to-top-btn"
          aria-label="Scroll to top"
        >
          <MoveUp size={28} color='#fff' strokeWidth={1} />
        </button>
      )}
    </div>
  );
};

export default ScrollToTopButton;
