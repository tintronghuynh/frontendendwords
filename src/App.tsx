import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import FlashcardStudy from "./pages/FlashcardStudy";
import InputStudy from "./pages/InputStudy";
import MasteredWordsStudy from "./pages/MasteredWordsStudy";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Header from "./components/layout/Header";
import ClockModal from "./components/ClockModal";
import { queryClient, apiRequest } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeProvider";
import { PrivateRoute } from "./components/PrivateRoute";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <PrivateRoute>
        <Route path="/" component={Home} />
        <Route path="/study/flashcard/:groupId" component={FlashcardStudy} />
        <Route path="/study/input/:groupId" component={InputStudy} />
        <Route path="/study/mastered/:groupId" component={MasteredWordsStudy} />
      </PrivateRoute>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [isClockVisible, setIsClockVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Chỉ kiểm tra stats và overdue words khi đã đăng nhập
        if (isAuthenticated) {
          // Try to get stats first
          const statsResponse = await apiRequest("GET", "/api/stats", undefined);

          if (statsResponse.ok) {
            const stats = await statsResponse.json();
            const today = new Date();
            const lastLearningDate = new Date(stats.lastLearningDate);

            if (today.toDateString() !== lastLearningDate.toDateString()) {
              await apiRequest("POST", "/api/stats/update-learning-days", {
                date: today.toISOString()
              });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            }
          } else {
            console.warn("Failed to fetch stats:", await statsResponse.text());
          }

          // Check overdue words separately - don't block initialization if this fails
          try {
            const overdueResponse = await apiRequest("POST", "/api/check-overdue-words", undefined);

            if (overdueResponse.ok) {
              const result = await overdueResponse.json();

              if (result.totalUpdatedWords > 0) {
                console.log(`Đã giảm cấp độ ${result.totalUpdatedWords} từ quá hạn xuống cấp 1`);
                toast({
                  title: "Đã giảm cấp độ từ vựng quá hạn",
                  description: `${result.totalUpdatedWords} từ bạn đã bỏ lỡ đã được đặt lại về cấp độ 1`,
                  variant: "default"
                });
                queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
              }
            } else {
              console.warn("Failed to check overdue words:", await overdueResponse.text());
            }
          } catch (overdueError) {
            console.error("Error checking overdue words:", overdueError);
          }
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        // Always call setInitialized to prevent infinite loading
        setIsInitialized(true);
      }
    };

    initialize();
  }, [toast, isAuthenticated]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsClockVisible(current => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Show loading screen while auth is checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-900 dark:text-slate-100">
        <div className="animate-pulse text-2xl">Đang tải...</div>
      </div>
    );
  }

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-900 dark:text-slate-100">
        <div className="animate-pulse text-2xl">Đang tải WordSpace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header />
      <div className="flex-grow">
        <Router />
      </div>
      <ClockModal isOpen={isClockVisible} />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;