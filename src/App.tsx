import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Auth from "./screens/Auth";
import { Toaster } from "@/components/ui/sonner";
import { getToken } from "@/lib/api";
import Dashboard from "./screens/Dashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!getToken());
    };
    
    // Listen for auth state changes across tabs/components
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-state-change", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-state-change", handleStorageChange);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    window.dispatchEvent(new Event("auth-state-change"));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("auth-state-change"));
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
        <Routes>
          {/* Public Authentication Route */}
          <Route
            path="/auth"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <div className="flex min-h-screen flex-col items-center justify-center p-4">
                  <div className="mb-6 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400">
                      Auralist
                    </h1>
                    <p className="text-sm text-slate-400 mt-2">
                      Manage your tasks completely through voice conversation
                    </p>
                  </div>
                  <Auth onLoginSuccess={handleLoginSuccess} />
                </div>
              )
            }
          />

          {/* Protected Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          {/* Fallback routing */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />}
          />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;