"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, Wallet, LayoutGrid, ShieldCheck, 
  Settings, FileText, Target, Search, BarChart, Phone,Calendar,MapPin,Truck,UserPlus
} from "lucide-react";

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();

  // --- 1. SMART URL PARSING LOGIC ---
  const segments = pathname.split('/').filter(Boolean);
  
  // Check if we are in a Sector Folder (Corporate/Domestic)
  const isSectorPath = segments[0] === "corporate" || segments[0] === "domestic";
  
  // Define Context
  const currentSector = isSectorPath ? segments[0] : null; 
  
  // Logic: 
  // If inside sector (e.g., /corporate/fse) -> Role is 2nd segment ('fse')
  // If outside sector (e.g., /hod or /admin) -> Role is 1st segment ('hod')
  const currentRole = isSectorPath ? segments[1] : segments[0];

  // Base URL Construction:
  // HOD -> /hod
  // FSE -> /corporate/fse
  const roleBaseHref = isSectorPath ? `/${currentSector}/${currentRole}` : `/${currentRole}`;

  let menuItems = [];

  // --- 2. MENU ITEMS DEFINITION (Preserved as requested) ---

  // --- GLOBAL ROLES (Outside Sector Folders) ---

  // 1. ADMIN
  if (currentRole === "admin") {
    menuItems = [
      { name: "Admin Home", href: "/admin", icon: <LayoutGrid size={20} /> },
      { name: "User Access", href: "/admin/users", icon: <ShieldCheck size={20} /> },
      { name: "Global Settings", href: "/admin/settings", icon: <Settings size={20} /> },
    ];
  } 
  
  // 2. HOD (Global Head - No Sector Folder)
  else if (currentRole === "hod") {
    menuItems = [
      { name: "Dept. Overview", href: roleBaseHref, icon: <LayoutGrid size={20} /> },
      { name: "Sector Targets", href: `${roleBaseHref}/targets`, icon: <Target size={20} /> },
      { name: "Expense Approval", href: `${roleBaseHref}/approvals`, icon: <FileText size={20} /> }, 
      { name: "My Expenses", href: `${roleBaseHref}/expenses`, icon: <Wallet size={20} /> },
    ];
  } 

  // --- SECTOR SPECIFIC ROLES (Inside /corporate or /domestic) ---

  // 3. SUB-HOD (Inside Sector)
  else if (currentRole === "subhod") {
    menuItems = [
      { name: "Sales DB", href: roleBaseHref, icon: <LayoutGrid size={20} /> },
      { name: "Delivery DB", href: `${roleBaseHref}`, icon: <FileText size={20} /> }, 
    ];
  } 
  
  // 4. MANAGER
  else if (currentRole === "manager") {
    menuItems = [
      { name: "Team Dashboard", href: roleBaseHref, icon: <LayoutGrid size={20} /> },
      { name: "FSE Tracking", href: `${roleBaseHref}/team-leads`, icon: <Users size={20} /> },
{ name: "FSE Onboard", href: `${roleBaseHref}/fse-onboard`, icon: <UserPlus size={20} /> },
      { name: "Leads", href: `${roleBaseHref}/leadsgen`, icon: <Truck size={20} /> },
      { name: "Target", href: `${roleBaseHref}/target`, icon: <Target size={20} /> },
      { name: "Expense Approval", href: `${roleBaseHref}/approvals`, icon: <FileText size={20} /> },
      { name: "My Expenses", href: `${roleBaseHref}/expenses`, icon: <Wallet size={20} /> },
    ];
  } 
  
  // 5. FSE
  else if (currentRole === "fse") {
    menuItems = [
      { name: "My Dashboard", href: roleBaseHref, icon: <LayoutGrid size={20} /> },
      { name: "My Leads", href: `${roleBaseHref}/lead`, icon: <Users size={20} /> },
      { name: "My Weekly Plan", href: `${roleBaseHref}/weekly-plan`, icon: <Calendar size={20} /> },
      { name: "My Expenses", href: `${roleBaseHref}/expenses`, icon: <Wallet size={20} /> },
    ];
  } 
  
  // 6. LEADGEN
  else if (currentRole === "leadgen") {
    menuItems = [
      { name: "My Dashboard", href: roleBaseHref, icon: <LayoutGrid size={20} /> },
      
      // Page 2: Execution (Search, Table, Calling Form)
      { name: "My Leads", href: `${roleBaseHref}/leads`, icon: <Phone size={20} /> },
    ];
  }

  // 7. NEW ROLES (CRM, TL, Recruiter)
  // You can add specific menus for them here. For now, defaulting to Dashboard.
 

  else if (currentRole === "crm") {
    menuItems = [
      { name: "CRM Dashboard", href: roleBaseHref, icon: <LayoutGrid size={20} /> },
      { name: "Onboardings", href: `${roleBaseHref}/onboard`, icon: <UserPlus size={20} /> }, // For New Handovers
      
    ];
  }

  // 8. OPERATION_HEAD / OPERATIONS (Global - No Sector Folder)
  else if (currentRole === "operation_head" || currentRole === "operations") {
    menuItems = [
      { name: "Reimbursement", href: "/operations/reimbursement", icon: <Wallet size={20} /> },
    ];
  }

  // DEFAULT
  else {
    menuItems = [{ name: "Portal Home", href: "/", icon: <LayoutGrid size={20} /> }];
  }

  return (
    <aside 
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      className={`bg-[#103c7f] text-white min-h-screen flex flex-col fixed left-0 top-0 h-full z-50 font-['Calibri'] border-r border-white/10 shadow-2xl transition-all duration-500 ease-in-out cursor-default ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Sector Badge: Only shows if user is in a Sector Path (Corporate/Domestic) 
          This will AUTOMATICALLY hide for HOD and ADMIN since they are global. */}
      {!isCollapsed && isSectorPath && (
        <div className="mt-6 px-6">
          <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest font-bold text-[#a1db40]">
            {currentSector} Sector
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className={`flex-1 px-5 space-y-3 ${isSectorPath ? "mt-6" : "mt-20"}`}>
        {menuItems.map((item) => {
          
          // --- ACTIVE STATE LOGIC ---
          const isDashboardLink = item.href === roleBaseHref;
          
          const isActive = isDashboardLink 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(item.href + "/");

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
      
      {/* Footer */}
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