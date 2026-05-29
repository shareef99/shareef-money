import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSegments } from "expo-router";
import { api } from "../lib/api";
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
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get<User & { createdAt: number }>("/auth/me");
      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        authProvider: data.authProvider,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleAuthSuccess = useCallback(
    async (tokens: AuthTokens) => {
      await setTokens(tokens.accessToken, tokens.refreshToken);
      await fetchUser();
    },
    [fetchUser],
  );

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = await getAccessToken();
      if (storedToken) {
        const success = await fetchUser();
        if (!success) {
          const refreshToken = await getRefreshToken();
          if (refreshToken) {
            try {
              const { data } = await api.post<AuthTokens>("/auth/refresh", {
                refreshToken,
              });
              await setTokens(data.accessToken, data.refreshToken);
              await fetchUser();
            } catch {
              await clearTokens();
            }
          }
        }
      }
      setIsLoading(false);
    };
    bootstrap();
  }, [fetchUser]);

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
      const { data } = await api.post<AuthTokens>("/auth/login", {
        email,
        password,
      });
      await handleAuthSuccess(data);
    },
    [handleAuthSuccess],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<AuthTokens>("/auth/register", {
        email,
        password,
        name,
      });
      await handleAuthSuccess(data);
    },
    [handleAuthSuccess],
  );

  const googleLogin = useCallback(
    async (idToken: string) => {
      const { data } = await api.post<AuthTokens>("/auth/google", {
        idToken,
        deviceType: "mobile",
      });
      await handleAuthSuccess(data);
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      api.post("/auth/logout", { refreshToken }).catch(() => {});
    }
    await clearTokens();
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
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}
