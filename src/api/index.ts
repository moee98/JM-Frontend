import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:44377/api', // update as needed
  withCredentials: true, // use cookies if backend supports it
});

export default api;