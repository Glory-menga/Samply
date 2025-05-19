import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Generate from './pages/Generate';
import NotFound from './pages/NotFound';
import './App.css'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generate" element={<Generate />} />
        {/*Error Page*/}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
