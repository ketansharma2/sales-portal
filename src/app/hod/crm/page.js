"use client";
import React, { useState, useEffect } from "react";
import {
  Building2, Users, Phone, FileText, CheckCircle,
  MapPin, Calendar, Filter, Search, Eye, Activity,BarChart3, UploadCloud,
  Briefcase, MessageSquare, UserCheck, Share2, CheckSquare , X,ExternalLink,Download , Clock ,
} from "lucide-react";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function AdminCRMDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [clients, setClients] = useState([]);
  const [crmList, setCrmList] = useState([]);

  // --- FILTERS STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [crmFilter, setCrmFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // --- ADD THIS MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);

  const fetchCrmList = async (sector) => {
    try {
      const query = supabase
        .from('users')
        .select('user_id, name, sector')
        .contains('role', ['CRM'])

      if (sector !== 'All') {
        query.eq('sector', sector)
      }
    //   console.log('CRM List Query:', query.toSQL())
      const { data: crmUsers } = await query
      setCrmList(crmUsers?.map(u => ({ id: u.user_id, name: u.name })) || [])
    } catch (error) {
      console.error('Error fetching CRM list:', error)
    }
  };

  const fetchClients = async () => {
    try {
     const session = JSON.parse(localStorage.getItem('session') || '{}');
       
      if (!session) return
      console.log('Fetching clients with filters:', { sectorFilter, crmFilter, searchQuery, fromDate, toDate });
      const params = new URLSearchParams()
      if (sectorFilter !== 'All') params.append('sector', sectorFilter)
      if (crmFilter !== 'All') params.append('crm', crmFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      const response = await fetch(`/api/admin/crm/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setClients(result.data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  };

  const fetchData = async () => {
    try {
      // Fetch stats
      await fetchStats(sectorFilter)

      // Fetch clients
      await fetchClients()

      // Fetch CRM list based on current sector
      await fetchCrmList(sectorFilter)

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false);
    }
  };

  const handleViewClick = async (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
    setClientDetails(null); // Reset while loading
    // Fetch client details
    try {
     const session = JSON.parse(localStorage.getItem('session') || '{}');
        if (!session) {
        console.error('No session found')
        return
      }
        console.log('Fetching details for client:', client);
      const response = await fetch(`/api/admin/crm/client/${client.id}?sector=${client.sector}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setClientDetails(result.data)
      } else {
        console.error('Failed to fetch client details:', result.error)
      }
    } catch (error) {
      console.error('Error fetching client details:', error)
    }
  };

  useEffect(() => {
    setMounted(true);
     fetchClients()

    fetchData();
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchClients();
      fetchCrmList(sectorFilter);
      fetchStats(sectorFilter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectorFilter, crmFilter, searchQuery, fromDate, toDate, mounted]);

  const fetchStats = async (sector) => {
    try {
     const session = JSON.parse(localStorage.getItem('session') || '{}');
      if (!session) return

      const params = new URLSearchParams()
      params.append('sector', sector)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      const response = await fetch(`/api/admin/crm/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  };

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
                    <Briefcase size={20}/> Clients Overview
                </h1>
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
                    <option key={crm.id} value={crm.id}>{crm.name}</option>
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
                            CRM Client Metrics
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <KpiCard title="Client Onboard" total={stats.onboards || 0} icon={<Briefcase size={18} />} color="blue" />
                        <KpiCard title="Active Clients" total={stats.totalActiveClients || 0} icon={<UserCheck size={18} />}   color="green"/>
                         <KpiCard title="Branches" total={stats.branches || 0} icon={<Building2 size={18} />} color="purple" />
                         <KpiCard title="Client Contacts" total={stats.contacts || 0} icon={<Phone size={18} />} color="teal" />
                         <KpiCard title="Client Calling" total={stats.conversations || 0} icon={<MessageSquare size={18} />} color="orange" />                 
                         <KpiCard title="Unique Profiles" total={stats.uniqueProfiles || 0} icon={<UserCheck size={18} />} color="blue" />
                         <KpiCard title="No. of Positions" total={stats.requirements || 0} icon={<FileText size={18} />} color="purple" />
                         <KpiCard title="Tracker Shared To Clients" total={stats.trackerShared || 0} icon={<Share2 size={18} />} color="teal" />
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
                                 {clients.map((client, idx) => (
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
                                {clients.length === 0 && (
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
            clientDetails={clientDetails}
            onClose={() => { setIsModalOpen(false); setClientDetails(null); }}
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
function ClientViewModal({ client, onClose, clientDetails }) {
  const [activeTab, setActiveTab] = useState("Client Info");
  const [selectedBranch, setSelectedBranch] = useState("All");
 const [isPopupOpen, setIsPopupOpen] = useState(false);
 const [isJdViewModalOpen, setIsJdViewModalOpen] = useState(false);
const [currentJdView, setCurrentJdView] = useState(null);
const [popupContent, setPopupContent] = useState({ type: '', url: '', title: '' });
  const tabs = ["Client Info", "Contacts", "Conversation", "Requirement",  "Tracker"];

  const branches = clientDetails?.branches?.map(b => b.branch_name) || []
  const allBranches = ["All", ...branches]
const handleJdView = (requirement) => {
  setCurrentJdView(requirement);
  setIsJdViewModalOpen(true);
};
  // Use fetched data
  const mockData = clientDetails || {
    clientInfo: [{}],
    contacts: [],
    conversations: [],
    requirements: [],
    workbench: [],
    tracker: []
  };

 const handleLinkClick = (url, type, title) => {
  // Google Docs Viewer for .docx files
  if (type === 'CV View' && url) {
    const viewerUrl = `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`;
    setPopupContent({ url: viewerUrl, type, title });
  } else if (url && (url.includes('.pdf') || type === 'contract' || type === 'kyc')) {
    setPopupContent({ url, type, title });
  } else {
    setPopupContent({ url, type, title });
  }
  setIsPopupOpen(true);
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
                                                                    <button 
    onClick={() => handleLinkClick(row.contractLink, 'contract', 'Contract Document')}
    className="text-blue-500 hover:text-blue-700 flex items-center gap-1.5 font-bold hover:underline"
  >
    <ExternalLink size={14}/> View Contract
  </button>
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
                                                                    <button 
    onClick={() => handleLinkClick(row.kycDoc, 'kyc', 'KYC Document')}
    className="text-blue-500 hover:text-blue-700 flex items-center gap-1.5 font-bold hover:underline"
  >
     <ExternalLink size={14}/>{row.kycDoc}
  </button>
                                                                </td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">GST Details</th>
                                                                <td className="py-3.5 px-6 font-semibold text-slate-700">{row.gstDetails}</td>
                                                            </tr>
                                                            <tr className="hover:bg-slate-50 transition-colors">
                                                                <th className="py-3.5 px-6 text-[#103c7f] font-bold w-1/3 md:w-1/4">Email SS</th>
                                                                <td className="py-3.5 px-6 text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1.5 font-bold hover:underline">
<button 
    onClick={() => handleLinkClick(row.emailSs, 'email', 'Email SS')}
    className="text-blue-500 hover:text-blue-700 flex items-center gap-1.5 font-bold hover:underline"
  >
    <ExternalLink size={14}/> {row.emailSs}
  </button> View Attachment
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
                                                <td className="px-4 py-3 font-bold text-slate-600">{row.dept}</td>
                                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.is_primary === 'Yes' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{row.is_primary}</span></td>
                                                <td className="px-4 py-3 font-bold text-gray-500">{row.handles}</td>
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
                                                    <p className="font-bold text-slate-800">{row.contact_name}</p>
                                                    <p className="text-[10px] text-gray-500">{row.contactPhone}</p>
                                                    <p className="text-[10px] text-gray-400">{row.contactEmail}</p>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-slate-600 max-w-sm whitespace-normal">{row.discussion}</td>
                                                <td className="px-4 py-3 font-bold text-emerald-600 flex items-center gap-1 mt-2"><Clock size={12}/>{row.next_follow_up}</td>
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
                                                <td className="px-4 py-3 font-black text-[#103c7f]">{row.job_title}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600">{row.date}</td>
                                                <td className="px-4 py-3 text-center font-black text-lg text-slate-700">{row.openings}</td>
                                                <td className="px-4 py-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{row.priority}</span></td>
                                                <td className="px-4 py-3 font-bold text-emerald-600">{row.status}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600">{row.timeline}</td>
                                                <td className="px-4 py-3 text-blue-500 hover:underline cursor-pointer flex items-center gap-1"> <button 
                            onClick={() => handleJdView(row)} 
                            className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                            <FileText size={12}/> View JD
                        </button></td>
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
                                                        {row.rcNote}
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
                                            {["Candidate Name","Profile", "Email Feedback", "Status", "Action"].map(h => (
                                                <th key={h} className="px-4 py-3 text-[10px] uppercase font-black text-gray-400 text-center">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mockData.tracker.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors text-center align-middle">
                                                <td className="px-4 py-3 font-black text-[#103c7f]">{row.name}</td>
                                                <td className="px-4 py-3 font-bold text-slate-600 ">{row.profile}</td>
<td className="px-4 py-3 font-black text-slate-600 max-w-[220px]">
  <div
    className="truncate cursor-pointer"
    title={row.feedback}
  >
    {row.feedback}
  </div>
</td>     

  
  <td className="px-4 py-3 font-bold text-slate-600 ">{row.interview_status || 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    <button  onClick={() => handleLinkClick(row.cv_url, 'CV View', 'CV View')} className="bg-white border border-gray-200 text-[#103c7f] hover:bg-blue-50 hover:border-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-1.5 mx-auto">
                                                        <Eye size={12} /> CV View
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
        {isPopupOpen && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] h-[500px] max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="bg-[#103c7f] text-white px-5 py-3 flex justify-between items-center shrink-0">
        <h3 className="text-xs font-black uppercase tracking-widest">{popupContent.title}</h3>
        <button onClick={() => setIsPopupOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
          <X size={18} />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-5">
        {popupContent.url ? (
          <iframe src={popupContent.url} className="w-full h-full border-0 rounded" title={popupContent.title} />
        ) : (
          <div className="text-center text-gray-500 mt-10">No content available</div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end shrink-0">
        <button onClick={() => setIsPopupOpen(false)} className="bg-[#103c7f] text-white px-4 py-1.5 rounded-lg text-xs font-bold">
          Close
        </button>
      </div>
    </div>
  </div>
)}

{isJdViewModalOpen && currentJdView && (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[10000] p-0 md:p-4">
        <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl">
            
            {/* Header */}
            <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900">
                <div className="flex items-center gap-3">
                    <FileText size={20} />
                    <h3 className="font-bold text-lg uppercase tracking-wide">Job Description</h3>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsJdViewModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition">
                        <X size={20}/>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 custom-scrollbar">
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative">
                    
                    {/* Header Logo */}
                    <div className="mb-10">
                        <img src="/maven-logo.png" alt="Maven Jobs" style={{ width: '220px', height: '70px', objectFit: 'contain' }} />
                    </div>

                    {/* Bordered Container */}
                    <div className="border border-black p-8 min-h-[850px]">
                        
                        {/* Key Value Pairs */}
                        <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                            {currentJdView.job_title && <p><span className="font-bold">JOB TITLE : </span> {currentJdView.job_title}</p>}
                            {currentJdView.location && <p><span className="font-bold">LOCATION : </span> {currentJdView.location}</p>}
                            {currentJdView.experience && <p><span className="font-bold">EXPERIENCE : </span> {currentJdView.experience}</p>}
                            {currentJdView.employment_type && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {currentJdView.employment_type}</p>}
                            {currentJdView.working_days && <p><span className="font-bold">WORKING DAYS : </span> {currentJdView.working_days}</p>}
                            {currentJdView.timings && <p><span className="font-bold">TIMINGS : </span> {currentJdView.timings}</p>}
                            {currentJdView.package_salary && <p><span className="font-bold">PACKAGE : </span> {currentJdView.package_salary}</p>}
                            {currentJdView.tool_requirement && <p><span className="font-bold">TOOL REQUIREMENT : </span> {currentJdView.tool_requirement}</p>}
                        </div>

                        {/* Sections */}
                        <div className="space-y-8 text-[15px]">
                            {currentJdView.summary && (
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{currentJdView.summary}</p></div>
                            )}
                            
                            {currentJdView.rnr && (
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                                    <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                        {currentJdView.rnr.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                    </ul>
                                </div>
                            )}
                            
                            {currentJdView.skills && (
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                                    <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                        {currentJdView.skills.split(',').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                    </ul>
                                </div>
                            )}
                            
                            {currentJdView.preferred_qual && (
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                                    <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                        {currentJdView.preferred_qual.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                    </ul>
                                </div>
                            )}
                            
                            {currentJdView.company_offers && (
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                                    <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                        {currentJdView.company_offers.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                    </ul>
                                </div>
                            )}
                            
                            {currentJdView.contact_details && (
                                <div className="mt-12 pt-6 border-t border-black/20">
                                    <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                    <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{currentJdView.contact_details}</div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

        </div>
    </div>
)}
    </div>
    
  );
}