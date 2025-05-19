import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Generate from './pages/Generate';
import Samples from './pages/Samples';
import Community from './pages/Community';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import './App.css'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/samples" element={<Samples />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        {/*Error Page*/}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
