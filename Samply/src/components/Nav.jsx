
import { Link, useLocation } from 'react-router-dom';

function Nav() {
  const location = useLocation();
  
  return (
    <div className='nav'>
      <nav>
      <div className='logo'>
        <Link to="/">Samply</Link>
      </div>
      <ul className="nav-links">
        <li><Link to="/" className={location.pathname === "/" ? "active" : ""}>Home</Link></li>
        <li><Link to="/generate" className={location.pathname === "/generate" ? "active" : ""}>Generate</Link></li>
        <li><Link to="/samples" className={location.pathname === "/samples" ? "active" : ""}>Samples</Link></li>
        <li><Link to="/community" className={location.pathname === "/community" ? "active" : ""}>Community</Link></li>
        <li className='line-nav'></li>
        <li><Link to="/login" className={location.pathname === "/login" ? "active" : ""}>Login</Link></li>
      </ul>
    </nav>
    </div>
  );
}

export default Nav;