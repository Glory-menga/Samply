import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import AnimatedBackground from '../components/background/AnimatedBackground';
import { ChevronRight, Headphones, HeadphoneOff, Info, CircleX, X, Lock, LogIn } from 'lucide-react';
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
                
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
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
    }, [user]);

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

    const handleGenerate = () => {
        if (!user) return;
        console.log('Generating with prompt:', prompt);
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
                                    <HeadphoneOff size={40} strokeWidth={1} color='#666' />
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
                        <h1>Generate a Sample</h1>
                        <p>Enter a prompt describing the type of melody you want, including mood, style, and tempo (e.g., 'uplifting jazzy melody with a fast tempo').</p>
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
                                        <p><b>Listen & Refine</b> – Play your sample and tweak the prompt for different results.</p>
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
                                        <p><b>Download & Use</b> – Save your sample for music production, content, or inspiration.</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                     
                    <div className='prompt'>
                        <div className='input-prompt'>
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Type something like 'dreamy piano melody with a slow tempo' or 'funky guitar riff with high energy'..."
                            />
                        </div>
                        <div className='buttons-prompt'>
                            <button
                                className="btn-inspiration"
                                onClick={handleGetInspiration}
                            >
                                <p>Need inspiration?</p>
                            </button>
                            
                            <button className="btn-generate" onClick={handleGenerate}>
                                <p>Generate</p>
                                <ChevronRight size={28} strokeWidth={1} />
                            </button>
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
                        <Metaball width="100%" height="100%" sphereScale={0.9} analyser={analyser} />
                    </motion.div>
                    <div className='help-icons'>
                        <div className="tips-toggle">
                            <button onClick={() => setShowTips(!showTips)}>
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
                            <button onClick={toggleHeadphones}>
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