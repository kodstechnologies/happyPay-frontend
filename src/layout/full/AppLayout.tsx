import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import SidebarDesktop from "../../components/SidebarDesktop";
import SidebarMobile from "../../components/SidebarMobile";
import Navbar from "../../components/Navbar";
import { logout } from "../../utils/auth";
import { getAuthUser } from "../../context/AuthContext";

const AppLayout = () => {
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
 const user=getAuthUser()?.fullName
  const handleLogout = () => {
    logout();

    navigate("/retailer/login", {
      replace: true,
    });
  };

  return (
    <div className="hp-retailer-canvas flex h-screen overflow-hidden text-[#0f172a]">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden h-full w-[276px] shrink-0 flex-col p-3 pr-0 lg:flex">
        <SidebarDesktop onLogout={handleLogout} />
      </div>

      {/* MAIN AREA */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <SidebarMobile
          open={mobileSidebarOpen}
          onOpenChange={setMobileSidebarOpen}
          onLogout={handleLogout}
        />

        {/* NAVBAR */}
        <div className="shrink-0 px-3 pt-3 pb-0 sm:px-4 lg:px-6 lg:pt-4">
          <Navbar
          UserName={user}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
            // onLogout={handleLogout}
          />
        </div>

        {/* PAGE CONTENT */}
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;