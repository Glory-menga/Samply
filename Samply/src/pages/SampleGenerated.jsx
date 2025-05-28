import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from "../components/background/AnimatedBackground";
import { ArrowDownToLine, Save, Play, Pause } from 'lucide-react';
import Metaball from '../components/3dObjects/Metaball';
import '../css/SampleGenerated.css';

function SampleGenerated(){
    const navigate = useNavigate();
    const [samples, setSamples] = useState([]);
    const [originalPrompt, setOriginalPrompt] = useState('');
    const [correctedPrompt, setCorrectedPrompt] = useState('');
    const [playingIndex, setPlayingIndex] = useState(null);
    const [currentTime, setCurrentTime] = useState([0, 0]);
    const [duration, setDuration] = useState([0, 0]);
    const [loading, setLoading] = useState(true);
    const audioRefs = useRef([]);

    useEffect(() => {
        // Load samples from localStorage
        const storedSamples = localStorage.getItem('generatedSamples');
        
        if (!storedSamples) {
            // If no samples found, redirect to generate page
            navigate('/generate');
            return;
        }

        try {
            const data = JSON.parse(storedSamples);
            setSamples(data.samples || []);
            setOriginalPrompt(data.originalPrompt || '');
            setCorrectedPrompt(data.correctedPrompt || '');
            
            // Initialize audio refs
            audioRefs.current = new Array(data.samples?.length || 0).fill(null);
            setCurrentTime(new Array(data.samples?.length || 0).fill(0));
            setDuration(new Array(data.samples?.length || 0).fill(0));
        } catch (error) {
            console.error('Error parsing stored samples:', error);
            navigate('/generate');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const handlePlay = async (index) => {
        const sample = samples[index];
        if (!sample || !sample.audio) return;

        // Pause any currently playing audio
        if (playingIndex !== null && audioRefs.current[playingIndex]) {
            audioRefs.current[playingIndex].pause();
        }

        if (playingIndex === index) {
            // If same audio is playing, pause it
            setPlayingIndex(null);
            return;
        }

        try {
            // Create new audio element if it doesn't exist
            if (!audioRefs.current[index]) {
                const audio = new Audio();
                audio.crossOrigin = "anonymous";
                
                // Use proxy endpoint to avoid CORS issues
                audio.src = `http://localhost:5000/api/replicate/proxy-audio?url=${encodeURIComponent(sample.audio)}`;
                
                audio.addEventListener('loadedmetadata', () => {
                    const newDuration = [...duration];
                    newDuration[index] = audio.duration;
                    setDuration(newDuration);
                });

                audio.addEventListener('timeupdate', () => {
                    const newCurrentTime = [...currentTime];
                    newCurrentTime[index] = audio.currentTime;
                    setCurrentTime(newCurrentTime);
                });

                audio.addEventListener('ended', () => {
                    setPlayingIndex(null);
                    const newCurrentTime = [...currentTime];
                    newCurrentTime[index] = 0;
                    setCurrentTime(newCurrentTime);
                });

                audioRefs.current[index] = audio;
            }

            await audioRefs.current[index].play();
            setPlayingIndex(index);
        } catch (error) {
            console.error('Error playing audio:', error);
            alert('Failed to play audio. Please try again.');
        }
    };

    const handleDownload = async (index) => {
        const sample = samples[index];
        if (!sample || !sample.audio) return;

        try {
            const response = await fetch(`http://localhost:5000/api/replicate/proxy-audio?url=${encodeURIComponent(sample.audio)}`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sample.title}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading audio:', error);
            alert('Failed to download audio. Please try again.');
        }
    };

    const handleSave = (index) => {
        // For now, just show an alert. You can implement your save logic here
        alert('Save functionality will be implemented based on your requirements.');
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleGenerateNew = () => {
        // Clear stored samples and navigate to generate page
        localStorage.removeItem('generatedSamples');
        navigate('/generate');
    };

    if (loading) {
        return (
            <>
                <AnimatedBackground />
                <div className="sample-generated-container">
                    <div className="loading-message">
                        <h1>Loading your samples...</h1>
                    </div>
                </div>
            </>
        );
    }

    if (samples.length === 0) {
        return (
            <>
                <AnimatedBackground />
                <div className="sample-generated-container">
                    <div className="no-samples">
                        <h1>No samples found</h1>
                        <button onClick={() => navigate('/generate')}>
                            Generate New Samples
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return(
        <>
            <AnimatedBackground />
            <div className="sample-generated-container">
                <div className="back">
                    <button onClick={handleGenerateNew}>
                        <p>Generate New Samples</p>
                    </button>
                </div>
                <div className='sample-generated-wrapper'>
                    <div className='intro-sample-generated'>
                        <h1>Choose Your Sound: Two Unique Samples Await</h1>
                    </div>
                    <div className='generated-samples'>
                        <div className='generated-sample'>
                            {samples.map((sample, index) => (
                                <div key={index} className='sample-gen'>
                                    <div className='audio-generated-sample'>
                                        <div className='intro-audio-gen'>
                                            <div className='name-generated-sample'>
                                                <p><b>{index + 1}.</b></p>
                                                <p>{sample.title}</p>
                                            </div>
                                            <div className='generated-sample-icons'>
                                                <button onClick={() => handleDownload(index)}>
                                                    <ArrowDownToLine size={28} strokeWidth={1} color='#fff'/>
                                                </button>
                                                <button onClick={() => handleSave(index)}>
                                                    <Save size={28} strokeWidth={1} color='#fff'/>
                                                </button>
                                            </div>
                                        </div>
                                        <div className='wave-generated-sample'>
                                            <div className='waveform-gen'>
                                                <button onClick={() => handlePlay(index)}>
                                                    {playingIndex === index ? (
                                                        <Pause size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                                    ) : (
                                                        <Play size={40} strokeWidth={1} color='#fff' fill='#fff'/>
                                                    )}
                                                </button>
                                                <div className='wave-gen'>
                                                    <div className='audio-progress-bar'>
                                                        <div 
                                                            className='audio-progress' 
                                                            style={{
                                                                width: duration[index] > 0 
                                                                    ? `${(currentTime[index] / duration[index]) * 100}%` 
                                                                    : '0%'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className='timestamps-generated-sample'>
                                                        <p>{formatTime(currentTime[index] || 0)}</p>
                                                        <p>{duration[index] > 0 ? formatTime(duration[index]) : '--:--'}</p>
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
                            ))}
                        </div>
                        <div className='generated-prompt'>
                            <div className='gen-prompt'>
                                <p> {correctedPrompt}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SampleGenerated;