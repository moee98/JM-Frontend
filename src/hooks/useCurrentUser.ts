import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";

export function useCurrentUser() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const refreshUser = async () => {
    try {
      const freshUser = await getCurrentUser();
      setUser(freshUser);
      localStorage.setItem("user", JSON.stringify(freshUser));
    } catch (error) {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  useEffect(() => {
    if (!user) {
      refreshUser();
    }
  }, []);

  return { user, setUser, refreshUser };
}
