"use client";
import React, { useState, useEffect } from "react";
import { 
  Building2, Users, Phone, FileText, CheckCircle, 
  MapPin, Calendar, Filter, Search, Eye, Activity,BarChart3, UploadCloud,
  Briefcase, MessageSquare, UserCheck, Share2, CheckSquare , X,ExternalLink,Download , Clock ,
} from "lucide-react";

export default function AdminCRMDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // --- FILTERS STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [crmFilter, setCrmFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // --- ADD THIS MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const handleViewClick = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  // --- MOCK DATA ---
  const crmList = ["Pooja Sharma", "Sanjay Dutt", "Neha Gupta", "Aarti Singh"];
  
  const stats = {
    onboards: "145",
    branches: "312",
    contacts: "520",
    conversations: "1,840",
    uniqueProfiles: "4,250",
    requirements: "380",
    workbenchAllot: "215",
    trackerShared: "110"
  };

 const onboardedClients = [
    { 
      id: "CL-1021", date: "04 Apr 2026", company: "TechNova Solutions", sector: "Corporate",
      crmName: "Pooja Sharma", contactPerson: "Vikram Malhotra", phone: "+91 9876543210", email: "vikram@technova.in", 
      requirements: 12, branches: 4, contacts: 15, workbenchAllotted: 8, trackerStatus: "Shared", color: "bg-emerald-100 text-emerald-800" 
    },
    { 
      id: "CL-1022", date: "02 Apr 2026", company: "Urban Builders", sector: "Domestic",
      crmName: "Sanjay Dutt", contactPerson: "Ramesh Singh", phone: "+91 8765432109", email: "ramesh@urban.com", 
      requirements: 5, branches: 1, contacts: 3, workbenchAllotted: 5, trackerStatus: "Pending", color: "bg-orange-100 text-orange-800" 
    },
    { 
      id: "CL-1023", date: "28 Mar 2026", company: "Global Finance", sector: "Corporate",
      crmName: "Aarti Singh", contactPerson: "Priya Desai", phone: "+91 7654321098", email: "priya@globalfin.in", 
      requirements: 25, branches: 12, contacts: 45, workbenchAllotted: 15, trackerStatus: "Shared", color: "bg-emerald-100 text-emerald-800" 
    },
    { 
      id: "CL-1024", date: "25 Mar 2026", company: "Apex Retail", sector: "Domestic",
      crmName: "Neha Gupta", contactPerson: "Karan Johar", phone: "+91 6543210987", email: "karan@apex.in", 
      requirements: 3, branches: 2, contacts: 8, workbenchAllotted: 1, trackerStatus: "Shared", color: "bg-emerald-100 text-emerald-800" 
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
        {/* HEADER & ONE-ROW CONTROLS                 */}
        {/* ========================================= */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h1 className="text-xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <Briefcase size={20}/> CRM Operations Overview
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Admin Central Dashboard</p>
            </div>
            
            {/* --- ONE ROW FILTERS --- */}
            <div className="flex items-center gap-3 flex-wrap">
              
              {/* Search Client */}
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

              {/* Sector Filter */}
              <div className="flex items-center bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors">
                <Filter size={12} className="text-indigo-500" />
                <select 
                  className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer uppercase"
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                >
                  <option value="All">All Sectors</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Domestic">Domestic</option>
                </select>
              </div>

              {/* CRM Name Filter */}
              <div className="flex items-center bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors">
                <Users size={12} className="text-blue-500" />
                <select 
                  className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer uppercase"
                  value={crmFilter}
                  onChange={(e) => setCrmFilter(e.target.value)}
                >
                  <option value="All">All CRMs</option>
                  {crmList.map(crm => (
                    <option key={crm} value={crm}>{crm}</option>
                  ))}
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
                {/* KPI ROW: 8 CARDS (2 ROWS X 4 COLS)        */}
                {/* ========================================= */}
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl shadow-sm w-full">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity size={16} className="text-indigo-700" />
                        <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                            CRM Performance Metrics
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KpiCard title="Onboards" total={stats.onboards} icon={<Briefcase size={18} />} color="blue" />
                        <KpiCard title="Branches" total={stats.branches} icon={<Building2 size={18} />} color="purple" />
                        <KpiCard title="Contacts" total={stats.contacts} icon={<Phone size={18} />} color="teal" />
                        <KpiCard title="Conversations" total={stats.conversations} icon={<MessageSquare size={18} />} color="orange" />
                        
                        <KpiCard title="Unique Profiles" total={stats.uniqueProfiles} icon={<UserCheck size={18} />} color="blue" />
                        <KpiCard title="Requirement No." total={stats.requirements} icon={<FileText size={18} />} color="purple" />
                        <KpiCard title="Workbench Allot" total={stats.workbenchAllot} icon={<CheckSquare size={18} />} color="green" />
                        <KpiCard title="Tracker Shared" total={stats.trackerShared} icon={<Share2 size={18} />} color="teal" />
                    </div>
                </div>

{/* ========================================= */}
                {/* DATA TABLE: ONBOARDED CLIENTS             */}
                {/* ========================================= */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-black text-[11px] text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={14}/> Onboarded Clients List
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                            <thead className="sticky top-0 z-20 shadow-sm bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Sector</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Onboarding Date</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Company Name</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Total Branches</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Total Contacts</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Total Requirements</th>
                                    <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {onboardedClients
                                  .filter(c => sectorFilter === "All" || c.sector === sectorFilter)
                                  .filter(c => crmFilter === "All" || c.crmName === crmFilter)
                                  .filter(c => c.company.toLowerCase().includes(searchQuery.toLowerCase()))
                                  .map((client, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-all group align-middle">
                                        
                                        {/* Sector */}
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${client.sector === 'Corporate' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                {client.sector}
                                            </span>
                                        </td>

                                        {/* Onboarding Date */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
                                                <Calendar size={12} className="text-gray-400"/> {client.date} 
                                            </div>
                                        </td>

                                        {/* Company Name */}
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-[#103c7f] text-sm">{client.company}</p>
                                        </td>

                                        {/* Total Branches */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                                                {client.branches}
                                            </span>
                                        </td>

                                        {/* Total Contacts */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                                                {client.contacts}
                                            </span>
                                        </td>

                                        {/* Total Requirements */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                                                {client.requirements}
                                            </span>
                                        </td>

{/* Action Column */}
<td className="px-6 py-4 text-center">
    <button 
      onClick={() => handleViewClick(client)} 
      className="bg-white border border-gray-200 text-[#103c7f] hover:bg-blue-50 hover:border-blue-200 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 mx-auto"
    >
        <Eye size={12} /> View
    </button>
</td>

                                    </tr>
                                ))}
                                {onboardedClients.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                                            No clients found matching your criteria.
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
    {/* --- ADD THIS MODAL INVOCATION HERE --- */}
      {isModalOpen && selectedClient && (
        <ClientViewModal 
            client={selectedClient} 
            onClose={() => setIsModalOpen(false)} 
        />
      )}
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
/* ========================================================= */
/* CLIENT VIEW MODAL COMPONENT                               */
/* ========================================================= */
function ClientViewModal({ client, onClose }) {
  const [activeTab, setActiveTab] = useState("Client Info");
  const [selectedBranch, setSelectedBranch] = useState("All");
  
  const tabs = ["Client Info", "Contacts", "Conversation", "Requirement", "Workbench", "Tracker"];
  const branches = ["All", "Delhi HQ", "Mumbai Branch", "Bangalore Branch"];

  // --- MOCK DATA FOR TABS ---
  const mockData = {
    clientInfo: [{ onboardDate: client.date, companyName: client.company, hqLocation: "Gurgaon, Haryana", clientType: "Category A", industry: "IT Services", contractLink: "https://drive.google.com/contract", tnc: "Signed", kycStatus: "Verified", kycDoc: "GST_Pan.pdf", gstDetails: "06AAACC1234D1Z5", emailSs: "Attached" }],
    contacts: [{ name: client.contactPerson, email: client.email, phone: client.phone, designation: "HR Head", department: "Human Resources", primaryContact: "Yes", handling: "Recruitment & Onboarding" }, { name: "Aditi Rao", email: "a.rao@technova.in", phone: "+91 9988776655", designation: "Talent Acquisition", department: "HR", primaryContact: "No", handling: "Tech Hiring" }],
    conversations: [{ date: "05 Apr 2026", mode: "Zoom Meeting", contactName: client.contactPerson, contactEmail: client.email, contactPhone: client.phone, discussion: "Discussed requirements for Frontend Devs. Need 5 heads.", nextFollowup: "10 Apr 2026" }],
    requirements: [{ title: "Sr. React Developer", date: "04 Apr 2026", openings: 5, priority: "High", status: "Active", timeline: "30 Days", jdView: "View JD PDF" }],
    workbench: [{ 
        date: "2026-03-02", slot: "09:30 AM - 01:00 PM", tl: "Vikram Singh", rc: "Pooja",
        profile: "Telecouncellor", pkg: "30k", req: "350",
        cvs: "70", advSti: "15", conversion: "2", asset: "5", tRcvd: "2", tShared: "1",
        rcNote: "Good response today. Focused mostly on Naukri database.", tlNote: "Asked Pooja to focus only on immediate joiners."
    }],
    tracker: [{ profile: "Frontend Developer", shareDate: "06 Apr 2026", shared: 15, shortlisted: 5, interviewed: 3, selected: 1, joining: "Pending" }]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="bg-[#103c7f] text-white px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Building2 size={20} /> {client.company}
                    </h2>
                    <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-1">Detailed CRM Report</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Sub-Header: Branch Filter & Tabs */}
            <div className="bg-slate-50 border-b border-gray-200 px-6 pt-4 shrink-0">
                {/* Branch Selection */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Branch:</span>
                    <select 
                        className="bg-white border border-gray-200 text-xs font-bold text-[#103c7f] rounded-lg px-3 py-1.5 outline-none shadow-sm cursor-pointer"
                        value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 overflow-x-auto custom-scrollbar">
                    {tabs.map(tab => (
                        <button 
                            key={tab} onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === tab ? "text-[#103c7f] border-b-2 border-[#103c7f]" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modal Content / Tables */}
            <div className="flex-1 overflow-auto bg-slate-100 p-6 custom-scrollbar">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                            
                           {/* --- 1. CLIENT INFO (TWO-COLUMN LAYOUT) --- */}
                            {activeTab === "Client Info" && (
                                <tbody className="divide-y divide-gray-100">
                                    <tr>
                                        <td colSpan="100%" className="p-0">
                                            <div className="max-w-4xl mx-auto py-2">
                                                {mockData.clientInfo.map((row, i) => (
                                                    <table key={i} className="w-full text-left border-collapse text-xs md:text-sm">
                                                        <tbody className="divide-y divide-gray-100">
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">Onboard Date</th>
                                                                <td className="py-3.5 px-6 font-semibold text-slate-700">{row.onboardDate}</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">Company Name</th>
                                                                <td className="py-3.5 px-6 font-black text-slate-800">{row.companyName}</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">HQ Location</th>
                                                                <td className="py-3.5 px-6 font-semibold text-slate-700">{row.hqLocation}</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">Client Type</th>
                                                                <td className="py-3.5 px-6 font-black text-orange-600">{row.clientType}</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">Industry</th>
                                                                <td className="py-3.5 px-6 font-semibold text-slate-700">{row.industry}</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">Contract Link</th>
                                                                <td className="py-3.5 px-6 text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1.5 font-bold hover:underline">
                                                                    <ExternalLink size={14}/> View Contract
                                                                </td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">T&C</th>
                                                                <td className="py-3.5 px-6 font-semibold text-slate-700">{row.tnc}</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">KYC Status</th>
                                                                <td className="py-3.5 px-6">
                                                                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest">{row.kycStatus}</span>
                                                                </td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">KYC Doc</th>
                                                                <td className="py-3.5 px-6 text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1.5 font-bold hover:underline">
                                                                    <Download size={14}/> {row.kycDoc}
                                                                </td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">GST Details</th>
                                                                <td className="py-3.5 px-6 font-semibold text-slate-700">{row.gstDetails}</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">Email SS</th>
                                                                <td className="py-3.5 px-6 text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1.5 font-bold hover:underline">
                                                                    <ExternalLink size={14}/> View Attachment
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            )}

                            {/* --- 2. CONTACTS TABLE --- */}
                            {activeTab === "Contacts" && (
                                <>
                                    <thead className="bg-slate-50 border-b border-gray-200">
                                        <tr>
                                            {["Name", "Email", "Phone Number", "Designation", "Department", "Primary Contact", "What they handle?"].map(h => (
                                                <th key={h} className="px-4 py-3 text-[10px] uppercase font-black text-gray-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mockData.contacts.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-black text-slate-800">{row.name}</td>
                                                <td className="px-4 py-3 font-bold text-gray-500">{row.email}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600">{row.phone}</td>
                                                <td className="px-4 py-3 font-bold text-[#103c7f]">{row.designation}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600">{row.department}</td>
                                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.primaryContact === 'Yes' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{row.primaryContact}</span></td>
                                                <td className="px-4 py-3 font-bold text-gray-500">{row.handling}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}

                            {/* --- 3. CONVERSATION TABLE --- */}
                            {activeTab === "Conversation" && (
                                <>
                                    <thead className="bg-slate-50 border-b border-gray-200">
                                        <tr>
                                            {["Date", "Mode", "Contact Info", "Discussion", "Next Followup Date"].map(h => (
                                                <th key={h} className="px-4 py-3 text-[10px] uppercase font-black text-gray-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mockData.conversations.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors align-top">
                                                <td className="px-4 py-3 font-bold text-slate-700">{row.date}</td>
                                                <td className="px-4 py-3 font-bold text-orange-600">{row.mode}</td>
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-800">{row.contactName}</p>
                                                    <p className="text-[10px] text-gray-500">{row.contactPhone}</p>
                                                    <p className="text-[10px] text-gray-400">{row.contactEmail}</p>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-slate-600 max-w-sm whitespace-normal">{row.discussion}</td>
                                                <td className="px-4 py-3 font-bold text-emerald-600 flex items-center gap-1 mt-2"><Clock size={12}/>{row.nextFollowup}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}

                            {/* --- 4. REQUIREMENT TABLE --- */}
                            {activeTab === "Requirement" && (
                                <>
                                    <thead className="bg-slate-50 border-b border-gray-200">
                                        <tr>
                                            {["Job Title", "Req Received Date", "No. of Openings", "Hiring Priority", "Status", "Timeline", "JD View"].map(h => (
                                                <th key={h} className="px-4 py-3 text-[10px] uppercase font-black text-gray-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mockData.requirements.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-black text-[#103c7f]">{row.title}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600">{row.date}</td>
                                                <td className="px-4 py-3 text-center font-black text-lg text-slate-700">{row.openings}</td>
                                                <td className="px-4 py-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{row.priority}</span></td>
                                                <td className="px-4 py-3 font-bold text-emerald-600">{row.status}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600">{row.timeline}</td>
                                                <td className="px-4 py-3 text-blue-500 hover:underline cursor-pointer flex items-center gap-1"><FileText size={12}/> View JD</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}

                            {/* --- NEW: WORKBENCH TABLE --- */}
                            {activeTab === "Workbench" && (
                                <>
                                    <thead className="bg-[#103c7f] border-b border-[#0c2f66] text-white">
                                        <tr>
                                            {["Date & Slot", "TL & Recruiter", "Profile & JD", "PKG / REQ", "CVs", "Adv Sti", "Conv.", "Asset", "T. Rcvd", "T. Shared", "RC Notes", "TL Remarks"].map((h, i) => (
                                                <th key={h} className={`px-4 py-3 text-[10px] uppercase font-black tracking-widest ${i >= 4 && i <= 9 ? 'text-center' : 'text-left'} ${h === 'CVs' ? 'bg-blue-500' : ''}`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mockData.workbench.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors align-top">
                                                
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-800 text-xs mb-1">{row.date}</p>
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-orange-500">
                                                        <Clock size={10} /> {row.slot}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[10px] font-bold text-[#103c7f] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">TL: {row.tl}</span>
                                                        <span className="text-[10px] font-bold text-[#103c7f] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">RC: {row.rc}</span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-600 mb-2">{row.profile}</p>
                                                    <button className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 w-max">
                                                        View JD
                                                    </button>
                                                </td>

                                                <td className="px-4 py-3 align-middle">
                                                    <div className="flex items-center gap-2 font-black">
                                                        <span className="text-green-600">{row.pkg}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="text-slate-600">{row.req}</span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-center align-middle font-black text-[#103c7f] text-sm bg-blue-50/30">
                                                    <span className="flex items-center justify-center gap-1">
                                                        {row.cvs} <Eye size={12} className="text-blue-400 opacity-60"/>
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-center align-middle font-black text-purple-600 text-sm">{row.advSti}</td>
                                                <td className="px-4 py-3 text-center align-middle font-black text-emerald-500 text-sm">{row.conversion}</td>
                                                <td className="px-4 py-3 text-center align-middle font-black text-orange-500 text-sm">{row.asset}</td>
                                                <td className="px-4 py-3 text-center align-middle font-black text-slate-600 text-sm">{row.tRcvd}</td>
                                                <td className="px-4 py-3 text-center align-middle font-black text-blue-600 text-sm">{row.tShared}</td>

                                                <td className="px-4 py-3">
                                                    <p className="text-[10px] font-semibold text-slate-500 italic max-w-[150px] leading-snug whitespace-normal">
                                                        "{row.rcNote}"
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <p className="text-[11px] font-bold text-[#103c7f] max-w-[150px] leading-snug whitespace-normal">
                                                        {row.tlNote}
                                                    </p>
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}


{/* --- 5. TRACKER TABLE --- */}
                            {activeTab === "Tracker" && (
                                <>
                                    <thead className="bg-slate-50 border-b border-gray-200">
                                        <tr>
                                            {["Profile", "Tracker Share Date", "Tracker Shared", "Shortlisted", "Interviewed", "Selected", "Joining", "Action"].map(h => (
                                                <th key={h} className="px-4 py-3 text-[10px] uppercase font-black text-gray-400 text-center">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mockData.tracker.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors text-center align-middle">
                                                <td className="px-4 py-3 font-black text-[#103c7f]">{row.profile}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600 ">{row.shareDate}</td>
                                                <td className="px-4 py-3 font-black text-slate-700 bg-slate-50">{row.shared}</td>
                                                <td className="px-4 py-3 font-black text-blue-600 bg-blue-50/50">{row.shortlisted}</td>
                                                <td className="px-4 py-3 font-black text-orange-600 bg-orange-50/50">{row.interviewed}</td>
                                                <td className="px-4 py-3 font-black text-emerald-600 bg-emerald-50/50">{row.selected}</td>
                                                <td className="px-4 py-3 font-bold text-gray-400">{row.joining}</td>
                                                <td className="px-4 py-3">
                                                    <button className="bg-white border border-gray-200 text-[#103c7f] hover:bg-blue-50 hover:border-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-1.5 mx-auto">
                                                        <Eye size={12} /> History View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
}