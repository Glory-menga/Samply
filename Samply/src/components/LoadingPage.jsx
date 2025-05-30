import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import AnimatedBackground from "./background/AnimatedBackground";
import Metaball from "./3dObjects/Metaball";
import '../css/LoadingPage.css';

function LoadingPage() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const loadingMessages = [
    "Turning words into music... just a moment while we create your custom sample.",
    "Analyzing your prompt and crafting the perfect sound signature...",
    "Mixing harmonies and rhythms tailored to your vision...",
    "Fine-tuning frequencies to match your creative energy...",
    "Adding the final touches to your unique instrument sample...",
    "Almost ready! Preparing your sample for the perfect beat..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % loadingMessages.length
      );
    }, 10000); 

    return () => clearInterval(interval);
  }, [loadingMessages.length]);

  const textVariants = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  };

  return (
    <>
      <AnimatedBackground />
      <motion.div 
        className="loading-page-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut"
        }}
      >
        <motion.div 
          className="metaballs-loading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6,
            delay: 0.2,
            ease: "easeOut"
          }}
        >
          <div className="metaball-loading">
            <Metaball width="100%" height="100%" sphereScale={1.4} animationSpeed={2}/>
          </div>
          <div className="metaball-loading">
            <Metaball width="100%" height="100%" sphereScale={1.4} animationSpeed={2}/>
          </div>
        </motion.div>
        
        <div className="loading-text-container">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessageIndex}
              variants={textVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {loadingMessages[currentMessageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

export default LoadingPage;