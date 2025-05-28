import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import '../css/Profile.css';
import AnimatedBackground from "../components/background/AnimatedBackground";
import Nav from '../components/Nav';
import { Eye, EyeOff, Pen, X, Check, CircleUser } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function Profile() {
    const navigate = useNavigate();
    const { user } = useUser(); 
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    
    const [hasNameChanged, setHasNameChanged] = useState(false);
    const [hasPasswordChanged, setHasPasswordChanged] = useState(false);
    const [hasImageChanged, setHasImageChanged] = useState(false);

    useEffect(() => {
        if (user) {
            setUserName(user.user_metadata?.username || user.email?.split('@')[0] || 'User');
            setUserEmail(user.email || '');
            setNewUserName(user.user_metadata?.username || user.email?.split('@')[0] || 'User');
            setProfilePicture(user.user_metadata?.profile_picture || '');
        }
    }, [user]);

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

    const handleNameEdit = () => {
        setIsEditingName(true);
    };

    const handleNameSave = () => {
        if (newUserName.trim() !== userName) {
            setHasNameChanged(true);
        }
        setIsEditingName(false);
    };

    const handleNameCancel = () => {
        setNewUserName(userName);
        setIsEditingName(false);
    };

    const handleNameChange = (e) => {
        setNewUserName(e.target.value);
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setIsUploadingImage(true);

        try {
            const blackAndWhiteFile = await convertToBlackAndWhite(file);

            if (profilePicture) {
                try {
                    const url = new URL(profilePicture);
                    const pathParts = url.pathname.split('/');
                    const bucketIndex = pathParts.findIndex(part => part === 'user-profiles');
                    if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
                        const oldFilePath = pathParts.slice(bucketIndex + 1).join('/');
                        
                        const { error: deleteError } = await supabase.storage
                            .from('user-profiles')
                            .remove([oldFilePath]);
                        
                        if (deleteError) {
                            console.warn('Could not delete old profile picture:', deleteError);
                        }
                    }
                } catch (deleteError) {
                    console.warn('Error parsing old profile picture URL:', deleteError);
                }
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `pics/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('user-profiles')
                .upload(filePath, blackAndWhiteFile);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('user-profiles')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { profile_picture: publicUrl }
            });

            if (updateError) {
                throw updateError;
            }

            setProfilePicture(publicUrl);
            setHasImageChanged(true);
            toast.success('Profile picture updated successfully!');

        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload profile picture');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const convertToBlackAndWhite = (file) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const grayscale = Math.round(
                        0.299 * data[i] +     
                        0.587 * data[i + 1] +
                        0.114 * data[i + 2]  
                    );
                    
                    data[i] = grayscale;     
                    data[i + 1] = grayscale; 
                    data[i + 2] = grayscale; 
                }

                ctx.putImageData(imageData, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const blackAndWhiteFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(blackAndWhiteFile);
                    } else {
                        reject(new Error('Failed to convert image to black and white'));
                    }
                }, file.type, 0.9); 
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = URL.createObjectURL(file);
        });
    };

    const handleUploadClick = () => {
        document.getElementById('profile-image-input').click();
    };

    const handlePasswordFormChange = (field, value) => {
        setPasswordForm(prev => ({
            ...prev,
            [field]: value
        }));
        
        const updatedForm = { ...passwordForm, [field]: value };
        const hasPasswordContent = Object.values(updatedForm).some(val => val.trim() !== '');
        setHasPasswordChanged(hasPasswordContent);
    };

    const handleChangePasswordClick = () => {
        if (showChangePassword) {
            setPasswordForm({
                newPassword: '',
                confirmPassword: ''
            });
            setHasPasswordChanged(false);
        }
        setShowChangePassword(!showChangePassword);
    };

    const handleSave = async () => {
        if (!hasNameChanged && !hasPasswordChanged && !hasImageChanged) {
            toast.info("No changes to save");
            return;
        }

        try {
            if (hasNameChanged) {
                const { error: updateError } = await supabase.auth.updateUser({
                    data: { username: newUserName.trim() }
                });

                if (updateError) {
                    toast.error("Failed to update username");
                    return;
                }
                setUserName(newUserName.trim());
            }

            if (hasPasswordChanged) {
                if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    toast.error("New passwords don't match");
                    return;
                }

                if (passwordForm.newPassword.length < 6) {
                    toast.error("Password must be at least 6 characters long");
                    return;
                }

                const { error: passwordError } = await supabase.auth.updateUser({
                    password: passwordForm.newPassword
                });

                if (passwordError) {
                    toast.error("Failed to update password");
                    return;
                }

                setPasswordForm({
                    newPassword: '',
                    confirmPassword: ''
                });
                setShowChangePassword(false);
            }

            toast.success("Profile updated successfully!");
            setHasNameChanged(false);
            setHasPasswordChanged(false);
            setHasImageChanged(false);

        } catch (error) {
            toast.error("An error occurred while updating your profile");
            console.error("Profile update error:", error);
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Failed to disconnect.");
        } else {
            toast.success("See you next time!");
            navigate("/login");
        }
    };

    return (
        <>
            <Nav />
            <AnimatedBackground />
            <div className='profile-container'>
                <h1>Hi, {userName}</h1>
                <div className='profile-wrapper'>
                    <div className='edit-profile'>
                        <div className='edit-name-profile'>
                            <div className='edit'>
                                <p>Username</p>
                                <div className='edit-update'>
                                    {isEditingName ? (
                                        <div className='edit-name-input'>
                                            <input
                                                type="text"
                                                value={newUserName}
                                                onChange={handleNameChange}
                                                onBlur={handleNameSave}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleNameSave();
                                                    if (e.key === 'Escape') handleNameCancel();
                                                }}
                                                autoFocus
                                            />
                                            <Check 
                                                size={25} 
                                                strokeWidth={1} 
                                                color='#fff' 
                                                onClick={handleNameSave}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <p>{newUserName}</p>
                                            <Pen 
                                                size={25} 
                                                strokeWidth={1} 
                                                color='#fff' 
                                                fill='#fff'
                                                onClick={handleNameEdit}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className='edit'>
                                <p>Email</p>
                                <div className='edit-update-mail'>
                                    <p>{userEmail}</p>
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
                                <motion.form 
                                    className='change-password'
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    variants={passwordAnimationVariants}
                                    onSubmit={handlePasswordSubmit}
                                >
                                    <motion.div 
                                        className='new-password'
                                        variants={passwordFieldVariants}
                                        custom={0}
                                    >
                                        <div className='password-txt'>
                                            <p>New Password</p>
                                        </div>
                                        <div className='password-change'>
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="New Password"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                                            />
                                            <span onClick={() => setShowNewPassword(!showNewPassword)}>
                                                {showNewPassword ? <EyeOff strokeWidth={1} size={36} color='#fff' /> : <Eye strokeWidth={1} size={36} color='#fff' />}
                                            </span>
                                        </div>
                                    </motion.div>
                                    <motion.div 
                                        className='password-confirm'
                                        variants={passwordFieldVariants}
                                        custom={1}
                                    >
                                        <div className='password-txt'>
                                            <p>Password Confirmation</p>
                                        </div>
                                        <div className='password-change'>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm New Password"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                                            />
                                            <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <EyeOff strokeWidth={1} size={36} color='#fff' /> : <Eye strokeWidth={1} size={36} color='#fff' />}
                                            </span>
                                        </div>
                                    </motion.div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className='right-profile'>
                        <div className='change-image'>
                            <div 
                                className='profile-pic'
                                style={{
                                    backgroundImage: profilePicture ? `url(${profilePicture})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: profilePicture ? 'transparent' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {!profilePicture && (
                                    <CircleUser 
                                        size={'100%'} 
                                        strokeWidth={1} 
                                        color='#666' 
                                    />
                                )}
                            </div>
                            <div className='upload-pic'>
                                <input
                                    id="profile-image-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <button onClick={handleUploadClick} disabled={isUploadingImage}>
                                    <p>{isUploadingImage ? 'Uploading...' : 'Upload new image'}</p>
                                </button>
                            </div>
                        </div>
                        <div className='disconnect-save'>
                            <div className='disconnect'>
                                <button onClick={handleLogout}>
                                    <X size={40} strokeWidth={1} color='#CF0000' />
                                    <p>Disconnect</p>
                                </button>
                            </div>
                            <div className='white-divider'></div>
                            <div className='save-button'>
                                <button 
                                    onClick={handleSave}
                                    className={hasNameChanged || hasPasswordChanged || hasImageChanged ? 'active' : 'inactive'}
                                    disabled={!hasNameChanged && !hasPasswordChanged && !hasImageChanged}
                                >
                                    <p>Save</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Profile;