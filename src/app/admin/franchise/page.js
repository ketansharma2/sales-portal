"use client";
import React, { useState, useEffect } from "react";
import { 
  Building2, Phone, FileText, Send, CheckCircle, 
  MapPin, Calendar, Clock, Filter, Award, Search,Eye
} from "lucide-react";

export default function AdminFranchiseDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // --- FILTERS ---
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // --- MOCK DATA FOR FRANCHISE (LEADGEN GENERATED) ---
  const pipeline = { discussed: "80", formAsk: "40", formShared: "35", accepted: "15" };

  const franchiseClients = [
    { 
      id: "FR-101", date: "02 Mar 2026", time: "11:30 AM", company: "EduTech Panipat", 
      contactPerson: "Ravi Kumar", phone: "+91 9876543210", email: "ravi@edutech.in", 
      location: "Panipat, Haryana", status: "Form Shared", leadGenName: "Pooja",
      remarks: "Reviewing terms and conditions with legal team.", color: "bg-blue-100 text-blue-800" 
    },
    { 
      id: "FR-102", date: "28 Feb 2026", time: "02:15 PM", company: "Global HR Services", 
      contactPerson: "Priya Singh", phone: "+91 8765432109", email: "priya@globalhr.com", 
      location: "Karnal, Haryana", status: "Discussed", leadGenName: "Sneha",
      remarks: "Highly interested. Requested callback on Monday.", color: "bg-orange-100 text-orange-800" 
    },
    { 
      id: "FR-103", date: "25 Feb 2026", time: "10:00 AM", company: "NextGen Staffing", 
      contactPerson: "Amit Patel", phone: "+91 7654321098", email: "amit@nextgen.in", 
      location: "Ahmedabad, Gujarat", status: "Accepted", leadGenName: "Khushi",
      remarks: "Agreement signed, onboarding process initiated.", color: "bg-emerald-100 text-emerald-800" 
    },
    { 
      id: "FR-104", date: "20 Feb 2026", time: "04:45 PM", company: "Stellar Jobs", 
      contactPerson: "Neha Gupta", phone: "+91 6543210987", email: "neha.g@stellar.com", 
      location: "Delhi, NCR", status: "Form Ask", leadGenName: "Pooja",
      remarks: "Asked for the application form, follow up tomorrow.", color: "bg-purple-100 text-purple-800" 
    },
  ];

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setLoading(false), 600); // Simulate data fetch
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-2 md:p-4 bg-[#f8fafc] font-['Calibri'] min-h-screen text-slate-800 flex flex-col">
      <div className="max-w-8xl mx-auto w-full space-y-4">
        
        {/* ========================================= */}
        {/* HEADER & CONTROLS                         */}
        {/* ========================================= */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h1 className="text-xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <Award size={20}/> Franchise Pipeline Overview
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Admin View (LeadGen Sourced)</p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              
              {/* Search Bar */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 focus-within:border-blue-400 transition-colors w-48">
                <Search size={14} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search Client..." 
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Date Filters */}
              <DateInput label="From" value={fromDate} onChange={setFromDate} />
              <DateInput label="To" value={toDate} onChange={setToDate} />

              {/* Status Filter */}
              <div className="flex items-center bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors">
                <Filter size={12} className="text-blue-500" />
                <select 
                  className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer uppercase"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Discussed">Discussed</option>
                  <option value="Form Ask">Form Ask</option>
                  <option value="Form Shared">Form Shared</option>
                  <option value="Accepted">Accepted</option>
                </select>
              </div>

            </div>
        </div>

        {loading ? (
             <div className="flex items-center justify-center py-20">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#103c7f]"></div>
             </div>
        ) : (
            <div className="animate-in fade-in duration-500 space-y-4">
                
                {/* ========================================= */}
                {/* KPI ROW: FRANCHISE PIPELINE FUNNEL        */}
                {/* ========================================= */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl shadow-sm w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KpiCard title="Discussed" total={pipeline.discussed} icon={<Phone size={18} />} color="teal" />
                        <KpiCard title="Form Ask" total={pipeline.formAsk} icon={<FileText size={18} />} color="teal" />
                        <KpiCard title="Form Shared" total={pipeline.formShared} icon={<Send size={18} />} color="teal" />
                        <KpiCard title="Accepted" total={pipeline.accepted} icon={<CheckCircle size={18} />} color="teal" />
                    </div>
                </div>

                {/* ========================================= */}
                {/* DATA TABLE: FRANCHISE LEADS               */}
               {/* ========================================= */}
                {/* DATA TABLE: FRANCHISE LEADS               */}
                {/* ========================================= */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]"> 
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-black text-[11px] text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={14}/> Sourced Franchise Leads
                        </h3>
                        <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">
                            Showing {statusFilter}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                            <thead className="sticky top-0 z-20 shadow-sm bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">LeadGen Name</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Company</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Contact Details</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Latest Interaction</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Franchise Status</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {franchiseClients
                                  .filter(c => statusFilter === "All" || c.status === statusFilter)
                                  .filter(c => c.company.toLowerCase().includes(searchQuery.toLowerCase()))
                                  .map((client, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-all group align-top">
                                        
                                        {/* LeadGen Name */}
                                        <td className="px-6 py-4">
                                            <p className="font-black text-[#103c7f] text-[12px]">{client.leadGenName}</p>
                                        </td>

                                        {/* Company Name & Location */}
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 text-sm mb-1">{client.company}</p>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                                <MapPin size={10} className="text-red-400" /> {client.location}
                                            </div>
                                        </td>

                                        {/* Contact Details */}
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-700 text-xs mb-0.5">{client.contactPerson}</p>
                                            <p className="text-[10px] font-semibold text-gray-500">{client.phone}</p>
                                            <p className="text-[10px] font-semibold text-gray-400">{client.email}</p>
                                        </td>

                                        {/* Latest Interaction */}
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] font-semibold text-slate-600 max-w-[250px] truncate whitespace-normal leading-snug" title={client.remarks}>
                                                {client.remarks}
                                            </p>
                                        </td>

                                        {/* Franchise Status */}
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter shadow-sm border border-white/20 ${client.color}`}>
                                                {client.status}
                                            </span>
                                        </td>

                                        {/* Action Column */}
                                        <td className="px-6 py-4 text-center">
                                            <button className="bg-white border border-gray-200 text-[#103c7f] hover:bg-blue-50 hover:border-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 mx-auto">
                                                <Eye size={12} /> View
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                                {franchiseClients.filter(c => statusFilter === "All" || c.status === statusFilter).length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                                            No franchise leads found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

/* --- REUSABLE COMPONENTS --- */

function DateInput({ label, value, onChange }) {
    return (
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors cursor-pointer group">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-[#103c7f] transition-colors">{label}</span>
            <input 
              type="date" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer uppercase" 
            />
        </div>
    )
}

function KpiCard({ title, total, icon, color, onClick }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        green: "bg-green-50 text-green-700 border-green-100",
        red: "bg-red-50 text-red-700 border-red-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100",
        teal: "bg-teal-50 text-teal-700 border-teal-100",
    };

    const activeColor = colorClasses[color] || colorClasses.blue;

    return (
        <div 
          className={`bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${activeColor} border shrink-0`}>
                    {icon}
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">{title}</p>
            </div>
            <div className="flex items-end justify-between">
                <h3 className="text-2xl font-black text-slate-800 leading-none ml-1">{total}</h3>
            </div>
        </div>
    );
}