import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "../lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Function to check auth status that can be called multiple times
  const checkAuthStatus = async () => {
    console.log("Checking auth status...");
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/auth/me", undefined);
      console.log("Auth status response:", response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log("User data received:", { ...userData, password: '[REDACTED]' });
        setUser(userData);
        return true;
      } else {
        console.log("No authenticated user found");
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setUser(null);
      return false;
    } finally {
      console.log("Auth check completed, setting isLoading to false");
      setIsLoading(false);
    }
  };

  // Initial auth check when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const register = async (username: string, email: string, password: string): Promise<void> => {
    console.log("Attempting registration...");
    try {
      const response = await apiRequest("POST", "/api/auth/register", { 
        username, 
        email, 
        password 
      });
      console.log("Registration response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Có lỗi xảy ra khi đăng ký");
      }

      const data = await response.json();
      console.log("Registration successful:", {
        ...data,
        user: { ...data.user, password: '[REDACTED]' }
      });

      // Sau khi đăng ký thành công, chuyển đến trang đăng nhập
      setLocation('/login');
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("Attempting login...");
    try {
      // Xóa session cũ nếu có
      try {
        // Kiểm tra nếu đã đăng nhập, đăng xuất trước
        if (user) {
          console.log("User already logged in, logging out first");
          await apiRequest("POST", "/api/auth/logout", undefined);
          setUser(null);
        }
      } catch (e) {
        console.log("Error clearing old session:", e);
        // Tiếp tục đăng nhập mới
      }
      
      // Thực hiện đăng nhập mới
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      console.log("Login response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Email hoặc mật khẩu không chính xác");
      }

      const userData = await response.json();
      console.log("Login successful, user data:", { ...userData, email, password: '[REDACTED]' });
      
      // Xóa cache để đảm bảo không còn dữ liệu cũ từ người dùng trước đó
      console.log("Invalidating query cache after login");
      queryClient.clear();
      
      // Cập nhật user state
      setUser(userData);
      
      // Kiểm tra trạng thái đăng nhập
      try {
        const checkResponse = await apiRequest("GET", "/api/auth/me", undefined);
        if (checkResponse.ok) {
          console.log("Session verification successful");
          return true;
        } else {
          console.error("Session verification failed despite successful login");
          return false;
        }
      } catch (verifyError) {
        console.error("Error verifying session:", verifyError);
        // Vẫn trả về true vì đăng nhập đã thành công, session sẽ được kiểm tra lại sau
        return true;
      }
    } catch (error) {
      console.error("Login error:", error);
      // Không throw lỗi, thay vào đó trả về false để xử lý ở component
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    console.log("Attempting logout...");
    try {
      const response = await apiRequest("POST", "/api/auth/logout", undefined);
      console.log("Logout response status:", response.status);

      if (response.ok) {
        console.log("Logout successful");
        
        // Xóa cache khi đăng xuất để tránh hiển thị dữ liệu của phiên đăng nhập trước đó
        console.log("Invalidating query cache after logout");
        queryClient.clear();
        
        setUser(null);
        setLocation('/login');
      } else {
        throw new Error("Lỗi khi đăng xuất");
      }
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
}