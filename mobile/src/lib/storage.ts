import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const storage = {
  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },

  async setUser(user: any) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const user = await SecureStore.getItemAsync(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async clearUser() {
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async clearAll() {
    await this.clearTokens();
    await this.clearUser();
  },
};
