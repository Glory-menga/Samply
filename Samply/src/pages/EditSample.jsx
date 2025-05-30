import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Galaxy from '../components/3dObjects/Galaxy';
import { Play, Square } from 'lucide-react';
import Metaball from '../components/3dObjects/Metaball';
import Knob from '../components/Knob';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { Save, ArrowDownToLine } from 'lucide-react';
import * as Tone from 'tone';
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
    const [pitchShift, setPitchShift] = useState(0); 
    
    const playerRef = useRef(null);
    const pitchShiftRef = useRef(null);
    const analyserRef = useRef(null);
    const webAudioAnalyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    
    const tempoLevels = ['Very Fast', 'Fast', 'Normal', 'Slow', 'Very Slow'];
    // Tempo multipliers: Very Fast = 2x, Fast = 1.5x, Normal = 1x, Slow = 0.75x, Very Slow = 0.5x
    const tempoMultipliers = [2, 1.5, 1, 0.75, 0.5];

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
            cleanup();
        };
    }, [sampleData]);

    useEffect(() => {
        if (playerRef.current && audioLoaded) {
            playerRef.current.reverse = reverse;
        }
    }, [reverse, audioLoaded]);

    useEffect(() => {
        if (pitchShiftRef.current) {
            pitchShiftRef.current.pitch = pitchShift;
        }
    }, [pitchShift]);

    // Effect to handle tempo changes
    useEffect(() => {
        if (playerRef.current && audioLoaded) {
            const playbackRate = tempoMultipliers[tempoValue];
            playerRef.current.playbackRate = playbackRate;
        }
    }, [tempoValue, audioLoaded]);

    const cleanup = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (playerRef.current) {
            playerRef.current.dispose();
            playerRef.current = null;
        }
        if (pitchShiftRef.current) {
            pitchShiftRef.current.dispose();
            pitchShiftRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.dispose();
            analyserRef.current = null;
        }
        if (webAudioAnalyserRef.current) {
            webAudioAnalyserRef.current = null;
        }
    };

    const initializeAudio = async () => {
        try {
            cleanup();

            const proxyUrl = `http://localhost:5000/api/replicate/proxy-audio?url=${encodeURIComponent(sampleData.sample.audio)}`;
            
            playerRef.current = new Tone.Player({
                url: proxyUrl,
                loop: isLooping,
                reverse: reverse,
                playbackRate: tempoMultipliers[tempoValue], // Set initial tempo
                onload: () => {
                    setDuration(playerRef.current.buffer.duration);
                    setAudioLoaded(true);
                    console.log('Audio loaded successfully');
                },
                onerror: (error) => {
                    console.error('Error loading audio:', error);
                }
            });

            pitchShiftRef.current = new Tone.PitchShift({
                pitch: pitchShift,
                windowSize: 0.1,
                overlap: 0.25,
                delayTime: 0
            });

            analyserRef.current = new Tone.Analyser('waveform', 256);

            const audioContext = Tone.getContext().rawContext;
            webAudioAnalyserRef.current = audioContext.createAnalyser();
            webAudioAnalyserRef.current.fftSize = 256;
            webAudioAnalyserRef.current.smoothingTimeConstant = 0.8;

            playerRef.current.connect(pitchShiftRef.current);
            pitchShiftRef.current.toDestination();
            
            pitchShiftRef.current.connect(analyserRef.current);
            
            const toneNode = pitchShiftRef.current.output;
            toneNode.connect(webAudioAnalyserRef.current);

            playerRef.current.onstop = () => {
                setIsPlaying(false);
                setCurrentTime(0);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };

        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    };

    const handlePlayPause = async () => {
        if (!playerRef.current || !audioLoaded) return;

        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }

            if (isPlaying) {
                playerRef.current.stop();
                Tone.Transport.stop();
                setIsPlaying(false);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            } else {
                Tone.Transport.start();
                playerRef.current.start();
                setIsPlaying(true);
                
                let startTime = Tone.now();
                const updateTime = () => {
                    if (playerRef.current && playerRef.current.state === 'started') {
                        const elapsed = Tone.now() - startTime;
                        const adjustedDuration = duration / tempoMultipliers[tempoValue]; // Adjust duration based on tempo
                        
                        if (elapsed >= adjustedDuration) {
                            if (isLooping) {
                                startTime = Tone.now();
                                setCurrentTime(0);
                            } else {
                                playerRef.current.stop();
                                setIsPlaying(false);
                                setCurrentTime(0);
                                return;
                            }
                        } else {
                            setCurrentTime(elapsed);
                        }
                        
                        animationFrameRef.current = requestAnimationFrame(updateTime);
                    } else {
                        setIsPlaying(false);
                        setCurrentTime(0);
                    }
                };
                updateTime();
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
        
        if (isPlaying && playerRef.current) {
            playerRef.current.stop();
            setIsPlaying(false);
        }
    };

    const handlePitchChange = (value) => {
        setPitchShift(value);
        // Removed console.log message
    };

    const handleTempoChange = (value) => {
        setTempoValue(value);
        // If currently playing, update playback rate immediately
        if (playerRef.current && audioLoaded) {
            playerRef.current.playbackRate = tempoMultipliers[value];
        }
    };

    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.loop = isLooping;
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
                            <Knob onChange={handlePitchChange} />
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
                                analyser={webAudioAnalyserRef.current}
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
                                    onChange={(e) => handleTempoChange(4 - Number(e.target.value))}
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
                                <Square  size={32} strokeWidth={1} color='#fff' fill='#fff'/>
                            ) : (
                                <Play size={32} strokeWidth={1} color='#fff' fill='#fff'/>
                            )}
                        </button>
                        <div className='time-sample'>
                            <p>{formatTime(currentTime)}</p>
                            <p>/</p>
                            <p>{formatTime(duration / tempoMultipliers[tempoValue])}</p>
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