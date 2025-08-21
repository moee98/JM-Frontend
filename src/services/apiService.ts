import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

class ApiService {
  private instance: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
    });

    // Attach token before requests
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn("No access token found");
      }
      return config;
    });

    // Handle 401s and refresh token flow
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already trying to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Wait for ongoing refresh if needed
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.subscribeTokenRefresh((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.instance(originalRequest));
              });
            });
          }

          this.isRefreshing = true;
          try {
            const newTokens = await this.refreshToken();
            this.onRereshSuccess(newTokens.accessToken);
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.instance(originalRequest);
          } catch (refreshErr) {
            console.error("Refresh token failed", refreshErr);
            this.clearTokens();
           // window.location.href = "/signin";
            return Promise.reject(refreshErr);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Refresh token API call
  private async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) throw new Error("No refresh token");

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || "https://localhost:44377/api"}/auth/refresh`,
      { accessToken, refreshToken }
    );

    const newAccessToken = response.data.token;
    const newRefreshToken = response.data.refreshToken;

    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // For queued requests while refreshing
  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }
  private onRereshSuccess(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  // CRUD methods
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }
  patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }
}

// Export instance
const api = new ApiService(import.meta.env.VITE_API_URL || "https://localhost:44377/api");
export default api;
