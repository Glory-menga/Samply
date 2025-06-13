import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import Nav from '../components/Nav';
import ScrollToTopButton from '../components/ScrollToTopButton';
import SavedSamplesTab from '../components/tabs/SavedSamplesTab';
import AnimatedBackground from '../components/background/AnimatedBackground';
import { Save, ArrowDownToLine, Play, Pause, Share2, Lock, LogIn, X, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import '../css/Samples.css';

const DeleteConfirmationModal = ({ isOpen, sampleName, onConfirm, onCancel, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="delete-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div 
                        className="delete-modal-content"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.3, type: "spring", damping: 20 }}
                    >
                        <div className="delete-modal-header">
                            <h2>Delete Sample</h2>
                        </div>
                        <div className="delete-modal-body">
                            <p>Are you sure you want to delete the sample</p>
                            <p className="sample-name-highlight">"{sampleName}"?</p>
                            <p>This action cannot be undone.</p>
                        </div>
                        <div className="delete-modal-actions">
                            <button 
                                className="btn-cancel"
                                onClick={onCancel}
                                disabled={isDeleting}
                            >
                                No, Keep It
                            </button>
                            <button 
                                className="btn-delete"
                                onClick={onConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <div className="delete-spinner"></div>
                                        Deleting...
                                    </div>
                                ) : (
                                    'Yes, Delete'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

function Samples(){
    const navigate = useNavigate();
    const waveformRefs = useRef({});
    const waveSurferInstances = useRef({});
    
    const [playingIndex, setPlayingIndex] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [samples, setSamples] = useState([]);
    const [loadingSamples, setLoadingSamples] = useState(false);
    const [audioStates, setAudioStates] = useState({});
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        sampleId: null,
        sampleName: '',
        sampleIndex: null,
        isDeleting: false
    });
    const [savingIndex, setSavingIndex] = useState(null);

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
        const checkForExpiringSamples = async () => {
            if (!user) return;

            try {
                const response = await fetch(`https://samply-production.up.railway.app/api/community/user-expiring-samples/${user.id}`);
                const data = await response.json();

                if (response.ok && data.expiringSamples && data.expiringSamples.length > 0) {
                    data.expiringSamples.forEach(sample => {
                        toast.warning(`${sample.title} will be deleted if you don't save it`, {
                            position: "top-right",
                            autoClose: 8000, 
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                        });
                    });
                }
            } catch (error) {
                console.error('Error checking expiring samples:', error);
            }
        };

        if (user && !loadingSamples) {
            checkForExpiringSamples();
        }
    }, [user, loadingSamples]);

    /**
     * Checks if the user is currently authenticated via Supabase.
     * - Sets the `user` state if a session exists.
     * - Listens for auth state changes to update the user.
     */
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
            fetchUserSamples();
        }
    }, [user]);

    /**
     * Fetches all samples posted by the logged-in user.
     * - Initializes audio state for each sample.
     * - Handles loading states and error notifications.
     */
    const fetchUserSamples = async () => {
        if (!user) return;

        setLoadingSamples(true);
        try {
            const response = await fetch(`https://samply-production.up.railway.app/api/community/user-samples/${user.id}`);
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
                console.error('Failed to fetch samples:', data.error);
                toast.error('Failed to load your samples');
            }
        } catch (error) {
            console.error('Error fetching samples:', error);
            toast.error('Failed to load your samples');
        } finally {
            setLoadingSamples(false);
        }
    };

    /**
     * Converts a number of seconds into a string formatted as mm:ss.
     * @param {number} seconds - The time in seconds.
     * @returns {string} Time formatted as 'mm:ss'.
     */
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    /**
     * Initializes a WaveSurfer instance for a specific sample.
     * - Binds all necessary event listeners (play, pause, seek, error).
     * - Updates playback state and timestamps in real-time.
     * @param {Object} sample - The sample data object.
     * @param {number} index - The index of the sample in the list.
     */
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

    /**
     * Toggles play/pause for the selected sample.
     * - Automatically pauses any other playing sample.
     * - Uses the WaveSurfer API to control playback.
     * @param {number} index - The index of the sample to toggle.
     */
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

    /**
     * Downloads a sample as an MP3 file.
     * - Fetches the audio blob from the sample URL.
     * - Triggers a download in the user's browser.
     */
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
            
            toast.success('Downloaded!');
        } catch (error) {
            console.error('Error downloading audio:', error);
            toast.error('Failed to download audio');
        }
    };

    /**
     * Sends a request to mark a sample as 'saved' by the user.
     * - Updates local UI state to reflect the save action.
     * @param {string} sampleId - The ID of the sample to save.
     * @param {string} sampleName - The title of the sample.
     * @param {number} index - The index of the sample in the list.
     */
    const handleSaveSample = async (sampleId, sampleName, index) => {
        setSavingIndex(index);
        
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
                toast.success(`${sampleName} is saved!`);
                
                setSamples(prev => prev.map((sample, i) => 
                    i === index ? { ...sample, saved: result.saved } : sample
                ));
            } else {
                console.error('Save error:', result);
                toast.error(result.error || 'Failed to save sample');
            }
        } catch (error) {
            console.error('Error saving sample:', error);
            toast.error('Failed to save sample');
        } finally {
            setSavingIndex(null);
        }
    };

    /**
     * Opens the delete confirmation modal for a sample.
     * - Stores the selected sample's ID, name, and index in state.
     */
    const openDeleteModal = (sampleId, sampleName, index) => {
        setDeleteModal({
            isOpen: true,
            sampleId,
            sampleName,
            sampleIndex: index,
            isDeleting: false
        });
    };

    /**
     * Closes the delete confirmation modal and resets its state.
     */
    const closeDeleteModal = () => {
        if (deleteModal.isDeleting) return;
        setDeleteModal({
            isOpen: false,
            sampleId: null,
            sampleName: '',
            sampleIndex: null,
            isDeleting: false
        });
    };

    /**
     * Sends a request to delete the selected sample.
     * - Updates the local list of samples upon success.
     * - Cleans up WaveSurfer instance and state.
     */
    const confirmDelete = async () => {
        const { sampleId, sampleName, sampleIndex } = deleteModal;
        
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        
        try {
            const response = await fetch(`https://samply-production.up.railway.app/api/community/samples/${sampleId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: user.id })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`${sampleName} deleted successfully!`);
                
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
                
                closeDeleteModal();
            } else {
                console.error('Delete error:', result);
                toast.error(result.error || 'Failed to delete sample');
                setDeleteModal(prev => ({ ...prev, isDeleting: false }));
            }
        } catch (error) {
            console.error('Error deleting sample:', error);
            toast.error('Failed to delete sample');
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    /**
     * Formats a date string into a readable format.
     * Example: "April 20, 2025, 2:14 PM"
     * @param {string} dateString - The ISO date string.
     * @returns {string} Formatted date.
     */
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

    /**
     * Navigates to the login page.
     */
    const handleLogin = () => {
        navigate('/login');
    };

    /**
     * Navigates to the signup page.
     */
    const handleSignup = () => {
        navigate('/signup');
    };

    if (loading) {
        return (
            <>
                <Nav />
                <ScrollToTopButton />
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
                <ScrollToTopButton />
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
                </div>
            </>
        );
    }

    return(
        <>
            <Nav />
            <ScrollToTopButton />
            <AnimatedBackground/>
            <div className='sample-container'>
                <SavedSamplesTab/>
                
                <motion.h1
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                >
                    Posted Samples
                </motion.h1>
                
                {loadingSamples ? (
                    <div className="loading-samples">
                        <p>Loading your samples...</p>
                    </div>
                ) : samples.length === 0 ? (
                    <motion.div 
                        className="no-samples-message"
                        variants={samplesContainerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p>No samples posted yet.</p>
                        <p>Start by <Link to={'/generate'}> Generating a sample</Link> and publishing them!</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        className='samples'
                        variants={samplesContainerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {samples.map((sample, index) => (
                            <motion.div 
                                key={sample.id} 
                                className='sample'
                                variants={sampleItemVariants}
                                initial="hidden"
                                animate="visible"
                                custom={index}
                            >
                                <div className='sample-audio'>
                                    <div className='sample-intro'>
                                        <div className='sample-txt'>
                                            <p>{sample.title}</p>
                                        </div>
                                        <div className='sample-icons'>
                                            {!sample.saved && (
                                                <button 
                                                    onClick={() => handleSaveSample(sample.id, sample.title, index)}
                                                    disabled={savingIndex === index}
                                                    title="Save sample"
                                                    style={{
                                                        opacity: savingIndex === index ? 0.5 : 1,
                                                        cursor: savingIndex === index ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {savingIndex === index ? (
                                                        <div style={{
                                                            width: '32px', 
                                                            height: '32px', 
                                                            border: '2px solid #fff',
                                                            borderTop: '2px solid transparent',
                                                            borderRadius: '50%',
                                                            animation: 'spin 1s linear infinite'
                                                        }}></div>
                                                    ) : (
                                                        <Save size={32} strokeWidth={1} color='#fff'/>
                                                    )}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDownload(sample, index)}
                                                title="Download"
                                            >
                                                <ArrowDownToLine size={32} strokeWidth={1} color='#fff'/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className='audio-wave'>
                                        <div className='audio'>  
                                            <button 
                                                onClick={() => togglePlayPause(index)}
                                                disabled={!audioStates[index]?.isLoaded}
                                                style={{ 
                                                    background: 'none', 
                                                    border: 'none', 
                                                    cursor: audioStates[index]?.isLoaded ? 'pointer' : 'not-allowed',
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    opacity: audioStates[index]?.isLoaded ? 1 : 0.5
                                                }}
                                                className='play-pause'
                                            >
                                                {audioStates[index]?.isPlaying ? 
                                                    <Pause size={40} strokeWidth={1} color='#fff' fill='#fff'/> :
                                                    <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                                }
                                            </button>
                                            <div className='wave-time'>
                                                <div 
                                                    className='wave' 
                                                    ref={el => waveformRefs.current[index] = el}
                                                ></div>
                                                <div className='time'>
                                                    <p>{audioStates[index]?.currentTime || '00:00'}</p>
                                                    <p>{audioStates[index]?.duration || '00:00'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='sample-date'>
                                    <div className='sample-save'>
                                        <button 
                                            onClick={() => openDeleteModal(sample.id, sample.title, index)}
                                            title="Delete sample"
                                        >
                                            <Trash2 size={32} strokeWidth={1} color='#fff'/>
                                        </button>
                                    </div>
                                    <p>{formatDate(sample.created_at)}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                sampleName={deleteModal.sampleName}
                onConfirm={confirmDelete}
                onCancel={closeDeleteModal}
                isDeleting={deleteModal.isDeleting}
            />
        </>
    );
}

export default Samples;