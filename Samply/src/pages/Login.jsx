import { useState } from 'react';
import { useNavigate } from "react-router";
import AnimatedBackground from "../components/background/AnimatedBackground";
import { Link } from "react-router";
import { Mail, Eye, EyeOff } from 'lucide-react';
import  '../css/Login.css';

function Login(){
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    return(
        <>
            <AnimatedBackground />
            <div className="login-container">
                <div className="login-background">
                    <h2>Welcome back!</h2>
                </div>
                <div className="login-form">
                    <div className="go-home">
                        <button><Link to="/"><p>Home</p></Link></button>
                    </div>
                    <div className="form-txt">
                        <h2>Log in</h2>
                        <div className="form">
                            <input
                                type="email" 
                                id="email" 
                                placeholder="Email adress"
                            />
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="Password"
                                />
                                <span
                                    className="eye-icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={30} strokeWidth={1} /> : <Eye size={30} strokeWidth={1}/>}
                                </span>
                            </div>
                        </div>
                        <div className="signup-suggestion">
                            <p>Don't have an <Link to="/signup" className="go-signup">account</Link> yet?</p>
                        </div>
                        <div className="get-started">
                            <button><p>Get Started</p></button>
                        </div>
                        <div className="divider">
                            <p>or</p>
                        </div>
                        <div className="side-connections">
                            <button>
                                <Mail size={22} strokeWidth={1} color='#fff'/>
                                <p>Continue with google</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Login;