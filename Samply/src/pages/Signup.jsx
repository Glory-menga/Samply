import '../css/Signup.css';
import { useState } from 'react';
import { useNavigate } from "react-router";
import BlurredBubbleBackground from '../components/background/BlurredBubbleBackground';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router';

function Signup(){
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    return(
        <>  
            <BlurredBubbleBackground />
            <div className='sign-container'>
                <div className='signup-form-wrapper'>
                    <div className="go-home">
                        <button onClick={() => navigate(-1)}> <p>Log in</p></button>
                    </div>
                    <div className="signup-form-txt">
                        <h2>Sign Up</h2>
                        <div className="signup-form">
                            <input
                                type="name" 
                                id="name" 
                                placeholder="Username"
                            />
                            <input
                                type="email" 
                                id="email" 
                                placeholder="Email adress"
                            />
                            <div className="signup-password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="Password"
                                />
                                <span
                                    className="signup-eye-icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={30} strokeWidth={1} /> : <Eye size={30} strokeWidth={1}/>}
                                </span>
                            </div>
                            <div className="signup-password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="confirm-password"
                                    placeholder="Confirm password"
                                />
                                <span
                                    className="signup-eye-icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={30} strokeWidth={1} /> : <Eye size={30} strokeWidth={1}/>}
                                </span>
                            </div>
                        </div>
                        <div className="signup-get-started">
                            <button><p>Join us</p></button>
                        </div>
                    </div>
                </div>
                <div className='signup-background'>
                    <div className='txt-signup-background'>
                        <h2>Create Your account</h2>
                        <p>Generate samples and share it with everybody</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Signup;