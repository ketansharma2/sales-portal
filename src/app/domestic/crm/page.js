"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Briefcase, FileText, CheckCircle,
  Phone, Mail, Calendar, TrendingUp,
  Share2, UserCheck, Award, MessageSquare,
  Clock, ArrowUpRight, Filter, Search
} from "lucide-react";

export default function CRMDashboard() {

  // --- STATE FOR DATE FILTER ---
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0], // Default Today
    to: new Date().toISOString().split('T')[0]    // Default Today
  });

  // --- STATE FOR TOTAL ONBOARDED CLIENTS ---
  const [totalOnboarded, setTotalOnboarded] = useState(0);
  const [acknowledged, setAcknowledged] = useState(0);
  const [callsMade, setCallsMade] = useState(0);
  const [followUps, setFollowUps] = useState([]);
  const [conversations, setConversations] = useState([]);
  
  // --- STATE FOR TOOLTIP ---
  const [hoveredDiscussion, setHoveredDiscussion] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // --- FETCH TOTAL ONBOARDED CLIENTS ---
  useEffect(() => {
    const fetchTotalOnboarded = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch('/api/domestic/crm/onboarded', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTotalOnboarded(data.data?.totalOnboarded || 0);
        }
      } catch (error) {
        console.error('Error fetching total onboarded:', error);
      }
    };

    const fetchAcknowledged = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch('/api/domestic/crm/acknowledged', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAcknowledged(data.data?.acknowledged || 0);
        }
      } catch (error) {
        console.error('Error fetching acknowledged:', error);
      }
    };

    fetchTotalOnboarded();
    fetchAcknowledged();
  }, []);

  // --- FETCH CALLS MADE (DIRECTLY ON DATE CHANGE) ---
  useEffect(() => {
    const fetchCallsMade = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch(`/api/domestic/crm/calls-made?fromDate=${dateRange.from}&toDate=${dateRange.to}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCallsMade(data.data?.callsMade || 0);
        }
      } catch (error) {
        console.error('Error fetching calls made:', error);
      }
    };

    fetchCallsMade();
  }, [dateRange.from, dateRange.to]);

  // --- FETCH CONVERSATIONS (DIRECTLY ON DATE CHANGE) ---
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch(`/api/domestic/crm/conversations?fromDate=${dateRange.from}&toDate=${dateRange.to}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, [dateRange.from, dateRange.to]);

  // --- FETCH TODAY'S FOLLOW-UPS ---
  useEffect(() => {
    const fetchTodayFollowUps = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch('/api/domestic/crm/today-followups', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFollowUps(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching today followups:', error);
      }
    };

    fetchTodayFollowUps();
  }, []);

  // --- MOCK DATA: ROW 1 (LIFETIME TOTALS - Always Visible) ---
  const totalStats = [
    { label: "Total Onboarded Clients", value: totalOnboarded, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Acknowledged", value: acknowledged, icon: Mail, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Reqs", value: "-", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Package", value: "-", icon: Award, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Trackers Shared", value: "-", icon: Share2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Interviews", value: "-", icon: Phone, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Total Selected", value: "-", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Joined", value: "-", icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  // --- MOCK DATA: ROW 2 (FILTERED ACTIVITY) ---
  // This data represents metrics ONLY for the Selected Date Range
  const filteredStats = [
    { label: "Calls Made", value: callsMade, icon: Phone },
    { label: "Reqs Worked", value: "-", icon: Briefcase },
    { label: "Trackers Shared", value: "-", icon: Share2 },
    { label: "Interviews", value: "-", icon: Users },
    { label: "Selected", value: "-", icon: CheckCircle },
    { label: "Joined", value: "-", icon: UserCheck },
  ];

  // --- TABLE DATA (FROM API) ---
  const tableData = conversations.map((conv) => ({
    id: conv.conversation_id,
    dateMode: `${new Date(conv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${conv.mode}`,
    company: conv.company_name,
    contact: conv.contact_name,
    email: conv.email,
    phone: conv.phone,
    conversation: conv.discussion
  }));

  // --- MOCK DATA: RIGHT SIDEBAR ---
  const followUpList = followUps.length > 0
    ? followUps.map((item, i) => ({
        id: i,
        company: item.company_name,
        contact: item.contact_name,
        lastConvo: item.discussion,
        time: "-",
        type: "Call"
      }))
    : Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        company: "-",
        contact: "-",
        lastConvo: "-",
        time: "-",
        type: i % 3 === 0 ? "Call" : "Email"
      }));

  return (
    <div className="flex h-screen bg-[#f8fafc] font-['Calibri'] text-slate-800 overflow-hidden">
      
      {/* ================= LEFT SECTION (MAIN DASHBOARD - 75% Width) ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-200">
        
        {/* HEADER WITH DATE FILTERS */}
        <div className="bg-[#103c7f] px-6 py-4 border-b border-[#0d316a] shadow-sm flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase italic leading-none">
              CRM Analytics
            </h1>
            <p className="text-xs font-bold text-blue-200 mt-1">Performance Overview</p>
          </div>

          {/* DATE FILTER CONTROLS */}
          <div className="flex items-center gap-3 bg-white/10 p-1.5 rounded-lg border border-white/10">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-200 uppercase px-2">From</span>
                <input 
                  type="date" 
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="bg-[#0d316a] text-white text-xs font-bold px-2 py-1.5 rounded border border-blue-800 outline-none focus:border-blue-400"
                />
             </div>
             <div className="w-px h-6 bg-blue-800"></div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-200 uppercase px-2">To</span>
                <input 
                  type="date" 
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="bg-[#0d316a] text-white text-xs font-bold px-2 py-1.5 rounded border border-blue-800 outline-none focus:border-blue-400"
                />
             </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-6 bg-slate-50">
          
          {/* --- ROW 1: DATABASE OVERVIEW (LIFETIME) --- */}
          <div className="shrink-0">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase size={14}/> Database Overview (Lifetime)
            </h3>
            <div className="grid grid-cols-8 gap-3">
              {totalStats.map((stat, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-all">
                  <div className={`p-1.5 rounded-full ${stat.bg} mb-1.5`}>
                    <stat.icon size={14} className={stat.color} />
                  </div>
                  <h4 className="text-lg font-black text-slate-700 leading-none">{stat.value}</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* --- ROW 2: FILTERED ACTIVITY REPORT (MERGED MONTHLY/DAILY) --- */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={14}/> Activity Report
                </h3>
                <span className="text-[10px] font-bold text-[#103c7f] bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                    {dateRange.from} <span className="mx-1 text-gray-400">to</span> {dateRange.to}
                </span>
            </div>
            
            <div className="grid grid-cols-7 gap-3">
              {filteredStats.map((stat, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-[#103c7f] transition-all cursor-default">
                   {/* Top Accent Line */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-[#103c7f]"></div>
                   
                   <div className="mb-1 text-blue-300 group-hover:text-[#103c7f] transition-colors">
                      <stat.icon size={14} />
                   </div>
                   <h4 className="text-xl font-black text-[#103c7f] leading-none mt-1">{stat.value}</h4>
                   <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* --- ROW 3: DETAILED TABLE --- */}
          <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
               <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14}/> Client Data ({dateRange.from} - {dateRange.to})
              </h3>
              
            </div>
            
            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse relative">
                  <thead className="bg-white text-[10px] font-black text-gray-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 bg-gray-50/95 backdrop-blur">Date & Mode</th>
                      <th className="px-4 py-3 bg-gray-50/95 backdrop-blur">Company Name</th>
                      <th className="px-4 py-3 bg-gray-50/95 backdrop-blur">Contact Info</th>
                      <th className="px-4 py-3 bg-gray-50/95 backdrop-blur">Conversation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                    {tableData.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#103c7f]">{row.dateMode.split(' - ')[0]}</span>
                            <span className="text-[10px] text-gray-500">{row.dateMode.split(' - ')[1]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#103c7f]">{row.company}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-gray-800">{row.contact}</span>
                            <span className="text-[10px] text-gray-500">{row.email}</span>
                            <span className="text-[10px] text-gray-500">{row.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="bg-gray-50 p-2 rounded-lg border border-gray-100 cursor-pointer relative"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltipPosition({ x: rect.left, y: rect.bottom + 8 });
                              setHoveredDiscussion(row.conversation);
                            }}
                            onMouseLeave={() => setHoveredDiscussion(null)}
                          >
                            <p className="text-[10px] text-gray-600 italic line-clamp-2">{row.conversation}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>

        </div>
      </div>

      {/* ================= RIGHT SECTION (FOLLOW-UPS SIDEBAR - 25% Width) ================= */}
      <div className="bg-white flex flex-col h-full shadow-xl z-10 w-72 shrink-0 border-l border-gray-200">
        
        {/* HEADER */}
        <div className="bg-white px-5 py-4 border-b border-gray-200 flex justify-between items-center shrink-0 h-[76px]">
          <div>
            <h2 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} /> Follow-ups
            </h2>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">
            {followUps.length} Pending
          </span>
        </div>

        {/* SCROLLABLE LIST */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-gray-50/50">
          {followUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare size={32} className="opacity-20 mb-2"/>
              <p className="text-sm font-bold">No followups for today</p>
            </div>
          ) : (
            followUpList.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
                
                <div className="mb-2">
                  <h4 className="text-xs font-black text-gray-800 group-hover:text-[#103c7f] transition-colors line-clamp-1 leading-tight">
                    {item.company}
                  </h4>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-gray-600 truncate">{item.contact}</span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <p className="text-[9px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <MessageSquare size={10} className="text-gray-300"/> Last Discussion
                  </p>
                  <p className="text-[10px] text-gray-600 font-medium italic line-clamp-3 leading-relaxed">
                    "{item.lastConvo}"
                  </p>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
      
      {/* DISCUSSION TOOLTIP */}
      {hoveredDiscussion && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-md"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={12} className="text-[#103c7f]" />
            <span className="text-[10px] font-bold text-gray-500 uppercase">Full Discussion</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{hoveredDiscussion}</p>
        </div>
      )}
    </div>
  );
}
