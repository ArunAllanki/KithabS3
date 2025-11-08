import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(sessionStorage.getItem("user")) || null
  );
  const [token, setToken] = useState(sessionStorage.getItem("token") || null);

  useEffect(() => {
    if (!token || !user) return;

    try {
      const decoded = jwtDecode(token);
      const expTime = decoded.exp * 1000;
      const now = Date.now();

      if (expTime <= now) {
        logout();
      } else {
        const timeout = setTimeout(() => logout(), expTime - now);
        return () => clearTimeout(timeout);
      }
    } catch (err) {
      console.error("Invalid token:", err);
      logout();
    }
  }, [token]);

  const login = async (idRaw, passwordRaw) => {
    const id = idRaw?.trim();
    const password = passwordRaw?.trim();
    if (!id || !password)
      return { success: false, message: "ID and password required" };

    const backendBase = process.env.REACT_APP_BACKEND_URL?.trim() || "";
    let endpoint = "";
    let body = {};

    if (id === process.env.REACT_APP_ADMIN_ID) {
      endpoint = "admin/login";
      body = { adminId: id, password };
    }
    // else if (id.startsWith("FAC")) {
    else {
      endpoint = "faculty/login";
      body = { employeeId: id, password };
    }
    //  else {
    //   endpoint = "student/login";
    //   body = { rollNumber: id, password };
    // }

    const url = `${backendBase.replace(/\/$/, "")}/auth/${endpoint}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      const userKey =
        endpoint === "admin/login" ? "admin" : endpoint.split("/")[0];
      const userData = data[userKey];

      setUser(userData);
      setToken(data.token);
      sessionStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.setItem("token", data.token);

      return { success: true, role: userData.role };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
