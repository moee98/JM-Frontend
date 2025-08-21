import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/authService";

export function useCurrentUser() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    localStorage.setItem("user", storedUser || "{}");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    //localStorage.setItem("token", storedUser ? parsedUser.token : "");
    //localStorage.setItem("refreshToken", storedUser ? parsedUser.refreshToken : "");

    return storedUser ? parsedUser : null;
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
