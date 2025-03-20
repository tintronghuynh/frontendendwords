import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 kí tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [isOnLoginPage] = useRoute("/login");
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      console.log("Attempting login with form data:", { email: data.email, password: "********" });

      let success = false;
      let retryCount = 0;

      while (!success && retryCount < 2) {
        try {
          success = await login(data.email, data.password);

          if (success) {
            console.log("Login successful on attempt", retryCount + 1);
            break;
          } else {
            retryCount++;
            console.log("Login attempt", retryCount, "failed, retrying:", retryCount < 2);

            if (retryCount < 2) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (loginError) {
          console.error("Login error on attempt", retryCount + 1, ":", loginError);
          retryCount++;

          if (retryCount < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      if (success) {
        toast({
          title: "Đăng nhập thành công",
          description: "Chuyển hướng đến trang học của bạn...",
        });

        setLocation("/");
      } else {
        toast({
          title: "Đăng nhập thất bại",
          description: "Email hoặc mật khẩu không chính xác",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during login process:", error);
      toast({
        title: "Đăng nhập thất bại",
        description: "Có lỗi xảy ra khi kết nối đến máy chủ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Đăng nhập WordSpace</CardTitle>
          <CardDescription>
            Nhập thông tin đăng nhập của bạn để tiếp tục học từ vựng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Chưa có tài khoản?{" "}
            <Button variant="link" className="p-0 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300" onClick={() => setLocation("/register")}>
              Đăng ký ngay
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}