"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, Briefcase, FileText, CheckCircle,
  Phone, Mail, Calendar, TrendingUp,
  Share2, UserCheck, Award, MessageSquare, XCircle, X,
  Clock, ArrowUpRight, Filter, Search, AlertTriangle
} from "lucide-react";

export default function CRMDashboard() {

  // --- STATE FOR DATE FILTER ---
  const [allDatabaseActive, setAllDatabaseActive] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0], // Default Today
    to: new Date().toISOString().split('T')[0]    // Default Today
  });

  // --- STATE FOR TOTAL ONBOARDED CLIENTS ---
  const [totalOnboarded, setTotalOnboarded] = useState(0);
  const [acknowledged, setAcknowledged] = useState(0);
  const [activeClients, setActiveClients] = useState('-');
  const [nonActiveClients, setNonActiveClients] = useState('-');
  const [expiringClients, setExpiringClients] = useState({ expired: 0, expiringSoon: 0, list: [] });
  const [totalReqs, setTotalReqs] = useState(0);
  const [trackerShared, setTrackerShared] = useState(0);
  const [reqsWorked, setReqsWorked] = useState(0);
  const [pipelineClients, setPipelineClients] = useState(0);
  const [rejectedByClient, setRejectedByClient] = useState(0);
  const [shortlistedClients, setShortlistedClients] = useState(0);
  const [ghostedClients, setGhostedClients] = useState(0);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [totalSelected, setTotalSelected] = useState(0);
  const [totalJoined, setTotalJoined] = useState(0);
  
  

  const [callsMade, setCallsMade] = useState(0);
  const [followUps, setFollowUps] = useState([]);
  const [conversations, setConversations] = useState([]);
  
  // --- STATE FOR TOOLTIP ---
  const [hoveredDiscussion, setHoveredDiscussion] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // --- FETCH ACTIVE & NON-ACTIVE CLIENTS ---
  useEffect(() => {
    const fetchClientCounts = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch('/api/corporate/crm/client-counts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setActiveClients(data.active || 0);
          setNonActiveClients(data.nonActive || 0);
        }
      } catch (error) {
        console.error('Error fetching client counts:', error);
      }
    };

    fetchClientCounts();
  }, []);

  // --- FETCH EXPIRING CLIENTS ---
  useEffect(() => {
    const fetchExpiringClients = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch('/api/corporate/crm/expiring-clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setExpiringClients({
            expired: data.expired || 0,
            expiringSoon: data.expiringSoon || 0,
            list: data.list || []
          });
        }
      } catch (error) {
        console.error('Error fetching expiring clients:', error);
      }
    };

    fetchExpiringClients();
  }, []);

  // --- FETCH TOTAL ONBOARDED CLIENTS ---
  useEffect(() => {
    const fetchTotalOnboarded = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/onboarded?${params.toString()}`, {
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

    fetchTotalOnboarded();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH ACKNOWLEDGED ---
  useEffect(() => {
    const fetchAcknowledged = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/acknowledged?${params.toString()}`, {
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

    fetchAcknowledged();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH PIPELINE ---
  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/pipeline?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPipelineClients(data.data?.pipeline || 0);
        }
      } catch (error) {
        console.error('Error fetching pipeline:', error);
      }
    };

    fetchPipeline();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH REJECTED BY CLIENT ---
  useEffect(() => {
    const fetchRejectedByClient = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/rejected-by-client?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setRejectedByClient(data.data?.rejectedByClient || 0);
        }
      } catch (error) {
        console.error('Error fetching rejected by client:', error);
      }
    };

    fetchRejectedByClient();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH SHORTLISTED ---
  useEffect(() => {
    const fetchShortlisted = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/shortlisted?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setShortlistedClients(data.data?.shortlisted || 0);
        }
      } catch (error) {
        console.error('Error fetching shortlisted:', error);
      }
    };

    fetchShortlisted();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH GHOSTED ---
  useEffect(() => {
    const fetchGhosted = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/ghosted?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setGhostedClients(data.data?.ghosted || 0);
        }
      } catch (error) {
        console.error('Error fetching ghosted:', error);
      }
    };

    fetchGhosted();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH TOTAL INTERVIEWS ---
  useEffect(() => {
    const fetchTotalInterviews = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/total-interviews?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setTotalInterviews(data.data?.totalInterviews || 0);
        }
      } catch (error) {
        console.error('Error fetching total interviews:', error);
      }
    };

    fetchTotalInterviews();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH TOTAL SELECTED ---
  useEffect(() => {
    const fetchTotalSelected = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/total-selected?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setTotalSelected(data.data?.totalSelected || 0);
        }
      } catch (error) {
        console.error('Error fetching total selected:', error);
      }
    };

    fetchTotalSelected();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH TOTAL JOINED ---
  useEffect(() => {
    const fetchTotalJoined = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/total-joined?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setTotalJoined(data.data?.totalJoined || 0);
        }
      } catch (error) {
        console.error('Error fetching total joined:', error);
      }
    };

    fetchTotalJoined();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

// --- FETCH CALLS MADE (DIRECTLY ON DATE CHANGE) ---
  useEffect(() => {
    const fetchCallsMade = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/calls-made?${params.toString()}`, {
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
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  useEffect(() => {
    const fetchTotalReqs = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/total-reqs?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTotalReqs(data.data?.totalReqs || 0);
        }
      } catch (error) {
        console.error('Error fetching total reqs:', error);
      }
    };

fetchTotalReqs();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH TRACKER SHARED ---
  useEffect(() => {
    const fetchTrackerShared = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/tracker-shared?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTrackerShared(data.data?.trackerShared || 0);
        }
      } catch (error) {
        console.error('Error fetching tracker shared:', error);
      }
    };

    fetchTrackerShared();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH REQS WORKED ---
  useEffect(() => {
    const fetchReqsWorked = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const params = new URLSearchParams();
        if (allDatabaseActive) {
          params.set('allDatabase', 'true');
        } else {
          params.set('fromDate', dateRange.from);
          params.set('toDate', dateRange.to);
        }

        const response = await fetch(`/api/corporate/crm/reqs-worked?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setReqsWorked(data.data?.reqsWorked || 0);
        }
      } catch (error) {
        console.error('Error fetching reqs worked:', error);
      }
    };

    fetchReqsWorked();
  }, [dateRange.from, dateRange.to, allDatabaseActive]);

  // --- FETCH CONVERSATIONS (DIRECTLY ON DATE CHANGE) ---
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        if (!token) return;

        const response = await fetch(`/api/corporate/crm/conversations?fromDate=${dateRange.from}&toDate=${dateRange.to}`, {
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

        const response = await fetch('/api/corporate/crm/today-followups', {
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
    { label: "Active Clients", value: activeClients, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Non-Active Clients", value: nonActiveClients, icon: Clock, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Total Reqs Added", value: totalReqs, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Package", value: "-", icon: Award, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Trackers Shared", value: trackerShared, icon: Share2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Reqs Worked", value: reqsWorked, icon: Briefcase, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Calls Made", value: callsMade, icon: Phone, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pipeline", value: pipelineClients, icon: TrendingUp, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Rejected By Client", value: rejectedByClient, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Shortlisted", value: shortlistedClients, icon: CheckCircle, color: "text-lime-600", bg: "bg-lime-50" },
    { label: "Ghosted", value: ghostedClients, icon: MessageSquare, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Total Interviews", value: totalInterviews, icon: Phone, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Total Selected", value: totalSelected, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Joined", value: totalJoined, icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50" },
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
             <button
               onClick={() => setAllDatabaseActive((prev) => !prev)}
               className={`${allDatabaseActive ? 'bg-yellow-300 text-[#103c7f] border-yellow-200 shadow-md' : 'bg-white text-[#103c7f] border-white/80'} text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded hover:bg-blue-50 transition-colors`}
             >
               All Database
             </button>
             <div className="w-px h-6 bg-blue-800"></div>
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
             <span className="text-[10px] font-bold text-[#103c7f] bg-blue-100 px-2 py-0.5 rounded border border-blue-200 ">
                    {dateRange.from} <span className="mx-1 text-gray-400">to</span> {dateRange.to}
                </span>
            {/* <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase size={14}/> Database Overview (Lifetime)
            </h3> */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
              {totalStats.map((stat, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-all mt-2">
                  <div className={`p-1.5 rounded-full ${stat.bg} mb-1.5`}>
                    <stat.icon size={14} className={stat.color} />
                  </div>
                  <h4 className="text-lg font-black text-slate-700 leading-none">{stat.value}</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 leading-tight">{stat.label}</p>
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

      {/* ================= RIGHT SECTION (ACTION CENTER - 25% Width) ================= */}
      <div className="bg-white flex flex-col h-full shadow-xl z-10 w-72 shrink-0 border-l border-gray-200">
        
        {/* HEADER */}
        <div className="bg-white px-5 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} /> Action Center
            </h2>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">
            {followUps.length + expiringClients.list.length} Actions
          </span>
        </div>

        {/* SCROLLABLE LIST - COMBINED FOLLOW-UPS & EXPIRING CLIENTS */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-gray-50/50">
          
          {/* EXPIRING/EXPIRED CLIENTS FIRST */}
          {expiringClients.list.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={10} /> Expiring Contracts ({expiringClients.list.length})
              </h3>
              {expiringClients.list.map((client) => {
                const expiryDate = new Date(client.expiry_date)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isExpired = expiryDate < today
                
                return (
                  <div key={client.client_id} className={`relative bg-white p-3 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    isExpired ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                  }`}>
                    {/* Badge - Top Right */}
                    <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isExpired ? 'Expired' : 'Expiring'}
                    </span>
                    
                    <h4 className="text-xs font-black text-gray-800 line-clamp-1 pr-16 leading-tight">
                      {client.company_name}
                    </h4>
                    <p className={`text-[10px] font-bold mt-1 ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                      {isExpired ? 'Expired: ' : 'Expires: '}{client.expiry_date}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* FOLLOW-UPS */}
          {followUps.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 pt-2">
                <Clock size={10} /> Follow-ups ({followUps.length})
              </h3>
              {followUpList.map((item) => (
                <div key={item.id} className="relative bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
                  {/* Badge - Top Right */}
                  <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Follow-up
                  </span>
                  
                  <div className="mb-2 pr-14">
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
                    <p className="text-[10px] text-gray-600 font-medium italic line-clamp-2 leading-relaxed">
                      "{item.lastConvo}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {followUps.length === 0 && expiringClients.list.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <CheckCircle size={32} className="opacity-20 mb-2"/>
              <p className="text-sm font-bold">All caught up!</p>
            </div>
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
