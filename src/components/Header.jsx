// src/components/Header.jsx
import { FiBell, FiLogOut, FiRefreshCw } from "react-icons/fi";
import { useState } from "react";

export default function Header({
  toggleDarkMode,
  darkMode,
  onLogout,
  user,
  unreadCount = 0,
  onBellClick,
  onRefresh
}) {
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const displayName = user?.name || user?.email || "User";
  const role = user?.role?.toLowerCase() || "customer";

  const hours = new Date().getHours();
  const greetingTime =
    hours < 12 ? "Good morning" :
    hours < 18 ? "Good afternoon" :
    "Good evening";

  const roleMessage =
    role === "rider"
      ? "Ready for your next delivery?"
      : "What would you like to order today?";

  const handleLogoutClick = () => {
    if (role === "rider") setShowLogoutMenu(true);
    else onLogout("online");
  };

  const chooseOption = (option) => {
    setShowLogoutMenu(false);
    onLogout(option);
  };

  return (
    <header className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm space-y-2 sm:space-y-0">

      {/* Logo */}
      <img src="/dan.svg" alt="Logo" className="h-10 w-auto" />

      {/* Greeting */}
      <div className="text-gray-700 dark:text-gray-200 font-semibold text-lg leading-tight">
        {greetingTime}, {displayName} 👋
        <br />
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          {roleMessage}
        </span>
      </div>

      {/* Icons */}
      <div className="flex items-center gap-4 mt-2 sm:mt-0">

        {/* 🔔 Bell */}
        <button
          onClick={onBellClick}
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiBell className="text-gray-600 dark:text-gray-300 text-2xl" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* 🔄 Refresh */}
        <button
          onClick={onRefresh}
          title="Refresh"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <FiRefreshCw className="text-gray-600 dark:text-gray-300 text-2xl" />
        </button>

        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogoutClick}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiLogOut className="text-gray-600 dark:text-gray-300 text-2xl" />
        </button>
      </div>

      {/* Rider Logout Menu */}
      {showLogoutMenu && role === "rider" && (
        <div className="absolute right-6 top-16 w-60 p-4 rounded-lg z-50 bg-white dark:bg-gray-700 shadow-lg">
          <p className="font-semibold mb-3">Logout Options</p>

          <button
            onClick={() => chooseOption("offline")}
            className="w-full bg-green-600 text-white py-2 rounded mb-2"
          >
            Go Offline & Logout
          </button>

          <button
            onClick={() => chooseOption("online")}
            className="w-full bg-blue-600 text-white py-2 rounded mb-2"
          >
            Logout but Stay Online
          </button>

          <button
            onClick={() => setShowLogoutMenu(false)}
            className="w-full bg-gray-500 text-white py-2 rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </header>
  );
}
