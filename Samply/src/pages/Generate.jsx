import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import AnimatedBackground from '../components/background/AnimatedBackground';
import { ChevronRight, Headphones, Info, HeadphoneOff, X, Lock, LogIn } from 'lucide-react';
import Metaball from '../components/3dObjects/Metaball';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';
import generateVoice from '../assets/audio/Generate_Voice.mp3';
import '../css/Generate.css';

function Generate(){
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [showTips, setShowTips] = useState(false);
    const [headphonesOn, setHeadphonesOn] = useState(true);
    const [analyser, setAnalyser] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [audioPlayed, setAudioPlayed] = useState(false); 
    const [isGenerating, setIsGenerating] = useState(false);
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);

    const inspirationPrompts = [
        "dreamy piano melody with a slow tempo",
        "funky guitar riff with high energy",
        "chill lofi beat with relaxing vibe",
        "uplifting jazzy melody with a fast tempo",
        "ambient synth pad with spacious reverb",
        "acoustic folk progression with warm tones"
    ];

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

    const descriptionVariants = {
        hidden: { opacity: 0, y: -20 },
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

    const inputVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.8,
                ease: "easeOut",
                delay: 0.4
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
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (audioRef.current && !audioRef.current.paused) {
                    audioRef.current.pause();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (!user || audioPlayed) return; 

        const setupAudio = async () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioContextRef.current = audioContext;
                
                const audio = new Audio(generateVoice);
                audio.loop = false; 
                audio.volume = 0.6;
                audioRef.current = audio;
                
                const analyserNode = audioContext.createAnalyser();
                analyserNode.fftSize = 256;
                
                const source = audioContext.createMediaElementSource(audio);
                source.connect(analyserNode);
                analyserNode.connect(audioContext.destination);
                
                setAnalyser(analyserNode);
                
                audio.addEventListener('ended', () => {
                    setAudioPlayed(true);
                });
                
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('Audio started playing');
                    }).catch(error => {
                        if (error.name !== 'AbortError') {
                            console.error("Audio playback failed:", error);
                        }
                    });
                }
            } catch (err) {
                console.error("Audio setup failed:", err);
            }
        };
        
        setupAudio();
        
        return () => {
            if (audioRef.current) {
                const audio = audioRef.current;
                
                if (!audio.paused) {
                    audio.pause();
                }
                
                audio.currentTime = 0;
                audioRef.current = null;
            }
            
            if (audioContextRef.current) {
                if (audioContextRef.current.state !== 'closed') {
                    audioContextRef.current.close().catch(err => 
                        console.error("Error closing audio context:", err)
                    );
                }
            }
            
            setAnalyser(null);
        };
    }, [user, audioPlayed]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = !headphonesOn;
        }
    }, [headphonesOn]);

    const handleGetInspiration = () => {
        if (!user) return;
        const randomPrompt = inspirationPrompts[Math.floor(Math.random() * inspirationPrompts.length)];
        setPrompt(randomPrompt);
    };

    const toggleHeadphones = () => {
        if (!user) return;
        setHeadphonesOn(!headphonesOn);
    };

    const handleGenerate = async () => {
        if (!user || !prompt.trim() || isGenerating) return;
        
        setIsGenerating(true);
        
        localStorage.removeItem('generatedSamples');
        
        navigate('/loading-page');
        
        try {
            const response = await fetch('https://samply-production.up.railway.app/api/replicate/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt.trim() }),
            });
            
            const data = await response.json();
            
            if (data.success && data.samples) {
                localStorage.setItem('generatedSamples', JSON.stringify({
                    samples: data.samples,
                    originalPrompt: data.originalPrompt,
                    correctedPrompt: data.correctedPrompt,
                    timestamp: Date.now()
                }));
                
                navigate('/sample-generated');
            } else {
                console.error('Generation failed:', data.error);
                alert('Failed to generate samples. Please try again.');
                navigate('/generate');
            }
        } catch (error) {
            console.error('Error generating samples:', error);
            alert('Network error. Please check your connection and try again.');
            navigate('/generate');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleGenerate();
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleSignup = () => {
        navigate('/signup');
    };

    const tipsAnimationVariants = {
        hidden: { 
            opacity: 0,
            y: 50,
            transition: { 
                duration: 0.3,
                ease: "easeInOut"
            }
        },
        visible: { 
            opacity: 1,
            y: 0,
            transition: { 
                duration: 0.3,
                ease: "easeOut",
                when: "beforeChildren",
                staggerChildren: 0.2 
            }
        },
        exit: {
            opacity: 0,
            y: 50,
            transition: { 
                duration: 0.3,
                ease: "easeInOut",
                when: "afterChildren",
                staggerChildren: 0
            }
        }
    };
    
    const tipItemVariants = {
        hidden: { 
            opacity: 0,
            y: 20,
            transition: { duration: 0.3 }
        },
        visible: custom => ({ 
            opacity: 1,
            y: 0,
            transition: { 
                duration: 0.3,
                delay: custom * 0.1
            }
        }),
        exit: { 
            opacity: 0,
            transition: { duration: 0.3 }
        }
    };

    const helpSphereVariants = {
        hidden: {
            opacity: 0,
            y: 50,
        },
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

    if (loading) {
        return (
            <>
                <Nav /> 
                <AnimatedBackground/>
                <div className='container-generate'>
                    <div className='prompt-generate'>
                        <div className='intro-generate'>
                            <h1>Loading...</h1>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Nav /> 
                <AnimatedBackground/>
                <div className='container-generate'>
                    <div className='prompt-generate'>
                        <div className='auth-required-overlay'>
                            <div className='auth-required-content'>
                                <Lock size={80} strokeWidth={1} color='#fff' />
                                <h1>Log in to generate.</h1>
                                <p>You need to be logged in to use the sample generator. Please log in or create an account to start generating your unique AI-powered samples.</p>
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
                    <div className='help-generate'>
                        <motion.div 
                            className='help-sphere'
                            initial="hidden"
                            animate="visible"
                            variants={helpSphereVariants}
                        >
                            <Metaball width="100%" height="100%" sphereScale={0.9} analyser={null} />
                        </motion.div>
                        <div className='help-icons'>
                            <div className="tips-toggle">
                                <button disabled>
                                    <Info size={40} strokeWidth={1} color='#666' />
                                </button>
                            </div>
                            <div className="sound-toggle">
                                <button disabled>
                                    <X size={40} strokeWidth={1} color='#666' />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return(
        <>
            <Nav /> 
            <AnimatedBackground/>
            <div className='container-generate'>
                <div className='prompt-generate'>
                    <div className='intro-generate'>
                        <motion.h1
                            variants={titleVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            Generate a Sample
                        </motion.h1>
                        <motion.p
                            variants={descriptionVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            Enter a prompt describing the type of melody you want, including mood, style, and tempo (e.g., 'uplifting jazzy melody with a fast tempo').
                        </motion.p>
                    </div>
                    <AnimatePresence>
                        {showTips && (
                            <motion.div 
                                className='tips-generate'
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={tipsAnimationVariants}
                            >
                                <motion.div 
                                    className='tip'
                                    variants={tipItemVariants}
                                    custom={0}
                                >
                                    <div className='tip-number'>
                                        <p>1.</p>
                                    </div>
                                    <div className='tip-txt'>
                                        <p><b>Describe Your Sound</b> – Choose a mood, style, and tempo (e.g., "chill lofi beat with slow tempo").</p>
                                    </div>
                                </motion.div>
                                <motion.div 
                                    className='tip'
                                    variants={tipItemVariants}
                                    custom={1}
                                >
                                    <div className='tip-number'>
                                        <p>2.</p>
                                    </div>
                                    <div className='tip-txt'>
                                        <p><b> Generate the Sample</b> – Click "Generate" to create a unique AI-powered sound.</p>
                                    </div>
                                </motion.div>
                                <motion.div 
                                    className='tip'
                                    variants={tipItemVariants}
                                    custom={2}
                                >
                                    <div className='tip-number'>
                                        <p>3.</p>
                                    </div>
                                    <div className='tip-txt'>
                                        <p><b>Listen & edit</b> – Play your sample and edit the sample for different results.</p>
                                    </div>
                                </motion.div>
                                <motion.div 
                                    className='tip'
                                    variants={tipItemVariants}
                                    custom={3}
                                >
                                    <div className='tip-number'>
                                        <p>4.</p>
                                    </div>
                                    <div className='tip-txt'>
                                        <p><b>Download & Use</b> – Download your sample for music production, content, or inspiration.</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                     
                    <motion.div 
                        className='prompt'
                        variants={inputVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className='input-prompt'>
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type something like 'dreamy piano melody with a slow tempo' or 'funky guitar riff with high energy'..."
                                disabled={isGenerating}
                            />
                        </div>
                        <div className='buttons-prompt'>
                            <button
                                className="btn-inspiration"
                                onClick={handleGetInspiration}
                                disabled={isGenerating}
                            >
                                <p>Need inspiration?</p>
                            </button>
                            
                            <button 
                                className="btn-generate" 
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt.trim()}
                            >
                                <p>{isGenerating ? 'Generating...' : 'Generate'}</p>
                                <ChevronRight size={28} strokeWidth={1} />
                            </button>
                        </div>
                    </motion.div>
                </div>
                <div className='help-generate'>
                    <motion.div 
                        className='help-sphere'
                        initial="hidden"
                        animate="visible"
                        variants={helpSphereVariants}
                    >
                        <Metaball width="100%" height="100%" sphereScale={0.9} analyser={analyser} />
                    </motion.div>
                    <div className='help-icons'>
                        <div className="tips-toggle">
                            <button onClick={() => setShowTips(!showTips)} disabled={isGenerating}>
                            {showTips ? (
                                <>
                                <X size={40} strokeWidth={1} color='#fff'/>
                                </>
                            ) : (
                                <>
                                <Info size={40} strokeWidth={1} color='#fff' />
                                </>
                            )}
                            </button>
                        </div>
                        <div className="sound-toggle">
                            <button onClick={toggleHeadphones} disabled={isGenerating}>
                            {headphonesOn ? (
                                <>
                                <Headphones size={40} strokeWidth={1} color='#fff' />
                                </>
                            ) : (
                                <>
                                <HeadphoneOff size={40} strokeWidth={1} color='#fff' />
                                </>
                            )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Generate;