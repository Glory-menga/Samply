import { useNavigate } from 'react-router-dom';
import AnimatedBackground from "../components/background/AnimatedBackground";
import { ArrowDownToLine, Save, Play  } from 'lucide-react';
import Metaball from '../components/3dObjects/Metaball';
import '../css/SampleGenerated.css';

function SampleGenerated(){
    const navigate = useNavigate();

    return(
        <>
            <AnimatedBackground />
            <div className="sample-generated-container">
                <div className="back">
                    <button onClick={() => navigate(-1)}> <p>Generate New Samples</p></button>
                </div>
                <div className='sample-generated-wrapper'>
                    <div className='intro-sample-generated'>
                        <h1>Choose Your Sound: Two Unique Samples Await</h1>
                    </div>
                    <div className='generated-samples'>
                        <div className='generated-sample'>
                            <div className='sample-gen'>
                                <div className='audio-generated-sample'>
                                    <div className='intro-audio-gen'>
                                        <div className='name-generated-sample'>
                                            <p><b>1.</b></p>
                                            <p> Jazzy melody with a slow tempo</p>
                                        </div>
                                        <div className='generated-sample-icons'>
                                            <button>
                                                <ArrowDownToLine size={28} strokeWidth={1} color='#fff'/>
                                            </button>
                                            <button>
                                                <Save size={28} strokeWidth={1} color='#fff'/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className='wave-generated-sample'>
                                        <div className='waveform-gen'>
                                            <button>
                                                <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                            </button>
                                            <div className='wave-gen'>
                                                <p>Wave</p>
                                                <div className='timestamps-generated-sample'>
                                                    <p>00:00</p>
                                                    <p>00:50</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='edit-generated-sample'>
                                            <div className='gen-metaball'>
                                                <Metaball />
                                            </div>
                                            <p>Edit Sample</p>
                                        </div>
                                    </div>
                                </div>
                                <div className='post-gen-sample'>
                                    <p>Publish Now</p>
                                </div>
                            </div>
                            <div className='sample-gen'>
                                <div className='audio-generated-sample'>
                                    <div className='intro-audio-gen'>
                                        <div className='name-generated-sample'>
                                            <p><b>1.</b></p>
                                            <p> Jazzy melody with a slow tempo</p>
                                        </div>
                                        <div className='generated-sample-icons'>
                                            <button>
                                                <ArrowDownToLine size={28} strokeWidth={1} color='#fff'/>
                                            </button>
                                            <button>
                                                <Save size={28} strokeWidth={1} color='#fff'/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className='wave-generated-sample'>
                                        <div className='waveform-gen'>
                                            <button>
                                                <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                            </button>
                                            <div className='wave-gen'>
                                                <p>Wave</p>
                                                <div className='timestamps-generated-sample'>
                                                    <p>00:00</p>
                                                    <p>00:50</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='edit-generated-sample'>
                                            <div className='gen-metaball'>
                                                <Metaball />
                                            </div>
                                            <p>Edit Sample</p>
                                        </div>
                                    </div>
                                </div>
                                <div className='post-gen-sample'>
                                    <p>Publish Now</p>
                                </div>
                            </div>
                        </div>
                        <div className='generated-prompt'>
                            <div className='gen-prompt'>
                                <p>Craft a smooth jazz melody with a walking bassline, mellow piano chords, and a soulful saxophone lead. Add soft brush drums and a touch of vibraphone for a cozy, late-night lounge vibe.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SampleGenerated;