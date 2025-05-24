import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Generate from './pages/Generate';
import SampleGenerated from './pages/SampleGenerated';
import Samples from './pages/Samples';
import Community from './pages/Community';
import CommentSample from './pages/CommentSample';
import SavedSamples from './pages/SavedSamples';
import LikedSamples from './pages/LikedSamples';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import './App.css'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/sample-generated" element={<SampleGenerated />} />
        <Route path="/samples" element={<Samples />} />
        <Route path="/community" element={<Community />} />
        <Route path="/comment-sample" element={<CommentSample />} />
        <Route path="/saved-samples" element={<SavedSamples />} />
        <Route path="/liked-samples" element={<LikedSamples />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/*Error Page*/}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
