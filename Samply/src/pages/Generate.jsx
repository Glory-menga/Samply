import React, { useState } from 'react';
import Nav from '../components/Nav';
import AnimatedBackground from '../components/Background/AnimatedBackground';
import { ChevronRight, Headphones, HeadphoneOff, Info, CircleX, X } from 'lucide-react';
import Metaball from '../components/3dObjects/Metaball';

function Generate(){
    const [prompt, setPrompt] = useState('');
    const [showTips, setShowTips] = useState(true);
    const [headphonesOn, headphonesOff] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const inspirationPrompts = [
        "dreamy piano melody with a slow tempo",
        "funky guitar riff with high energy",
        "chill lofi beat with relaxing vibe",
        "uplifting jazzy melody with a fast tempo",
        "ambient synth pad with spacious reverb",
        "acoustic folk progression with warm tones"
    ];

    const handleGetInspiration = () => {
        const randomPrompt = inspirationPrompts[Math.floor(Math.random() * inspirationPrompts.length)];
        setPrompt(randomPrompt);
    };

    const handleGenerateSample = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
        }, 2000);
    };

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
                    <div className='tips-generate'>
                        <div className='tip'>
                            <div className='tip-number'>
                                <p>1.</p>
                            </div>
                            <div className='tip-txt'>
                                <p><b>Describe Your Sound</b> – Choose a mood, style, and tempo (e.g., "chill lofi beat with slow tempo").</p>
                            </div>
                        </div>
                        <div className='tip'>
                            <div className='tip-number'>
                                <p>2.</p>
                            </div>
                            <div className='tip-txt'>
                                <p><b> Generate the Sample</b> – Click "Generate" to create a unique AI-powered sound.</p>
                            </div>
                        </div>
                        <div className='tip'>
                            <div className='tip-number'>
                                <p>3.</p>
                            </div>
                            <div className='tip-txt'>
                                <p><b>Listen & Refine</b> – Play your sample and tweak the prompt for different results.</p>
                            </div>
                        </div>
                        <div className='tip'>
                            <div className='tip-number'>
                                <p>4.</p>
                            </div>
                            <div className='tip-txt'>
                                <p><b>Download & Use</b> – Save your sample for music production, content, or inspiration.</p>
                            </div>
                        </div>
                    </div>
                     
                    <div className='prompt'>
                        <div className='input-prompt'>
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
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
                                <span>Need inspiration?</span>
                            </button>
                            
                            <button
                                className={`btn-generate ${isGenerating ? 'generating' : ''}`}
                                onClick={handleGenerateSample}
                                disabled={!prompt || isGenerating}
                            >
                                {isGenerating ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    <span>Generating...</span>
                                </>
                                ) : (
                                <>
                                    <span>Generate</span>
                                    <ChevronRight size={32} strokeWidth={1} />
                                </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <div className='help-generate'>
                    <div className='help-sphere'>
                        <Metaball width="100%" height="100%" sphereScale={1} />
                    </div>
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
                        <div className="tips-toggle">
                            <button onClick={() => headphonesOff(!headphonesOn)}>
                            {headphonesOn ? (
                                <>
                                <Headphones size={40} strokeWidth={1} color='#fff' />                                </>
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