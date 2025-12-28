// src/components/Header.jsx
import { FiBell, FiLogOut, FiRefreshCw } from "react-icons/fi";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Header({
  toggleDarkMode,
  darkMode,
  onLogout,
  user,
  onBellClick,
  onRefresh,
}) {
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const displayName = user?.name || user?.email || "User";
  const role = user?.role?.toLowerCase() || "customer";

  // =============================
  // SHOW BROWSER NOTIFICATION
  // =============================
  const showBrowserNotification = (title, body) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/dan.svg",
      });
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // =============================
  // FETCH UNREAD
  // =============================
  const fetchUnread = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("id,message")
      .eq("receiver_id", user.id)
      .eq("read_status", false);

    if (!error) {
      setUnreadCount(data.length);
      // Show browser notifications for new messages
      data.forEach((notif) => showBrowserNotification("New Notification", notif.message || "You have a new update!"));
    }
  };

  // =============================
  // REAL-TIME SUBSCRIPTION
  // =============================
  useEffect(() => {
    fetchUnread();

    if (!user?.id) return;

    const channel = supabase
      .channel(`header_unread_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new;
          if (!notif.read_status) {
            setUnreadCount((prev) => prev + 1);
            showBrowserNotification("New Notification", notif.message || "You have a new update!");
          }
        }
      )
      .subscribe();

    // Listen for custom "notifications-read" event from Chat.jsx
    const handleReadEvent = () => fetchUnread();
    window.addEventListener("notifications-read", handleReadEvent);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("notifications-read", handleReadEvent);
    };
  }, [user]);

  // =============================
  // GREETING
  // =============================
  const hours = new Date().getHours();
  const greetingTime =
    hours < 12 ? "Good morning" :
      hours < 18 ? "Good afternoon" :
        "Good evening";

  const roleMessage =
    role === "rider"
      ? "Ready for your next delivery?"
      : "What would you like to order today?";

  // =============================
  // LOGOUT HANDLING
  // =============================
  const handleLogoutClick = () => {
    if (role === "rider") setShowLogoutMenu(true);
    else onLogout("online");
  };

  const chooseOption = (option) => {
    setShowLogoutMenu(false);
    onLogout(option);
  };

  const badgeColor = role === "rider" ? "bg-emerald-500" : "bg-blue-500";

  // =============================
  // RENDER
  // =============================
  return (
    <header className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">

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
      <div className="flex items-center gap-4 mt-3 sm:mt-0">

        {/* 🔔 Notification Bell */}
        <button
          onClick={onBellClick}
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <FiBell className="text-gray-600 dark:text-gray-300 text-2xl" />
          {unreadCount > 0 && (
            <span
              className={`
                absolute -top-1 -right-1
                ${badgeColor}
                text-white text-[11px] font-bold
                min-w-[18px] h-[18px]
                px-1 rounded-full
                flex items-center justify-center
                shadow-md
                animate-notif-pulse
              `}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          title="Refresh"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiRefreshCw className="text-gray-600 dark:text-gray-300 text-2xl" />
        </button>

        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
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
