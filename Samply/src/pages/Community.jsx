import AnimatedBackground from '../components/background/AnimatedBackground';
import Nav from '../components/Nav';
import { Link } from 'react-router';
import { Heart, ArrowDownToLine, Play, Share2, CircleUser, MessageSquare    } from 'lucide-react';
import LikedSamplesTab from '../components/tabs/LikedSamplesTab';

function Community(){
    return(
        <>
            <Nav />
            <AnimatedBackground />
            <div className='community-container'>
                < LikedSamplesTab />
                <h1>Feed</h1>
                <h4>Popular Posts</h4>
                <div className='popular-posts'>
                    <div className='popular-post'>
                        <div className='first-popular-post'>
                            <div className='profile-popular-post'>
                                <p>Glory</p>
                                <div className='popular-post-icons'>
                                    <Heart size={24} strokeWidth={1} color='#fff'/>
                                    <ArrowDownToLine size={24} strokeWidth={1} color='#fff'/>
                                </div>
                            </div>
                            <div className='title-popular-post'>
                                <p>Jazzy melody with a slow tempo</p>
                            </div>
                        </div>
                        <div className='audio-popular-post'>
                            <Play size={34} strokeWidth={1} color='#fff' fill='#fff'/>
                            <div className='wave-popular-post'>
                                <div className='waveform'>
                                    <p>wave</p>
                                </div>
                                <div className='timestamps-popular-post'>
                                    <p>00:00</p>
                                    <p>00:02</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='posts-container'>
                    <h4>Posts</h4>
                    <div className='posts'>
                        <div className='post'>
                            <div className='audio-post'>
                                <div className='intro-post'>
                                    <div className='profile-post'>
                                        <div className='profile-post-info'>
                                            <CircleUser size={42} strokeWidth={1} color='#fff'/>
                                            <p> <b>Glory</b> - 5h ago</p>
                                        </div>
                                        <div className='post-title'>
                                            <p>Rainy melody with harmonic violins</p>
                                        </div>
                                    </div>
                                    <div className='post-icons'>
                                        <div className='post-icon'>
                                            <ArrowDownToLine size={28} strokeWidth={1} color='#fff'/>
                                            <p>Download</p>
                                        </div>
                                        <div className='post-icon'>
                                            <Share2 size={28} strokeWidth={1} color='#fff'/>
                                            <p>Share</p>
                                        </div>
                                    </div>
                                </div>
                                <div className='wave-audio-post'>
                                    <div className='waveform-post'>
                                        <Play size={38} strokeWidth={1} color='#fff' fill='#fff'/>

                                        <div className='waveform-details'>
                                            <p>wave</p>
                                            <div className='timestamps-wave-post'>
                                                <p>00:00</p>
                                                <p>00:20</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='wave-icons'>
                                        <Link to='#' className='wave-icon'>
                                            <Heart size={28} strokeWidth={1} color='#fff'/>
                                            <p>206</p>
                                        </Link>
                                        <Link to='/comment-sample' className='wave-icon'>
                                            <MessageSquare size={28} strokeWidth={1} color='#fff'/>
                                            <p>206</p>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className='prompt-post'>
                                <p>Craft a smooth jazz melody with a walking bassline, mellow piano chords, and a soulful saxophone lead. Add soft brush drums and a touch of vibraphone for a cozy, late-night lounge vibe.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Community;