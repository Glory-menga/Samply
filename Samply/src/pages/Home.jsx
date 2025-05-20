import { useEffect, useRef, useState } from 'react';
import Nav from '../components/Nav';
import Galaxy from '../components/3dObjects/Galaxy';
import Metaball from '../components/3dObjects/Metaball';
import bgMusic from '../assets/audio/Space_Background_Music.mp3';

function Home() {
  const [analyser, setAnalyser] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        const audio = new Audio(bgMusic);
        audio.loop = true;
        audio.volume = 0.6;
        await audio.play();

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        audioRef.current = audio;
        setAnalyser(analyser);
      } catch (err) {
        console.error("Audio setup failed:", err);
      }
    };

    setupAudio();
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
