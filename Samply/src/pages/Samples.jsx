import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Peaks from 'peaks.js';
import Nav from '../components/Nav';
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
    const audioRefs = useRef({});
    const waveformRefs = useRef({});
    const peaksInstances = useRef({});
    
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
            fetchUserSamples();
        }
    }, [user]);

    const fetchUserSamples = async () => {
        if (!user) return;

        setLoadingSamples(true);
        try {
            const response = await fetch(`http://localhost:5000/api/community/user-samples/${user.id}`);
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

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const initializePeaks = (sample, index) => {
        const audioRef = audioRefs.current[index];
        const waveformRef = waveformRefs.current[index];
        
        if (!audioRef || !waveformRef || peaksInstances.current[index]) return;

        const options = {
            overview: {
                container: waveformRef,
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
            mediaElement: audioRef,
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
            
            peaksInstances.current[index] = peaks;
            
            setAudioStates(prev => ({
                ...prev,
                [index]: { ...prev[index], isLoaded: true }
            }));
            
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
            
            if (player && typeof player.on === 'function') {
                player.on('play', () => {
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], isPlaying: true }
                    }));
                    setPlayingIndex(index);
                });
                
                player.on('pause', () => {
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], isPlaying: false }
                    }));
                    if (playingIndex === index) setPlayingIndex(null);
                });
                
                player.on('ended', () => {
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], isPlaying: false, currentTime: '00:00' }
                    }));
                    if (playingIndex === index) setPlayingIndex(null);
                });
                
                player.on('timeupdate', (time) => {
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], currentTime: formatTime(time) }
                    }));
                });
                
                player.on('canplay', () => {
                    const dur = player.getDuration();
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], duration: formatTime(dur) }
                    }));
                });
            } else {
                audioRef.addEventListener('play', () => {
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], isPlaying: true }
                    }));
                    setPlayingIndex(index);
                });
                
                audioRef.addEventListener('pause', () => {
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], isPlaying: false }
                    }));
                    if (playingIndex === index) setPlayingIndex(null);
                });
                
                audioRef.addEventListener('ended', () => {
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], isPlaying: false, currentTime: '00:00' }
                    }));
                    if (playingIndex === index) setPlayingIndex(null);
                });
                
                audioRef.addEventListener('timeupdate', () => {
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], currentTime: formatTime(audioRef.currentTime) }
                    }));
                });
                
                audioRef.addEventListener('canplay', () => {
                    setAudioStates(prev => ({
                        ...prev,
                        [index]: { ...prev[index], duration: formatTime(audioRef.duration) }
                    }));
                });
            }

            setTimeout(() => {
                const textElements = waveformRef.querySelectorAll('text, .time-label, .axis-label');
                textElements.forEach(el => {
                    el.style.display = 'none';
                });
                
                const svgTexts = waveformRef.querySelectorAll('svg text');
                svgTexts.forEach(el => {
                    el.style.display = 'none';
                });
            }, 100);
        });
    };

    useEffect(() => {
        if (samples.length > 0) {
            samples.forEach((sample, index) => {
                const audioRef = audioRefs.current[index];
                if (audioRef && audioRef.readyState >= 2) {
                    initializePeaks(sample, index);
                } else if (audioRef) {
                    audioRef.addEventListener('loadedmetadata', () => initializePeaks(sample, index), { once: true });
                }
            });
        }

        return () => {
            Object.values(peaksInstances.current).forEach(peaks => {
                if (peaks && typeof peaks.destroy === 'function') {
                    peaks.destroy();
                }
            });
            peaksInstances.current = {};
        };
    }, [samples]);

    const togglePlayPause = (index) => {
        const peaksInstance = peaksInstances.current[index];
        const audioRef = audioRefs.current[index];
        const audioState = audioStates[index];
        
        if (!peaksInstance || !audioState?.isLoaded) return;

        if (playingIndex !== null && playingIndex !== index) {
            const otherPeaks = peaksInstances.current[playingIndex];
            const otherAudio = audioRefs.current[playingIndex];
            
            if (otherPeaks?.player?.pause) {
                otherPeaks.player.pause();
            } else if (otherAudio) {
                otherAudio.pause();
            }
        }
        
        const player = peaksInstance.player;
        
        if (audioState.isPlaying) {
            if (player && typeof player.pause === 'function') {
                player.pause();
            } else {
                audioRef.pause();
            }
        } else {
            if (player && typeof player.play === 'function') {
                player.play();
            } else {
                audioRef.play();
            }
        }
    };

    const handleWaveformClick = (event, index) => {
        const peaksInstance = peaksInstances.current[index];
        const waveformRef = waveformRefs.current[index];
        const audioRef = audioRefs.current[index];
        const audioState = audioStates[index];
        
        if (!peaksInstance || !audioState?.isLoaded) return;
        
        const rect = waveformRef.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const containerWidth = rect.width;
        const clickRatio = clickX / containerWidth;
        
        const player = peaksInstance.player;
        
        let duration;
        if (player && typeof player.getDuration === 'function') {
            duration = player.getDuration();
        } else {
            duration = audioRef.duration;
        }
        
        const seekTime = duration * clickRatio;
        
        if (player && typeof player.seek === 'function') {
            player.seek(seekTime);
        } else {
            audioRef.currentTime = seekTime;
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

    const openDeleteModal = (sampleId, sampleName, index) => {
        setDeleteModal({
            isOpen: true,
            sampleId,
            sampleName,
            sampleIndex: index,
            isDeleting: false
        });
    };

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

    const confirmDelete = async () => {
        const { sampleId, sampleName, sampleIndex } = deleteModal;
        
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        
        try {
            const response = await fetch(`http://localhost:5000/api/community/samples/${sampleId}`, {
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
                
                if (peaksInstances.current[sampleIndex]) {
                    peaksInstances.current[sampleIndex].destroy();
                    delete peaksInstances.current[sampleIndex];
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
                </div>
            </>
        );
    }

    return(
        <>
            <Nav />
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
                                                    onClick={(e) => handleWaveformClick(e, index)}
                                                    style={{ cursor: 'pointer' }}
                                                ></div>
                                                <div className='time'>
                                                    <p>{audioStates[index]?.currentTime || '00:00'}</p>
                                                    <p>{audioStates[index]?.duration || '00:00'}</p>
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
                                
                                {/* Audio element for each sample */}
                                <audio 
                                    ref={el => audioRefs.current[index] = el}
                                    src={sample.sample_url} 
                                    preload="metadata"
                                    style={{ display: 'none' }}
                                />
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