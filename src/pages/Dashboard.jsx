// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import CustomerDashboard from "./CustomerDashboard";
import RiderDashboard from "./RiderDashboard";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import MobileNav from "../components/MobileNav";

export default function Dashboard({ onLogout, darkMode, toggleDarkMode }) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedPage, setSelectedPage] = useState("dashboard");
  const [riderLogoutHandler, setRiderLogoutHandler] = useState(() => () => {});

  // FETCH PROFILE
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

  // CENTRAL LOGOUT HANDLER
  const handleLogout = async (option) => {
    if (profile?.role?.toLowerCase() === "rider") {
      return riderLogoutHandler(option);
    }

    await supabase.auth.signOut();
    onLogout();
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-700 dark:text-gray-200">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

      {/* DESKTOP SIDEBAR */}
      <Sidebar
        role={profile.role}
        selectedPage={selectedPage}
        onSelectPage={setSelectedPage}
      />

      {/* MAIN COLUMN */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* HEADER (ALWAYS VISIBLE) */}
        <Header
          user={profile}
          onLogout={handleLogout}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* MOBILE NAV (ONLY ON SMALL SCREENS) */}
        <MobileNav
          role={profile.role}
          selectedPage={selectedPage}
          onSelectPage={setSelectedPage}
        />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {profile.role === "Customer" && (
            <CustomerDashboard selectedPage={selectedPage} />
          )}

          {profile.role === "Rider" && (
            <RiderDashboard
              selectedPage={selectedPage}
              onHeaderLogout={setRiderLogoutHandler}
            />
          )}
        </main>
      </div>
    </div>
  );
}
