import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

class ApiService {
  private instance: AxiosInstance;
  private isRefreshing = false;

  private refreshSubscribers: Array<{
    resolve: () => void;
    reject: (err: unknown) => void;
  }> = [];

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
      // withCredentials sends the HTTP-only jwt cookie on every request
      // so we never need to read or attach the token manually.
      withCredentials: true,
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetriableConfig | undefined;

        if (!originalRequest) return Promise.reject(error);

        const status = error.response?.status;

        // Avoid retry loops on the refresh endpoint itself
        if (originalRequest.url?.includes("/auth/refresh")) {
          this.clearSession();
          return Promise.reject(error);
        }

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push({
                resolve: () => resolve(this.instance(originalRequest)),
                reject,
              });
            });
          }

          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.onRefreshSuccess();
            return this.instance(originalRequest);
          } catch (refreshErr) {
            this.onRefreshFailure(refreshErr);
            this.clearSession();
            return Promise.reject(refreshErr);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private onRefreshSuccess() {
    this.refreshSubscribers.forEach((s) => s.resolve());
    this.refreshSubscribers = [];
  }

  private onRefreshFailure(err: unknown) {
    this.refreshSubscribers.forEach((s) => s.reject(err));
    this.refreshSubscribers = [];
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token");

    // The expired access token is sent automatically via the HTTP-only jwt
    // cookie. We only need to supply the refresh token in the body.
    const response = await this.instance.post("/auth/refresh", { refreshToken });

    const newRefreshToken = (response.data as { refreshToken?: string }).refreshToken;
    if (!newRefreshToken) throw new Error("Refresh response missing token");

    localStorage.setItem("refreshToken", newRefreshToken);
  }

  private clearSession() {
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    // Redirect to login if not already there
    if (!window.location.pathname.startsWith("/signin")) {
      window.location.href = "/signin";
    }
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }
}

const api = new ApiService("/api");
export default api;
