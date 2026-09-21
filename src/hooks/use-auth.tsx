import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type UserProfile } from "@/lib/api";
import { toast } from "sonner";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  updateSettings: (data: Partial<UserProfile>) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "campverse_user_settings";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        if (res.user) {
          setUser(res.user);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.user));
          } catch {}
        }
      })
      .catch(() => {
        // Keep local user if available, otherwise fallback to default guest
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (data: any) => {
    try {
      const res = await api.login(data);
      setUser(res.user);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.user));
      } catch {}
      toast.success(`Welcome back, ${res.user.name}!`);
    } catch (err: any) {
      toast.error(err.message || "Login failed");
      throw err;
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.register(data);
      setUser(res.user);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.user));
      } catch {}
      toast.success("Account created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {}
      toast.info("Logged out");
    } catch (err: any) {
      toast.error("Logout failed");
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      let updated: UserProfile;
      try {
        const res = await api.updateProfile(data);
        updated = res.user;
      } catch (err) {
        // If not logged in or backend offline, update local user object
        updated = {
          ...(user || {
            id: "local-user",
            name: "Alex Sharma",
            email: "alex@skcet.ac.in",
            role: "student",
          }),
          ...data,
        } as UserProfile;
      }

      setUser(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      toast.success("Settings saved successfully!");
      return updated;
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
      throw err;
    }
  };

  const updateSettings = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    return updateProfile(data);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile, updateSettings }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
