import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import ScrollToTopButton from '../components/ScrollToTopButton';
import AnimatedBackground from "../components/background/AnimatedBackground";
import { CircleUser, Heart, ArrowDownToLine, Play, Pause, Lock, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import '../css/SavedSamples.css'

function LikedSamples() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [likedSamples, setLikedSamples] = useState([]);
    const [loadingSamples, setLoadingSamples] = useState(false);
    const [audioStates, setAudioStates] = useState({});
    const [playingIndex, setPlayingIndex] = useState(null);
    
    const waveformRefs = useRef({});
    const waveSurferInstances = useRef({});

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.1
            }
        }
    };

    const titleVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    const backButtonVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: { 
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const contentVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.8,
                ease: "easeOut",
                delay: 0.2
            }
        }
    };

    const sampleVariants = {
        hidden: { opacity: 0, y: 40, scale: 0.95 },
        visible: (index) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                delay: index * 0.1
            }
        })
    };

    const authOverlayVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { 
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    const loadingVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

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
        if (user) {
            fetchLikedSamples();
        }
    }, [user]);

    const fetchLikedSamples = async () => {
        if (!user) return;
        
        setLoadingSamples(true);
        try {
            const response = await fetch(`https://samply-production.up.railway.app/api/community/user-liked-samples/${user.id}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to fetch liked samples:', errorData);
                toast.error('Failed to load liked samples');
                setLikedSamples([]);
                return;
            }

            const data = await response.json();
            setLikedSamples(data.samples || []);
            
            const initialStates = {};
            (data.samples || []).forEach((_, index) => {
                initialStates[index] = {
                    isPlaying: false,
                    duration: '00:00',
                    currentTime: '00:00',
                    isLoaded: false,
                    isLoading: false,
                    hasError: false
                };
            });
            setAudioStates(initialStates);
            
        } catch (error) {
            console.error('Error fetching liked samples:', error);
            toast.error('Failed to load liked samples');
            setLikedSamples([]);
        } finally {
            setLoadingSamples(false);
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const testAudioUrl = async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error('Audio URL test failed:', error);
            return false;
        }
    };

    const initializeWaveSurfer = async (sample, index) => {
        const waveformRef = waveformRefs.current[index];
        
        if (!waveformRef || waveSurferInstances.current[index]) {
            console.log(`Skipping initialization for index ${index}: ref=${!!waveformRef}, instance=${!!waveSurferInstances.current[index]}`);
            return;
        }

        console.log(`Initializing WaveSurfer for sample ${index}:`, sample.title, sample.sample_url);

        setAudioStates(prev => ({
            ...prev,
            [index]: { 
                ...prev[index], 
                isLoading: true,
                hasError: false
            }
        }));

        const isUrlAccessible = await testAudioUrl(sample.sample_url);
        if (!isUrlAccessible) {
            console.error(`Audio URL not accessible for sample ${index}:`, sample.sample_url);
            setAudioStates(prev => ({
                ...prev,
                [index]: { 
                    ...prev[index], 
                    isLoading: false,
                    hasError: true
                }
            }));
            toast.error(`Audio file not accessible for "${sample.title}"`);
            return;
        }

        try {
            if (waveSurferInstances.current[index]) {
                waveSurferInstances.current[index].destroy();
                delete waveSurferInstances.current[index];
            }

            const wavesurfer = WaveSurfer.create({
                container: waveformRef,
                waveColor: '#ffffff',
                progressColor: '#212121',
                cursorColor: '#000000',
                cursorWidth: 1,
                barWidth: 1,
                barGap: 1,
                height: 60,
                normalize: true,
                backend: 'WebAudio',
                mediaControls: false,
                interact: true,
                hideScrollbar: true,
                fillParent: true,
                responsive: true,
                crossOrigin: 'anonymous'
            });

            waveSurferInstances.current[index] = wavesurfer;

            wavesurfer.on('ready', () => {
                console.log(`WaveSurfer ready for sample ${index}`);
                const duration = wavesurfer.getDuration();
                setAudioStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        isLoaded: true,
                        isLoading: false,
                        hasError: false,
                        duration: formatTime(duration)
                    }
                }));
            });

            wavesurfer.on('play', () => {
                setAudioStates(prev => ({
                    ...prev,
                    [index]: { ...prev[index], isPlaying: true }
                }));
                setPlayingIndex(index);
            });

            wavesurfer.on('pause', () => {
                setAudioStates(prev => ({
                    ...prev,
                    [index]: { ...prev[index], isPlaying: false }
                }));
                if (playingIndex === index) {
                    setPlayingIndex(null);
                }
            });

            wavesurfer.on('finish', () => {
                setAudioStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        isPlaying: false, 
                        currentTime: '00:00' 
                    }
                }));
                if (playingIndex === index) {
                    setPlayingIndex(null);
                }
            });

            wavesurfer.on('audioprocess', () => {
                const currentTime = wavesurfer.getCurrentTime();
                setAudioStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        currentTime: formatTime(currentTime) 
                    }
                }));
            });

            wavesurfer.on('seek', () => {
                const currentTime = wavesurfer.getCurrentTime();
                setAudioStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        currentTime: formatTime(currentTime) 
                    }
                }));
            });

            wavesurfer.on('error', (error) => {
                console.error(`WaveSurfer error for sample ${index}:`, error);
                setAudioStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        isLoading: false,
                        hasError: true
                    }
                }));
                toast.error(`Failed to load audio for "${sample.title}"`);
            });

            wavesurfer.on('loading', (percent) => {
                console.log(`Loading ${percent}% for sample ${index}`);
            });

            console.log(`Loading audio for sample ${index}:`, sample.sample_url);
            wavesurfer.load(sample.sample_url);

        } catch (error) {
            console.error(`Error initializing WaveSurfer for sample ${index}:`, error);
            setAudioStates(prev => ({
                ...prev,
                [index]: { 
                    ...prev[index], 
                    isLoading: false,
                    hasError: true
                }
            }));
            toast.error(`Failed to initialize audio player for "${sample.title}"`);
        }
    };

    useEffect(() => {
        if (likedSamples.length > 0) {
            Object.values(waveSurferInstances.current).forEach(wavesurfer => {
                if (wavesurfer && typeof wavesurfer.destroy === 'function') {
                    try {
                        wavesurfer.destroy();
                    } catch (error) {
                        console.warn('Error destroying WaveSurfer instance:', error);
                    }
                }
            });
            waveSurferInstances.current = {};

            const timer = setTimeout(() => {
                likedSamples.forEach((sample, index) => {
                    if (waveformRefs.current[index]) {
                        setTimeout(() => {
                            initializeWaveSurfer(sample, index);
                        }, index * 200); 
                    }
                });
            }, 300);

            return () => clearTimeout(timer);
        }

        return () => {
            Object.values(waveSurferInstances.current).forEach(wavesurfer => {
                if (wavesurfer && typeof wavesurfer.destroy === 'function') {
                    try {
                        wavesurfer.destroy();
                    } catch (error) {
                        console.warn('Error destroying WaveSurfer instance:', error);
                    }
                }
            });
            waveSurferInstances.current = {};
        };
    }, [likedSamples]);

    const togglePlayPause = (index) => {
        const wavesurfer = waveSurferInstances.current[index];
        const audioState = audioStates[index];
        
        if (!wavesurfer || !audioState?.isLoaded) {
            if (audioState?.hasError) {
                toast.error('Audio failed to load. Please try refreshing the page.');
            }
            return;
        }

        if (playingIndex !== null && playingIndex !== index) {
            const otherWaveSurfer = waveSurferInstances.current[playingIndex];
            if (otherWaveSurfer && typeof otherWaveSurfer.isPlaying === 'function' && otherWaveSurfer.isPlaying()) {
                otherWaveSurfer.pause();
            }
        }
        
        try {
            if (audioState.isPlaying) {
                wavesurfer.pause();
            } else {
                wavesurfer.play();
            }
        } catch (error) {
            console.error('Error toggling play/pause:', error);
            toast.error('Error playing audio');
        }
    };

    const handleDownload = async (sample) => {
        try {
            const response = await fetch(sample.sample_url);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sample.title}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Download started!');
        } catch (error) {
            console.error('Error downloading audio:', error);
            toast.error('Failed to download audio');
        }
    };

    const handleUnlike = async (sampleId, index) => {
        if (!user) return;

        try {
            const response = await fetch(`https://samply-production.up.railway.app/api/community/samples/${sampleId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                setLikedSamples(prev => prev.filter(sample => sample.id !== sampleId));
                toast.info('Sample removed from liked samples');
            } else {
                toast.error(data.error || 'Failed to unlike sample');
            }
        } catch (error) {
            console.error('Error unliking sample:', error);
            toast.error('Failed to unlike sample');
        }
    };

    const handleGoBack = () => {
        if (!user) return;
        navigate(-1);
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleSignup = () => {
        navigate('/signup');
    };

    const getButtonStyle = (index) => {
        const audioState = audioStates[index];
        if (!audioState) return { opacity: 0.5, cursor: 'not-allowed' };
        
        if (audioState.isLoading) {
            return { opacity: 0.7, cursor: 'wait' };
        }
        
        if (audioState.hasError) {
            return { opacity: 0.3, cursor: 'not-allowed' };
        }
        
        if (audioState.isLoaded) {
            return { opacity: 1, cursor: 'pointer' };
        }
        
        return { opacity: 0.5, cursor: 'not-allowed' };
    };

    if (loading) {
        return (
            <>
                <AnimatedBackground/>
                <ScrollToTopButton />
                <motion.div 
                    className="saved-samples-container"
                    variants={loadingVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div 
                        className="back"
                        variants={backButtonVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <button disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            <p>Loading...</p>
                        </button>
                    </motion.div>
                    <motion.div 
                        className='savings'
                        variants={titleVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1>Liked Samples</h1>
                    </motion.div>
                </motion.div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <AnimatedBackground/>
                <ScrollToTopButton />
                <motion.div 
                    className='auth-required-overlay'
                    variants={authOverlayVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className='auth-required-content'>
                        <Lock size={80} strokeWidth={1} color='#fff' />
                        <h1>Log in to view liked samples.</h1>
                        <p>You need to be logged in to access your liked samples. Please log in or create an account to view your saved collection.</p>
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
                </motion.div>
                <motion.div 
                    className="saved-samples-container"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div 
                        className="back"
                        variants={backButtonVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <button disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            <p>Go Back</p>
                        </button>
                    </motion.div>
                    <motion.div 
                        className='savings'
                        variants={titleVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1>Liked Samples</h1>
                        <motion.div 
                            className='saved-samples-wrapper'
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <div className='saved-sample'>
                                <h3>Rainy melody with harmonic violins</h3>
                                <div className='audios-saved-sample'>
                                    <div className='audio-saved-sample'>
                                        <div className='info-saved-sample'>
                                            <div className='profile-saved-sample'>
                                                <CircleUser size={32} strokeWidth={1} color='#666' />
                                                <p style={{ color: '#666' }}>Glory</p>
                                            </div>
                                            <div className='saved-sample-icons'>
                                                <button disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                    <ArrowDownToLine size={32} strokeWidth={1} color='#666'/>
                                                </button>
                                            </div>
                                        </div>
                                        <div className='wave-saved-sample'>
                                            <button disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                <Play size={40} strokeWidth={1} color='#666' fill='#666'/>
                                            </button>
                                            <div className='wave-sample'>
                                                <div className='waveform-saved-sample' style={{ opacity: 0.5 }}>
                                                    wave
                                                </div>
                                                <div className='timestamps-saved-sample' style={{ opacity: 0.5 }}>
                                                    <p>00:00</p>
                                                    <p>00:20</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='prompt-saved-sample'>
                                        <div className='like-icon'>
                                            <div className='heart-icon'>
                                                <Heart size={32} strokeWidth={1} color='#666'/>
                                            </div>
                                        </div>
                                        <p style={{ opacity: 0.5 }}>Craft a smooth jazz melody with a walking bassline, mellow piano chords, and a soulful saxophone lead. Add soft brush drums and a touch of vibraphone for a cozy, late-night lounge vibe.</p>
                                    </div>
                                </div>
                                <div className='white-line' style={{ opacity: 0.5 }}></div>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </>
        );
    }

    return (
        <>
            <AnimatedBackground/>
            <ScrollToTopButton />
            <motion.div 
                className="saved-samples-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div 
                    className="back"
                    variants={backButtonVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <button onClick={handleGoBack}> <p>Go Back</p></button>
                </motion.div>
                <motion.div 
                    className='savings'
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <h1>Liked Samples</h1>
                    <motion.div 
                        className='saved-samples-wrapper'
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {loadingSamples ? (
                            <motion.div 
                                className="loading-message"
                                variants={loadingVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <p>Loading your liked samples...</p>
                            </motion.div>
                        ) : likedSamples.length === 0 ? (
                            <motion.div 
                                className="no-content-message"
                                variants={contentVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <p>You haven't liked any samples yet.</p>
                                <p>Go to the community page to discover and like some amazing samples!</p>
                            </motion.div>
                        ) : (
                            likedSamples.map((sample, index) => (
                                <motion.div 
                                    key={sample.id} 
                                    className='saved-sample'
                                    variants={sampleVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={index}
                                >
                                    <h3>{sample.title}</h3>
                                    <div className='audios-saved-sample'>
                                        <div className='audio-saved-sample'>
                                            <div className='info-saved-sample'>
                                                <div className='profile-saved-sample'>
                                                    <div 
                                                        className='profile-pic-saved'
                                                        style={{
                                                            backgroundImage: sample.user?.profile_picture ? `url(${sample.user.profile_picture})` : 'none',
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden',
                                                            marginRight: '8px'
                                                        }}
                                                    >
                                                        {!sample.user?.profile_picture && (
                                                            <CircleUser size={32} strokeWidth={1} color='#fff' />
                                                        )}
                                                    </div>
                                                    <p>{sample.user?.username || 'Unknown User'}</p>
                                                </div>
                                                <div className='saved-sample-icons'>
                                                    <button onClick={() => handleDownload(sample)}>
                                                        <ArrowDownToLine size={32} strokeWidth={1} color='#fff'/>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className='wave-saved-sample'>
                                                <button 
                                                    onClick={() => togglePlayPause(index)}
                                                    disabled={!audioStates[index]?.isLoaded}
                                                    style={getButtonStyle(index)}
                                                    title={
                                                        audioStates[index]?.isLoading ? 'Loading audio...' :
                                                        audioStates[index]?.hasError ? 'Audio failed to load' :
                                                        audioStates[index]?.isLoaded ? 'Click to play' : 'Audio loading...'
                                                    }
                                                >
                                                    {audioStates[index]?.isLoading ? (
                                                        <div style={{ 
                                                            width: '40px', 
                                                            height: '40px', 
                                                            border: '2px solid rgba(255,255,255,0.3)', 
                                                            borderTop: '2px solid #fff', 
                                                            borderRadius: '50%', 
                                                            animation: 'spin 1s linear infinite' 
                                                        }} />
                                                    ) : audioStates[index]?.isPlaying ? (
                                                        <Pause size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                                    ) : (
                                                        <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                                    )}
                                                </button>
                                                <div className='wave-sample'>
                                                    <div 
                                                        className='waveform-saved-sample'
                                                        ref={el => waveformRefs.current[index] = el}
                                                        style={{
                                                            opacity: audioStates[index]?.hasError ? 0.3 : 1
                                                        }}
                                                    ></div>
                                                    <div className='timestamps-saved-sample'>
                                                        <p>{audioStates[index]?.currentTime || '00:00'}</p>
                                                        <p>{audioStates[index]?.duration || '00:00'}</p>
                                                    </div>
                                                    {audioStates[index]?.hasError && (
                                                        <p style={{ 
                                                            fontSize: '12px', 
                                                            color: '#ff6b6b', 
                                                            textAlign: 'center',
                                                            marginTop: '5px'
                                                        }}>
                                                            Audio failed to load
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className='prompt-saved-sample'>
                                            <div className='like-icon'>
                                                <div 
                                                    className='heart-icon'
                                                    onClick={() => handleUnlike(sample.id, index)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <Heart size={32} strokeWidth={1} color='#fff' fill='#fff'/>
                                                </div>
                                            </div>
                                            <p>{sample.prompt}</p>
                                        </div>
                                    </div>
                                    <div className='white-line'></div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>
        </>
    );
}

export default LikedSamples