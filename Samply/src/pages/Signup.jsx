import '../css/Signup.css';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BlurredBubbleBackground from '../components/background/BlurredBubbleBackground';
import { Eye, EyeOff } from 'lucide-react';

function Signup() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignup = async () => {
        if (!email || !password || !username || !confirmPassword) {
            toast.error("All fields are required");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Invalid email address");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            });

            if (error) {
                if (error.message.toLowerCase().includes("already registered")) {
                    toast.error("An account with this email already exists.");
                } else {
                    toast.error(error.message);
                }
            } else {
                toast.success("Account created! Now log in.");
                navigate("/login");
            }
        } catch (err) {
            toast.error("Something went wrong. Please try again.");
            console.error("Signup error:", err);
        }
    };


    return (
        <>  
            <BlurredBubbleBackground />
            <div className='sign-container'>
                <div className='signup-form-wrapper'>
                    <div className="go-home">
                        <button onClick={() => navigate(-1)}> <p>Log in</p></button>
                    </div>
                    <div className="signup-form-txt">
                        <h2>Sign Up</h2>
                        <form
                            className="signup-form"
                            onSubmit={(e) => {
                                e.preventDefault(); 
                                handleSignup();     
                            }}
                            >
                                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username"/>
                                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/>
                                <div className="signup-password-wrapper">
                                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"/>
                                    <span className="signup-eye-icon" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={30} strokeWidth={1} /> : <Eye size={30} strokeWidth={1} />}
                                    </span>
                                </div>
                                <div className="signup-password-wrapper">
                                    <input type={showPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password"/>
                                    <span className="signup-eye-icon" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={30} strokeWidth={1} /> : <Eye size={30} strokeWidth={1} />}
                                    </span>
                                </div>
                                <div className="signup-get-started">
                                    <button type="submit"><p>Join us</p></button>
                                </div>
                        </form>
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
