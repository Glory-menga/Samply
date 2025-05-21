import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Nav from '../components/Nav';
import Galaxy from '../components/3dObjects/Galaxy';
import Metaball from '../components/3dObjects/Metaball';
import bgMusic from '../assets/audio/Space_Background_Music.mp3';

function Home() {
  const [analyser, setAnalyser] = useState(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  
  useEffect(() => {
    const setupAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const audio = new Audio(bgMusic);
        audio.loop = true;
        audio.volume = 0.6;
        audioRef.current = audio;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        setAnalyser(analyser);
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') {
              console.error("Audio playback failed:", error);
            }
          });
        }
      } catch (err) {
        console.error("Audio setup failed:", err);
      }
    };
    
    setupAudio();
    
    return () => {
      if (audioRef.current) {
        const audio = audioRef.current;
        
        if (!audio.paused) {
          audio.pause();
        }
        
        audio.currentTime = 0;
        audioRef.current = null;
      }
      
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(err => 
            console.error("Error closing audio context:", err)
          );
        }
      }
      
      setAnalyser(null);
    };
  }, []);

  return (
    <>
      <Nav />
      <div className='space'>
        <Galaxy />
      </div>
      <div className="container-space">
        <div className='cta'>
          <div className="heading-container">
            <h1>Generate. Create. Inspire.</h1>
            <div className='metaball'>
              <Metaball analyser={analyser} />
            </div>
          </div>
        </div>
        <p>Tap the ball to generate your sample!</p>
      </div>
    </>
  );
}

export default Home;