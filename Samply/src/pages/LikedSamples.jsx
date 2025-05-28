import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from "../components/background/AnimatedBackground";
import { CircleUser, Heart, ArrowDownToLine, Play, Lock, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';
import '../css/SavedSamples.css'

function LikedSamples() {
    const navigate = useNavigate();
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

    const handleGoBack = () => {
        if (!user) return;
        navigate(-1);
    };

    const handlePlaySample = () => {
        if (!user) return;
        // Add play functionality here
    };

    const handleDownload = () => {
        if (!user) return;
        // Add download functionality here
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
                        <button disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            <p>Loading...</p>
                        </button>
                    </div>
                    <div className='savings'>
                        <h1>Liked Samples</h1>
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
                    <div className='auth-required-overlay'>
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
                    </div>
                    <div className="back">
                        <button disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            <p>Go Back</p>
                        </button>
                    </div>
                    <div className='savings'>
                        <h1>Liked Samples</h1>
                        <div className='saved-samples-wrapper'>
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
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AnimatedBackground/>
            <div className="saved-samples-container">
                <div className="back">
                    <button onClick={handleGoBack}> <p>Go Back</p></button>
                </div>
                <div className='savings'>
                    <h1>Liked Samples</h1>
                    <div className='saved-samples-wrapper'>
                        <div className='saved-sample'>
                            <h3>Rainy melody with harmonic violins</h3>
                            <div className='audios-saved-sample'>
                                <div className='audio-saved-sample'>
                                    <div className='info-saved-sample'>
                                        <div className='profile-saved-sample'>
                                            <CircleUser size={32} strokeWidth={1} color='#000' />
                                            <p>Glory</p>
                                        </div>
                                        <div className='saved-sample-icons'>
                                            <button onClick={handleDownload}>
                                                <ArrowDownToLine size={32} strokeWidth={1} color='#fff'/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className='wave-saved-sample'>
                                        <button onClick={handlePlaySample}>
                                            <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                        </button>
                                        <div className='wave-sample'>
                                            <div className='waveform-saved-sample'>
                                                wave
                                            </div>
                                            <div className='timestamps-saved-sample'>
                                                <p>00:00</p>
                                                <p>00:20</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='prompt-saved-sample'>
                                    <div className='like-icon'>
                                        <div className='heart-icon'>
                                            <Heart size={32} strokeWidth={1} color='#fff'/>
                                        </div>
                                    </div>
                                    <p>Craft a smooth jazz melody with a walking bassline, mellow piano chords, and a soulful saxophone lead. Add soft brush drums and a touch of vibraphone for a cozy, late-night lounge vibe.</p>
                                </div>
                            </div>
                            <div className='white-line'></div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </>
    );
}

export default LikedSamples