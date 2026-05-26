import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { clearCredentials } from '../../redux/authSlice';

// A simple utility to check token validity
const validateToken = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (e) {
    return false;
  }
};

function ProtectedRoute({ children, allowedRoles }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const token = useSelector((state) => state.auth.token);
  const userRoles = useSelector((state) => state.auth.userRoles || []);
  const location = useLocation();
  const dispatch = useDispatch();

  const isTokenValid = validateToken(token);

  useEffect(() => {
    if (isAuthenticated && !isTokenValid) {
      dispatch(clearCredentials());
    }
  }, [isAuthenticated, token, dispatch, isTokenValid]);

  if (!isAuthenticated || !isTokenValid) {
    // Redirect to login, but keep the current location we were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = userRoles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
