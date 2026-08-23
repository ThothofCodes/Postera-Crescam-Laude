// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const ADMIN_ROLES = ['SUPER_ADMIN', 'DEPT_HEAD_OWNER', 'STAFF', 'admin', 'staff'];

const AdminPrivateRoute = ({ children }) => {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Allow access if user is authenticated with any admin role
  if (user && ADMIN_ROLES.includes(user.role)) {
    return children;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Access denied for non-admin users
  return <Navigate to="/403" replace />;
};

export default AdminPrivateRoute;