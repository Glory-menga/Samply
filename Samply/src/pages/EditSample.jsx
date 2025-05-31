import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Galaxy from '../components/3dObjects/Galaxy';
import { LoaderCircle, Play, Square } from 'lucide-react';
import Metaball from '../components/3dObjects/Metaball';
import Knob from '../components/Knob';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { Save, ArrowDownToLine, Loader } from 'lucide-react';
import * as Tone from 'tone';
import '../css/EditSample.css';

function EditSample(){
    const navigate = useNavigate();
    const [tempoValue, setTempoValue] = useState(2);
    const [sampleData, setSampleData] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLooping, setIsLooping] = useState(true);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [reverse, setReverse] = useState(false);
    const [pitchShift, setPitchShift] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    
    const playerRef = useRef(null);
    const pitchShiftRef = useRef(null);
    const analyserRef = useRef(null);
    const webAudioAnalyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const destinationRef = useRef(null);
    
    const tempoLevels = ['Very Fast', 'Fast', 'Normal', 'Slow', 'Very Slow'];
    const tempoMultipliers = [2, 1.5, 1, 0.75, 0.5];

    // Function to convert AudioBuffer to WAV format
    const audioBufferToWav = (audioBuffer) => {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;

        const buffer = new ArrayBuffer(44 + audioBuffer.length * numberOfChannels * bytesPerSample);
        const view = new DataView(buffer);

        // Write WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        let offset = 0;
        writeString(offset, 'RIFF'); offset += 4;
        view.setUint32(offset, 36 + audioBuffer.length * numberOfChannels * bytesPerSample, true); offset += 4;
        writeString(offset, 'WAVE'); offset += 4;
        writeString(offset, 'fmt '); offset += 4;
        view.setUint32(offset, 16, true); offset += 4;
        view.setUint16(offset, format, true); offset += 2;
        view.setUint16(offset, numberOfChannels, true); offset += 2;
        view.setUint32(offset, sampleRate, true); offset += 4;
        view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
        view.setUint16(offset, blockAlign, true); offset += 2;
        view.setUint16(offset, bitDepth, true); offset += 2;
        writeString(offset, 'data'); offset += 4;
        view.setUint32(offset, audioBuffer.length * numberOfChannels * bytesPerSample, true); offset += 4;

        // Write audio data
        const channels = [];
        for (let i = 0; i < numberOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }

        let sampleIndex = 0;
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, channels[channel][i]));
                const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset + sampleIndex * 2, intSample, true);
                sampleIndex++;
            }
        }

        return new Blob([buffer], { type: 'audio/wav' });
    };

    useEffect(() => {
        const storedSampleData = localStorage.getItem('editSampleData');
        
        if (!storedSampleData) {
            navigate('/sample-generated');
            return;
        }

        try {
            const data = JSON.parse(storedSampleData);
            setSampleData(data);
        } catch (error) {
            console.error('Error parsing sample data:', error);
            navigate('/sample-generated');
        }
    }, [navigate]);

    useEffect(() => {
        if (sampleData && sampleData.sample.audio) {
            initializeAudio();
        }

        return () => {
            cleanup();
        };
    }, [sampleData]);

    useEffect(() => {
        if (playerRef.current && audioLoaded) {
            playerRef.current.reverse = reverse;
        }
    }, [reverse, audioLoaded]);

    useEffect(() => {
        if (pitchShiftRef.current) {
            pitchShiftRef.current.pitch = pitchShift;
        }
    }, [pitchShift]);

    useEffect(() => {
        if (playerRef.current && audioLoaded) {
            const playbackRate = tempoMultipliers[tempoValue];
            playerRef.current.playbackRate = playbackRate;
        }
    }, [tempoValue, audioLoaded]);

    const cleanup = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (playerRef.current) {
            playerRef.current.dispose();
            playerRef.current = null;
        }
        if (pitchShiftRef.current) {
            pitchShiftRef.current.dispose();
            pitchShiftRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.dispose();
            analyserRef.current = null;
        }
        if (webAudioAnalyserRef.current) {
            webAudioAnalyserRef.current = null;
        }
        if (destinationRef.current) {
            destinationRef.current = null;
        }
    };

    const initializeAudio = async () => {
        try {
            cleanup();

            const proxyUrl = `http://localhost:5000/api/replicate/proxy-audio?url=${encodeURIComponent(sampleData.sample.audio)}`;
            
            playerRef.current = new Tone.Player({
                url: proxyUrl,
                loop: isLooping,
                reverse: reverse,
                playbackRate: tempoMultipliers[tempoValue], 
                onload: () => {
                    setDuration(playerRef.current.buffer.duration);
                    setAudioLoaded(true);
                    console.log('Audio loaded successfully');
                },
                onerror: (error) => {
                    console.error('Error loading audio:', error);
                }
            });

            pitchShiftRef.current = new Tone.PitchShift({
                pitch: pitchShift,
                windowSize: 0.1,
                overlap: 0.25,
                delayTime: 0
            });

            analyserRef.current = new Tone.Analyser('waveform', 256);

            const audioContext = Tone.getContext().rawContext;
            webAudioAnalyserRef.current = audioContext.createAnalyser();
            webAudioAnalyserRef.current.fftSize = 256;
            webAudioAnalyserRef.current.smoothingTimeConstant = 0.8;

            // Create a destination for recording
            destinationRef.current = audioContext.createMediaStreamDestination();

            playerRef.current.connect(pitchShiftRef.current);
            pitchShiftRef.current.toDestination();
            
            pitchShiftRef.current.connect(analyserRef.current);
            
            const toneNode = pitchShiftRef.current.output;
            toneNode.connect(webAudioAnalyserRef.current);
            
            // Connect to recording destination
            toneNode.connect(destinationRef.current);

            playerRef.current.onstop = () => {
                setIsPlaying(false);
                setCurrentTime(0);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };

        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    };

    const handlePlayPause = async () => {
        if (!playerRef.current || !audioLoaded) return;

        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }

            if (isPlaying) {
                playerRef.current.stop();
                Tone.Transport.stop();
                setIsPlaying(false);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            } else {
                Tone.Transport.start();
                playerRef.current.start();
                setIsPlaying(true);
                
                let startTime = Tone.now();
                const updateTime = () => {
                    if (playerRef.current && playerRef.current.state === 'started') {
                        const elapsed = Tone.now() - startTime;
                        const adjustedDuration = duration / tempoMultipliers[tempoValue]; 
                        
                        if (elapsed >= adjustedDuration) {
                            if (isLooping) {
                                startTime = Tone.now();
                                setCurrentTime(0);
                            } else {
                                playerRef.current.stop();
                                setIsPlaying(false);
                                setCurrentTime(0);
                                return;
                            }
                        } else {
                            setCurrentTime(elapsed);
                        }
                        
                        animationFrameRef.current = requestAnimationFrame(updateTime);
                    } else {
                        setIsPlaying(false);
                        setCurrentTime(0);
                    }
                };
                updateTime();
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    const handleDownload = async () => {
        if (!playerRef.current || !audioLoaded || !destinationRef.current) {
            alert('Audio not ready for download. Please wait for audio to load.');
            return;
        }

        try {
            setIsDownloading(true);
            recordedChunksRef.current = [];

            // Ensure Tone.js context is running
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(destinationRef.current.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                try {
                    const webmBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                    
                    // Convert WebM to WAV using Web Audio API
                    const arrayBuffer = await webmBlob.arrayBuffer();
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // Convert AudioBuffer to WAV
                    const wavBlob = audioBufferToWav(audioBuffer);
                    
                    const url = URL.createObjectURL(wavBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${sampleData.sample.title}_edited.wav`;
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } catch (conversionError) {
                    console.error('Error converting to WAV, falling back to WebM:', conversionError);
                    // Fallback to original WebM if conversion fails
                    const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${sampleData.sample.title}_edited.webm`;
                    document.body.appendChild(a);
                    a.click();
                    URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }
                
                // Ensure the sample is stopped and paused after download
                if (playerRef.current && playerRef.current.state === 'started') {
                    playerRef.current.stop();
                }
                Tone.Transport.stop();
                setIsPlaying(false);
                setCurrentTime(0);
                setIsDownloading(false);
            };

            // Start recording
            mediaRecorder.start();

            // Temporarily disable looping for recording
            const wasLooping = isLooping;
            if (playerRef.current) {
                playerRef.current.loop = false;
            }

            // Start playback
            Tone.Transport.start();
            playerRef.current.start();
            setIsPlaying(true);

            // Calculate the duration of the edited sample
            const recordingDuration = (duration / tempoMultipliers[tempoValue]) * 1000; // Convert to milliseconds

            // Stop recording after the sample finishes
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
                
                // Stop playback
                if (playerRef.current && playerRef.current.state === 'started') {
                    playerRef.current.stop();
                }
                
                // Restore original looping setting
                if (playerRef.current) {
                    playerRef.current.loop = wasLooping;
                }
                
                Tone.Transport.stop();
                setIsPlaying(false);
                setCurrentTime(0);
            }, recordingDuration + 100); // Add small buffer

        } catch (error) {
            console.error('Error recording audio:', error);
            alert('Failed to download edited audio. Please try again.');
            setIsDownloading(false);
            setIsPlaying(false);
        }
    };

    const handleSave = () => {
        alert('Save functionality will be implemented based on your requirements.');
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleReverseToggle = (checked) => {
        setReverse(checked);
        
        if (isPlaying && playerRef.current) {
            playerRef.current.stop();
            setIsPlaying(false);
        }
    };

    const handlePitchChange = (value) => {
        setPitchShift(value);
    };

    const handleTempoChange = (value) => {
        setTempoValue(value);
        if (playerRef.current && audioLoaded) {
            playerRef.current.playbackRate = tempoMultipliers[value];
        }
    };

    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.loop = isLooping;
        }
    }, [isLooping]);

    if (!sampleData) {
        return (
            <>
                <div className='space'>
                    <Galaxy />
                </div>
                <div className="edit-sample-container">
                    <div className="loading-message">
                        <h1>Loading sample...</h1>
                    </div>
                </div>
            </>
        );
    }

    return(
        <>
            <div className={`main-content ${isDownloading ? 'blurred' : ''}`}>
                <div className='space'>
                    <Galaxy />
                </div>
                <div className="edit-sample-container">
                    <div className="back">
                        <button onClick={() => navigate(-1)}> 
                            <p>Back to the generated samples</p>
                        </button>
                    </div>
                    <div className='edit-sample-wrapper'>
                        <motion.h1
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            {sampleData.sample.title}
                        </motion.h1>
                        <div className='edit-metaball'>
                            <div className='edit-pitch-semitones'>
                                <Knob onChange={handlePitchChange} />
                                <div className='reverse-toggle'> 
                                    <Checkbox.Root
                                        className="checkbox-custom"
                                        id="reverse"
                                        checked={reverse}
                                        onCheckedChange={handleReverseToggle}
                                    >
                                        <Checkbox.Indicator className="checkbox-indicator">
                                            <CheckIcon />
                                        </Checkbox.Indicator>
                                    </Checkbox.Root>
                                    <p>Reverse: {reverse ? "ON" : "OFF"}</p>
                                </div>
                            </div>
                            <motion.div 
                                className='placement-metaball'
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ 
                                    duration: 0.8, 
                                    ease: "easeOut",
                                    delay: 0.3 
                                }}
                            >
                                <Metaball 
                                    width="100%" 
                                    height="100%" 
                                    sphereScale={1.4}
                                    analyser={webAudioAnalyserRef.current}
                                    animationSpeed={isPlaying ? 1.5 : 0.3}
                                    isHovering={isPlaying}
                                />
                            </motion.div>
                            <div className='edit-tempo'>
                                <div className="tempo-slider-wrapper">
                                    <input
                                        type="range"
                                        min="0"
                                        max="4"
                                        step="1"
                                        value={4 - tempoValue}
                                        onChange={(e) => handleTempoChange(4 - Number(e.target.value))}
                                        className="tempo-slider"
                                    />
                                    <p className="tempo-label">Tempo : {tempoLevels[tempoValue]}</p>
                                </div>
                            </div>
                        </div>
                        <div className='timestamps-edit-sample'>
                            <button 
                                onClick={handlePlayPause}
                                disabled={!audioLoaded || isDownloading}
                                className={(!audioLoaded || isDownloading) ? 'disabled' : ''}
                            >
                                {isPlaying ? (
                                    <Square  size={32} strokeWidth={1} color='#fff' fill='#fff'/>
                                ) : (
                                    <Play size={32} strokeWidth={1} color='#fff' fill='#fff'/>
                                )}
                            </button>
                            <div className='time-sample'>
                                <p>{formatTime(currentTime)}</p>
                                <p>/</p>
                                <p>{formatTime(duration / tempoMultipliers[tempoValue])}</p>
                            </div>
                            <div className='loop-toggle'>
                                <Checkbox.Root
                                    className="loop-checkbox-custom"
                                    id="loop"
                                    checked={isLooping}
                                    onCheckedChange={setIsLooping}
                                >
                                    <Checkbox.Indicator className="loop-checkbox-indicator">
                                        <CheckIcon />
                                    </Checkbox.Indicator>
                                </Checkbox.Root>
                                <p>Loop: {isLooping ? "ON" : "OFF"}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='edit-sample-icons'>
                    <button onClick={handleSave}>
                        <Save size={32} strokeWidth={1} color='#fff'/>
                    </button>
                    <button 
                        onClick={handleDownload}
                        disabled={!audioLoaded || isDownloading}
                        className={(!audioLoaded || isDownloading) ? 'disabled' : ''}
                    >
                        {isDownloading ? (
                            <Loader size={32} strokeWidth={1} color='#fff' className="download-spinner"/>
                        ) : (
                            <ArrowDownToLine size={32} strokeWidth={1} color='#fff'/>
                        )}
                    </button>
                </div>
            </div>
            {isDownloading && (
                <div className="download-overlay">
                    <div className="download-message">
                        <LoaderCircle size={48} strokeWidth={1} color='#fff' className="download-spinner-large"/>
                        <p>Recording and downloading edited sample...</p>
                    </div>
                </div>
            )}
        </>
    );
}

export default EditSample;