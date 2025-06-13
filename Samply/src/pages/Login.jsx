import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/background/AnimatedBackground";
import { supabase } from "../supabaseClient";
import { toast } from 'react-toastify';
import { Link } from "react-router-dom";
import { Mail, Eye, EyeOff } from 'lucide-react';
import '../css/Login.css';

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Attempts to sign in a user using Supabase email/password authentication
   * Validates email format and handles success or error feedback via toasts
   */
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email address");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          toast.error("Incorrect email or password");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("You're now logged in. Start generating your samples!");
        navigate("/generate");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  /**
   * Initiates OAuth login using Google as the provider via Supabase
   * Handles error feedback via toast notifications
   */
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        toast.error("Google sign-in failed");
      }
    } catch (err) {
      console.error("OAuth error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
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
            <form
              className="signup-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <input
                type="email"
                id="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={30} strokeWidth={1} /> : <Eye size={30} strokeWidth={1} />}
                </span>
              </div>
              <div className="signup-suggestion">
                <p>Don't have an <Link to="/signup" className="go-signup">account</Link> yet?</p>
              </div>
              <div className="get-started">
                <button type="submit"><p>Get Started</p></button>
              </div>
            </form>
            <div className="divider">
              <p>or</p>
            </div>
            <div className="side-connections">
              <button onClick={handleGoogleLogin}>
                <Mail size={22} strokeWidth={1} color='#fff' />
                <p>Continue with Google</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
