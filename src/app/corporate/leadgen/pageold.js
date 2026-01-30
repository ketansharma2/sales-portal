"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Database, Phone, CheckCircle, Clock, Calendar,
  ArrowRight, Target, Zap, PhoneOutgoing,
  TrendingUp, Bell, UserCheck
} from "lucide-react";

export default function LeadGenHome() {
  
  // --- STATS DATA ---
  const [stats, setStats] = useState({
    totalDb: 0,
    pickedUp: 0,
    interested: 0,

    // Monthly
    monthlyCallTarget: 0,
    monthlyCallAchieved: 0,
    monthlyIntTarget: 0,
    monthlyIntAchieved: 0,

    // Daily
    dailyCallTarget: 0,
    dailyCallAchieved: 0,
    dailyIntTarget: 0,
    dailyIntAchieved: 0
  });

  const [latestDate, setLatestDate] = useState('Loading...');
  const [latestRawDate, setLatestRawDate] = useState(null);

  const getPercent = (ach, tar) => tar === 0 ? 0 : Math.min(Math.round((ach / tar) * 100), 100);
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const todayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

  // Sidebar Data (Dynamic)
  const [followUps, setFollowUps] = useState({
    today: [],
    tomorrow: []
  });

  useEffect(() => {
    fetchTodayFollowups();
    fetchStats();
  }, []);

  useEffect(() => {
    if (latestRawDate) {
      fetchDailyStats(latestRawDate);
    }
  }, [latestRawDate]);

  const fetchDailyStats = async (date) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      // Fetch daily interactions count
      const dailyInteractionsResponse = await fetch(`/api/corporate/leadgen/daily-interactions-count?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const dailyInteractionsData = await dailyInteractionsResponse.json();

      // Fetch daily interested count
      const dailyInterestedResponse = await fetch(`/api/corporate/leadgen/daily-interested-count?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const dailyInterestedData = await dailyInterestedResponse.json();

      setStats(prev => ({
        ...prev,
        dailyCallAchieved: dailyInteractionsData.success ? dailyInteractionsData.count : 0,
        dailyIntAchieved: dailyInterestedData.success ? dailyInterestedData.count : 0
      }));
    } catch (error) {
      console.error('Failed to fetch daily stats:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      // Fetch leads count
      const leadsResponse = await fetch('/api/corporate/leadgen/leads-count', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const leadsData = await leadsResponse.json();

      // Fetch interactions count
      const interactionsResponse = await fetch('/api/corporate/leadgen/interactions-count', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const interactionsData = await interactionsResponse.json();

      // Fetch interested count
      const interestedResponse = await fetch('/api/corporate/leadgen/interested-count', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const interestedData = await interestedResponse.json();

      // Fetch monthly call target
      const monthlyCallTargetResponse = await fetch('/api/corporate/leadgen/monthly-call-target', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const monthlyCallTargetData = await monthlyCallTargetResponse.json();

      // Fetch monthly interactions count
      const monthlyInteractionsResponse = await fetch('/api/corporate/leadgen/monthly-interactions-count', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const monthlyInteractionsData = await monthlyInteractionsResponse.json();

      // Fetch monthly interested count
      const monthlyInterestedResponse = await fetch('/api/corporate/leadgen/monthly-interested-count', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const monthlyInterestedData = await monthlyInterestedResponse.json();

      // Fetch latest interaction date
      const latestDateResponse = await fetch('/api/corporate/leadgen/latest-interaction-date', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const latestDateData = await latestDateResponse.json();

      setStats(prev => ({
        ...prev,
        totalDb: leadsData.success ? leadsData.count : 0,
        pickedUp: interactionsData.success ? interactionsData.count : 0,
        interested: interestedData.success ? interestedData.count : 0,
        monthlyCallTarget: monthlyCallTargetData.success ? monthlyCallTargetData.target : 0,
        monthlyCallAchieved: monthlyInteractionsData.success ? monthlyInteractionsData.count : 0,
        monthlyIntAchieved: monthlyInterestedData.success ? monthlyInterestedData.count : 0
      }));

      if (latestDateData.success) {
        setLatestDate(latestDateData.latestDate);
        setLatestRawDate(latestDateData.rawDate);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchTodayFollowups = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/leadgen/today-followups', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Format the data to match the expected structure
        const formattedToday = data.data.map((item, index) => ({
          id: index + 1,
          company: item.company,
          time: "Pending", // Since time is not in the API, use placeholder
          status: item.status === 'Interested' ? 'Hot' : item.status === 'Not Interested' ? 'Cold' : 'Warm',
          last_remark: item.remarks
        }));
        setFollowUps(prev => ({ ...prev, today: formattedToday }));
      }
    } catch (error) {
      console.error('Failed to fetch today\'s follow-ups:', error);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-['Calibri'] text-slate-800">
      
      {/* ================= LEFT SECTION (MAIN DASHBOARD - 3 ROWS) ================= */}
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        
        {/* HEADER */}
        <div className="bg-white px-6 py-3 border-b border-gray-200 sticky top-0 z-10 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic">Lead Dashboard</h1>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-8">
          
          {/* ---------------- ROW 1: TOTAL DATABASE OVERVIEW ---------------- */}
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
               <Database size={14} /> Database Overview
            </h4>
            <div className="grid grid-cols-3 gap-5">
              
              {/* Card 1: Total Data */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Database size={60} className="text-blue-900"/></div>
                <div className="z-10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Database</p>
                  <h3 className="text-3xl font-black text-[#103c7f] mt-1">{stats.totalDb.toLocaleString()}</h3>
                </div>
                <div className="z-10 mt-auto">
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md">Total Rows Uploaded</span>
                </div>
              </div>

              {/* Card 2: Picked Up */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><PhoneOutgoing size={60} className="text-purple-900"/></div>
                <div className="z-10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calls Picked</p>
                  <h3 className="text-3xl font-black text-purple-900 mt-1">{stats.pickedUp}</h3>
                </div>
                <div className="z-10 mt-auto flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded-md">
                    {((stats.pickedUp / stats.totalDb) * 100).toFixed(1)}% Coverage
                  </span>
                </div>
              </div>

              {/* Card 3: Interested */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><UserCheck size={60} className="text-emerald-900"/></div>
                <div className="z-10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interested Leads</p>
                  <h3 className="text-3xl font-black text-emerald-600 mt-1">{stats.interested}</h3>
                </div>
                <div className="z-10 mt-auto">
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
                    {((stats.interested / stats.pickedUp) * 100).toFixed(1)}% Conversion
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ---------------- ROW 2: MONTHLY TARGETS (JANUARY) ---------------- */}
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
               <Target size={14} /> Monthly Goals ({currentMonth})
            </h4>
            <div className="grid grid-cols-2 gap-5">
              
              {/* Monthly Calls */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                 {/* Progress Circle (CSS Trick) */}
                 <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                      <circle cx="40" cy="40" r="36" stroke="#4f46e5" strokeWidth="8" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * getPercent(stats.monthlyCallAchieved, stats.monthlyCallTarget)) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-indigo-600">
                      {getPercent(stats.monthlyCallAchieved, stats.monthlyCallTarget)}%
                    </div>
                 </div>
                 
                 <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Call Target</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-3xl font-black text-indigo-900">{stats.monthlyCallAchieved}</h3>
                       {stats.monthlyCallTarget > 0 && <span className="text-xs font-bold text-gray-400">/ {stats.monthlyCallTarget}</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Keep pushing to reach the goal!</p>
                 </div>
              </div>

              {/* Monthly Leads */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                 {/* Progress Circle */}
                 <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                      <circle cx="40" cy="40" r="36" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * getPercent(stats.monthlyIntAchieved, stats.monthlyIntTarget)) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-emerald-600">
                      {getPercent(stats.monthlyIntAchieved, stats.monthlyIntTarget)}%
                    </div>
                 </div>
                 
                 <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly Lead Target</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-3xl font-black text-emerald-900">{stats.monthlyIntAchieved}</h3>
                       {stats.monthlyIntTarget > 0 && <span className="text-xs font-bold text-gray-400">/ {stats.monthlyIntTarget}</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Interested Leads</p>
                 </div>
              </div>

            </div>
          </div>

          {/* ---------------- ROW 3: DAILY / LATEST PERFORMANCE ---------------- */}
          <div>
            <h4 className="text-xs font-black text-orange-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
               <Zap size={14} fill="currentColor" /> Latest Date Performance ({latestDate})
            </h4>
            <div className="grid grid-cols-2 gap-5">
              
              {/* Daily Calls */}
              <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100 relative">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Calls</p>
                       <div className="flex items-baseline gap-1 mt-1">
                          <h3 className="text-4xl font-black text-slate-800">{stats.dailyCallAchieved}</h3>
                          {/* <span className="text-xs font-bold text-gray-400"> {stats.dailyCallTarget}</span> */}
                       </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm text-orange-500"><Phone size={20} /></div>
                 </div>
                 {/* Linear Progress Bar */}
                 <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${getPercent(stats.dailyCallAchieved, stats.dailyCallTarget)}%` }}></div>
                 </div>
                 <p className="text-[10px] font-bold text-right mt-1 text-orange-600">{getPercent(stats.dailyCallAchieved, stats.dailyCallTarget)}% Done</p>
              </div>

              {/* Daily Leads */}
              <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 relative">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Interested Leads</p>
                       <div className="flex items-baseline gap-1 mt-1">
                          <h3 className="text-4xl font-black text-slate-800">{stats.dailyIntAchieved}</h3>
                          {stats.dailyIntTarget > 0 && <span className="text-xs font-bold text-gray-400">/ {stats.dailyIntTarget}</span>}
                       </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500"><TrendingUp size={20} /></div>
                 </div>
                 {/* Linear Progress Bar */}
                 <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getPercent(stats.dailyIntAchieved, stats.dailyIntTarget)}%` }}></div>
                 </div>
                 <p className="text-[10px] font-bold text-right mt-1 text-blue-600">{getPercent(stats.dailyIntAchieved, stats.dailyIntTarget)}% Done</p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ================= RIGHT SECTION (SIDEBAR) ================= */}
      <div className="w-96 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl z-10 shrink-0">
        
        {/* HEADER - MATCHED TO LEFT HEADER STYLE */}
        <div className="bg-white px-6 py-3 border-b border-gray-200 shadow-sm sticky top-0 z-10 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#103c7f] flex items-center gap-2 tracking-tight uppercase italic">
            <Clock size={20} className="text-orange-500" /> Follow-up Schedule
          </h2>
        </div>

        {/* SCROLLABLE CONTENT - MATCHED SCROLL BEHAVIOR */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Today ({todayDate})
            </h3>
            <div className="space-y-3">
              {followUps.today.map((item) => (
                <div key={item.id} className="p-3 bg-orange-50 border border-orange-100 rounded-xl hover:shadow-md transition-all group">
                  <h4 className="font-bold text-gray-800 text-sm mb-2">{item.company}</h4>
                  <div className="bg-white/60 p-2 rounded border border-orange-100 mb-3 text-xs italic text-gray-600">
                    <span className="font-bold text-orange-400 not-italic mr-1">Remark:</span> {item.last_remark}
                  </div>
                  <Link href="/corporate/leadgen/leads">
                    <button className="w-full bg-white border border-orange-200 text-orange-700 text-xs font-bold py-1.5 rounded-lg hover:bg-orange-600 hover:text-white transition-colors flex items-center justify-center gap-1">
                      Call Now <ArrowRight size={12} />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER - ALIGNED */}
        <div className="p-4 border-t border-gray-100 mt-auto bg-white">
           <Link href="/corporate/leadgen/leads">
             <button className="w-full bg-[#103c7f] hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
               <Phone size={18} /> Open Master Database
             </button>
           </Link>
        </div>
      </div>

    </div>
  );
}