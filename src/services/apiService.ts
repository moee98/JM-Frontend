import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

type TokenPair = { accessToken: string; refreshToken: string };

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

class ApiService {
  private instance: AxiosInstance;
  private isRefreshing = false;

  // store both resolve+reject so we can fail queued requests
  private refreshSubscribers: Array<{
    resolve: (token: string) => void;
    reject: (err: any) => void;
  }> = [];

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
       withCredentials: true,
    });

    // Attach token before requests
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      config.headers = config.headers ?? {};

      // Optional: don’t attach Authorization to refresh endpoint if you call it via this.instance
      // if (config.url?.includes("/auth/refresh")) return config;

      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetriableConfig | undefined;

        // If we don’t have a request config, nothing to retry
        if (!originalRequest) return Promise.reject(error);

        const status = error.response?.status;

        // Don’t try to refresh if the refresh endpoint itself 401s
        if (originalRequest.url?.includes("/auth/refresh")) {
          this.clearTokens();
          return Promise.reject(error);
        }

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // If refresh is in-flight, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.subscribeTokenRefresh(
                (token) => {
                  originalRequest.headers = originalRequest.headers ?? {};
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.instance(originalRequest));
                },
                reject
              );
            });
          }

          this.isRefreshing = true;

          try {
            const tokens = await this.refreshToken();

            this.onRefreshSuccess(tokens.accessToken);

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;

            return this.instance(originalRequest);
          } catch (refreshErr) {
            this.onRefreshFailure(refreshErr);
            this.clearTokens();
            return Promise.reject(refreshErr);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private subscribeTokenRefresh(
    resolve: (token: string) => void,
    reject: (err: any) => void
  ) {
    this.refreshSubscribers.push({ resolve, reject });
  }

  private onRefreshSuccess(token: string) {
    this.refreshSubscribers.forEach((s) => s.resolve(token));
    this.refreshSubscribers = [];
  }

  private onRefreshFailure(err: any) {
    this.refreshSubscribers.forEach((s) => s.reject(err));
    this.refreshSubscribers = [];
  }

  private async refreshToken(): Promise<TokenPair> {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) throw new Error("No refresh token");

    // Safer: use same baseURL as instance
    const response = await this.instance.post(
      "/auth/refresh",
      { accessToken, refreshToken },
      {
        // If your server uses cookies for refresh:
        // withCredentials: true,
      }
    );

    // ✅ Adjust these names to match your API response EXACTLY
    const newAccessToken = (response.data as any).accessToken ?? (response.data as any).token;
    const newRefreshToken = (response.data as any).refreshToken;

    if (!newAccessToken || !newRefreshToken) {
      throw new Error("Refresh response missing tokens");
    }

    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  private clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  // CRUD
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

const api = new ApiService("/api");
export default api;
