import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, homeFor } from '../AuthContext.jsx'

// Redirects guests to /login (remembering where they were going) and
// sends users with the wrong role to their own home page.
export default function RequireRole({ roles, children }) {
  const { user } = useAuth()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />
  return children
}
