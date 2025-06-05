import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import WaveSurfer from 'wavesurfer.js';
import ScrollToTopButton from '../components/ScrollToTopButton';
import AnimatedBackground from "../components/background/AnimatedBackground";
import { CircleUser, SaveOff, ArrowDownToLine, Play, Pause, Lock, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import '../css/SavedSamples.css';

const UnsaveConfirmationModal = ({ isOpen, sampleName, onConfirm, onCancel, isUnsaving }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="unsave-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div 
                        className="unsave-modal-content"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.3, type: "spring", damping: 20 }}
                    >
                        <div className="unsave-modal-header">
                            <h2>Unsave Sample</h2>
                        </div>
                        <div className="unsave-modal-body">
                            <p>Are you sure you want to unsave the sample</p>
                            <p className="sample-name-highlight">"{sampleName}"?</p>
                            <p>You can save it again later if needed.</p>
                        </div>
                        <div className="unsave-modal-actions">
                            <button 
                                className="btn-cancel"
                                onClick={onCancel}
                                disabled={isUnsaving}
                            >
                                No, Keep Saved
                            </button>
                            <button 
                                className="btn-unsave"
                                onClick={onConfirm}
                                disabled={isUnsaving}
                            >
                                {isUnsaving ? (
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <div className="unsave-spinner"></div>
                                        Unsaving...
                                    </div>
                                ) : (
                                    'Yes, Unsave'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

function SavedSamples() {
    const navigate = useNavigate();
    const waveformRefs = useRef({});
    const waveSurferInstances = useRef({});
    
    const [playingIndex, setPlayingIndex] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [samples, setSamples] = useState([]);
    const [loadingSamples, setLoadingSamples] = useState(false);
    const [audioStates, setAudioStates] = useState({});
    const [unsaveModal, setUnsaveModal] = useState({
        isOpen: false,
        sampleId: null,
        sampleName: '',
        sampleIndex: null,
        isUnsaving: false
    });

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

    const samplesContainerVariants = {
        hidden: { opacity: 0, y: 50 },
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

    const sampleItemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (index) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                delay: index * 0.1
            }
        })
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
            fetchSavedSamples();
        }
    }, [user]);

    const fetchSavedSamples = async () => {
        if (!user) return;

        setLoadingSamples(true);
        try {
            const response = await fetch(`https://samply-production.up.railway.app/api/community/user-saved-samples/${user.id}`);
            const data = await response.json();

            if (response.ok) {
                setSamples(data.samples || []);
                const initialStates = {};
                data.samples?.forEach((_, index) => {
                    initialStates[index] = {
                        isPlaying: false,
                        duration: '00:00',
                        currentTime: '00:00',
                        isLoaded: false
                    };
                });
                setAudioStates(initialStates);
            } else {
                console.error('Failed to fetch saved samples:', data.error);
                toast.error('Failed to load your saved samples');
            }
        } catch (error) {
            console.error('Error fetching saved samples:', error);
            toast.error('Failed to load your saved samples');
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

    const initializeWaveSurfer = (sample, index) => {
        const waveformRef = waveformRefs.current[index];
        
        if (!waveformRef || waveSurferInstances.current[index]) return;

        try {
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
                responsive: true
            });

            waveSurferInstances.current[index] = wavesurfer;

            wavesurfer.on('ready', () => {
                const duration = wavesurfer.getDuration();
                setAudioStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        isLoaded: true,
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
                if (playingIndex === index) setPlayingIndex(null);
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
                if (playingIndex === index) setPlayingIndex(null);
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
                console.error('WaveSurfer error for sample', index, ':', error);
                toast.error(`Failed to load audio for ${sample.title}`);
            });

            wavesurfer.load(sample.sample_url);

        } catch (error) {
            console.error('Error initializing WaveSurfer for sample', index, ':', error);
        }
    };

    useEffect(() => {
        if (samples.length > 0) {
            const timer = setTimeout(() => {
                samples.forEach((sample, index) => {
                    if (waveformRefs.current[index]) {
                        initializeWaveSurfer(sample, index);
                    }
                });
            }, 100);

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
    }, [samples]);

    const togglePlayPause = (index) => {
        const wavesurfer = waveSurferInstances.current[index];
        const audioState = audioStates[index];
        
        if (!wavesurfer || !audioState?.isLoaded) {
            console.warn(`WaveSurfer instance or audio not ready for index ${index}`);
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
        }
    };

    const handleDownload = async (sample, index) => {
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

    const openUnsaveModal = (sampleId, sampleName, index) => {
        setUnsaveModal({
            isOpen: true,
            sampleId,
            sampleName,
            sampleIndex: index,
            isUnsaving: false
        });
    };

    const closeUnsaveModal = () => {
        if (unsaveModal.isUnsaving) return;
        setUnsaveModal({
            isOpen: false,
            sampleId: null,
            sampleName: '',
            sampleIndex: null,
            isUnsaving: false
        });
    };

    const confirmUnsave = async () => {
        const { sampleId, sampleName, sampleIndex } = unsaveModal;
        
        setUnsaveModal(prev => ({ ...prev, isUnsaving: true }));
        
        try {
            const response = await fetch(`https://samply-production.up.railway.app/api/community/samples/${sampleId}/save`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: user.id })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`${sampleName} unsaved successfully!`);
                
                setSamples(prev => prev.filter((_, i) => i !== sampleIndex));
                
                if (waveSurferInstances.current[sampleIndex]) {
                    waveSurferInstances.current[sampleIndex].destroy();
                    delete waveSurferInstances.current[sampleIndex];
                }
                
                setAudioStates(prev => {
                    const newStates = { ...prev };
                    delete newStates[sampleIndex];
                    return newStates;
                });
                
                if (playingIndex === sampleIndex) {
                    setPlayingIndex(null);
                }
                
                closeUnsaveModal();
            } else {
                console.error('Unsave error:', result);
                toast.error(result.error || 'Failed to unsave sample');
                setUnsaveModal(prev => ({ ...prev, isUnsaving: false }));
            }
        } catch (error) {
            console.error('Error unsaving sample:', error);
            toast.error('Failed to unsave sample');
            setUnsaveModal(prev => ({ ...prev, isUnsaving: false }));
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
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
                <AnimatedBackground/>
                <div className="saved-samples-container">
                    <div className="back">
                        <button onClick={() => navigate(-1)}> <p>Go Back</p></button>
                    </div>
                    <div className='savings'>
                        <h1>Loading...</h1>
                    </div>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <AnimatedBackground/>
                <div className="saved-samples-container">
                    <div className="back">
                        <button onClick={() => navigate(-1)}> <p>Go Back</p></button>
                    </div>
                    <div className='savings'>
                        <div className='auth-required-overlay'>
                            <div className='auth-required-content'>
                                <Lock size={80} strokeWidth={1} color='#fff' />
                                <h1>Log in to view your saved samples.</h1>
                                <p>You need to be logged in to access your saved samples.</p>
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
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AnimatedBackground/>
            <ScrollToTopButton />
            <div className="saved-samples-container">
                <div className="back">
                    <button onClick={() => navigate(-1)}> <p>Go Back</p></button>
                </div>
                <div className='savings'>
                    <motion.h1
                        variants={titleVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        Saved Samples
                    </motion.h1>
                    
                    {loadingSamples ? (
                        <div className="loading-samples">
                            <p>Loading your saved samples...</p>
                        </div>
                    ) : samples.length === 0 ? (
                        <motion.div 
                            className="no-saved-samples-message"
                            variants={samplesContainerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <p>No saved samples yet.</p>
                            <p>Save some samples from your <Link to={'/samples'}>posted samples</Link> to see them here!</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            className='saved-samples-wrapper'
                            variants={samplesContainerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {samples.map((sample, index) => (
                                <motion.div 
                                    key={sample.id}
                                    className='saved-sample'
                                    variants={sampleItemVariants}
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
                                                        className='profile-pic-saved-sample'
                                                        style={{
                                                            backgroundImage: user.user_metadata?.profile_picture ? `url(${user.user_metadata.profile_picture})` : 'none',
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {!user.user_metadata?.profile_picture && (
                                                            <CircleUser size={32} strokeWidth={1} color='#000' />
                                                        )}
                                                    </div>
                                                    <p>{user.user_metadata?.username || user.email?.split('@')[0] || 'User'}</p>
                                                </div>
                                                <div className='saved-sample-icons'>
                                                    <button 
                                                        onClick={() => handleDownload(sample, index)}
                                                        title="Download"
                                                    >
                                                        <ArrowDownToLine size={32} strokeWidth={1} color='#fff'/>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className='wave-saved-sample'>
                                                <button 
                                                    onClick={() => togglePlayPause(index)}
                                                    disabled={!audioStates[index]?.isLoaded}
                                                    style={{ 
                                                        opacity: audioStates[index]?.isLoaded ? 1 : 0.5,
                                                        cursor: audioStates[index]?.isLoaded ? 'pointer' : 'not-allowed'
                                                    }}
                                                >
                                                    {audioStates[index]?.isPlaying ? 
                                                        <Pause size={40} strokeWidth={1} color='#fff' fill='#fff'/> :
                                                        <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                                    }
                                                </button>                                        
                                                <div className='wave-sample'>
                                                    <div 
                                                        className='waveform-saved-sample'
                                                        ref={el => waveformRefs.current[index] = el}
                                                    ></div>
                                                    <div className='timestamps-saved-sample'>
                                                        <p>{audioStates[index]?.currentTime || '00:00'}</p>
                                                        <p>{audioStates[index]?.duration || '00:00'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='prompt-saved-sample'>
                                            <div className='like-icon'>
                                                <div className='save-icon'>
                                                    <button 
                                                        onClick={() => openUnsaveModal(sample.id, sample.title, index)}
                                                        title="Unsave sample"
                                                    >
                                                        <SaveOff size={32} strokeWidth={1} color='#fff'/>
                                                    </button>
                                                </div>
                                            </div>
                                            <p>{sample.prompt}</p>
                                        </div>
                                    </div>
                                    <div className='white-line'></div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Unsave Confirmation Modal */}
            <UnsaveConfirmationModal
                isOpen={unsaveModal.isOpen}
                sampleName={unsaveModal.sampleName}
                onConfirm={confirmUnsave}
                onCancel={closeUnsaveModal}
                isUnsaving={unsaveModal.isUnsaving}
            />
        </>
    );
}

export default SavedSamples;