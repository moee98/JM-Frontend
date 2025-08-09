import axios from "axios";

const API_URL = "https://localhost:44377/api";

// Automatically attach JWT token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email: string, password: string) => {
  const response = fetch("https://localhost:44377/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ email, password }),
  credentials: "include" // <== This tells the browser to accept/set cookies
});
  return response; // Should contain token + user info
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

export const getCurrentUser = async () => {
  const response =fetch("https://localhost:44377/api/users/me", {
  method: "GET",
  credentials: "include" ,// <== Send cookies along with the request
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  }
})
.then(response => {
  if (!response.ok) throw new Error("Unauthorized");
  return response.json();
})
.then(data => {
  console.log("User data:", data);
});
  return response; // Expected: { id, name, email, ... }
};

