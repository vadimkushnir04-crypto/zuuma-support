// hooks/useAuth.ts
import { useEffect, useState } from 'react';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      const parsed = JSON.parse(user);
      setIsLoggedIn(true);
      setUserName(parsed.fullName || parsed.email.split("@")[0]);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return { isLoggedIn, userName, logout };
}