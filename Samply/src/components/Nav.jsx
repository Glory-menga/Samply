import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext'; 

/**
 * Nav component
 * - Displays the navigation bar with links to main pages
 * - Highlights the active page using the current pathname
 * - Shows user profile link if logged in; otherwise shows a login link
 */
function Nav() {
  const location = useLocation();
  const { user } = useUser(); 

  return (
    <div className='nav'>
      <nav>
        {/* Logo links to home page */}
        <div className='logo'>
          <Link to="/">Samply</Link>
        </div>

        {/* Navigation links with active state highlighting */}
        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/generate" className={location.pathname === "/generate" ? "active" : ""}>
              Generate
            </Link>
          </li>
          <li>
            <Link to="/samples" className={location.pathname === "/samples" ? "active" : ""}>
              Samples
            </Link>
          </li>
          <li>
            <Link to="/community" className={location.pathname === "/community" ? "active" : ""}>
              Community
            </Link>
          </li>

          <li className='line-nav'></li>

          {/* Show profile link if user is logged in; otherwise show login */}
          <li>
            {user ? (
              <Link 
                to="/profile" 
                className={location.pathname === "/profile" ? "active" : ""}
              >
                {user.user_metadata?.username || user.user_metadata?.full_name || "Profile"}
              </Link>
            ) : (
              <Link 
                to="/login" 
                className={location.pathname === "/login" ? "active" : ""}
              >
                Login
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Nav;
