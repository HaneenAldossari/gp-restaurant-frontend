import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Default landing page per user. Most users land on the dashboard, but
// a sub-user with write_only permission has no read views at all — they
// land on Upload Data instead. Used by the index route.
export const defaultRouteFor = (user) => {
  if (!user) return '/login';
  if (user.role === 'Cashier' && user.permission === 'write_only') return '/upload';
  return '/dashboard';
};

// Route guard. Wrap any element that must be permission-restricted.
// Falls back to the user's default landing page when access is denied
// (rather than showing an error) so a sub-user typing /settings just
// silently bounces to the page they CAN see.
//
//   roles      — list of normalised UI roles allowed (Admin/Manager/Cashier)
//   subUserPerm — for sub-users (Cashier role), additionally restrict
//                 to these permission values
const RequireAccess = ({ children, roles, subUserPerm }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const isSubUser = user.role === 'Cashier';
  const allowed = isSubUser
    ? (subUserPerm || []).includes(user.permission)
    : (roles || []).includes(user.role);

  if (!allowed) return <Navigate to={defaultRouteFor(user)} replace />;
  return children;
};

export default RequireAccess;
