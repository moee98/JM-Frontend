import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // The access token is now an HTTP-only cookie and cannot be read by
  // JavaScript. We use the presence of the refresh token as the "logged in"
  // indicator instead. If the access cookie is actually invalid or expired,
  // the first API call will attempt a refresh; if that also fails, apiService
  // clears this key and redirects to /signin automatically.
  const isLoggedIn = Boolean(localStorage.getItem("refreshToken"));

  if (!isLoggedIn) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
