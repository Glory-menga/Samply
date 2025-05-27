import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

function RedirectIfLoggedIn({ children, redirectTo = "/profile" }) {
  const { user } = useUser();
  const location = useLocation();

  if (user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
}

export default RedirectIfLoggedIn;
