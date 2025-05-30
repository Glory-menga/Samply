import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Galaxy from '../components/3dObjects/Galaxy';
import { Play, Pause } from 'lucide-react';
import Metaball from '../components/3dObjects/Metaball';
import Knob from '../components/Knob';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { Save, ArrowDownToLine } from 'lucide-react';
import '../css/EditSample.css';

function EditSample(){
    const navigate = useNavigate();
    const [tempoValue, setTempoValue] = useState(2);
    const [sampleData, setSampleData] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLooping, setIsLooping] = useState(true);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [reverse, setReverse] = useState(false);
    
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    
    const tempoLevels = ['Very Fast', 'Fast', 'Normal', 'Slow', 'Very Slow'];

    useEffect(() => {
        const storedSampleData = localStorage.getItem('editSampleData');
        
        if (!storedSampleData) {
            navigate('/sample-generated');
            return;
        }

        try {
            const data = JSON.parse(storedSampleData);
            setSampleData(data);
        } catch (error) {
            console.error('Error parsing sample data:', error);
            navigate('/sample-generated');
        }
    }, [navigate]);

    useEffect(() => {
        if (sampleData && sampleData.sample.audio) {
            initializeAudio();
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [sampleData]);

    const initializeAudio = async () => {
        try {
            const proxyUrl = `http://localhost:5000/api/replicate/proxy-audio?url=${encodeURIComponent(sampleData.sample.audio)}`;
            
            // Create audio element
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.loop = isLooping;
            
            audio.addEventListener('loadedmetadata', () => {
                setDuration(audio.duration);
                setAudioLoaded(true);
            });

            audio.addEventListener('timeupdate', () => {
                setCurrentTime(audio.currentTime);
            });

            audio.addEventListener('ended', () => {
                if (!isLooping) {
                    setIsPlaying(false);
                }
            });

            audio.src = proxyUrl;
            audioRef.current = audio;

            // Create Web Audio API context for visualization
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContextRef.current.createMediaElementSource(audio);
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                
                source.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
            }

        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    };

    const handlePlayPause = async () => {
        if (!audioRef.current || !audioLoaded) return;

        try {
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                await audioRef.current.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    const handleDownload = async () => {
        if (!sampleData || !sampleData.sample.audio) return;

        try {
            const response = await fetch(`http://localhost:5000/api/replicate/proxy-audio?url=${encodeURIComponent(sampleData.sample.audio)}`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sampleData.sample.title}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading audio:', error);
            alert('Failed to download audio. Please try again.');
        }
    };

    const handleSave = () => {
        alert('Save functionality will be implemented based on your requirements.');
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleReverseToggle = (checked) => {
        setReverse(checked);
        console.log("Reverse is", checked ? "ON" : "OFF");
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.loop = isLooping;
        }
    }, [isLooping]);

    if (!sampleData) {
        return (
            <>
                <div className='space'>
                    <Galaxy />
                </div>
                <div className="edit-sample-container">
                    <div className="loading-message">
                        <h1>Loading sample...</h1>
                    </div>
                </div>
            </>
        );
    }

    return(
        <>
            <div className='space'>
                <Galaxy />
            </div>
            <div className="edit-sample-container">
                <div className="back">
                    <button onClick={() => navigate(-1)}> 
                        <p>Back to the generated samples</p>
                    </button>
                </div>
                <div className='edit-sample-wrapper'>
                    <motion.h1
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {sampleData.sample.title}
                    </motion.h1>
                    <div className='edit-metaball'>
                        <div className='edit-pitch-semitones'>
                            <Knob />
                            <div className='reverse-toggle'> 
                                <Checkbox.Root
                                    className="checkbox-custom"
                                    id="reverse"
                                    checked={reverse}
                                    onCheckedChange={handleReverseToggle}
                                >
                                    <Checkbox.Indicator className="checkbox-indicator">
                                        <CheckIcon />
                                    </Checkbox.Indicator>
                                </Checkbox.Root>
                                <p>Reverse: {reverse ? "ON" : "OFF"}</p>
                            </div>
                        </div>
                        <motion.div 
                            className='placement-metaball'
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                                duration: 0.8, 
                                ease: "easeOut",
                                delay: 0.3 
                            }}
                        >
                            <Metaball 
                                width="100%" 
                                height="100%" 
                                sphereScale={1.4}
                                analyser={analyserRef.current}
                                animationSpeed={isPlaying ? 1.5 : 0.3}
                                isHovering={isPlaying}
                            />
                        </motion.div>
                        <div className='edit-tempo'>
                            <div className="tempo-slider-wrapper">
                                <input
                                    type="range"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={4 - tempoValue}
                                    onChange={(e) => setTempoValue(4 - Number(e.target.value))}
                                    className="tempo-slider"
                                />
                                <p className="tempo-label">Tempo : {tempoLevels[tempoValue]}</p>
                            </div>
                        </div>
                    </div>
                    <div className='timestamps-edit-sample'>
                        <button 
                            onClick={handlePlayPause}
                            disabled={!audioLoaded}
                            className={!audioLoaded ? 'disabled' : ''}
                        >
                            {isPlaying ? (
                                <Pause size={32} strokeWidth={1} color='#fff' fill='#fff'/>
                            ) : (
                                <Play size={32} strokeWidth={1} color='#fff' fill='#fff'/>
                            )}
                        </button>
                        <div className='time-sample'>
                            <p>{formatTime(currentTime)}</p>
                            <p>/</p>
                            <p>{formatTime(duration)}</p>
                        </div>
                        <div className='loop-toggle'>
                            <Checkbox.Root
                                className="loop-checkbox-custom"
                                id="loop"
                                checked={isLooping}
                                onCheckedChange={setIsLooping}
                            >
                                <Checkbox.Indicator className="loop-checkbox-indicator">
                                    <CheckIcon />
                                </Checkbox.Indicator>
                            </Checkbox.Root>
                            <p>Loop: {isLooping ? "ON" : "OFF"}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className='edit-sample-icons'>
                <button onClick={handleSave}>
                    <Save size={32} strokeWidth={1} color='#fff'/>
                </button>
                <button onClick={handleDownload}>
                    <ArrowDownToLine size={32} strokeWidth={1} color='#fff'/>
                </button>
            </div>
        </>
    );
}

export default EditSample;