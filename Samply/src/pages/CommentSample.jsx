import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/background/AnimatedBackground';
import { CircleUser, ArrowDownToLine, Share2, Heart, Play, Send  } from 'lucide-react';
import '../css/CommentSample.css';
function CommentSample(){
    const navigate = useNavigate();

    return(
        <>
            <AnimatedBackground />
            <div className='comment-sample-container'>
                <div className="back">
                    <button onClick={() => navigate(-1)}> <p>Go Back</p></button>
                </div>
                <div className='intro-comment-sample'>
                    <h2>Rainy melody with harmonic violins</h2>
                    <div className='post-comment-sample'>
                        <div className='intro-post-comment'>
                            <div className='info-post-comment'>
                                <div className='profile-post-comment'>
                                    <CircleUser size={40} strokeWidth={1} color='#000' />
                                    <p>Glory - 29th Apr. 2025</p>
                                </div>
                                <div className='info-post-icons'>
                                    <div className='info-post-icon'>
                                        <ArrowDownToLine size={28} strokeWidth={1} color='#fff'/>
                                        <p>Download</p>
                                    </div>
                                </div>
                            </div>
                            <div className='audio-post-comment'>
                                <div className='wave-post-comment'>
                                    <button>
                                        <Play size={42} strokeWidth={1} color='#fff' fill='#fff'/>
                                    </button>
                                    <div className='waveform-post-comment'>
                                        <div className='waveform-audio'>
                                            <p>Wave</p>
                                        </div>
                                        <div className='timestamps-post-comment'>
                                            <p>00:00</p>
                                            <p>00:50</p>
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
                            <p>Craft a smooth jazz melody with a walking bassline, mellow piano chords, and a soulful saxophone lead. Add soft brush drums and a touch of vibraphone for a cozy, late-night lounge vibe.</p>
                        </div>
                    </div>
                    <div className='comment-post-sample'>
                        <div className='write-comment'>
                            <CircleUser size={60} strokeWidth={1} color='#000' />
                            <input
                                type="text"
                                placeholder="Drop a comment!"
                            />
                        </div>
                        <div className='post-comment'>
                            <Send size={36} strokeWidth={1} color='#fff' />
                            <p>Post</p>
                        </div>
                    </div>
                    <div className='white-line2'></div>
                    <div className='comments'>
                        <div className='comment'>
                            <div className='comment-info'>
                                <div className='profile-comment'>
                                    <CircleUser size={50} strokeWidth={1} color='#000' />
                                    <p>Glory - 5h Ago</p>
                                </div>
                                <div className='comment-icon'>
                                    <button>
                                        <Heart size={30} strokeWidth={1} color='#fff'/>
                                    </button>
                                    <p>351</p>
                                </div>
                            </div>  
                            <div className='comment-txt'>
                                <p>I really like this sample, and the piano at the end is really peaceful. I really like this sample, and the piano at the end is really peaceful. I really like this sample, and the piano at the end is really peaceful. I really like this sample, and the piano at the end is really peaceful. I really like this sample, and the piano at the end is really peaceful. </p>
                            </div>
                        </div>
                        <div className='comment'>
                            <div className='comment-info'>
                                <div className='profile-comment'>
                                    <CircleUser size={50} strokeWidth={1} color='#000' />
                                    <p>Glory - 5h Ago</p>
                                </div>
                                <div className='comment-icon'>
                                    <button>
                                        <Heart size={30} strokeWidth={1} color='#fff'/>
                                    </button>
                                    <p>351</p>
                                </div>
                            </div>  
                            <div className='comment-txt'>
                                <p> really peaceful. I really like this sample, and the piano at the end is really peaceful. </p>
                            </div>
                        </div>
                        <div className='comment'>
                            <div className='comment-info'>
                                <div className='profile-comment'>
                                    <CircleUser size={50} strokeWidth={1} color='#000' />
                                    <p>Glory - 5h Ago</p>
                                </div>
                                <div className='comment-icon'>
                                    <button>
                                        <Heart size={30} strokeWidth={1} color='#fff'/>
                                    </button>
                                    <p>351</p>
                                </div>
                            </div>  
                            <div className='comment-txt'>
                                <p> I really like this sample, and the piano at the end is really peaceful. I really like this sample, and the piano at the end is really peaceful. I really like this sample, and the piano at the end is really peaceful. </p>
                            </div>
                        </div>
                        <div className='comment'>
                            <div className='comment-info'>
                                <div className='profile-comment'>
                                    <CircleUser size={50} strokeWidth={1} color='#000' />
                                    <p>Glory - 5h Ago</p>
                                </div>
                                <div className='comment-icon'>
                                    <button>
                                        <Heart size={30} strokeWidth={1} color='#fff'/>
                                    </button>
                                    <p>351</p>
                                </div>
                            </div>  
                            <div className='comment-txt'>
                                <p> I really like this sample, and the piano at the end is really peaceful. I really like this sample, and the piano at the end is really peaceful. I really like this sample, and the piano at the end is really peaceful. I really like this sample, and the piano at the end is really peaceful. </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CommentSample;