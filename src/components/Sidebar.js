"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, Wallet, LayoutGrid, ShieldCheck, 
  BarChart3, Settings, FileText ,Target
} from "lucide-react";

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");
  const isHOD = pathname.startsWith("/hod");
  const isManager = pathname.startsWith("/manager");
  const isFSE = pathname.startsWith("/fse");

  let menuItems = [];

  if (isAdmin) {
    menuItems = [
      { name: "Admin Home", href: "/admin", icon: <LayoutGrid size={20} /> },
      { name: "User Access", href: "/admin/users", icon: <ShieldCheck size={20} /> },
      { name: "Global Settings", href: "/admin/settings", icon: <Settings size={20} /> },
    ];
  } 
  else if (isHOD) {
    menuItems = [
      { name: "Dept. Overview", href: "/hod", icon: <LayoutGrid size={20} /> },
      { name: "Team Targets", href: "/hod/targets", icon: <Target size={20} /> }, // 👈 New Page
      { name: "My Expenses", href: "/hod/expenses", icon: <Wallet size={20} /> },
      { name: "Expense Approval", href: "/hod/approvals", icon: <FileText size={20} /> },
    ];
  } 
  else if (isManager) {
    menuItems = [
      { name: "Team Dashboard", href: "/manager", icon: <LayoutGrid size={20} /> },
      { name: "FSE Tracking", href: "/manager/team-leads", icon: <Users size={20} /> },
      { name: "My Expenses", href: "/manager/expenses", icon: <Wallet size={20} /> },
      { name: "Expense Approval", href: "/manager/approvals", icon: <FileText size={20} /> },
      
    ];
  } 
  else if (isFSE) {
    menuItems = [
      { name: "My Dashboard", href: "/fse", icon: <LayoutGrid size={20} /> },
      { name: "My Leads", href: "/fse/leads", icon: <Users size={20} /> },
      { name: "My Expenses", href: "/fse/expenses", icon: <Wallet size={20} /> },
    ];
  } 
  else {
    menuItems = [{ name: "Portal Home", href: "/", icon: <LayoutGrid size={20} /> }];
  }

  return (
    <aside 
      /* --- HOVER LOGIC START --- */
      onMouseEnter={() => setIsCollapsed(false)} // Expand on Hover
      onMouseLeave={() => setIsCollapsed(true)}  // Collapse on Leave
      /* --- HOVER LOGIC END --- */
      className={`bg-[#103c7f] text-white min-h-screen flex flex-col fixed left-0 top-0 h-full z-50 font-['Calibri'] border-r border-white/10 shadow-2xl transition-all duration-500 ease-in-out cursor-default ${
        isCollapsed ? "w-18" : "w-72"
      }`}
    >
      {/* Navigation Menu */}
      <nav className="flex-1 px-5 mt-20 space-y-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex items-center rounded-2xl transition-all duration-300 group relative ${
                isCollapsed ? "justify-center p-2" : "justify-between px-6 py-4"
              } ${
                isActive ? "bg-white/10 text-white shadow-lg" : "text-blue-100/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`transition-transform duration-300 ${isActive ? "text-[#a1db40] scale-110" : "group-hover:text-[#a1db40]"}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className={`text-[15px] tracking-wide ${isActive ? "font-black" : "font-semibold"}`}>
                    {item.name}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Compact Footer Footer */}
      {!isCollapsed && (
        <div className="p-8 mt-auto animate-in fade-in duration-700">
          <div className="bg-white/5 backdrop-blur-md rounded-[24px] p-5 border border-white/5 shadow-inner flex flex-col items-center gap-2">
             <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 bg-[#a1db40] rounded-full shadow-[0_0_8px_#a1db40]"></div>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Active System</span>
             </div>
             <p className="text-[8px] text-blue-200/20 font-bold italic tracking-tighter uppercase">Maven Jobs Portal</p>
          </div>
        </div>
      )}
    </aside>
  );
}