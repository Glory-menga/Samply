import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import AnimatedBackground from '../components/background/AnimatedBackground';
import Nav from '../components/Nav';
import { Heart, ArrowDownToLine, Play, Pause, Share2, CircleUser, MessageSquare, X, Copy, Check } from 'lucide-react';
import LikedSamplesTab from '../components/tabs/LikedSamplesTab';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import '../css/Community.css';

import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  RedditShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  RedditIcon,
  WhatsappIcon,
} from 'react-share';

const ShareModal = ({ isOpen, sample, onClose }) => {
    const [copied, setCopied] = useState(false);
    
    if (!isOpen || !sample) return null;

    const shareUrl = `${window.location.origin}/community`;
    const shareTitle = `Check out this amazing sample: ${sample.title}`;
    const shareDescription = `Listen to "${sample.title}" by ${sample.user?.username || 'Unknown User'} - Created with AI music generation`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Community link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            toast.error('Failed to copy link');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="share-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                >
                    <motion.div 
                        className="share-modal-content"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.3, type: "spring", damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="share-modal-header">
                            <h2>Share Sample</h2>
                            <button className="share-close-btn" onClick={onClose}>
                                <X size={24} color="#fff" />
                            </button>
                        </div>
                        
                        <div className="share-modal-body">
                            <div className="sample-preview">
                                <h3>"{sample.title}"</h3>
                                <p>by {sample.user?.username || 'Unknown User'}</p>
                                <p>Share this amazing sample with others</p>
                            </div>

                            <div className="share-platforms">
                                <h4>Share on social platforms</h4>
                                <div className="social-buttons">
                                    <FacebookShareButton
                                        url={shareUrl}
                                        quote={shareTitle}
                                        hashtag="#AIMusic"
                                        className="social-share-button"
                                    >
                                        <FacebookIcon size={48} round />
                                        <p>Facebook</p>
                                    </FacebookShareButton>

                                    <TwitterShareButton
                                        url={shareUrl}
                                        title={shareTitle}
                                        hashtags={['AIMusic', 'MusicGeneration', 'Sample']}
                                        className="social-share-button"
                                    >
                                        <TwitterIcon size={48} round />
                                        <p>Twitter</p>
                                    </TwitterShareButton>

                                    <LinkedinShareButton
                                        url={shareUrl}
                                        title={shareTitle}
                                        summary={shareDescription}
                                        source="AI Music Generator"
                                        className="social-share-button"
                                    >
                                        <LinkedinIcon size={48} round />
                                        <p>LinkedIn</p>
                                    </LinkedinShareButton>

                                    <RedditShareButton
                                        url={shareUrl}
                                        title={shareTitle}
                                        className="social-share-button"
                                    >
                                        <RedditIcon size={48} round />
                                        <p>Reddit</p>
                                    </RedditShareButton>

                                    <WhatsappShareButton
                                        url={shareUrl}
                                        title={shareTitle}
                                        separator=" - "
                                        className="social-share-button"
                                    >
                                        <WhatsappIcon size={48} round />
                                        <p>WhatsApp</p>
                                    </WhatsappShareButton>
                                </div>
                            </div>

                            <div className="share-link-section">
                                <h4>Or copy community link</h4>
                                <div className="copy-link-container">
                                    <input 
                                        type="text" 
                                        value={shareUrl} 
                                        readOnly 
                                        className="share-link-input"
                                    />
                                    <button 
                                        className="copy-link-btn"
                                        onClick={handleCopyLink}
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={20} />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={20} />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

function Community(){
    const navigate = useNavigate();
    const waveformRefs = useRef({});
    const waveSurferInstances = useRef({});
    const popularWaveformRefs = useRef({});
    const popularWaveSurferInstances = useRef({});
    
    const [playingIndex, setPlayingIndex] = useState(null);
    const [playingSection, setPlayingSection] = useState(null); 
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [popularSamples, setPopularSamples] = useState([]);
    const [allSamples, setAllSamples] = useState([]);
    const [loadingPopular, setLoadingPopular] = useState(false);
    const [loadingSamples, setLoadingSamples] = useState(false);
    const [audioStates, setAudioStates] = useState({});
    const [popularAudioStates, setPopularAudioStates] = useState({});
    const [likedSamples, setLikedSamples] = useState(new Set());
    const [popularLikedSamples, setPopularLikedSamples] = useState(new Set());
    const [shareModal, setShareModal] = useState({
        isOpen: false,
        sample: null
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

    const sectionVariants = {
        hidden: { opacity: 0, y: 50 },
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

    const itemVariants = {
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
        fetchPopularSamples();
        fetchAllSamples();
        if (user) {
            fetchUserLikes();
        }
    }, [user]);

    const fetchUserLikes = async () => {
        if (!user) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/community/user-likes/${user.id}`);
            const data = await response.json();
            
            if (response.ok) {
                const likedSampleIds = new Set(data.likes.map(like => like.sample_id));
                setLikedSamples(likedSampleIds);
                setPopularLikedSamples(likedSampleIds);
            } else {
                console.error('Failed to fetch user likes:', data.error);
                setLikedSamples(new Set());
                setPopularLikedSamples(new Set());
            }
        } catch (error) {
            console.error('Error fetching user likes:', error);
            setLikedSamples(new Set());
            setPopularLikedSamples(new Set());
        }
    };

    const fetchPopularSamples = async () => {
        setLoadingPopular(true);
        try {
            const response = await fetch('http://localhost:5000/api/community/popular-samples');
            const data = await response.json();

            if (response.ok) {
                setPopularSamples(data.samples || []);
                const initialStates = {};
                data.samples?.forEach((_, index) => {
                    initialStates[index] = {
                        isPlaying: false,
                        duration: '00:00',
                        currentTime: '00:00',
                        isLoaded: false
                    };
                });
                setPopularAudioStates(initialStates);
            } else {
                console.error('Failed to fetch popular samples:', data.error);
                toast.error('Failed to load popular samples');
            }
        } catch (error) {
            console.error('Error fetching popular samples:', error);
            toast.error('Failed to load popular samples');
        } finally {
            setLoadingPopular(false);
        }
    };

    const fetchAllSamples = async () => {
        setLoadingSamples(true);
        try {
            const response = await fetch('http://localhost:5000/api/community/samples-with-users');
            const data = await response.json();

            if (response.ok) {
                setAllSamples(data.samples || []);
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
                toast.error('Failed to load samples');
            }
        } catch (error) {
            console.error('Error fetching samples:', error);
            toast.error('Failed to load samples');
        } finally {
            setLoadingSamples(false);
        }
    };

    const handleLike = async (sampleId, section = 'posts', index) => {
        if (!user) {
            toast.error('Please log in to like samples');
            return;
        }

        const isCurrentlyLiked = section === 'popular' 
            ? popularLikedSamples.has(sampleId) 
            : likedSamples.has(sampleId);

        try {
            const response = await fetch(`http://localhost:5000/api/community/samples/${sampleId}/like`, {
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
                if (section === 'popular') {
                    setPopularLikedSamples(prev => {
                        const newSet = new Set(prev);
                        if (isCurrentlyLiked) {
                            newSet.delete(sampleId);
                        } else {
                            newSet.add(sampleId);
                        }
                        return newSet;
                    });

                    setPopularSamples(prev => prev.map(sample => 
                        sample.id === sampleId 
                            ? { ...sample, likes_count: data.likes_count }
                            : sample
                    ));
                } else {
                    setLikedSamples(prev => {
                        const newSet = new Set(prev);
                        if (isCurrentlyLiked) {
                            newSet.delete(sampleId);
                        } else {
                            newSet.add(sampleId);
                        }
                        return newSet;
                    });

                    setAllSamples(prev => prev.map(sample => 
                        sample.id === sampleId 
                            ? { ...sample, likes_count: data.likes_count }
                            : sample
                    ));
                }

                const sample = section === 'popular' 
                    ? popularSamples[index] 
                    : allSamples[index];
                
                if (isCurrentlyLiked) {
                    toast.info(`You unliked "${sample.title}"`);
                } else {
                    toast.success(`You liked "${sample.title}"`);
                }
            } else {
                toast.error(data.error || 'Failed to update like');
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            toast.error('Failed to update like');
        }
    };

    const handleCommentClick = (sample, section = 'posts') => {
        navigate('/comment-sample', { state: { sample } });
    };

    const openShareModal = (sample) => {
        setShareModal({
            isOpen: true,
            sample: sample
        });
    };

    const closeShareModal = () => {
        setShareModal({
            isOpen: false,
            sample: null
        });
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return `${Math.floor(diffInSeconds / 604800)}w ago`;
    };

    const initializeWaveSurfer = async (sample, index, section = 'posts') => {
        const waveformRef = section === 'popular' 
            ? popularWaveformRefs.current[index] 
            : waveformRefs.current[index];
        const instances = section === 'popular' 
            ? popularWaveSurferInstances.current 
            : waveSurferInstances.current;
        
        if (!waveformRef || instances[index]) {
            return;
        }

        try {
            const testResponse = await fetch(sample.sample_url, { method: 'HEAD' });
            if (!testResponse.ok) {
                toast.error(`Audio file not accessible for "${sample.title}"`);
                return;
            }

            const wavesurfer = WaveSurfer.create({
                container: waveformRef,
                waveColor: '#ffffff',
                progressColor: '#212121',
                cursorColor: '#000000',
                cursorWidth: 1,
                barWidth: 1,
                barGap: 1,
                height: section === 'popular' ? 40 : 60,
                normalize: true,
                backend: 'WebAudio',
                mediaControls: false,
                interact: true,
                hideScrollbar: true,
                fillParent: true,
                responsive: true,
                crossOrigin: 'anonymous'
            });

            instances[index] = wavesurfer;

            wavesurfer.on('ready', () => {
                const duration = wavesurfer.getDuration();
                const setStates = section === 'popular' ? setPopularAudioStates : setAudioStates;
                setStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        isLoaded: true,
                        duration: formatTime(duration)
                    }
                }));
            });

            wavesurfer.on('play', () => {
                const setStates = section === 'popular' ? setPopularAudioStates : setAudioStates;
                setStates(prev => ({
                    ...prev,
                    [index]: { ...prev[index], isPlaying: true }
                }));
                setPlayingIndex(index);
                setPlayingSection(section);
            });

            wavesurfer.on('pause', () => {
                const setStates = section === 'popular' ? setPopularAudioStates : setAudioStates;
                setStates(prev => ({
                    ...prev,
                    [index]: { ...prev[index], isPlaying: false }
                }));
                if (playingIndex === index && playingSection === section) {
                    setPlayingIndex(null);
                    setPlayingSection(null);
                }
            });

            wavesurfer.on('finish', () => {
                const setStates = section === 'popular' ? setPopularAudioStates : setAudioStates;
                setStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        isPlaying: false, 
                        currentTime: '00:00' 
                    }
                }));
                if (playingIndex === index && playingSection === section) {
                    setPlayingIndex(null);
                    setPlayingSection(null);
                }
            });

            wavesurfer.on('audioprocess', () => {
                const currentTime = wavesurfer.getCurrentTime();
                const setStates = section === 'popular' ? setPopularAudioStates : setAudioStates;
                setStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        currentTime: formatTime(currentTime) 
                    }
                }));
            });

            wavesurfer.on('seek', () => {
                const currentTime = wavesurfer.getCurrentTime();
                const setStates = section === 'popular' ? setPopularAudioStates : setAudioStates;
                setStates(prev => ({
                    ...prev,
                    [index]: { 
                        ...prev[index], 
                        currentTime: formatTime(currentTime) 
                    }
                }));
            });

            wavesurfer.on('error', (error) => {
                console.error(`WaveSurfer error for ${section} sample`, index, ':', error);
                toast.error(`Failed to load audio for ${sample.title}`);
            });

            wavesurfer.load(sample.sample_url);

        } catch (error) {
            console.error(`Error initializing WaveSurfer for ${section} sample`, index, ':', error);
            toast.error(`Failed to initialize audio player for "${sample.title}"`);
        }
    };

    useEffect(() => {
        if (popularSamples.length > 0) {
            const timer = setTimeout(() => {
                popularSamples.forEach((sample, index) => {
                    if (popularWaveformRefs.current[index]) {
                        setTimeout(() => {
                            initializeWaveSurfer(sample, index, 'popular');
                        }, index * 150);
                    }
                });
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [popularSamples]);

    useEffect(() => {
        if (allSamples.length > 0) {
            const timer = setTimeout(() => {
                allSamples.forEach((sample, index) => {
                    if (waveformRefs.current[index]) {
                        setTimeout(() => {
                            initializeWaveSurfer(sample, index, 'posts');
                        }, index * 150);
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
            Object.values(popularWaveSurferInstances.current).forEach(wavesurfer => {
                if (wavesurfer && typeof wavesurfer.destroy === 'function') {
                    try {
                        wavesurfer.destroy();
                    } catch (error) {
                        console.warn('Error destroying popular WaveSurfer instance:', error);
                    }
                }
            });
            waveSurferInstances.current = {};
            popularWaveSurferInstances.current = {};
        };
    }, [allSamples]);

    const togglePlayPause = (index, section = 'posts') => {
        const instances = section === 'popular' 
            ? popularWaveSurferInstances.current 
            : waveSurferInstances.current;
        const audioStatesData = section === 'popular' ? popularAudioStates : audioStates;
        const wavesurfer = instances[index];
        const audioState = audioStatesData[index];
        
        if (!wavesurfer || !audioState?.isLoaded) {
            return;
        }

        if (playingIndex !== null && (playingIndex !== index || playingSection !== section)) {
            const otherInstances = playingSection === 'popular' 
                ? popularWaveSurferInstances.current 
                : waveSurferInstances.current;
            const otherWaveSurfer = otherInstances[playingIndex];
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

    if (loading) {
        return (
            <>
                <Nav />
                <AnimatedBackground />
                <div className='community-container'>
                    <LikedSamplesTab />
                    <h1>Loading...</h1>
                </div>
            </>
        );
    }

    return(
        <>
            <Nav />
            <AnimatedBackground />
            <div className='community-container'>
                <LikedSamplesTab />
                
                <motion.h1
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                >
                    Feed
                </motion.h1>
                
                <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <h4>Popular Posts</h4>
                    <div className='popular-posts'>
                        {loadingPopular ? (
                            <div className="loading-message">
                                <p>Loading popular posts...</p>
                            </div>
                        ) : popularSamples.length === 0 ? (
                            <div className="no-content-message">
                                <p>No popular posts yet.</p>
                            </div>
                        ) : (
                            popularSamples.map((sample, index) => (
                                <motion.div 
                                    key={sample.id}
                                    className='popular-post'
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={index}
                                >
                                    <div className='first-popular-post'>
                                        <div className='profile-popular-post'>
                                            <div className='profile-info-popular'>
                                                <p>{sample.user?.username || 'Unknown User'}</p>
                                            </div>
                                            <div className='popular-post-icons'>
                                                <button 
                                                    className='popular-heart-btn'
                                                    onClick={() => handleLike(sample.id, 'popular', index)}
                                                >
                                                    <Heart 
                                                        size={24} 
                                                        strokeWidth={1} 
                                                        color='#fff'
                                                        fill={popularLikedSamples.has(sample.id) ? '#fff' : 'none'}
                                                    />
                                                    <span className='like-count'>{sample.likes_count}</span>
                                                </button>
                                                <button onClick={() => handleDownload(sample)}>
                                                    <ArrowDownToLine size={24} strokeWidth={1} color='#fff'/>
                                                </button>
                                            </div>
                                        </div>
                                        <div className='title-popular-post'>
                                            <p>{sample.title}</p>
                                        </div>
                                    </div>
                                    <div className='audio-popular-post'>
                                        <button 
                                            onClick={() => togglePlayPause(index, 'popular')}
                                            disabled={!popularAudioStates[index]?.isLoaded}
                                            style={{ 
                                                opacity: popularAudioStates[index]?.isLoaded ? 1 : 0.5,
                                                cursor: popularAudioStates[index]?.isLoaded ? 'pointer' : 'not-allowed'
                                            }}
                                        >
                                            {popularAudioStates[index]?.isPlaying ? 
                                                <Pause size={34} strokeWidth={1} color='#fff' fill='#fff'/> :
                                                <Play size={34} strokeWidth={1} color='#fff' fill='#fff'/>
                                            }
                                        </button>
                                        <div className='wave-popular-post'>
                                            <div 
                                                className='waveform'
                                                ref={el => popularWaveformRefs.current[index] = el}
                                            ></div>
                                            <div className='timestamps-popular-post'>
                                                <p>{popularAudioStates[index]?.currentTime || '00:00'}</p>
                                                <p>{popularAudioStates[index]?.duration || '00:00'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
                
                <motion.div 
                    className='posts-container'
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <h4>Posts</h4>
                    <div className='posts'>
                        {loadingSamples ? (
                            <div className="loading-message">
                                <p>Loading posts...</p>
                            </div>
                        ) : allSamples.length === 0 ? (
                            <div className="no-content-message">
                                <p>No posts yet.</p>
                            </div>
                        ) : (
                            allSamples.map((sample, index) => (
                                <motion.div 
                                    key={sample.id}
                                    className='post'
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={index}
                                >
                                    <div className='audio-post'>
                                        <div className='intro-post'>
                                            <div className='profile-post'>
                                                <div className='profile-post-info'>
                                                    <div 
                                                        className='profile-pic-post'
                                                        style={{
                                                            backgroundImage: sample.user?.profile_picture ? `url(${sample.user.profile_picture})` : 'none',
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            width: '42px',
                                                            height: '42px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            overflow: 'hidden',
                                                            marginRight: '12px'
                                                        }}
                                                    >
                                                        {!sample.user?.profile_picture && (
                                                            <CircleUser size={42} strokeWidth={1} color='#fff'/>
                                                        )}
                                                    </div>
                                                    <p><b>{sample.user?.username || 'Unknown User'}</b> - {formatTimeAgo(sample.created_at)}</p>
                                                </div>
                                                <div className='post-title'>
                                                    <p>{sample.title}</p>
                                                </div>
                                            </div>
                                            <div className='post-icons'>
                                                <div className='post-icon' onClick={() => handleDownload(sample)}>
                                                    <ArrowDownToLine size={28} strokeWidth={1} color='#fff'/>
                                                    <p>Download</p>
                                                </div>
                                                <div className='post-icon' onClick={() => openShareModal(sample)}>
                                                    <Share2 size={28} strokeWidth={1} color='#fff'/>
                                                    <p>Share</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='wave-audio-post'>
                                            <div className='waveform-post'>
                                                <button 
                                                    onClick={() => togglePlayPause(index, 'posts')}
                                                    disabled={!audioStates[index]?.isLoaded}
                                                    style={{ 
                                                        opacity: audioStates[index]?.isLoaded ? 1 : 0.5,
                                                        cursor: audioStates[index]?.isLoaded ? 'pointer' : 'not-allowed'
                                                    }}
                                                >
                                                    {audioStates[index]?.isPlaying ? 
                                                        <Pause size={38} strokeWidth={1} color='#fff' fill='#fff'/> :
                                                        <Play size={38} strokeWidth={1} color='#fff' fill='#fff'/>
                                                    }
                                                </button>
                                                <div className='waveform-details'>
                                                    <div 
                                                        className='waveform-container-post'
                                                        ref={el => waveformRefs.current[index] = el}
                                                    ></div>
                                                    <div className='timestamps-wave-post'>
                                                        <p>{audioStates[index]?.currentTime || '00:00'}</p>
                                                        <p>{audioStates[index]?.duration || '00:00'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='wave-icons'>
                                                <div 
                                                    className='wave-icon'
                                                    onClick={() => handleLike(sample.id, 'posts', index)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <Heart 
                                                        size={28} 
                                                        strokeWidth={1} 
                                                        color='#fff'
                                                        fill={likedSamples.has(sample.id) ? '#fff' : 'none'}
                                                    />
                                                    <p>{sample.likes_count}</p>
                                                </div>
                                                <div 
                                                    className='wave-icon'
                                                    onClick={() => handleCommentClick(sample, 'posts')}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <MessageSquare size={28} strokeWidth={1} color='#fff'/>
                                                    <p>{sample.comments_count || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='prompt-post'>
                                        <p>{sample.prompt}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={shareModal.isOpen}
                sample={shareModal.sample}
                onClose={closeShareModal}
            />
        </>
    );
}

export default Community;