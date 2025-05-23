import { useNavigate } from 'react-router-dom';
import AnimatedBackground from "../components/background/AnimatedBackground";
import { CircleUser, Heart, ArrowDownToLine, Play  } from 'lucide-react';

function SavedSamples() {
    const navigate = useNavigate();

    return (
        <>
            <AnimatedBackground/>
            <div className="saved-samples-container">
                <div className="back">
                    <button onClick={() => navigate(-1)}> <p>Go Back</p></button>
                </div>
                <div className='savings'>
                    <h1>Saved Samples</h1>
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
                                            <ArrowDownToLine  size={32} strokeWidth={1} color='#fff'/>
                                        </div>
                                    </div>
                                    <div className='wave-saved-sample'>
                                        <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
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
                                        <Heart  size={32} strokeWidth={1} color='#fff'/>
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

export default SavedSamples