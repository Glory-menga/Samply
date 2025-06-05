import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import AnimatedBackground from '../components/background/AnimatedBackground';
import { CircleUser, ArrowDownToLine, Share2, Heart, Play, Pause, Send, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import '../css/CommentSample.css';

function CommentSample(){
    const navigate = useNavigate();
    const location = useLocation();
    const waveformRef = useRef(null);
    const waveSurferInstance = useRef(null);
    
    const [sample, setSample] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [audioState, setAudioState] = useState({
        isPlaying: false,
        duration: '00:00',
        currentTime: '00:00',
        isLoaded: false
    });

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

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const commentVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (index) => ({
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.5,
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
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        const sampleData = location.state?.sample;
        if (sampleData) {
            setSample(sampleData);
            fetchComments(sampleData.id);
        } else {
            navigate(-1);
        }
        setLoading(false);
    }, [location.state]);

    useEffect(() => {
        if (sample && waveformRef.current && !waveSurferInstance.current) {
            initializeWaveSurfer();
        }

        return () => {
            if (waveSurferInstance.current) {
                try {
                    waveSurferInstance.current.destroy();
                } catch (error) {
                    console.warn('Error destroying WaveSurfer instance:', error);
                }
                waveSurferInstance.current = null;
            }
        };
    }, [sample]);

    const fetchComments = async (sampleId) => {
        try {
            const response = await fetch(`https://samply-production.up.railway.app/api/community/comments/${sampleId}`);
            const data = await response.json();
            
            if (response.ok) {
                setComments(data.comments || []);
            } else {
                console.error('Failed to fetch comments:', data.error);
                toast.error('Failed to load comments');
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            toast.error('Failed to load comments');
        }
    };

    const initializeWaveSurfer = async () => {
        if (!waveformRef.current || !sample) return;

        try {
            const testResponse = await fetch(sample.sample_url, { method: 'HEAD' });
            if (!testResponse.ok) {
                toast.error(`Audio file not accessible for "${sample.title}"`);
                return;
            }

            const wavesurfer = WaveSurfer.create({
                container: waveformRef.current,
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

            waveSurferInstance.current = wavesurfer;

            wavesurfer.on('ready', () => {
                const duration = wavesurfer.getDuration();
                setAudioState(prev => ({
                    ...prev,
                    isLoaded: true,
                    duration: formatTime(duration)
                }));
            });

            wavesurfer.on('play', () => {
                setAudioState(prev => ({ ...prev, isPlaying: true }));
            });

            wavesurfer.on('pause', () => {
                setAudioState(prev => ({ ...prev, isPlaying: false }));
            });

            wavesurfer.on('finish', () => {
                setAudioState(prev => ({ 
                    ...prev, 
                    isPlaying: false, 
                    currentTime: '00:00' 
                }));
            });

            wavesurfer.on('audioprocess', () => {
                const currentTime = wavesurfer.getCurrentTime();
                setAudioState(prev => ({ 
                    ...prev, 
                    currentTime: formatTime(currentTime) 
                }));
            });

            wavesurfer.on('seek', () => {
                const currentTime = wavesurfer.getCurrentTime();
                setAudioState(prev => ({ 
                    ...prev, 
                    currentTime: formatTime(currentTime) 
                }));
            });

            wavesurfer.on('error', (error) => {
                console.error('WaveSurfer error:', error);
                toast.error(`Failed to load audio for ${sample.title}`);
            });

            wavesurfer.load(sample.sample_url);
        } catch (error) {
            console.error('Error initializing WaveSurfer:', error);
            toast.error(`Failed to initialize audio player for "${sample.title}"`);
        }
    };

    const togglePlayPause = () => {
        if (!waveSurferInstance.current || !audioState.isLoaded) return;
        
        try {
            if (audioState.isPlaying) {
                waveSurferInstance.current.pause();
            } else {
                waveSurferInstance.current.play();
            }
        } catch (error) {
            console.error('Error toggling play/pause:', error);
            toast.error('Error playing audio');
        }
    };

    const handleDownload = async () => {
        if (!sample) return;
        
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

    const handleCommentSubmit = async () => {
        if (!user) {
            toast.error('Please log in to comment');
            return;
        }

        if (!newComment.trim()) {
            toast.error('Please enter a comment');
            return;
        }

        try {
            const response = await fetch('https://samply-production.up.railway.app/api/community/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    sample_id: sample.id,
                    comment: newComment.trim()
                })
            });

            const data = await response.json();

            if (response.ok) {
                setNewComment('');
                fetchComments(sample.id); 
                toast.success('Comment posted successfully!');
            } else {
                toast.error(data.error || 'Failed to post comment');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Failed to post comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!user) {
            toast.error('Please log in to delete comments');
            return;
        }

        try {
            const response = await fetch(`https://samply-production.up.railway.app/api/community/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                setComments(prev => prev.filter(comment => comment.id !== commentId));
                toast.success('Comment deleted successfully!');
            } else {
                toast.error(data.error || 'Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
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

    if (loading || !sample) {
        return (
            <>
                <AnimatedBackground />
                <div className='comment-sample-container'>
                    <h1>Loading...</h1>
                </div>
            </>
        );
    }

    return(
        <>
            <AnimatedBackground />
            <motion.div 
                className='comment-sample-container'
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="back" variants={itemVariants}>
                    <button onClick={() => navigate(-1)}> <p>Go Back</p></button>
                </motion.div>
                
                <motion.div className='intro-comment-sample' variants={itemVariants}>
                    <h2>{sample.title}</h2>
                    <div className='post-comment-sample'>
                        <div className='intro-post-comment'>
                            <div className='info-post-comment'>
                                <div className='profile-post-comment'>
                                    <div 
                                        style={{
                                            backgroundImage: sample.user?.profile_picture ? `url(${sample.user.profile_picture})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            marginRight: '12px'
                                        }}
                                    >
                                        {!sample.user?.profile_picture && (
                                            <CircleUser size={40} strokeWidth={1} color='#000' />
                                        )}
                                    </div>
                                    <p>{sample.user?.username || 'Unknown User'} - {formatTimeAgo(sample.created_at)}</p>
                                </div>
                                <div className='info-post-icons'>
                                    <div className='info-post-icon' onClick={handleDownload}>
                                        <ArrowDownToLine size={28} strokeWidth={1} color='#fff'/>
                                        <p>Download</p>
                                    </div>
                                </div>
                            </div>
                            <div className='audio-post-comment'>
                                <div className='wave-post-comment'>
                                    <button 
                                        onClick={togglePlayPause}
                                        disabled={!audioState.isLoaded}
                                        style={{ 
                                            opacity: audioState.isLoaded ? 1 : 0.5,
                                            cursor: audioState.isLoaded ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        {audioState.isPlaying ? 
                                            <Pause size={42} strokeWidth={1} color='#fff' fill='#fff'/> :
                                            <Play size={42} strokeWidth={1} color='#fff' fill='#fff'/>
                                        }
                                    </button>
                                    <div className='waveform-post-comment'>
                                        <div 
                                            className='waveform-audio'
                                            ref={waveformRef}
                                        ></div>
                                        <div className='timestamps-post-comment'>
                                            <p>{audioState.currentTime}</p>
                                            <p>{audioState.duration}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className='like-post-comment'>
                                    <Share2 size={28} strokeWidth={1} color='#fff'/>
                                    <p>Share</p>
                                </div>
                            </div>
                        </div>
                        <div className='prompt-post-comment'>
                            <p>{sample.prompt}</p>
                        </div>
                    </div>
                    
                    {user && (
                        <motion.div className='comment-post-sample' variants={itemVariants}>
                            <div className='write-comment'>
                                <div 
                                    style={{
                                        backgroundImage: user?.user_metadata?.profile_picture ? `url(${user.user_metadata.profile_picture})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {!user?.user_metadata?.profile_picture && (
                                        <CircleUser size={60} strokeWidth={1} color='#000' />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Drop a comment!"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                                />
                            </div>
                            <div className='post-comment' onClick={handleCommentSubmit}>
                                <Send size={36} strokeWidth={1} color='#fff' />
                                <p>Post</p>
                            </div>
                        </motion.div>
                    )}
                    
                    <motion.div className='white-line2' variants={itemVariants}></motion.div>
                    
                    <motion.div className='comments' variants={itemVariants}>
                        {comments.length === 0 ? (
                            <motion.div variants={itemVariants}>
                                <p>No comments yet. Be the first to comment!</p>
                            </motion.div>
                        ) : (
                            comments.map((comment, index) => (
                                <motion.div 
                                    key={comment.id}
                                    className='comment'
                                    variants={commentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={index}
                                >
                                    <div className='comment-info'>
                                        <div className='profile-comment'>
                                            <div 
                                                style={{
                                                    backgroundImage: comment.user?.profile_picture ? `url(${comment.user.profile_picture})` : 'none',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden',
                                                    marginRight: '12px'
                                                }}
                                            >
                                                {!comment.user?.profile_picture && (
                                                    <CircleUser size={50} strokeWidth={1} color='#000' />
                                                )}
                                            </div>
                                            <p>{comment.user?.username || 'Unknown User'} - {formatTimeAgo(comment.created_at)}</p>
                                        </div>
                                        <div className='comment-icon'>
                                            {user && comment.user_id === user.id && (
                                                <button 
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    style={{ marginLeft: '10px' }}
                                                >
                                                    <X size={38} strokeWidth={1} color='#ff4444'/>
                                                </button>
                                            )}
                                        </div>
                                    </div>  
                                    <div className='comment-txt'>
                                        <p>{comment.comment}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>
        </>
    );
}

export default CommentSample;