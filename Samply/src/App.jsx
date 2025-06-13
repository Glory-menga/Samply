import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Home from './pages/Home';
import Generate from './pages/Generate';
import SampleGenerated from './pages/SampleGenerated';
import EditSample from './pages/EditSample';
import Samples from './pages/Samples';
import Community from './pages/Community';
import CommentSample from './pages/CommentSample';
import SavedSamples from './pages/SavedSamples';
import LikedSamples from './pages/LikedSamples';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import LoadingPage from './components/LoadingPage';
import NotFound from './pages/NotFound';
import PhoneOrTablet from './pages/PhoneOrTablet';

import RedirectIfLoggedIn from './components/RedirectIfLoggedIn';
import { UserProvider } from './context/UserContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

/**
 * ProtectedRoute component
 * - Blocks access to certain routes on mobile/tablet devices
 * - Redirects to a dedicated page if the screen is too small
 *
 * @param {React.ReactNode} children - The component to render if access is allowed
 * @param {boolean} isMobileOrTablet - Whether the device screen is considered small
 */
const ProtectedRoute = ({ children, isMobileOrTablet }) => {
  if (isMobileOrTablet) {
    return <Navigate to="/phone-or-tablet" replace />;
  }
  return children;
};

/**
 * App component
 * - Main router setup for all pages and components
 * - Provides user context and toast notifications
 * - Dynamically adapts based on device screen size
 */
function App() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  /**
   * Detect screen width and update isMobileOrTablet accordingly
   */
  useEffect(() => {
    const detectDevice = () => {
      const isSmallScreen = window.innerWidth <= 490;
      setIsMobileOrTablet(isSmallScreen);
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  return (
    <UserProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastClassName="custom-toast"
          progressClassName="custom-progress"
        />

        <Routes>
          {/* Fallback for small devices */}
          <Route path="/phone-or-tablet" element={<PhoneOrTablet />} />

          {/* Main routes protected from small screens */}
          <Route path="/" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <Home />
            </ProtectedRoute>
          }/>

          <Route path="/generate" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <Generate />
            </ProtectedRoute>
          }/>

          <Route path="/sample-generated" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <SampleGenerated />
            </ProtectedRoute>
          }/>

          <Route path="/edit-sample" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <EditSample />
            </ProtectedRoute>
          }/>

          <Route path="/samples" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <Samples />
            </ProtectedRoute>
          }/>

          <Route path="/community" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <Community />
            </ProtectedRoute>
          }/>

          <Route path="/comment-sample" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <CommentSample />
            </ProtectedRoute>
          }/>

          <Route path="/saved-samples" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <SavedSamples />
            </ProtectedRoute>
          }/>

          <Route path="/liked-samples" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <LikedSamples />
            </ProtectedRoute>
          }/>

          {/* Login and Signup should redirect if already logged in */}
          <Route path="/login" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <RedirectIfLoggedIn redirectTo="/">
                <Login />
              </RedirectIfLoggedIn>
            </ProtectedRoute>
          }/>

          <Route path="/signup" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <RedirectIfLoggedIn redirectTo="/">
                <Signup />
              </RedirectIfLoggedIn>
            </ProtectedRoute>
          }/>

          <Route path="/profile" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <Profile />
            </ProtectedRoute>
          }/>

          <Route path="/loading-page" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <LoadingPage />
            </ProtectedRoute>
          }/>

          {/* Catch-all route (404) */}
          <Route path="*" element={
            <ProtectedRoute isMobileOrTablet={isMobileOrTablet}>
              <NotFound />
            </ProtectedRoute>
          }/>
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
