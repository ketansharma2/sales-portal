"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation"; 
import { 
  Bell, UserCircle, LogOut, User, ChevronDown, 
  X, Mail, Phone, MapPin, Briefcase, Calendar, BadgeCheck 
} from "lucide-react"; 
import NotificationDropdown from "./NotificationDropdown";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter(); 
  const [mounted, setMounted] = useState(false);
  
  // Existing Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => { 
    setMounted(true); 

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const user = mounted ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  // --- DYNAMIC HEADER LOGIC START ---
  const segments = pathname.split('/').filter(Boolean);
  const isSectorPath = segments[0] === "corporate" || segments[0] === "domestic";
  
  const currentSector = isSectorPath ? segments[0] : null; 
  const currentRole = isSectorPath ? segments[1] : segments[0];

  let sectorLabel = "MAVEN PORTAL"; // Default
  let roleLabel = "User";
  let pageSubtitle = "DASHBOARD";

  // 1. Determine Sector Label
  if (currentSector === "corporate") sectorLabel = "CORPORATE SALES";
  else if (currentSector === "domestic") sectorLabel = "DOMESTIC SALES";
  else if (currentRole === "hod") sectorLabel = "DEPARTMENT HEADQUARTERS";
  else if (currentRole === "admin") sectorLabel = "SYSTEM ADMINISTRATION";

  // 2. Determine Role & Subtitle
  switch (currentRole) {
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
    default:
      roleLabel = "Team Member";
      pageSubtitle = "WORK DASHBOARD";
  }
  // --- DYNAMIC HEADER LOGIC END ---

  // Profile Data Object (Using User Data or Fallback)
  const userName = user.name || "User";
  const userProfile = {
    name: userName,
    role: roleLabel,
    email: user.email || "user@mavenjobs.com",
    phone: "+91 98765 43210",
    empId: "MJ-2024-045",
    manager: "Diwakar", // Ideally comes from DB
    location: currentSector ? `${currentSector.charAt(0).toUpperCase() + currentSector.slice(1)} Region` : "Head Office",
    joiningDate: "12 Aug, 2024"
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    router.push("/");
  };

  return (
    <>
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm font-['Calibri']">
        
        {/* --- BRANDING --- */}
        <div className="flex items-center gap-8">
          <div className="relative border-r border-gray-100 pr-6 flex items-center h-10 self-center">
            <Image src="/maven-logo.png" alt="Maven Jobs" width={140} height={40} priority className="object-contain p-0 m-0" />
          </div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] hidden md:flex items-center gap-2">
            {/* Dynamic Sector Label */}
            {sectorLabel} <span className="text-gray-300">|</span> 
            {/* Dynamic Page Subtitle */}
            <span className="text-[#103c7f] font-black">{pageSubtitle}</span>
          </div>
        </div>

        {/* --- ICONS & USER SECTION --- */}
        <div className="flex items-center gap-8">
          <NotificationDropdown />

          {mounted && (
            <div className="relative" ref={dropdownRef}>
              
              {/* CLICKABLE USER AREA */}
              <div 
                className="flex items-center gap-4 pl-6 border-l border-gray-100 cursor-pointer group"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="text-right">
                  <p className="text-xs font-black text-[#103c7f] leading-none uppercase tracking-tight group-hover:text-[#a1db40] transition-colors">
                    {userName}
                  </p>
                  <p className="text-[9px] font-black text-[#a1db40] mt-1.5 uppercase tracking-widest leading-none group-hover:text-[#103c7f] transition-colors">
                    {roleLabel}
                  </p>
                </div>
                
                <div className={`bg-gradient-to-br from-blue-50 to-white p-0.5 rounded-full border border-blue-100 shadow-inner transition-all duration-300 ${isProfileOpen ? 'ring-2 ring-[#a1db40]/50' : ''}`}>
                  <div className="bg-white p-1 rounded-full text-[#103c7f]">
                    <UserCircle size={34} strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* --- DROPDOWN MENU --- */}
              {isProfileOpen && (
                <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                  
                  {/* Dropdown Header */}
                  <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-black text-[#103c7f] truncate">{user.email || "user@mavenjobs.com"}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button 
                      onClick={() => { setIsProfileOpen(false); setShowProfileModal(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 rounded-xl transition-all group"
                    >
                      <User size={16} className="text-gray-400 group-hover:text-[#103c7f]" />
                      My Profile
                    </button>
                  </div>

                  {/* Logout Section */}
                  <div className="p-2 border-t border-gray-50 mt-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </header>

      {/* --- MY PROFILE MODAL UI --- */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn font-['Calibri']">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative border border-white/20">
            
            {/* Modal Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-[#103c7f] to-[#0d316a] relative">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Avatar & Main Info */}
            <div className="px-8 pb-8 relative">
              <div className="flex justify-between items-end -mt-12 mb-6">
                <div className="bg-white p-1.5 rounded-full shadow-lg">
                  <div className="bg-gray-100 h-24 w-24 rounded-full flex items-center justify-center text-[#103c7f]">
                    <UserCircle size={64} strokeWidth={1} />
                  </div>
                </div>
                <div className="mb-2">
                  <span className="bg-[#a1db40]/20 text-[#103c7f] border border-[#a1db40] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <BadgeCheck size={12} className="text-[#a1db40]" /> Active Employee
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-black text-[#103c7f] leading-none uppercase italic tracking-tight">{userProfile.name}</h2>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em] mt-1">{userProfile.role}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-[#a1db40] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-xs font-bold text-[#103c7f] break-all">{userProfile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-[#a1db40] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                      <p className="text-xs font-bold text-[#103c7f]">{userProfile.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-[#a1db40] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Region</p>
                      <p className="text-xs font-bold text-[#103c7f]">{userProfile.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-l border-gray-200 pl-6">
                  <div className="flex items-start gap-3">
                    <Briefcase size={16} className="text-[#103c7f] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Employee ID</p>
                      <p className="text-xs font-bold text-[#103c7f]">{userProfile.empId}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User size={16} className="text-[#103c7f] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reporting Manager</p>
                      <p className="text-xs font-bold text-[#103c7f]">{userProfile.manager}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-[#103c7f] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Joining Date</p>
                      <p className="text-xs font-bold text-[#103c7f]">{userProfile.joiningDate}</p>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Footer */}
              <div className="mt-6 text-center">
                 <button className="text-[10px] font-bold text-gray-400 hover:text-[#103c7f] uppercase tracking-widest border-b border-dashed border-gray-300 hover:border-[#103c7f] transition-all">
                   Request Profile Update
                 </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}