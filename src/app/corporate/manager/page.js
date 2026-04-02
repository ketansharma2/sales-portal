"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, CheckCircle, MapPin, Target,
  TrendingUp, Calendar, Filter,
  Search, Activity, Phone, Ghost, AlertCircle, Copy,
  UserCheck, Headset, PhoneCall, CalendarDays, Database, Clock,
  PhoneOutgoing, PhoneIncoming, PhoneMissed, Send, FileText, Briefcase, Award, Rocket
} from "lucide-react";

// --- Helper function to build filter URL ---
const buildFilterUrl = (router, fromDate, toDate, isAllData, filters) => {
  const params = new URLSearchParams();
  
  if (!isAllData && fromDate && toDate) {
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'All') {
      if (key === 'status') params.append('status', value);
      if (key === 'subStatus') params.append('subStatus', value);
      if (key === 'franchiseStatus') params.append('franchiseStatus', value);
      if (key === 'startup') params.append('startup', value);
      if (key === 'isSubmitted') params.append('isSubmitted', value);
      if (key === 'cardType') params.append('cardType', value);
    }
  });
  
  const queryString = params.toString();
  router.push(`/corporate/leadgen/details${queryString ? '?' + queryString : ''}`);
};

export default function SalesManagerDashboard() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // --- MANAGER CONTROLS ---
  // Default tab set to LeadGen for Corporate Sector
  const [activeTab, setActiveTab] = useState("LeadGen"); 
  const [selectedAgent, setSelectedAgent] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isAllData, setIsAllData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latestDate, setLatestDate] = useState("");

  const currentMonth = new Date().toLocaleString('default', { month: 'long' }).toUpperCase();

  // Mock Lists for Dropdown
  const fseList = ["Rahul Sharma", "Vikram Singh", "Amit Desai", "Neha Gupta"];
  const leadGenList = ["Pooja", "Sneha", "Khushi", "Amit Kumar"];

  // --- MOCK STATS ---
  const [stats, setStats] = useState({
    global: { totalClients: 1240, totalOnboard: 45, totalVisits: 320, onboardCall: 15, onboardVisit: 30, untouched: 150, noStatus: 42, duplicate: 12 },
    monthly: { visitTarget: 180, individualVisits: 110, onboardMtd: "12/20", avgVisit: 4.5, visitGoal: 200, onboardGoal: 20 },
    projections: { mpLess50: 12, mpGreater50: 8, wpLess50: 20, wpGreater50: 15 },
    dynamicMetrics: { totalVisits: 320, calls: 450, individual: 110, repeat: 210, interested: 45, notInterested: 80, reachedOut: 300, onboard: 12 },
    clientsFSE: [
      { date: "2026-03-02", name: "TechCorp Solutions", agent: "Vikram Singh", status: "Visited", sub: "Follow up tomorrow", color: "bg-blue-100 text-blue-800" },
      { date: "2026-03-02", name: "Urban Money", agent: "Neha Gupta", status: "Onboarded", sub: "Docs pending", color: "bg-emerald-100 text-emerald-800" },
    ],

    clientsLeadGen: [
      { 
        date: "02 Mar 2026", time: "10:30 AM", agent: "Pooja", name: "Frankfin Solutions", 
        contactPerson: "Rahul Verma", phone: "+91 9876543210", email: "rahul@frankfin.in",
        status: "Connected", subStatus: "Meeting Fixed", franchiseStatus: "Not Applicable",
        interaction: "Discussed about new hiring needs.",
        color: "bg-purple-100 text-purple-800" 
      },
      { 
        date: "01 Mar 2026", time: "02:15 PM", agent: "Sneha", name: "MKS Pvt Ltd", 
        contactPerson: "Priya Sharma", phone: "+91 8765432109", email: "hr@mkspvt.com",
        status: "Not Interested", subStatus: "Budget Issue", franchiseStatus: "Discussed",
        interaction: "Currently have an internal team.",
        color: "bg-red-100 text-red-800" 
      },
    ],
    // MOCK KPI DATA FOR LEADGEN TAB
    kpiData: {
      searched: { total: '8,540', startup: '3,200' },
      normal: { leads: '5,340', calls: '1,800' },
      contacts: { total: '4,200', startup: '1,500' },
      calls: { total: '2,140', startup: '850', new: { total: '1,200', startup: '400' }, followup: { total: '940', startup: '450' } },
      picked: { total: '850', startup: '320' },
      notPicked: { total: '1,290', startup: '530' },
      contract: { total: '120', startup: '45' },
      sentToManager: { total: '60', startup: '25' },
      onboarded: { total: '15', startup: '8' },
      interested: { total: '120', startup: '50' },
      masterUnion: { company: '150', profiles: '450', calling: '300' },
      franchise: {
          discussed: { total: '80', startup: '0' },
          formAsk: { total: '40', startup: '0' },
          formShared: { total: '35', startup: '0' },
          accepted: { total: '5', startup: '0' }
      }
    }
  });

  useEffect(() => {
    setMounted(true);
    setLoading(false);
    setLatestDate("2026-03-02");
  }, []);

  const handleFilter = () => {
    setLoading(true);
    console.log(`Filtering for Tab: ${activeTab}, Agent: ${selectedAgent}, From: ${fromDate}, To: ${toDate}`);
    setTimeout(() => setLoading(false), 500); // mock loading
  };

  if (!mounted) return null;

  return (
    <div className="p-2 md:p-4 bg-[#f8fafc] font-['Calibri'] min-h-screen text-slate-800 flex flex-col">
      <div className="max-w-8xl mx-auto w-full space-y-4">
        
        {/* ========================================= */}
        {/* HEADER & TABS */}
        {/* ========================================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-3 px-5 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h1 className="text-xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <UserCheck size={20}/> Sales Manager Overview
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Corporate Sector</p>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                <button 
                    onClick={() => { setActiveTab("LeadGen"); setSelectedAgent("All"); }}
                    className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "LeadGen" ? "bg-white text-[#103c7f] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <Headset size={14} /> LeadGen
                </button>
                <button 
                    onClick={() => { setActiveTab("FSE"); setSelectedAgent("All"); }}
                    className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "FSE" ? "bg-white text-[#103c7f] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <MapPin size={14} /> FSE Team
                </button>
            </div>
        </div>

        {/* ========================================= */}
        {/* GLOBAL MANAGER CONTROL PANEL */}
        {/* ========================================= */}
        <div className="bg-white rounded-2xl p-3 px-4 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#103c7f] shrink-0">
            <h3 className="font-black text-sm uppercase tracking-wide">Filters</h3>
            {latestDate && <span className="text-xs font-bold text-gray-500">(Latest Data: {latestDate})</span>}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">{activeTab === "FSE" ? "FSE:" : "Agent:"}</span>
              <select 
                className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer uppercase"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="All">All {activeTab}</option>
                {(activeTab === "FSE" ? fseList : leadGenList).map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>

            <DateInput label="From" value={fromDate} onChange={setFromDate} />
            <DateInput label="To" value={toDate} onChange={setToDate} />
          </div>
        </div>

        {loading ? (
             <div className="flex items-center justify-center py-20">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#103c7f]"></div>
             </div>
        ) : (
            <div className="animate-in fade-in duration-500 space-y-4">
                
               
              {/* ========================================= */}
                {/* TAB 1: LEADGEN CONTENT */}
                {/* ========================================= */}
                {activeTab === "LeadGen" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 space-y-4"> 
                     {/* ROW 1: OVERALL METRICS (MATCHING HIGHLIGHTED STYLE) */}
                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl shadow-sm w-full">
                            <div className="flex items-center gap-2 mb-3">
                                <Database size={16} className="text-indigo-700" />
                                <h2 className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                                    1. Overall Metrics
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                                <KpiCard title="Total Leads" total={stats.kpiData.searched.total} icon={<SearchIcon/>} color="blue" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
                                <KpiCard title="Total Contacts" total={stats.kpiData.contacts.total} icon={<UserCheck size={18}/>} color="blue" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'contacts' })} />
                                <KpiCard title="Total Calls" total={stats.kpiData.calls.total} icon={<Phone size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'calls' })} />
                                <KpiCard title="New Calls" total={stats.kpiData.calls.new.total} icon={<PhoneOutgoing size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'new_calls' })} />
                                <KpiCard title="Followup Calls" total={stats.kpiData.calls.followup.total} icon={<PhoneIncoming size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'followup_calls' })} />
                                <KpiCard title="Picked" total={stats.kpiData.picked.total} icon={<CheckCircle size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'picked' })} />
                                <KpiCard title="Not Picked" total={stats.kpiData.notPicked.total} icon={<PhoneMissed size={18}/>} color="red" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'not_picked' })} />
                                <KpiCard title="Contract Share" total={stats.kpiData.contract.total} icon={<FileText size={18}/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'contract' })} />
                                <KpiCard title="Interested" total={stats.kpiData.interested.total} icon={<TrendingUp size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'interested' })} />
                                <KpiCard title="Sent to Manager" total={stats.kpiData.sentToManager.total} icon={<Send size={18}/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'sent_to_manager' })} />
                                <KpiCard title="Total Onboard" total={stats.kpiData.onboarded.total} icon={<Briefcase size={18}/>} color="teal" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'onboard' })} />
                            </div>
                        </div>
                        {/* ROW 2 & 3: NORMAL AND STARTUP CLIENTS (HIGHLIGHTED) */}
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl shadow-sm w-full">
                            <div className="flex flex-col lg:flex-row gap-6">
                                
                                {/* 2. Normal Clients */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserCheck size={16} className="text-[#103c7f]" />
                                        <h2 className="text-xs font-black text-[#103c7f] uppercase tracking-widest">
                                            2. Normal Clients
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <KpiCard title="Leads" total={stats.kpiData.normal.leads} icon={<Search size={18} />} color="blue" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'No' })} />
                                        <KpiCard title="Calls" total={stats.kpiData.normal.calls} icon={<Phone size={18} />} color="blue" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'No', cardType: 'normal_calls' })} />
                                    </div>
                                </div>

                                <div className="hidden lg:block w-px bg-blue-200/50"></div>

                                {/* 3. Startup Clients */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Rocket size={16} className="text-orange-600" />
                                        <h2 className="text-xs font-black text-orange-600 uppercase tracking-widest">
                                            3. Startup Clients
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <KpiCard title="Leads" total={stats.kpiData.searched.startup} icon={<Search size={18} />} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Yes' })} />
                                        <KpiCard title="Calls" total={stats.kpiData.calls.startup} icon={<Phone size={18} />} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Yes' })} />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* ROW 4 & 5: MASTER UNION AND FRANCHISE (HIGHLIGHTED - ONE ROW) */}
                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl shadow-sm w-full">
                            {/* Changed to xl:flex-row so standard cards have enough space on smaller laptops */}
                            <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                                
                                {/* 4. Master Union Clients */}
                                <div className="flex-[3]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Briefcase size={16} className="text-purple-700" />
                                        <h2 className="text-xs font-black text-purple-700 uppercase tracking-widest">
                                            4. Master Union
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <KpiCard title="Leads" total={stats.kpiData.masterUnion.company} icon={<Briefcase size={18} />} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Master Union' })} />
                                        <KpiCard title="Profiles" total={stats.kpiData.masterUnion.profiles} icon={<UserCheck size={18} />} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Master Union' })} />
                                        <KpiCard title="Calls" total={stats.kpiData.masterUnion.calling} icon={<Phone size={18} />} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Master Union', cardType: 'master_union_calls' })} />
                                    </div>
                                </div>

                                {/* Vertical Divider */}
                                <div className="hidden xl:block w-px bg-indigo-200/50"></div>

                                {/* 5. Franchise Pipeline */}
                                <div className="flex-[4]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Award size={16} className="text-emerald-700" />
                                        <h2 className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                                            5. Franchise Pipeline
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <KpiCard title="Discussed" total={stats.kpiData.franchise.discussed.total} icon={<Phone size={18} />} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'franchise_discussed' })} />
                                        <KpiCard title="Form Ask" total={stats.kpiData.franchise.formAsk.total} icon={<FileText size={18} />} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'franchise_form_ask' })} />
                                        <KpiCard title="Shared" total={stats.kpiData.franchise.formShared.total} icon={<Send size={18} />} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'franchise_form_shared' })} />
                                        <KpiCard title="Accepted" total={stats.kpiData.franchise.accepted.total} icon={<CheckCircle size={18} />} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { cardType: 'franchise_accepted' })} />
                                    </div>
                                </div>

                            </div>
                        </div>


                        {/* --- LEADGEN CONVERSATION LOG TABLE --- */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[350px]"> 
                            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-black text-[11px] text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14}/> LeadGen Conversation Log
                                </h3>
                                {latestDate && (
                                    <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">
                                        {latestDate}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                    <thead className="sticky top-0 z-20 shadow-sm bg-white">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">LeadGen & Date</th>
                                            <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Company</th>
                                            <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Contact Details</th>
                                            <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Interaction</th>
                                            <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Status / Substatus</th>
                                            <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Franchise Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stats.clientsLeadGen?.map((client, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-all group align-top">
                                                
                                                {/* Agent & Date */}
                                                <td className="px-6 py-3">
                                                    <p className="font-black text-[#103c7f] text-xs">{selectedAgent === "All" ? client.agent : selectedAgent}</p>
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-gray-400">
                                                        <Calendar size={10} /> {client.date} 
                                                        <Clock size={10} className="ml-1" /> {client.time}
                                                    </div>
                                                </td>

                                                {/* Company Name */}
                                                <td className="px-6 py-3">
                                                    <p className="font-bold text-slate-800">{client.name}</p>
                                                </td>

                                                {/* Contact Details (Combined) */}
                                                <td className="px-6 py-3">
                                                    <p className="font-bold text-slate-700 text-xs">{client.contactPerson}</p>
                                                    <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{client.phone}</p>
                                                    <p className="text-[10px] font-semibold text-gray-400">{client.email}</p>
                                                </td>

                                                {/* Interaction */}
                                                <td className="px-6 py-3">
                                                    <p className="text-[11px] font-semibold text-slate-600 max-w-[200px] truncate whitespace-normal leading-snug" title={client.interaction}>
                                                        {client.interaction}
                                                    </p>
                                                </td>

                                                {/* Status & Substatus */}
                                                <td className="px-6 py-3 text-center">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${client.color}`}>
                                                            {client.status}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                            {client.subStatus}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Franchise Status */}
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${client.franchiseStatus === 'Not Applicable' ? 'text-gray-400 bg-gray-50' : 'text-emerald-700 bg-emerald-50'}`}>
                                                        {client.franchiseStatus}
                                                    </span>
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}

              
               {/* ========================================= */}
                {/* TAB 2: FSE CONTENT */}
                {/* ========================================= */}
                {activeTab === "FSE" && (
                    <div className="animate-in fade-in duration-500">
                        {/* --- NO FSE MESSAGE --- */}
                        <div className="flex items-center justify-center py-16 opacity-50 mt-4">
                            <p className="text-sm font-semibold text-slate-400 tracking-wide flex items-center gap-2">
                                <MapPin size={16} strokeWidth={1.5} />
                                No FSE in Corporate
                            </p>
                        </div>
                    </div>
                )}

            </div>
        )}
      </div>
    </div>
  );
}
/* --- NEW COMPONENT FOR 7-CARD ROW --- */
function UltraCompactCard({ label, value, icon, color }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm flex flex-col justify-between h-full w-full hover:shadow-md transition-all">
            <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${color}`}>
                    {icon}
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider truncate leading-tight">
                    {label}
                </span>
            </div>
            <div className="pl-1">
                <span className="text-lg font-black text-slate-800 leading-none tracking-tight">{value}</span>
            </div>
        </div>
    );
}
/* --- REUSABLE SUB-COMPONENTS --- */
function CompactMonthCard({ label, value, icon, trend, progress, target }) {
  const isPositive = trend && trend.includes("+");
  const trendColor = isPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50";
  const trendIcon = isPositive ? "↑" : "↓";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex flex-col justify-between h-full w-full relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-0.5">
        <div className="flex items-center gap-1.5">
           <div className="w-6 h-6 rounded-md bg-[#103c7f]/10 flex items-center justify-center text-[#103c7f] shrink-0 group-hover:bg-[#103c7f] group-hover:text-white transition-colors">
             {React.cloneElement(icon, { size: 14 })}
           </div>
           <div className="flex flex-col min-w-0">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{label}</span>
             {target != null && (
               <span className="text-[9px] font-semibold text-gray-300 leading-none mt-0.5">Goal: {target}</span>
             )}
           </div>
        </div>
        {trend && (
          <span className={`px-1 py-0.5 rounded text-[8px] font-black ${trendColor} flex items-center leading-none`}>
            {trendIcon} {trend}
          </span>
        )}
      </div>
      
      <div className="mt-0.5 pl-1">
        <span className="text-xl font-black text-[#103c7f] leading-none tracking-tight">{value}</span>
      </div>
      
      {progress !== undefined && (
        <div className="mt-1.5 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
          <div className="h-full bg-[#103c7f] rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
}

function ProjItem({ label, value }) {
  return (
    <button className="flex justify-between items-center border-b border-white/10 py-1 w-full gap-2 hover:bg-white/10 transition-colors cursor-pointer">
      <span className="text-[12px] font-bold text-[#a1db40] uppercase tracking-tighter shrink-0">{label}</span>
      <span className="text-[12px] font-black text-white italic shrink-0">{value}</span>
    </button>
  );
}

function DynamicCard({ label, value, color }) {
  return (
    <div className={`bg-white p-2 rounded-xl border border-gray-100 border-l-4 ${color} shadow-sm text-center`}>
      <p className="text-[12px] font-black text-gray-400 uppercase mb-1 truncate">{label}</p>
      <p className="text-lg font-black text-[#103c7f]">{value}</p>
    </div>
  );
}

function DateInput({ label, value, onChange }) {
    return (
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors cursor-pointer group">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-[#103c7f] transition-colors">{label}</span>
            <input 
              type="date" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer uppercase" 
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
          className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full cursor-pointer"
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

function SearchIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    )
}