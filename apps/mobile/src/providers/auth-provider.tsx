import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSegments } from "expo-router";
import { apiRequest } from "../lib/api";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../lib/token-store";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  authProvider: string;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  const fetchUser = useCallback(async (token: string) => {
    try {
      const profile = await apiRequest<User & { createdAt: number }>(
        "/auth/me",
        {},
        token,
      );
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        authProvider: profile.authProvider,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const tokens = await apiRequest<AuthTokens>("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      });
      await setTokens(tokens.accessToken, tokens.refreshToken);
      setAccessToken(tokens.accessToken);
      return tokens.accessToken;
    } catch {
      await clearTokens();
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = await getAccessToken();
      if (storedToken) {
        const success = await fetchUser(storedToken);
        if (success) {
          setAccessToken(storedToken);
        } else {
          const newToken = await refreshAccessToken();
          if (newToken) {
            await fetchUser(newToken);
          }
        }
      }
      setIsLoading(false);
    };
    bootstrap();
  }, [fetchUser, refreshAccessToken]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isAuthenticated = !!user;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(app)/(tabs)/transactions");
    }
  }, [user, segments, isLoading, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const tokens = await apiRequest<AuthTokens>("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        await setTokens(tokens.accessToken, tokens.refreshToken);
        setAccessToken(tokens.accessToken);
        await fetchUser(tokens.accessToken);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUser],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const tokens = await apiRequest<AuthTokens>("/auth/register", {
          method: "POST",
          body: { email, password, name },
        });
        await setTokens(tokens.accessToken, tokens.refreshToken);
        setAccessToken(tokens.accessToken);
        await fetchUser(tokens.accessToken);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUser],
  );

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      apiRequest("/auth/logout", {
        method: "POST",
        body: { refreshToken },
      }).catch(() => {});
    }
    await clearTokens();
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        accessToken,
      }}
    >
      {children}
    </AuthContext>
  );
}
