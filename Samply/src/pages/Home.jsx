import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Galaxy from '../components/3dObjects/Galaxy';
import Metaball from '../components/3dObjects/Metaball';
import bgMusic from '../assets/audio/Space_Background_Music.mp3';
import IntroAudio from '../assets/audio/intro_voice.mp3';
import '../css/Home.css';

function Home() {
  const [analyser, setAnalyser] = useState(null);
  const [introAnalyser, setIntroAnalyser] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentState, setCurrentState] = useState('loading');
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const audioRef = useRef(null);
  const introAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const introTimeoutRef = useRef(null);
  const userInteractionRef = useRef(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleUserInteraction = () => {
      userInteractionRef.current = true;
      if (audioBlocked && audioRef.current) {
        attemptAudioPlay();
      }
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('mousemove', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('mousemove', handleUserInteraction);
    };
  }, [audioBlocked]);
  
  useEffect(() => {
    if (currentState === 'loading') {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setCurrentState('intro'), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [currentState]);
  
  useEffect(() => {
    if (currentState === 'intro') {
      introTimeoutRef.current = setTimeout(() => {
        setCurrentState('home');
      }, 15000); 
      
      const introAudioTimeout = setTimeout(() => {
        setupIntroAudio();
      }, 2000);
      
      return () => {
        if (introTimeoutRef.current) {
          clearTimeout(introTimeoutRef.current);
        }
        clearTimeout(introAudioTimeout);
      };
    }
  }, [currentState]);
  
  const attemptAudioPlay = async () => {
    if (!audioRef.current) return;
    
    try {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      await audioRef.current.play();
      setAudioBlocked(false);
      setShowAudioPrompt(false);
    } catch (error) {
      console.log("Audio autoplay blocked, waiting for user interaction");
      setAudioBlocked(true);
      setTimeout(() => setShowAudioPrompt(true), 3000);
    }
  };

  useEffect(() => {
    const setupAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const audio = new Audio();
        audio.src = bgMusic;
        audio.loop = true;
        audio.volume = 0.6;
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        
        audio.muted = false;
        audio.defaultMuted = false;
        
        audioRef.current = audio;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const handleCanPlay = async () => {
          try {
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            setAnalyser(analyser);
            
            await attemptAudioPlay();
          } catch (err) {
            console.error("Audio connection failed:", err);
          }
        };

        if (audio.readyState >= 3) {
          handleCanPlay();
        } else {
          audio.addEventListener('canplay', handleCanPlay, { once: true });
        }
        
        audio.load();
        
      } catch (err) {
        console.error("Audio setup failed:", err);
      }
    };
    
    const setupDelay = setTimeout(setupAudio, 100);
    
    return () => {
      clearTimeout(setupDelay);
      
      if (audioRef.current) {
        const audio = audioRef.current;
        if (!audio.paused) {
          audio.pause();
        }
        audio.currentTime = 0;
        audioRef.current = null;
      }

      if (introAudioRef.current) {
        const introAudio = introAudioRef.current;
        if (!introAudio.paused) {
          introAudio.pause();
        }
        introAudio.currentTime = 0;
        introAudioRef.current = null;
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => 
          console.error("Error closing audio context:", err)
        );
      }
      
      if (introTimeoutRef.current) {
        clearTimeout(introTimeoutRef.current);
      }
      
      setAnalyser(null);
      setIntroAnalyser(null);
    };
  }, []);

  const setupIntroAudio = async () => {
    try {
      if (!audioContextRef.current) return;
      
      const introAudio = new Audio();
      introAudio.src = IntroAudio;
      introAudio.volume = 0.5;
      introAudio.crossOrigin = 'anonymous';
      introAudio.preload = 'auto';
      introAudioRef.current = introAudio;
      
      const introAnalyser = audioContextRef.current.createAnalyser();
      introAnalyser.fftSize = 256;
      
      const handleIntroCanPlay = async () => {
        try {
          const introSource = audioContextRef.current.createMediaElementSource(introAudio);
          introSource.connect(introAnalyser);
          introAnalyser.connect(audioContextRef.current.destination);
          
          setIntroAnalyser(introAnalyser);
          
          if (userInteractionRef.current || !audioBlocked) {
            await introAudio.play();
          }
        } catch (error) {
          console.log("Intro audio blocked:", error);
        }
      };

      if (introAudio.readyState >= 3) {
        handleIntroCanPlay();
      } else {
        introAudio.addEventListener('canplay', handleIntroCanPlay, { once: true });
      }
      
      introAudio.addEventListener('ended', () => {
        setIntroAnalyser(null);
        introAudioRef.current = null;
      });
      
      introAudio.load();
      
    } catch (err) {
      console.error("Intro audio setup failed:", err);
    }
  };

  const handleMetaballClick = () => {
    if (audioBlocked && audioRef.current) {
      attemptAudioPlay();
    }
    navigate('/generate');
  };

  const handleMetaballHover = (hovering) => {
    setIsHovering(hovering);
  };

  const handleSkipIntro = () => {
    if (audioBlocked && audioRef.current) {
      attemptAudioPlay();
    }
    
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
    }
    
    if (introAudioRef.current && !introAudioRef.current.paused) {
      introAudioRef.current.pause();
      introAudioRef.current.currentTime = 0;
      setIntroAnalyser(null);
    }
    
    setCurrentState('home');
  };

  const handleEnableAudio = async () => {
    userInteractionRef.current = true;
    await attemptAudioPlay();
    setShowAudioPrompt(false);
  };

  const fadeInOut = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.8 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.5 }
    }
  };

  const h1Variants = {
    hidden: {
      opacity: 0,
      y: -30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.1
      }
    }
  };

  const metaballVariants = {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.3
      }
    }
  };

  const introTextVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.5
      }
    }
  };

  const skipButtonVariants = {
    hidden: {
      opacity: 0,
      x: 20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.7
      }
    }
  };

  const ProgressCircle = ({ progress }) => {
    const radius = 100;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    const svgSize = (radius + 20) * 2;
    
    return (
      <div className="progress-container">
        <svg className="progress-circle" width={svgSize} height={svgSize}>
          <circle
            className="progress-circle-bg"
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="2"
          />
          <circle
            className="progress-circle-fill"
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
          />
        </svg>
        <div className="progress-text">
          {Math.round(progress)}%
        </div>
      </div>
    );
  };

  return (
    <>
      <div className='space'>
        <Galaxy />
      </div>
      
      {showAudioPrompt && (
        <motion.div
          className="audio-prompt"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <button onClick={handleEnableAudio} className="audio-enable-btn">
            🔊 Enable Audio
          </button>
        </motion.div>
      )}
      
      <AnimatePresence mode="wait">
        {/* Loading Screen */}
        {currentState === 'loading' && (
          <motion.div
            key="loading"
            className="loading-screen"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeInOut}
          >
            <ProgressCircle progress={loadingProgress} />
          </motion.div>
        )}

        {/* Intro Screen */}
        {currentState === 'intro' && (
          <motion.div
            key="intro"
            className="intro-screen"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeInOut}
          >
            <div className="intro-content">
              <motion.div
                className="intro-text"
                initial="hidden"
                animate="visible"
                variants={introTextVariants}
              >
                <p>Why not visualize sound as a dynamic black sphere? Sound isn't just waves, it's energy you can see in new forms like an object that reacts and comes alive with every beat.</p>
              </motion.div>
              <motion.div 
                className='intro-metaball'
                initial="hidden"
                animate="visible"
                variants={metaballVariants}
              >
                <Metaball 
                  analyser={introAnalyser || analyser} 
                  isHovering={false}
                  sphereScale={1.3}
                  animationSpeed={1}
                />
              </motion.div>
            </div>
            <motion.button
              className="skip-intro-btn"
              onClick={handleSkipIntro}
              initial="hidden"
              animate="visible"
              variants={skipButtonVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <p>Skip Intro</p>
            </motion.button>
          </motion.div>
        )}

        {/* Home Screen */}
        {currentState === 'home' && (
          <motion.div
            key="home"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeInOut}
            transition={{ duration: 0.8 }}
          >
            <div className="container-space">
              <div className='cta'>
                <div className="heading-container">
                  <motion.h1
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  >
                    Generate. Create. Inspire.
                  </motion.h1>
                  <motion.div 
                    className='metaball'
                    onMouseEnter={() => handleMetaballHover(true)}
                    onMouseLeave={() => handleMetaballHover(false)}
                    onClick={handleMetaballClick}
                    style={{ cursor: 'pointer' }}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Metaball 
                      analyser={analyser} 
                      isHovering={isHovering}
                      sphereScale={1.4}
                      animationSpeed={isHovering ? 1.8 : 1}
                    />
                  </motion.div>
                  <motion.div 
                    className='bottom-text-home'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 0.3, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    <p>Tap the ball to generate your sample!</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Home;