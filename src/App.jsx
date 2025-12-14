// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import { supabase } from "./supabaseClient";
import ElectricBorder from "./components/ElectricBorder";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);
  const [rememberDisclaimer, setRememberDisclaimer] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  const toggleDarkMode = () => setDarkMode((d) => !d);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.transition = "background 0.5s, color 0.5s";
  }, [darkMode]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const remembered = localStorage.getItem("disclaimerAgreed") === "true";
    if (remembered) setDisclaimerAgreed(true);
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-yellow-200 via-red-200 to-pink-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 animate-fadeIn">
        <span className="text-xl font-semibold">Loading…</span>
      </div>
    );

  // Disclaimer modal
  const DisclaimerModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-white/20 dark:border-gray-700 w-full max-w-md h-[90vh] overflow-y-auto p-6 flex flex-col animate-fadeIn">
        <h2 className="text-2xl font-bold mb-4">⚠ Important Notice</h2>
        <div className="mb-4 text-sm md:text-base flex-1 overflow-y-auto pr-2">
          <p>
            This delivery service is run informally by friends. Riders are not licensed delivery personnel.
            Delivery times, food quality, and availability are not guaranteed. By using this app, you agree
            to these terms and release the app and riders from any liability.
          </p>
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="rememberDisclaimer"
            checked={rememberDisclaimer}
            onChange={() => setRememberDisclaimer(!rememberDisclaimer)}
            className="mr-2 accent-blue-500"
          />
          <label htmlFor="rememberDisclaimer" className="text-sm">
            Remember my agreement
          </label>
        </div>

        <div className="flex justify-between items-center mt-auto">
          <button
            onClick={() => {
              setDisclaimerAgreed(true);
              if (rememberDisclaimer) localStorage.setItem("disclaimerAgreed", "true");
              else localStorage.removeItem("disclaimerAgreed");
            }}
            className="py-2 px-4 rounded text-white font-semibold bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 transition-all duration-300"
          >
            I Agree
          </button>

          <button
            onClick={() => {
              setDisclaimerAgreed(false);
              localStorage.removeItem("disclaimerAgreed");
              if (onClose) onClose();
            }}
            className="py-2 px-4 rounded text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (!disclaimerAgreed) return <DisclaimerModal />;

  // Layout wrapper
  const AppLayout = ({ children }) => (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-700 overflow-hidden">
      <ElectricBorder>{children}</ElectricBorder>

      <div className="w-full py-4 text-center mt-auto z-10">
        <button
          onClick={() => setShowDisclaimerModal(true)}
          className="text-sm text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          View Disclaimer
        </button>
      </div>

      {showDisclaimerModal && <DisclaimerModal onClose={() => setShowDisclaimerModal(false)} />}
    </div>
  );

  // Main routing
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Landing onShowLogin={() => {}} onShowRegister={() => {}} />} />
          <Route
            path="/login"
            element={!user ? <Login onLogin={setUser} switchToRegister={() => {}} /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!user ? <Register onLogin={setUser} switchToLogin={() => {}} /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
