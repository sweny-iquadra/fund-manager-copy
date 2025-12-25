import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-app-url.replit.dev';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('accessToken');
    } catch {
      return null;
    }
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = await this.getAuthToken();
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const api = new ApiClient(API_BASE_URL);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: any }>('/api/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<{ accessToken: string; refreshToken: string; user: any }>('/api/auth/register', data),
  
  getUser: () => api.get<any>('/api/auth/user'),
  
  refreshToken: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', { refreshToken }),
  
  logout: () => api.post('/api/auth/logout'),
};

export const contestsApi = {
  getAll: (params?: { status?: string; modeId?: number; categoryId?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return api.get<any[]>(`/api/contests${queryString}`);
  },
  
  getById: (id: number) => api.get<any>(`/api/contests/${id}`),
  
  join: (id: number) => api.post<any>(`/api/contests/${id}/join`),
  
  leave: (id: number) => api.delete<any>(`/api/contests/${id}/leave`),

  getLeaderboard: (id: number) => api.get<any[]>(`/api/contests/${id}/leaderboard`),
};

export const contestRequestsApi = {
  create: (data: any) => api.post<any>('/api/contest-requests', data),
};

export const portfolioApi = {
  get: (contestId: number) => api.get<any>(`/api/contests/${contestId}/portfolio`),
  
  update: (contestId: number, allocations: any[]) =>
    api.put<any>(`/api/contests/${contestId}/portfolio`, { allocations }),
  
  getPerformance: (contestId: number) => api.get<any>(`/api/contests/${contestId}/performance`),
};

export const modesApi = {
  getAll: () => api.get<any[]>('/api/modes'),
};

export const categoriesApi = {
  getAll: () => api.get<any[]>('/api/categories'),
};

export const userApi = {
  getStats: () => api.get<any>('/api/user/stats'),
  
  getTransactions: () => api.get<any[]>('/api/user/transactions'),
  
  updateProfile: (data: any) => api.patch<any>('/api/user/profile', data),
};

export const stocksApi = {
  search: (query: string, category?: string) => {
    const params = new URLSearchParams({ q: query });
    if (category) params.append('category', category);
    return api.get<any[]>(`/api/stocks/search?${params}`);
  },
  
  getQuote: (symbol: string) => api.get<any>(`/api/stocks/quote/${symbol}`),
};
