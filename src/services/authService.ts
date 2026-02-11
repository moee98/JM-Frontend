import axios from "axios";
import {User} from "../types/user";

const API_URL = "/api";

// Automatically attach JWT token to requests
axios.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      const accessToken = localStorage.getItem("accessToken");

      try {
        const res = await axios.post("/auth/refresh", {
          accessToken,
          refreshToken
        });

        localStorage.setItem("accessToken", res.data.token);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        error.config.headers["Authorization"] = `Bearer ${res.data.token}`;
        return axios.request(error.config);
      } catch (err) {
        console.error("Refresh failed", err);
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include", // ensures cookies (refresh token) are included
  });

  if (!response.ok) {
    throw new Error("Login failed");
   
  }

  const data = await response.json();

  // Store access token for immediate use
  //console.log("Login response:", data);
    //localStorage.setItem("token",  data.token);
    localStorage.setItem("refreshToken",  data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user.id));

    localStorage.setItem("accessToken", data.token);
  

  // Refresh token will be stored in HTTP-only cookie automatically by the server
  return response;// includes accessToken and user info
};


export const signup = async (name: string, email: string, password: string, phoneNumber:string) => {
  const response = await axios.post(`${API_URL}/auth/register`, {
    name,
    email,
    password,
    phoneNumber
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await fetch("/api/users/me", {
    method: "GET",
    credentials: "include", // <== Send cookies along with the request
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  const data:User = await response.json();
  console.log("User data:", data);
  
  return data;
};

