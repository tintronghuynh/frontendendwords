import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Cấu hình biến môi trường để sử dụng trong quá trình build
  define: {
    'process.env.BACKEND_URL': JSON.stringify(process.env.BACKEND_URL || 'https://wordspace-backend.onrender.com')
  }
});