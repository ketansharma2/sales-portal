"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, Wallet, LayoutGrid, ShieldCheck, Store, Briefcase, HelpCircle, Receipt, FileScan, FileBadge,
  Settings, FileText, Target, Search, BarChart, Phone, Calendar, MapPin, Truck, UserPlus, IndianRupee, UserCheck, Edit, Plus,
  Package, PhoneCall, ClipboardList, KanbanSquare, TableProperties, SunMedium, UploadCloud, Activity, History, LayoutDashboard, Building2,
  House, ShoppingCart, CalendarOff, UserCheck2Icon, FilesIcon,
  Bell, UserCircle, LogOut, User, ChevronDown, X, Mail, PhoneCall as PhoneIcon, BadgeCheck 
} from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Sidebar({ isCollapsed, setIsCollapsed , onOpenProfile }) {
  const pathname = usePathname();
  const router = useRouter(); 
  const [mounted, setMounted] = useState(false);
  
  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  useEffect(() => {
    const main = document.querySelector('main');
    if (showProfileModal && main) {
      main.classList.add('overflow-hidden');
      main.classList.remove('overflow-y-auto');
    } else if (main) {
      main.classList.remove('overflow-hidden');
      main.classList.add('overflow-y-auto');
    }
    return () => {
      const main = document.querySelector('main');
      if (main) {
        main.classList.remove('overflow-hidden');
        main.classList.add('overflow-y-auto');
      }
    };
  }, [showProfileModal]);

  const user = mounted ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  // --- 1. SMART URL PARSING LOGIC ---
  const segments = pathname.split('/').filter(Boolean);
  const isSectorPath = segments[0] === "corporate" || segments[0] === "domestic" || segments[0] === "deliverycorporate";
  const currentSector = isSectorPath ? segments[0] : null; 
  const currentRole = isSectorPath ? segments[1] : segments[0];

  const roleBaseHref = isSectorPath ? `/${currentSector}/${currentRole}` : `/${currentRole}`;

  let roleLabel = "User";
  let pageSubtitle = "DASHBOARD";

  const userRole = (user.current_role || currentRole || "").toLowerCase();
  switch (userRole) {
    case "admin":
      roleLabel = "System Admin";
      pageSubtitle = "MASTER CONTROL";
      break;
    case "hod":
      roleLabel = "Head of Department";
      pageSubtitle = "STRATEGY OVERSIGHT";
      break;
    case "subhod":
      roleLabel = "Sub-HOD";
      pageSubtitle = "CLUSTER OPERATIONS";
      break;
    case "manager":
      roleLabel = "Sales Manager";
      pageSubtitle = "TEAM MANAGEMENT";
      break;
    case "revenue":
      roleLabel = "Revenue";
      pageSubtitle = "REVENUE SYSTEM";
      break;
    case "fse":
      roleLabel = "Field Executive";
      pageSubtitle = "DAILY WORK REPORT";
      break;
    case "leadgen":
      roleLabel = "Lead Generation";
      pageSubtitle = "CALLING STATION";
      break;
    case "crm":
      roleLabel = "CRM Manager";
      pageSubtitle = "RELATIONSHIP MGMT";
      break;
    case "recruiter":
      roleLabel = "Recruiter";
      pageSubtitle = "TALENT ACQUISITION";
      break;
    case "delivery":
      roleLabel = "Delivery Manager";
      pageSubtitle = "DELIVERY OPERATIONS";
      break;
    case "operation_head":
      roleLabel = "Operation Head";
      pageSubtitle = "OPERATIONS CONTROL";
      break;
    case "jobpost":
      roleLabel = "Job Poster";
      pageSubtitle = "JOB PUBLISHING";
      break;
    case "tl":
      roleLabel = "Team Lead";
      pageSubtitle = "TEAM MANAGEMENT"; 
      break;
    default:
      roleLabel = "Team Member";
      pageSubtitle = "WORK DASHBOARD";
  }

  // Profile Data Object
  const userName = user.name || "User";
  const userProfile = {
    name: userName,
    role: roleLabel,
    email: user.email || "user@mavenjobs.com",
    phone: "+91 98765 43210",
    empId: "MJ-2024-045",
    manager: "Diwakar", 
    location: currentSector ? `${currentSector.charAt(0).toUpperCase() + currentSector.slice(1)} Region` : "Head Office",
    joiningDate: "12 Aug, 2024"
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    router.push("/");
  };

  let menuItems = [];

  if (currentRole === "admin") {
    menuItems = [
      { name: "Admin Home", href: "/admin", icon: <LayoutGrid size={18} /> },
      { name: "Morning Report", href: "/admin/morning-report", icon: <SunMedium size={18} /> },
      { name: "Operations Report", href: "/admin/opr", icon: <ClipboardList size={18} /> },
      { name: "CRM Overview", href: "/admin/crm", icon: <Briefcase size={18} /> },
      { name: "Franchise", href: "/admin/franchise", icon: <Store size={18} /> },
      { name: "User Mgt", href: "/admin/users", icon: <UserCheck size={18} /> },
      { name: "Hierarchy", href: "/admin/hierarchy", icon: <Users size={18} /> },
    ];
  } else if (currentRole === "hod") {
    menuItems = [
      { name: "Dept. Overview", href: roleBaseHref, icon: <LayoutGrid size={18} /> },
      { name: "CRM Clients", href: `${roleBaseHref}/crm`, icon: <UserCheck2Icon size={18} /> },
      { name: "Corporate Sales", href: `${roleBaseHref}/corporate/sales`, icon: <Building2 size={18} /> },
      { name: "Corporate Delivery", href: `${roleBaseHref}/corporate/delivery`, icon: <Truck size={18} /> },
      { name: "Domestic Sales", href: `${roleBaseHref}/domestic/sales`, icon: <House size={18} /> },
      { name: "Domestic Delivery", href: `${roleBaseHref}/domestic/delivery`, icon: <ShoppingCart size={18} /> },
      { name: "Sector Targets", href: `${roleBaseHref}/targets`, icon: <Target size={18} /> },
      // { name: "Expense Approval", href: `${roleBaseHref}/approvals`, icon: <FileText size={18} /> },
      { name: "My Expenses", href: `${roleBaseHref}/expense`, icon: <Wallet size={18} /> },
      { name: "Packages", href: `${roleBaseHref}/packages`, icon: <Package size={18} /> },
    ];
  } else if (currentRole === "manager") {
    menuItems = [
      { name: "Team Dashboard", href: roleBaseHref, icon: <LayoutGrid size={18} /> },
      { name: "Field Executive Data", href: `${roleBaseHref}/fse-onboard`, icon: <UserPlus size={18} /> },
      { name: "Telecalling Leads", href: `${roleBaseHref}/leadsgen`, icon: <Truck size={18} /> },
      { name: "Target", href: `${roleBaseHref}/target`, icon: <Target size={18} /> },
      { name: "Expense Approval", href: `${roleBaseHref}/approvals`, icon: <FileText size={18} /> },
      { name: "My Expenses", href: `${roleBaseHref}/expenses`, icon: <Wallet size={18} /> },
    ];
  } else if (currentRole === "fse") {
    menuItems = [
      { name: "My Dashboard", href: roleBaseHref, icon: <LayoutGrid size={18} /> },
      { name: "My Leads", href: `${roleBaseHref}/lead`, icon: <Users size={18} /> },
      { name: "Non-Visit Days", href: `${roleBaseHref}/leaves`, icon: <CalendarOff size={18} /> },
      { name: "Targets", href: `${roleBaseHref}/target`, icon: <Target size={18} /> },
      { name: "My Expenses", href: `${roleBaseHref}/expenses`, icon: <Wallet size={18} /> },
      { name: "Packages", href: `${roleBaseHref}/packages`, icon: <Package size={18} /> },
    ];
  } else if (currentRole === "leadgen") {
    menuItems = [
      { name: "My Dashboard", href: roleBaseHref, icon: <LayoutGrid size={18} /> },
      { name: "My Leads", href: `${roleBaseHref}/leads`, icon: <Phone size={18} /> },
      { name: "My Targets", href: `${roleBaseHref}/target`, icon: <Target size={18} /> },
    ];
  } else if (currentRole === "crm") {
    menuItems = [
      { name: "CRM Dashboard", href: roleBaseHref, icon: <LayoutGrid size={18} /> },
      { name: "Onboardings", href: `${roleBaseHref}/onboard`, icon: <UserPlus size={18} /> },
      { name: "Client Tracker", href: `${roleBaseHref}/tracker`, icon: <Building2 size={18} /> },
      { name: "Tracker History", href: `${roleBaseHref}/emailhistory`, icon: <History size={18} /> },
      { name: "Requirement Allocation", href: `${roleBaseHref}/assign`, icon: <ClipboardList size={18} /> },
      { name: "Workbench Report", href: `${roleBaseHref}/workbench`, icon: <LayoutDashboard size={18} /> },
      { name: "Client FAQs", href: `${roleBaseHref}/faq`, icon: <HelpCircle size={18} /> },
      { name: "Target", href: `${roleBaseHref}/target`, icon: <Target size={18} /> },
      { name: "Job Post", href: `${roleBaseHref}/jobpost`, icon: <FileBadge size={18} /> },
    ];
  } else if (currentRole === "recruiter") {
    menuItems = [
      { name: "Dashboard", href: roleBaseHref, icon: <LayoutGrid size={18} /> },
      { name: "Workbench", href: `${roleBaseHref}/workbench`, icon: <TableProperties size={18} /> },
      { name: "CV Parsing", href: `${roleBaseHref}/parsing`, icon: <UploadCloud size={18} /> },
      { name: "Targets", href: `${roleBaseHref}/target`, icon: <Target size={18} /> }, 
    ];
  } else if (currentRole === "tl") {
    menuItems = [
      { name: "Dashboard", href: roleBaseHref, icon: <LayoutGrid size={18} /> },
      { name: "My Workbench", href: `${roleBaseHref}/workbench`, icon: <KanbanSquare size={18} /> },
      { name: "Team Tracker", href: `${roleBaseHref}/tracker`, icon: <Activity size={18} /> },
      { name: "Target", href: `${roleBaseHref}/target`, icon: <Target size={18} /> },
    ];
  } else if (currentRole === "operation_head" || currentRole === "operations") {
    menuItems = [
      { name: "Reimbursement", href: "/operations/reimbursement", icon: <Wallet size={18} /> },
    ];
  } else if (currentRole === "jobpost") {
    menuItems = [
      { name: "Dashboard", href: roleBaseHref, icon: <LayoutGrid size={18} /> },
      { name: "CV Parsing", href: `${roleBaseHref}/parsing`, icon: <UploadCloud size={18} /> },
      { name: "Posting", href: `${roleBaseHref}/posting`, icon: <FileScan size={18} /> },
    ];
  } else if (currentRole === "revenue") {
    menuItems = [
      { name: "Dashboard", href: roleBaseHref, icon: <LayoutGrid size={18} /> },
      { name: "Revenue Tracker", href: `${roleBaseHref}/history`, icon: <IndianRupee size={18} /> },
    ];
  } else {
    menuItems = [{ name: "Portal Home", href: "/", icon: <LayoutGrid size={18} /> }];
  }

  return (
    <>
      <aside 
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={`bg-[#103c7f] text-white min-h-screen flex flex-col z-50 font-['Cambria'] border-r border-white/10 shadow-2xl transition-[width] duration-500 ease-in-out cursor-default print:hidden ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* 1. TOP: LOGO HEADER AREA */}
        <div className="p-3 border-b border-white/10 flex items-center h-16 shrink-0 overflow-hidden">
          {!isCollapsed ? (
            <div className="bg-white px-4 py-2 rounded-2xl shadow-inner relative flex items-center justify-center h-12 w-full border border-white/20">
              <Image src="/maven-logo.png" alt="Maven Jobs" width={120} height={32} priority className="object-contain" />
            </div>
          ) : (
            <div className="mx-auto bg-white p-2 rounded-xl shadow-md font-black text-lg text-[#103c7f]">MJ</div>
          )}
        </div>

        {/* 2. JUST ABOVE MENU: NOTIFICATION BELL AREA */}
        <div className={`px-4 py-2 border-b border-white/10 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} bg-white/5`}>
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Alerts</span>}
          <NotificationBell />
        </div>

        {/* SECTOR BADGE (If applicable) */}
        {!isCollapsed && isSectorPath && (
          <div className="mt-2 px-4">
            <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest font-bold text-[#a1db40]">
              {currentSector} Sector
            </span>
          </div>
        )}

        {/* 3. NAVIGATION LINKS LIST */}
        <nav className={`flex-1 px-3 space-y-0.5 my-2 overflow-y-auto custom-scrollbar`}>
          {menuItems.map((item) => {
            const isDashboardLink = item.href === roleBaseHref;
            const isActive = isDashboardLink 
              ? pathname === item.href 
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
             <Link 
                key={item.name} 
                href={item.href} 
                title={isCollapsed ? item.name : ""}
                className={`flex items-center rounded-2xl transition-all duration-300 group relative ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                } ${
                  isActive ? "bg-white/10 text-white shadow-lg" : "text-blue-100/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`transition-all duration-300 w-6 flex justify-center ${isActive ? "text-[#a1db40] scale-110" : "group-hover:text-[#a1db40]"}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="text-[13px] tracking-wide relative font-semibold truncate">
                      {item.name}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* 4. BOTTOM: DISTINCT PROFILE & LOGOUT SECTION */}
        {mounted && (
          <div className="p-2 border-t border-white/10 bg-black/10 flex flex-col gap-1.5">
            
            {/* Profile Button */}
            {/* Profile Button */}
<button 
  onClick={onOpenProfile}
  title={isCollapsed ? "My Profile" : ""}
  className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start gap-2"} w-full p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all group`}
>
              <div className="bg-white p-1 rounded-full text-[#103c7f] shrink-0">
                <UserCircle size={22} strokeWidth={1.5} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left truncate">
                  <p className="text-[11px] font-black leading-none uppercase tracking-tight group-hover:text-[#a1db40] transition-colors truncate max-w-[130px]">
                    {userName}
                  </p>
                  <p className="text-[8px] font-black text-[#a1db40] mt-0.5 uppercase tracking-widest leading-none truncate">
                    {roleLabel}
                  </p>
                </div>
              )}
            </button>

            {/* Separate Logout Button */}
            <button 
              onClick={handleLogout}
              title={isCollapsed ? "Sign Out" : ""}
              className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start gap-2 px-2.5"} w-full py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all text-[11px] font-black uppercase tracking-wider`}
            >
              <LogOut size={16} className="shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>

          </div>
        )}
      </aside>

      
    </>
  );
}