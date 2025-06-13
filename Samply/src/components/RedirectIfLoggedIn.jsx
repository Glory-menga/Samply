import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * RedirectIfLoggedIn component
 * - Prevents authenticated users from accessing public-only pages (e.g. login or signup)
 * - Automatically redirects to a target route (default: /profile) if the user is already logged in
 *
 * @param {React.ReactNode} children - The content to render if the user is *not* logged in
 * @param {string} redirectTo - Path to redirect to if the user *is* logged in
 * @returns {JSX.Element} Either the children or a <Navigate /> redirect
 */
function RedirectIfLoggedIn({ children, redirectTo = "/profile" }) {
  const { user } = useUser();
  const location = useLocation();

  // Redirect to target route if user is authenticated
  if (user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Allow rendering of protected content if not logged in
  return children;
}

export default RedirectIfLoggedIn;
