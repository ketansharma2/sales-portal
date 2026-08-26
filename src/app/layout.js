"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; 
import Image from "next/image";
import { Menu, X, UserCircle, BadgeCheck, Mail, Phone, MapPin, Briefcase, User, Calendar } from "lucide-react";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile drawer state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const isLoginPage = pathname === "/";

  // Dynamic role label helper for modal
  const segments = pathname.split('/').filter(Boolean);
  const currentRole = (segments[0] === "corporate" || segments[0] === "domestic") ? segments[1] : segments[0];
  const userRole = (user.current_role || currentRole || "").toLowerCase();
  
  let roleLabel = "Team Member";
  switch (userRole) {
    case "admin": roleLabel = "System Admin"; break;
    case "hod": roleLabel = "Head of Department"; break;
    case "subhod": roleLabel = "Sub-HOD"; break;
    case "manager": roleLabel = "Sales Manager"; break;
    case "fse": roleLabel = "Field Executive"; break;
    case "leadgen": roleLabel = "Lead Generation"; break;
    case "crm": roleLabel = "CRM Manager"; break;
    case "recruiter": roleLabel = "Recruiter"; break;
    case "delivery": roleLabel = "Delivery Manager"; break;
    case "operation_head": roleLabel = "Operation Head"; break;
    case "jobpost": roleLabel = "Job Poster"; break;
    case "tl": roleLabel = "Team Lead"; break;
    case "revenue": roleLabel = "Revenue"; break;
  }

  const userProfile = {
    name: user.name || "User",
    role: roleLabel,
    email: user.email || "user@mavenjobs.com",
    phone: "+91 98765 43210",
    empId: "MJ-2024-045",
    manager: "Diwakar",
    location: "Head Office",
    joiningDate: "12 Aug, 2024"
  };

  return (
    <html lang="en">
      <body className="antialiased bg-gray-50/50 flex font-['Calibri'] h-screen overflow-hidden">
        
        {!isLoginPage && (
          <>
            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
              <Sidebar 
                isCollapsed={isCollapsed && !mobileOpen} 
                setIsCollapsed={setIsCollapsed} 
                onOpenProfile={() => setShowProfileModal(true)} 
              />
            </div>

            {/* Backdrop Overlay for Mobile */}
            {mobileOpen && (
              <div 
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
              />
            )}
          </>
        )}

        {/* Main Content Wrapper */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden transition-[margin] duration-500 ease-in-out ${
            isLoginPage ? "ml-0" : (isCollapsed ? "md:ml-20 ml-0" : "md:ml-72 ml-0")
          }`}
        >
          {/* Mobile Top Navigation Bar */}
         {!isLoginPage && (
  <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30 relative">
    <button 
      onClick={() => setMobileOpen(!mobileOpen)}
      className="p-2 rounded-xl bg-[#103c7f] text-white shadow-sm"
    >
      {mobileOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
    
    <div className="relative flex items-center h-8">
      <Image src="/maven-logo.png" alt="Maven Jobs" width={110} height={28} priority className="object-contain" />
    </div>
  </div>
)}

          {/* Page Content */}
          <main 
            className={`flex-1 overflow-y-auto ${
              isLoginPage ? "w-full p-0" : "pt-4 px-4 md:px-6 pb-8 w-full"
            }`}
          >
            {children}
          </main>
        </div>

        {/* --- GLOBAL PROFILE MODAL (Rendered on main page center) --- */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn font-['Calibri']">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative border border-white/20">
              <div className="h-32 bg-gradient-to-r from-[#103c7f] to-[#0d316a] relative">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

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

                <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100 text-slate-800">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail size={16} className="text-[#103c7f] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                        <p className="text-xs font-bold text-[#103c7f] break-all">{userProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone size={16} className="text-[#103c7f] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                        <p className="text-xs font-bold text-[#103c7f]">{userProfile.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-[#103c7f] mt-0.5 shrink-0" />
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
                
                <div className="mt-6 text-center">
                   <button className="text-[10px] font-bold text-gray-400 hover:text-[#103c7f] uppercase tracking-widest border-b border-dashed border-gray-300 hover:border-[#103c7f] transition-all cursor-pointer">
                     Request Profile Update
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}