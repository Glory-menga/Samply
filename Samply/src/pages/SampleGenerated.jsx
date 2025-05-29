import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from "../components/background/AnimatedBackground";
import { ArrowDownToLine, Save, Play, Pause } from 'lucide-react';
import Metaball from '../components/3dObjects/Metaball';
import WaveSurfer from 'wavesurfer.js';
import '../css/SampleGenerated.css';

function SampleGenerated(){
    const navigate = useNavigate();
    const [samples, setSamples] = useState([]);
    const [originalPrompt, setOriginalPrompt] = useState('');
    const [correctedPrompt, setCorrectedPrompt] = useState('');
    const [playingIndex, setPlayingIndex] = useState(null);
    const [currentTime, setCurrentTime] = useState([0, 0]);
    const [duration, setDuration] = useState([0, 0]);
    const [loading, setLoading] = useState(true);
    const [wavesurferReady, setWavesurferReady] = useState([false, false]);
    const [loadingErrors, setLoadingErrors] = useState([null, null]);
    
    const waveformRefs = useRef([]);
    const wavesurferRefs = useRef([]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3
            }
        }
    };

    const sampleVariants = {
        hidden: { 
            opacity: 0, 
            y: 50 
        },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const promptVariants = {
        hidden: { 
            opacity: 0, 
            y: 30 
        },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                delay: 1
            }
        }
    };

    useEffect(() => {
        const storedSamples = localStorage.getItem('generatedSamples');
        
        if (!storedSamples) {
            navigate('/generate');
            return;
        }

        try {
            const data = JSON.parse(storedSamples);
            setSamples(data.samples || []);
            setOriginalPrompt(data.originalPrompt || '');
            setCorrectedPrompt(data.correctedPrompt || '');
            
            waveformRefs.current = new Array(data.samples?.length || 0).fill(null);
            wavesurferRefs.current = new Array(data.samples?.length || 0).fill(null);
            setCurrentTime(new Array(data.samples?.length || 0).fill(0));
            setDuration(new Array(data.samples?.length || 0).fill(0));
            setWavesurferReady(new Array(data.samples?.length || 0).fill(false));
            setLoadingErrors(new Array(data.samples?.length || 0).fill(null));
        } catch (error) {
            console.error('Error parsing stored samples:', error);
            navigate('/generate');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (samples.length > 0) {
            samples.forEach((sample, index) => {
                if (sample && sample.audio && waveformRefs.current[index] && !wavesurferRefs.current[index]) {
                    try {
                        const wavesurfer = WaveSurfer.create({
                            container: waveformRefs.current[index],
                            waveColor: '#ffffff',
                            progressColor: '#212121',
                            cursorColor: '#000000',
                            barWidth: 1,
                            responsive: true,
                            height: 60,
                            normalize: true,
                            backend: 'WebAudio',
                            interact: true,
                            mediaControls: false,
                            audioRate: 1,
                            xhr: {
                                cache: 'default',
                                mode: 'cors',
                                credentials: 'omit',
                                headers: [
                                    { key: 'cache-control', value: 'no-cache' }
                                ]
                            }
                        });

                        const proxyUrl = `http://localhost:5000/api/replicate/proxy-audio?url=${encodeURIComponent(sample.audio)}`;
                        
                        wavesurfer.load(proxyUrl);

                        wavesurfer.on('ready', () => {
                            setWavesurferReady(prev => {
                                const newReady = [...prev];
                                newReady[index] = true;
                                return newReady;
                            });
                            
                            setDuration(prev => {
                                const newDuration = [...prev];
                                newDuration[index] = wavesurfer.getDuration();
                                return newDuration;
                            });
                            
                            setLoadingErrors(prev => {
                                const newErrors = [...prev];
                                newErrors[index] = null;
                                return newErrors;
                            });
                            
                            setTimeout(() => {
                                wavesurfer.drawBuffer();
                            }, 100);
                        });

                        wavesurfer.on('error', (error) => {
                            console.error(`WaveSurfer error for sample ${index}:`, error);
                            const newErrors = [...loadingErrors];
                            newErrors[index] = `Failed to load audio: ${error}`;
                            setLoadingErrors(newErrors);
                            
                            const newReady = [...wavesurferReady];
                            newReady[index] = false;
                            setWavesurferReady(newReady);
                        });

                        wavesurfer.on('audioprocess', () => {
                            const newCurrentTime = [...currentTime];
                            newCurrentTime[index] = wavesurfer.getCurrentTime();
                            setCurrentTime(newCurrentTime);
                        });

                        wavesurfer.on('seek', () => {
                            const newCurrentTime = [...currentTime];
                            newCurrentTime[index] = wavesurfer.getCurrentTime();
                            setCurrentTime(newCurrentTime);
                        });

                        wavesurfer.on('play', () => {
                            setPlayingIndex(index);
                        });

                        wavesurfer.on('pause', () => {
                            if (playingIndex === index) {
                                setPlayingIndex(null);
                            }
                        });

                        wavesurfer.on('finish', () => {
                            setPlayingIndex(null);
                        });

                        wavesurfer.on('interaction', (time) => {
                            setCurrentTime(prev => {
                                const newTime = [...prev];
                                newTime[index] = time;
                                return newTime;
                            });
                        });

                        fetch(proxyUrl, { method: 'HEAD' })
                            .then(response => {
                                if (!response.ok) {
                                    console.error(`Audio URL not accessible for sample ${index}`);
                                }
                            })
                            .catch(error => {
                                console.error(`Failed to test audio URL for sample ${index}:`, error);
                            });

                        wavesurferRefs.current[index] = wavesurfer;
                    } catch (error) {
                        console.error(`Failed to create WaveSurfer for sample ${index}:`, error);
                        const newErrors = [...loadingErrors];
                        newErrors[index] = `Failed to initialize audio player: ${error.message}`;
                        setLoadingErrors(newErrors);
                    }
                }
            });
        }

        return () => {
            wavesurferRefs.current.forEach(wavesurfer => {
                if (wavesurfer) {
                    wavesurfer.destroy();
                }
            });
        };
    }, [samples]);

    const handlePlay = async (index) => {
        const wavesurfer = wavesurferRefs.current[index];
        if (!wavesurfer || !wavesurferReady[index]) {
            return;
        }

        if (playingIndex !== null && playingIndex !== index && wavesurferRefs.current[playingIndex]) {
            wavesurferRefs.current[playingIndex].pause();
        }

        if (playingIndex === index) {
            wavesurfer.pause();
            setPlayingIndex(null);
        } else {
            wavesurfer.play();
            setPlayingIndex(index);
        }
    };

    const handleDownload = async (index) => {
        const sample = samples[index];
        if (!sample || !sample.audio) return;

        try {
            const response = await fetch(`http://localhost:5000/api/replicate/proxy-audio?url=${encodeURIComponent(sample.audio)}`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sample.title}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading audio:', error);
            alert('Failed to download audio. Please try again.');
        }
    };

    const handleSave = (index) => {
        alert('Save functionality will be implemented based on your requirements.');
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleGenerateNew = () => {
        localStorage.removeItem('generatedSamples');
        navigate('/generate');
    };

    const handleRetryLoad = (index) => {
        const wavesurfer = wavesurferRefs.current[index];
        if (wavesurfer) {
            wavesurfer.destroy();
            wavesurferRefs.current[index] = null;
            
            const newErrors = [...loadingErrors];
            newErrors[index] = null;
            setLoadingErrors(newErrors);
            
            const newReady = [...wavesurferReady];
            newReady[index] = false;
            setWavesurferReady(newReady);
            
            setSamples([...samples]);
        }
    };

    if (loading) {
        return (
            <>
                <AnimatedBackground />
                <div className="sample-generated-container">
                    <div className="loading-message">
                        <h1>Loading your samples...</h1>
                    </div>
                </div>
            </>
        );
    }

    if (samples.length === 0) {
        return (
            <>
                <AnimatedBackground />
                <div className="sample-generated-container">
                    <div className="no-samples">
                        <h1>No samples found</h1>
                        <button onClick={() => navigate('/generate')}>
                            Generate New Samples
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return(
        <>
            <AnimatedBackground />
            <div className="sample-generated-container">
                <div className="back">
                    <button onClick={handleGenerateNew}>
                        <p>Generate New Samples</p>
                    </button>
                </div>
                <div className='sample-generated-wrapper'>
                    <motion.div 
                        className='intro-sample-generated'
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <h1>Choose Your Sound: Two Unique Samples Await</h1>
                    </motion.div>
                    <motion.div 
                        className='generated-samples'
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className='generated-sample'>
                            {samples.map((sample, index) => (
                                <motion.div 
                                    key={index} 
                                    className='sample-gen'
                                    variants={sampleVariants}
                                >
                                    <div className='audio-generated-sample'>
                                        <div className='intro-audio-gen'>
                                            <div className='name-generated-sample'>
                                                <p><b>{index + 1}.</b></p>
                                                <p>{sample.title}</p>
                                            </div>
                                            <div className='generated-sample-icons'>
                                                <button onClick={() => handleDownload(index)}>
                                                    <ArrowDownToLine size={28} strokeWidth={1} color='#fff'/>
                                                </button>
                                                <button onClick={() => handleSave(index)}>
                                                    <Save size={28} strokeWidth={1} color='#fff'/>
                                                </button>
                                            </div>
                                        </div>
                                        <div className='wave-generated-sample'>
                                            <div className='waveform-gen'>
                                                <button 
                                                    onClick={() => handlePlay(index)}
                                                    disabled={!wavesurferReady[index]}
                                                    className={!wavesurferReady[index] ? 'disabled' : ''}
                                                >
                                                    {playingIndex === index ? (
                                                        <Pause size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                                    ) : (
                                                        <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                                    )}
                                                </button>
                                                <div className='wave-gen'>
                                                    <div 
                                                        ref={el => waveformRefs.current[index] = el}
                                                        className='waveform-container'
                                                        style={{ width: '100%', minHeight: '60px' }}
                                                    >
                                                        {!wavesurferReady[index] && !loadingErrors[index] && (
                                                            <div className='waveform-loading'>Loading waveform...</div>
                                                        )}
                                                        {loadingErrors[index] && (
                                                            <div className='waveform-error'>
                                                                <p>{loadingErrors[index]}</p>
                                                                <button onClick={() => handleRetryLoad(index)} className='retry-button'>
                                                                    Retry
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className='timestamps-generated-sample'>
                                                        <p>{formatTime(currentTime[index] || 0)}</p>
                                                        <p>{duration[index] > 0 ? formatTime(duration[index]) : '--:--'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='edit-generated-sample'>
                                                <div className='gen-metaball'>
                                                    <Metaball />
                                                </div>
                                                <p>Edit Sample</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='post-gen-sample'>
                                        <p>Publish Now</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <motion.div 
                            className='generated-prompt'
                            variants={promptVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <div className='gen-prompt'>
                                <p>{correctedPrompt}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}

export default SampleGenerated;