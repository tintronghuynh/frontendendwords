import { useState } from "react";
import { useTheme } from "../../hooks/use-theme";
import { useFontSize } from "../../hooks/use-font-size";
import { Moon, Sun, Brain, LogOut, User } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";

export default function Header() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                  <Brain size={20} />
                </div>
              </div>
              <h1 className="text-xl font-heading font-bold">WordSpace</h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="font-size" className="text-sm">Aa</label>
              <input 
                type="range" 
                id="font-size" 
                className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer" 
                min="0" 
                max="2" 
                step="1" 
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
              />
              <label htmlFor="font-size" className="text-base">Aa</label>
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                      <User className="h-5 w-5 text-primary-700 dark:text-primary-300" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user && (
                        <>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <button
                      className="w-full flex items-center cursor-default"
                      onClick={() => logout()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
