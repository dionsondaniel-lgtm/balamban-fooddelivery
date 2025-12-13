// src/App.jsx
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import { supabase } from "./supabaseClient";
import ElectricBorder from "./components/ElectricBorder";


export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("landing");
  const [loading, setLoading] = useState(true);
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false);
  const [rememberDisclaimer, setRememberDisclaimer] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

  const toggleDarkMode = () => setDarkMode(d => !d);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("landing");
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.style.transition = "background 0.5s, color 0.5s";
  }, [darkMode]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (sessionUser) {
        setUser(sessionUser);
        setPage("dashboard");
      } else {
        setUser(null);
        setPage("landing");
      }

      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        const sessionUser = session?.user ?? null;
        if (sessionUser) {
          setUser(sessionUser);
          setPage("dashboard");
        } else {
          setUser(null);
          setPage("landing");
        }
      }
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

  // Responsive Disclaimer Modal
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

        {/* Remember Checkbox */}
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
              if (rememberDisclaimer) {
                localStorage.setItem("disclaimerAgreed", "true");
              } else {
                localStorage.removeItem("disclaimerAgreed");
              }
            }}
            className="py-2 px-4 rounded text-white font-semibold bg-gradient-to-r from-green-400 to-blue-500 hover:from-blue-500 hover:to-green-400 transition-all duration-300"
          >
            I Agree
          </button>

          <button
            onClick={() => {
              setDisclaimerAgreed(false);  // Reset if user closes
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

  const AppLayout = ({ children }) => (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-700 overflow-hidden">

      <ElectricBorder>
        {children}
      </ElectricBorder>

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


  if (!user) {
    return (
      <AppLayout>
        {page === "landing" && (
          <Landing
            onShowLogin={() => setPage("login")}
            onShowRegister={() => setPage("register")}
          />
        )}
        {page === "login" && (
          <Login
            onLogin={u => { setUser(u); setPage("dashboard"); }}
            switchToRegister={() => setPage("register")}
          />
        )}
        {page === "register" && (
          <Register
            onLogin={u => { setUser(u); setPage("dashboard"); }}
            switchToLogin={() => setPage("login")}
          />
        )}

        <div className="absolute inset-0 pointer-events-none">
          {["🍔", "🍕", "🍟", "🌭", "🥤", "🍩", "🍰", "🥪"].map((emoji, idx) => (
            <span
              key={idx}
              className={`absolute text-2xl md:text-3xl animate-float-${idx % 4}`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Dashboard
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
      />
      <span className="absolute w-40 h-40 bg-yellow-200 rounded-full mix-blend-multiply opacity-30 animate-pulse -top-10 -left-10"></span>
      <span className="absolute w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply opacity-25 animate-pulse -bottom-10 -right-5"></span>
      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease forwards; }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        .animate-pulse { animation: pulse 6s ease-in-out infinite; }

        @keyframes float1 {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          50% { transform: translateY(-20px) rotate(10deg); opacity: 1; }
          100% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
        }
        @keyframes float2 {
          0% { transform: translateY(0) rotate(-5deg); opacity: 0.7; }
          50% { transform: translateY(-25px) rotate(5deg); opacity: 0.9; }
          100% { transform: translateY(0) rotate(-5deg); opacity: 0.7; }
        }
        @keyframes float3 {
          0% { transform: translateY(0) rotate(5deg); opacity: 0.6; }
          50% { transform: translateY(-15px) rotate(-5deg); opacity: 0.8; }
          100% { transform: translateY(0) rotate(5deg); opacity: 0.6; }
        }
        @keyframes float0 {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-18px) rotate(8deg); opacity: 0.9; }
          100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
        }
        ${[0, 1, 2, 3].map(i => `.animate-float-${i} { animation: float${i} ${6 + i}s ease-in-out infinite; }`).join("")}
      `}</style>
    </AppLayout>
  );
}
