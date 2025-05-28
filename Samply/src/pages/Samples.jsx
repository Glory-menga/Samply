import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Peaks from 'peaks.js';
import Nav from '../components/Nav';
import SavedSamplesTab from '../components/tabs/SavedSamplesTab';
import AnimatedBackground from '../components/background/AnimatedBackground';
import { Save, ArrowDownToLine, Play, Pause, Share2, Lock, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';
import audioFile from '../assets/audio/Generate_Voice.mp3'; 
import '../css/Samples.css';

function Samples(){
    const navigate = useNavigate();
    const audioRef = useRef(null);
    const waveformRef = useRef(null);
    const peaksInstance = useRef(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState('00:00');
    const [currentTime, setCurrentTime] = useState('00:00');
    const [isLoaded, setIsLoaded] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);
            } catch (error) {
                console.error('Error checking auth:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        const audio = audioRef.current;
        
        if (!audio || !waveformRef.current) return;

        const initPeaks = () => {
            const options = {
                overview: {
                    container: waveformRef.current,
                    waveformColor: '#ffffff',
                    progressColor: '#000000', 
                    cursorColor: '#ffffff',
                    cursorWidth: 2,
                    showPlayheadTime: false,
                    timeLabelPrecision: 0,
                    enablePoints: false,
                    enableSegments: false,
                    enableMarkers: false,
                    showAxisLabels: false, 
                    axisTopMarkerHeight: 0, 
                    axisBottomMarkerHeight: 0,
                    axisLabelColor: 'transparent', 
                },
                mediaElement: audio,
                webAudio: {
                    audioContext: new (window.AudioContext || window.webkitAudioContext)(),
                },
                keyboard: false,
                mouseWheelMode: 'none',
                segmentOptions: {
                    markers: false,
                },
                zoomLevels: [1024],
                height: 40,
            };

            Peaks.init(options, (err, peaks) => {
                if (err) {
                    console.error('Peaks.js initialization error:', err);
                    return;
                }
                
                peaksInstance.current = peaks;
                setIsLoaded(true);
                
                const view = peaks.views.getView('overview');
                if (view) {
                    if (typeof view.enableAutoScroll === 'function') {
                        view.enableAutoScroll(false);
                    }
                    if (typeof view.enableMarkerEditing === 'function') {
                        view.enableMarkerEditing(false);
                    }
                }
                
                const player = peaks.player;
                const audioElement = audioRef.current;
                
                if (player && typeof player.on === 'function') {
                    player.on('play', () => {
                        setIsPlaying(true);
                    });
                    
                    player.on('pause', () => {
                        setIsPlaying(false);
                    });
                    
                    player.on('ended', () => {
                        setIsPlaying(false);
                        setCurrentTime('00:00');
                    });
                    
                    player.on('timeupdate', (time) => {
                        setCurrentTime(formatTime(time));
                    });
                    
                    player.on('canplay', () => {
                        const dur = player.getDuration();
                        setDuration(formatTime(dur));
                    });
                } else {
                    audioElement.addEventListener('play', () => {
                        setIsPlaying(true);
                    });
                    
                    audioElement.addEventListener('pause', () => {
                        setIsPlaying(false);
                    });
                    
                    audioElement.addEventListener('ended', () => {
                        setIsPlaying(false);
                        setCurrentTime('00:00');
                    });
                    
                    audioElement.addEventListener('timeupdate', () => {
                        setCurrentTime(formatTime(audioElement.currentTime));
                    });
                    
                    audioElement.addEventListener('canplay', () => {
                        setDuration(formatTime(audioElement.duration));
                    });
                }

                setTimeout(() => {
                    const waveformContainer = waveformRef.current;
                    if (waveformContainer) {
                        const textElements = waveformContainer.querySelectorAll('text, .time-label, .axis-label');
                        textElements.forEach(el => {
                            el.style.display = 'none';
                        });
                        
                        const svgTexts = waveformContainer.querySelectorAll('svg text');
                        svgTexts.forEach(el => {
                            el.style.display = 'none';
                        });
                    }
                }, 100);
            });
        };

        if (audio.readyState >= 2) {
            initPeaks();
        } else {
            audio.addEventListener('loadedmetadata', initPeaks, { once: true });
        }

        return () => {
            if (peaksInstance.current) {
                peaksInstance.current.destroy();
                peaksInstance.current = null;
            }
        };
    }, [user]);

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const togglePlayPause = () => {
        if (!user || !peaksInstance.current || !isLoaded) return;
        
        const player = peaksInstance.current.player;
        const audioElement = audioRef.current;
        
        if (isPlaying) {
            if (player && typeof player.pause === 'function') {
                player.pause();
            } else {
                audioElement.pause();
            }
        } else {
            if (player && typeof player.play === 'function') {
                player.play();
            } else {
                audioElement.play();
            }
        }
    };

    const handleWaveformClick = (event) => {
        if (!user || !peaksInstance.current || !isLoaded) return;
        
        const waveformContainer = waveformRef.current;
        const rect = waveformContainer.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const containerWidth = rect.width;
        const clickRatio = clickX / containerWidth;
        
        const player = peaksInstance.current.player;
        const audioElement = audioRef.current;
        
        let duration;
        if (player && typeof player.getDuration === 'function') {
            duration = player.getDuration();
        } else {
            duration = audioElement.duration;
        }
        
        const seekTime = duration * clickRatio;
        
        if (player && typeof player.seek === 'function') {
            player.seek(seekTime);
        } else {
            audioElement.currentTime = seekTime;
        }
    };

    const handleTimestampClick = () => {
        if (!user || !peaksInstance.current || !isLoaded) return;
        
        const timeInput = prompt("Enter time to seek to (format: mm:ss or seconds):");
        if (!timeInput) return;
        
        let seekTime = 0;
        
        if (timeInput.includes(':')) {
            const [minutes, seconds] = timeInput.split(':').map(Number);
            if (!isNaN(minutes) && !isNaN(seconds)) {
                seekTime = minutes * 60 + seconds;
            }
        } else {
            seekTime = parseFloat(timeInput);
        }
        
        if (!isNaN(seekTime) && seekTime >= 0) {
            const player = peaksInstance.current.player;
            const audioElement = audioRef.current;
            
            let duration;
            if (player && typeof player.getDuration === 'function') {
                duration = player.getDuration();
            } else {
                duration = audioElement.duration;
            }
            
            seekTime = Math.min(seekTime, duration);
            
            if (player && typeof player.seek === 'function') {
                player.seek(seekTime);
            } else {
                audioElement.currentTime = seekTime;
            }
        } else {
            alert('Invalid time format. Use mm:ss or seconds.');
        }
    };

    const pauseAudio = () => {
        if (!user || !peaksInstance.current || !isLoaded) return;
        
        const player = peaksInstance.current.player;
        const audioElement = audioRef.current;
        
        if (isPlaying) {
            if (player && typeof player.pause === 'function') {
                player.pause();
            } else {
                audioElement.pause();
            }
        }
    };

    const playAudio = () => {
        if (!user || !peaksInstance.current || !isLoaded) return;
        
        const player = peaksInstance.current.player;
        const audioElement = audioRef.current;
        
        if (!isPlaying) {
            if (player && typeof player.play === 'function') {
                player.play();
            } else {
                audioElement.play();
            }
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleSignup = () => {
        navigate('/signup');
    };

    if (loading) {
        return (
            <>
                <Nav />
                <AnimatedBackground/>
                <div className='sample-container'>
                    <SavedSamplesTab/>
                    <h1>Loading...</h1>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Nav />
                <AnimatedBackground/>
                <div className='sample-container'>
                    <div className='auth-required-overlay'>
                        <div className='auth-required-content'>
                            <Lock size={80} strokeWidth={1} color='#fff' />
                            <h1>Log in to view your posted samples.</h1>
                            <p>You need to be logged in to access your posted samples.</p>
                            <div className='auth-buttons'>
                                <button className='btn-login' onClick={handleLogin}>
                                    <LogIn size={20} strokeWidth={1} />
                                    <span>Log In</span>
                                </button>
                                <button className='btn-signup' onClick={handleSignup}>
                                    <span>Sign Up</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <SavedSamplesTab/>
                    <h1>Posted Samples</h1>
                    <div className='samples'>
                        <div className='sample'>
                            <div className='sample-audio'>
                                <div className='sample-intro'>
                                    <div className='sample-txt'>
                                        <p>Jazzy sample type beat</p>
                                    </div>
                                    <div className='sample-icons'>
                                        <button disabled>
                                            <Save size={32} strokeWidth={1} color='#666'/>
                                        </button>
                                        <button disabled>
                                            <ArrowDownToLine size={32} strokeWidth={1} color='#666'/>
                                        </button>
                                    </div>
                                </div>
                                <div className='audio-wave'>
                                    <div className='audio'>  
                                        <button 
                                            disabled
                                            style={{ 
                                                background: 'none', 
                                                border: 'none', 
                                                cursor: 'not-allowed',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                opacity: 0.5
                                            }}
                                            className='play-pause'
                                        >
                                            <Play size={40} strokeWidth={1} color='#666' fill='#666'/>
                                        </button>
                                        <div className='wave-time'>
                                            <div 
                                                className='wave' 
                                                ref={waveformRef}
                                                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                            ></div>
                                            <div 
                                                style={{ 
                                                    cursor: 'not-allowed',
                                                    userSelect: 'none',
                                                    opacity: 0.5
                                                }}
                                                className='time'
                                            >
                                                <p>00:00</p>
                                                <p> 00:00</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='share'>
                                        <button disabled>
                                            <Share2 size={30} strokeWidth={1} color='#666'/>
                                            <p>Share</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className='sample-date'>
                                <p>6:50 PM - 05th january 2025</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Audio element for Peaks.js */}
                <audio 
                    ref={audioRef} 
                    src={audioFile} 
                    preload="metadata"
                    style={{ display: 'none' }}
                />
            </>
        );
    }

    return(
        <>
            <Nav />
            <AnimatedBackground/>
            <div className='sample-container'>
                <SavedSamplesTab/>
                <h1>Posted Samples</h1>
                <div className='samples'>
                    <div className='sample'>
                        <div className='sample-audio'>
                            <div className='sample-intro'>
                                <div className='sample-txt'>
                                    <p>Jazzy sample type beat</p>
                                </div>
                                <div className='sample-icons'>
                                    <button>
                                        <Save size={32} strokeWidth={1} color='#fff'/>
                                    </button>
                                    <button>
                                        <ArrowDownToLine size={32} strokeWidth={1} color='#fff'/>
                                    </button>
                                </div>
                            </div>
                            <div className='audio-wave'>
                                <div className='audio'>  
                                    <button 
                                        onClick={togglePlayPause}
                                        disabled={!isLoaded}
                                        style={{ 
                                            background: 'none', 
                                            border: 'none', 
                                            cursor: isLoaded ? 'pointer' : 'not-allowed',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            opacity: isLoaded ? 1 : 0.5
                                        }}
                                        className='play-pause'
                                    >
                                        {isPlaying ? 
                                            <Pause size={40} strokeWidth={1} color='#fff' fill='#fff'/> :
                                            <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                        }
                                    </button>
                                    <div className='wave-time'>
                                        <div 
                                            className='wave' 
                                            ref={waveformRef}
                                            onClick={handleWaveformClick}
                                            style={{ cursor: 'pointer' }}
                                        ></div>
                                        <div 
                                            style={{ 
                                                cursor: 'pointer',
                                                userSelect: 'none'
                                            }}
                                            onClick={handleTimestampClick}
                                            title="Click to seek"
                                            className='time'
                                        >
                                            <p>{currentTime}</p>
                                            <p> {duration}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className='share'>
                                    <button>
                                        <Share2 size={30} strokeWidth={1} color='#fff'/>
                                        <p>Share</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className='sample-date'>
                            <p>6:50 PM - 05th january 2025</p>
                        </div>
                    </div>
                    
                    
                </div>
                
                {/* Audio element for Peaks.js */}
                <audio 
                    ref={audioRef} 
                    src={audioFile} 
                    preload="metadata"
                    style={{ display: 'none' }}
                />
            </div>
        </>
    );
}

export default Samples;