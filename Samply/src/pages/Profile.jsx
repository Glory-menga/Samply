import { useState } from 'react';
import '../css/Profile.css';
import AnimatedBackground from "../components/background/AnimatedBackground";
import Nav from '../components/Nav';
import { Eye, EyeOff, Pen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function Profile() {
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    const passwordAnimationVariants = {
        hidden: { 
            opacity: 0,
            y: 50,
            transition: { 
                duration: 0.3,
                ease: "easeInOut"
            }
        },
        visible: { 
            opacity: 1,
            y: 0,
            transition: { 
                duration: 0.3,
                ease: "easeOut",
                when: "beforeChildren",
                staggerChildren: 0.2 
            }
        },
        exit: {
            opacity: 0,
            y: 50,
            transition: { 
                duration: 0.3,
                ease: "easeInOut",
                when: "afterChildren",
                staggerChildren: 0
            }
        }
    };
    
    const passwordFieldVariants = {
        hidden: { 
            opacity: 0,
            y: 20,
            transition: { duration: 0.3 }
        },
        visible: custom => ({ 
            opacity: 1,
            y: 0,
            transition: { 
                duration: 0.3,
                delay: custom * 0.1
            }
        }),
        exit: { 
            opacity: 0,
            transition: { duration: 0.3 }
        }
    };

    const handleChangePasswordClick = () => {
        setShowChangePassword(!showChangePassword);
    };

    return (
        <>
            <Nav />
            <AnimatedBackground />
            <div className='profile-container'>
                <h1>Hi, Mengs</h1>
                <div className='profile-wrapper'>
                    <div className='edit-profile'>
                        <div className='edit-name-profile'>
                            <div className='edit'>
                                <p>Username</p>
                                <div className='edit-update'>
                                    <p>Glory</p>
                                    <Pen size={25} strokeWidth={1} color='#fff' fill='#fff' />
                                </div>
                            </div>
                            <div className='edit'>
                                <p>Email</p>
                                <div className='edit-update-mail'>
                                    <p>Glory@gmail.com</p>
                                </div>
                            </div>
                        </div>
                        <div className='change-password-button'>
                            <button onClick={handleChangePasswordClick}>
                               <p>{showChangePassword ? 'Close' : 'Change Password'}</p>
                            </button>
                        </div>
                        
                        <AnimatePresence>
                            {showChangePassword && (
                                <motion.div 
                                    className='change-password'
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    variants={passwordAnimationVariants}
                                >
                                    <motion.div 
                                        className='old-password'
                                        variants={passwordFieldVariants}
                                        custom={0}
                                    >
                                        <div className='password-txt'>
                                            <p>Old Password</p>
                                        </div>
                                        <div className='password-change'>
                                            <input
                                                type={showOldPassword ? "text" : "password"}
                                                placeholder="Password"
                                            />
                                            <span onClick={() => setShowOldPassword(!showOldPassword)}>
                                                {showOldPassword ? <EyeOff size={36} strokeWidth={1} color='#fff' /> : <Eye strokeWidth={1} size={36} color='#fff' />}
                                            </span>
                                        </div>
                                    </motion.div>
                                    <motion.div 
                                        className='new-password'
                                        variants={passwordFieldVariants}
                                        custom={1}
                                    >
                                        <div className='password-txt'>
                                            <p>New Password</p>
                                        </div>
                                        <div className='password-change'>
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="Password"
                                            />
                                            <span onClick={() => setShowNewPassword(!showNewPassword)}>
                                                {showNewPassword ? <EyeOff strokeWidth={1} size={36} color='#fff' /> : <Eye strokeWidth={1} size={36} color='#fff' />}
                                            </span>
                                        </div>
                                    </motion.div>
                                    <motion.div 
                                        className='password-confirm'
                                        variants={passwordFieldVariants}
                                        custom={2}
                                    >
                                        <div className='password-txt'>
                                            <p>Password Confirmation</p>
                                        </div>
                                        <div className='password-change'>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Password"
                                            />
                                            <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <EyeOff strokeWidth={1} size={36} color='#fff' /> : <Eye strokeWidth={1} size={36} color='#fff' />}
                                            </span>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className='right-profile'>
                        <div className='change-image'>
                            <div className='profile-pic'></div>
                            <div className='upload-pic'>
                                <button><p>Upload new image</p></button>
                            </div>
                        </div>
                        <div className='disconnect-save'>
                            <div className='disconnect'>
                                <button>
                                    <X size={40} strokeWidth={1} color='#CF0000' />
                                    <p>Disconnect</p>
                                </button>
                            </div>
                            <div className='white-divider'></div>
                            <div className='save-button'>
                                <button><p>Save</p></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Profile;