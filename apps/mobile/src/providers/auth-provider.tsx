import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getLocalUserId } from "../lib/local-user";

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

// Local-first build: there are no accounts and nothing talks to a server. The
// whole app runs as a single, always-"authenticated" device-local user whose id
// (a persisted UUID) owns every row. The AuthContext shape is kept intact so the
// ~10 hooks/screens that read `user.id` keep working unchanged, and the auth
// methods are no-ops (the login/register/google UI is removed). To add cloud
// accounts later, restore the real provider from git history and claim the
// existing local rows onto the signed-in user's id.
const noop = async () => {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    getLocalUserId().then((id) => {
      if (!active) return;
      setUser({
        id,
        email: "",
        name: "",
        avatarUrl: null,
        authProvider: "local",
      });
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext
      value={{
        user,
        isLoading: user === null,
        isAuthenticated: user !== null,
        login: noop,
        register: noop,
        googleLogin: noop,
        logout: noop,
      }}
    >
      {children}
    </AuthContext>
  );
}
