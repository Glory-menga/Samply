import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import LoadingDownload from './components/LoadingDownload';
import NotFound from './pages/NotFound';
import RedirectIfLoggedIn from './components/RedirectIfLoggedIn';
import { UserProvider } from './context/UserContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'

function App() {

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
            <Route path="/" element={<Home />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/sample-generated" element={<SampleGenerated />} />
            <Route path="/edit-sample" element={<EditSample />} />
            <Route path="/samples" element={<Samples />} />
            <Route path="/community" element={<Community />} />
            <Route path="/comment-sample" element={<CommentSample />} />
            <Route path="/saved-samples" element={<SavedSamples />} />
            <Route path="/liked-samples" element={<LikedSamples />} />
            <Route
              path="/login"
              element={
                <RedirectIfLoggedIn redirectTo="/">
                  <Login />
                </RedirectIfLoggedIn>
              }
            />
            <Route
              path="/signup"
              element={
                <RedirectIfLoggedIn redirectTo="/">
                  <Signup />
                </RedirectIfLoggedIn>
              }
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/loading-page" element={<LoadingPage />} />
            <Route path="/loading-download" element={<LoadingDownload />} />
            {/*Error Page*/}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
    </UserProvider>
  )
}

export default App
