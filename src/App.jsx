import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, ADMIN_EMAIL } from "./firebase/config";
import LoginPage from "./pages/LoginPage";
import InternDashboard from "./pages/InternDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo">
          <span className="logo-dv">DV</span>
          <span className="logo-text">Devverse</span>
        </div>
        <div className="splash-spinner" />
      </div>
    );
  }

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            !user ? (
              <LoginPage />
            ) : isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/intern" replace />
            )
          }
        />
        <Route
          path="/intern"
          element={user && !isAdmin ? <InternDashboard user={user} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin"
          element={user && isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
