import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getApiBaseUrl() {
  // Trong môi trường phát triển, sử dụng URL của server API trên Replit
  const hostname = window.location.hostname;
  
  // Nếu đang ở trên Replit (kết nối đến backend ở cùng Origin)
  if (hostname.includes('replit')) {
    return '';
  }
  
  // Khi triển khai trên Netlify - connect đến Render
  if (hostname.includes('netlify.app')) {
    // Sử dụng biến môi trường nếu có, hoặc giá trị mặc định
    return process.env.BACKEND_URL || 'https://wordspace-backend.onrender.com';
  }
  
  // Môi trường phát triển local - kết nối đến API server trên cổng 5000
  return 'http://localhost:5000';
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retryCount = 0
): Promise<Response> {
  try {
    const baseUrl = getApiBaseUrl();
    const apiUrl = baseUrl + url;
    
    // Lấy các cookie hiện tại trên client để debug
    const currentCookies = document.cookie;
    const cookieLog = currentCookies ? `Current cookies: ${currentCookies.length} chars` : 'No cookies found';
    
    console.log(`Calling API: ${method} ${url} from ${window.location.origin} (${cookieLog})`, {
      data: data ? { ...data, password: data.hasOwnProperty('password') ? '[REDACTED]' : undefined } : undefined
    });

    // Điều chỉnh headers dựa trên loại request
    const headers: HeadersInit = {
      "Accept": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    };
    
    if (data) {
      headers["Content-Type"] = "application/json";
    }

    // Thêm timestamp để tránh cache
    const timestampedUrl = 
      url.includes('?') 
        ? `${apiUrl}&_t=${Date.now()}` 
        : `${apiUrl}?_t=${Date.now()}`;

    const res = await fetch(timestampedUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Sử dụng include để gửi cookies cross-origin
      mode: 'cors', // Cho phép CORS requests
      cache: 'no-cache' // Không cache requests để tránh vấn đề với cookies
    });

    // Ghi log thông tin phản hồi để debug
    console.log(`API response: ${method} ${url} - Status: ${res.status} ${res.statusText}`);
    
    // Kiểm tra nếu có Set-Cookie header trong response
    const setCookieHeader = res.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('Server set cookie header received');
    }

    // Kiểm tra nếu cookie hết hạn hoặc lỗi session, thử lại request tối đa 1 lần
    if (res.status === 401 && retryCount < 1 && url !== '/api/auth/me' && url !== '/api/auth/login') {
      console.log("Unauthorized response, will retry after checking authentication status...");
      
      // Thử kiểm tra auth status để refresh session
      try {
        console.log("Checking auth status before retry...");
        const authCheckRes = await fetch(`${baseUrl}/api/auth/me?_t=${Date.now()}`, {
          credentials: "include",
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
        console.log(`Auth check before retry: ${authCheckRes.status}`);
      } catch (e) {
        console.warn("Failed to check auth status before retry:", e);
      }
      
      // Chờ một chút trước khi thử lại
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log("Retrying original request...");
      return apiRequest(method, url, data, retryCount + 1);
    }

    // Xử lý lỗi từ server
    if (!res.ok) {
      let errorMessage = res.statusText;
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Xử lý JSON response
          const errorJson = await res.json();
          console.error(`API error (JSON): ${res.status}`, errorJson);
          errorMessage = errorJson.message || errorJson.error || res.statusText;
        } else {
          // Xử lý text response
          const errorText = await res.text();
          console.error(`API error (text): ${res.status} ${res.statusText}`, errorText);
          errorMessage = errorText || res.statusText;
        }
      } catch (e) {
        console.error("Failed to read error response", e);
      }
      
      throw new Error(errorMessage);
    }

    return res;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Định nghĩa loại và hàm tạo query function
type UnauthorizedBehavior = "returnNull" | "throw";

function createQueryFn<T>({ on401: unauthorizedBehavior }: { on401: UnauthorizedBehavior }): QueryFunction<T> {
  return async ({ queryKey, signal }) => {
    try {
      const baseUrl = getApiBaseUrl();
      const url = queryKey[0] as string;
      
      // Lấy các cookie hiện tại trên client để debug
      const currentCookies = document.cookie;
      const cookieLog = currentCookies ? `Current cookies: ${currentCookies.length} chars` : 'No cookies found';
      
      console.log(`Query API: GET ${url} from ${window.location.origin} (${cookieLog})`);
      
      // Thêm timestamp để tránh cache
      const timestampedUrl = 
        url.includes('?') 
          ? `${baseUrl}${url}&_t=${Date.now()}` 
          : `${baseUrl}${url}?_t=${Date.now()}`;

      const res = await fetch(timestampedUrl, {
        credentials: "include", // Sử dụng include để gửi cookies cross-origin
        mode: 'cors', // Cho phép CORS requests
        cache: 'no-cache', // Không cache requests để tránh vấn đề với cookies
        signal, // Truyền signal để có thể cancel request
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      });

      console.log(`Query response: GET ${url} - Status: ${res.status} ${res.statusText}`);
      
      // Kiểm tra nếu có Set-Cookie header trong response
      const setCookieHeader = res.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log('Server set cookie header received in query');
      }

      // Xử lý lỗi 401 theo cấu hình
      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          console.log("Unauthorized but configured to return null");
          return null;
        }
        
        // Nếu không phải endpoint auth/me, thử refresh session
        if (url !== '/api/auth/me') {
          console.log("Unauthorized response in query, attempting to refresh session...");
          
          // Thử request lại sau khi kiểm tra auth
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Kiểm tra lại auth status để refresh session
          try {
            console.log("Checking auth status to refresh session...");
            const authCheckRes = await fetch(`${baseUrl}/api/auth/me?_t=${Date.now()}`, {
              credentials: "include",
              mode: 'cors',
              cache: 'no-cache',
              headers: {
                "Accept": "application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate"
              }
            });
            console.log(`Auth refresh attempt: ${authCheckRes.status}`);
            
            // Nếu auth check thành công nhưng request gốc thất bại, có thể do lỗi session
            if (authCheckRes.ok) {
              console.log("Auth is valid but request failed - likely a temporary session issue");
              // Thử lại request ban đầu
              try {
                console.log("Retrying original query...");
                const retryResponse = await fetch(timestampedUrl, {
                  credentials: "include",
                  mode: 'cors',
                  cache: 'no-cache',
                  signal,
                  headers: {
                    "Accept": "application/json",
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                  }
                });
                
                if (retryResponse.ok) {
                  console.log("Retry successful!");
                  const data = await retryResponse.json();
                  return data;
                } else {
                  console.log("Retry also failed with status:", retryResponse.status);
                }
              } catch (retryError) {
                console.error("Error during retry:", retryError);
              }
            }
          } catch (e) {
            console.error("Failed to refresh auth session:", e);
          }
          
          // Nếu là lỗi auth không khắc phục được, chuyển người dùng về trang login
          if (window.location.pathname !== '/login') {
            console.log("Session appears invalid, redirecting to login page...");
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
        
        // Trả về null nếu là lỗi auth không thể khắc phục
        return null;
      }

      // Xử lý lỗi từ server
      if (!res.ok) {
        let errorMessage = res.statusText;
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            // Xử lý JSON response
            const errorJson = await res.json();
            console.error(`Query error (JSON): ${res.status}`, errorJson);
            errorMessage = errorJson.message || errorJson.error || res.statusText;
          } else {
            // Xử lý text response
            const errorText = await res.text();
            console.error(`Query error (text): ${res.status} ${res.statusText}`, errorText);
            errorMessage = errorText || res.statusText;
          }
        } catch (e) {
          console.error("Failed to read error response", e);
        }
        
        throw new Error(errorMessage);
      }

      try {
        const data = await res.json();
        return data;
      } catch (e) {
        console.error("Failed to parse JSON response", e);
        throw new Error("Lỗi khi xử lý dữ liệu từ server");
      }
    } catch (error) {
      // Bỏ qua lỗi khi request bị cancel
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log("Request was aborted");
        return null as any;
      }
      
      console.error("Query request failed:", error);
      throw error;
    }
  };
}

// Xuất getQueryFn và sử dụng trong queryClient
export const getQueryFn = createQueryFn;

// Tạo queryClient sau khi đã định nghĩa getQueryFn
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 30000, // 30 giây thay vì Infinity, giúp dữ liệu được cập nhật nhanh hơn
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});