import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/queryClient";

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [verifyingAuth, setVerifyingAuth] = useState(false);
  const [verificationDone, setVerificationDone] = useState(false);

  // Verify authentication status from server
  useEffect(() => {
    let isMounted = true;
    
    const verifyAuthentication = async () => {
      // Chỉ kiểm tra nếu isAuthenticated = true từ context
      if (!isLoading && isAuthenticated && !verificationDone) {
        try {
          setVerifyingAuth(true);
          console.log("PrivateRoute: Verifying authentication with server...");
          
          const response = await apiRequest("GET", "/api/auth/me", undefined);
          
          if (isMounted) {
            if (response.ok) {
              console.log("PrivateRoute: Server confirmed authentication");
              setVerificationDone(true);
            } else {
              console.log("PrivateRoute: Server rejected authentication, redirecting to login");
              setLocation("/login");
            }
            setVerifyingAuth(false);
          }
        } catch (error) {
          console.error("PrivateRoute: Error verifying authentication:", error);
          if (isMounted) {
            // Nếu thất bại do lỗi mạng, vẫn dựa vào state client đã có
            console.log("PrivateRoute: Falling back to client auth state due to error");
            setVerificationDone(true);
            setVerifyingAuth(false);
          }
        }
      }
    };

    verifyAuthentication();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading, verificationDone, setLocation]);

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log("PrivateRoute state:", {
      isAuthenticated,
      isLoading,
      verifyingAuth,
      userId: user?.id,
      currentPath: window.location.pathname
    });
    
    // Nếu chưa đăng nhập và đã hoàn thành loading, chuyển hướng về trang login
    if (!isLoading && !isAuthenticated) {
      console.log("PrivateRoute: User not authenticated, redirecting to login");
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, user, setLocation, verifyingAuth]);

  // Hiển thị loading khi đang kiểm tra trạng thái đăng nhập
  if (isLoading || verifyingAuth) {
    console.log(`PrivateRoute: ${isLoading ? 'Loading auth status' : 'Verifying with server'}`);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-2xl">{isLoading ? 'Đang kiểm tra đăng nhập...' : 'Đang xác thực...'}</div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, để useEffect xử lý redirect
  if (!isAuthenticated) {
    return null;
  }

  // Nếu đã đăng nhập và xác thực với server, hiển thị nội dung được bảo vệ
  console.log("PrivateRoute: User authenticated, rendering protected content");
  return <>{children}</>;
}