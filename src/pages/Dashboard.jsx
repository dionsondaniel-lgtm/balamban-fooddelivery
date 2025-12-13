// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import CustomerDashboard from "./CustomerDashboard";
import RiderDashboard from "./RiderDashboard";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function Dashboard({ onLogout, darkMode, toggleDarkMode }) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedPage, setSelectedPage] = useState("dashboard");
  const [riderLogoutHandler, setRiderLogoutHandler] = useState(() => () => {});

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return onLogout();

      const { data, error } = await supabase
        .from("ridercustomer_users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return onLogout();
      }

      setProfile(data);
      setLoadingProfile(false);
    };

    fetchProfile();
  }, [onLogout]);

  const handleLogout = async (option) => {
    if (profile?.role?.toLowerCase() === "rider") {
      return riderLogoutHandler(option);
    }

    await supabase.auth.signOut();
    onLogout();
  };

  if (loadingProfile) return (
    <div className="flex items-center justify-center h-screen text-gray-700 dark:text-gray-200">
      Loading profile…
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

      {/* Only one Header */}
      <Header
        user={profile}
        onLogout={handleLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          role={profile.role}
          selectedPage={selectedPage}
          onSelectPage={setSelectedPage}
        />

        {/* Main content */}
        <div className="flex-1 p-4 overflow-auto">
          {profile.role === "Customer" && (
            <CustomerDashboard selectedPage={selectedPage} />
          )}

          {profile.role === "Rider" && (
            <RiderDashboard
              selectedPage={selectedPage}
              onHeaderLogout={setRiderLogoutHandler} // Pass logout handler to header
            />
          )}
        </div>
      </div>
    </div>
  );
}
