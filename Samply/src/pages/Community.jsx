import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import AnimatedBackground from '../components/background/AnimatedBackground';
import Nav from '../components/Nav';
import { Heart, ArrowDownToLine, Play, Pause, Share2, CircleUser, MessageSquare } from 'lucide-react';
import LikedSamplesTab from '../components/tabs/LikedSamplesTab';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import '../css/Community.css';

function Community(){
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
    }, []);

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

    const initializeWaveSurfer = (sample, index, section = 'posts') => {
        const waveformRef = section === 'popular' 
            ? popularWaveformRefs.current[index] 
            : waveformRefs.current[index];
        const instances = section === 'popular' 
            ? popularWaveSurferInstances.current 
            : waveSurferInstances.current;
        
        if (!waveformRef || instances[index]) return;

        try {
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
                responsive: true
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
        }
    };

    useEffect(() => {
        if (popularSamples.length > 0) {
            const timer = setTimeout(() => {
                popularSamples.forEach((sample, index) => {
                    if (popularWaveformRefs.current[index]) {
                        initializeWaveSurfer(sample, index, 'popular');
                    }
                });
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [popularSamples]);

    useEffect(() => {
        if (allSamples.length > 0) {
            const timer = setTimeout(() => {
                allSamples.forEach((sample, index) => {
                    if (waveformRefs.current[index]) {
                        initializeWaveSurfer(sample, index, 'posts');
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
            console.warn(`WaveSurfer instance or audio not ready for ${section} index ${index}`);
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
                                                <button className='popular-heart-btn'>
                                                    <Heart size={24} strokeWidth={1} color='#fff'/>
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
                                                <div className='post-icon'>
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
                                                <div className='wave-icon'>
                                                    <Heart size={28} strokeWidth={1} color='#fff'/>
                                                    <p>{sample.likes_count}</p>
                                                </div>
                                                <Link to='/comment-sample' className='wave-icon'>
                                                    <MessageSquare size={28} strokeWidth={1} color='#fff'/>
                                                    <p>0</p>
                                                </Link>
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
        </>
    );
}

export default Community;