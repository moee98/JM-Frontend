import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode; // Accepts any valid React content
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem("accessToken"); // Use accessToken for consistency

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>; // ReactNode must be wrapped in fragment if multiple elements
};

export default ProtectedRoute;
