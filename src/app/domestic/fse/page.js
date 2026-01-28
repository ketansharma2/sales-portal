"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, CheckCircle, MapPin, Target,
  TrendingUp, Calendar, Filter,
  ArrowRight, Search, Activity
} from "lucide-react";

export default function FSEDashboard() {
  const [mounted, setMounted] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [latestDate, setLatestDate] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Get current month abbreviation
  const currentMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();

  // Initial stats with defaults
  const [stats, setStats] = useState({
    global: { totalClients: 0, totalOnboard: 0, totalVisits: 0 },
    monthly: { visitTarget: 0 , individualVisits: 0, onboardMtd: "0/0", avgVisit: 0, visitGoal: 0, onboardGoal: 0 },
    projections: { mpLess50: 0, mpGreater50: 0, wpLess50: 0, wpGreater50: 0 },
    dynamicMetrics: { total: 0, individual: 0, repeat: 0, interested: 0, notInterested: 0, reachedOut: 0, onboard: 0 },
    clients: []
  });

  // Fetch dashboard data
  useEffect(() => {
    if (mounted) {
      fetchDashboard();
      fetchVisitTarget();
    }
  }, [mounted]);

  const fetchVisitTarget = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7) + '-01';
      const response = await fetch(`/api/domestic/fse/targets?month=${currentMonth}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      console.log('Targets API response:', data);
      if (data.success && data.data) {
        console.log('Visit Goal:', data.data.monthly_visits);
        console.log('Onboard Goal:', data.data.monthly_onboards);
        setStats(prev => ({
          ...prev,
          monthly: {
            ...prev.monthly,
            visitGoal: data.data.monthly_visits || 0,
            onboardGoal: data.data.monthly_onboards || 0
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch visit target:', error);
    }
  };

  const fetchDashboard = async (from = '', to = '') => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/domestic/fse/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ from, to })
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Dashboard API response:', data);
      console.log('Data success:', data.success);

      if (data.success) {
        console.log('Setting stats with data');
        setStats(prev => ({
          ...prev,
          global: {
            ...prev.global,
            totalClients: data.data.totalClients,
            totalOnboard: data.data.totalOnboarded,
            totalVisits: data.data.totalVisits
          },
          monthly: {
            ...prev.monthly,
            visitTarget: data.data.monthlyStats.totalVisits,
            individualVisits: data.data.monthlyStats.individualVisits,
            onboardMtd: data.data.monthlyStats.mtdMp,
            avgVisit: data.data.monthlyStats.avg
          },
          projections: {
            mpLess50: data.data.projections.mpLess50,
            mpGreater50: data.data.projections.mpGreater50,
            wpLess50: data.data.projections.wpLess50,
            wpGreater50: data.data.projections.wpGreater50
          },
          dynamicMetrics: {
            ...prev.dynamicMetrics,
            total: data.data.latestActivity.total,
            individual: data.data.latestActivity.individual,
            repeat: data.data.latestActivity.repeat,
            interested: data.data.latestActivity.interested,
            notInterested: data.data.latestActivity.notInterested,
            reachedOut: data.data.latestActivity.reachedOut,
            onboard: data.data.latestActivity.onboarded
          },
          clients: data.data.latestLeads.map(lead => ({
            date: lead.date,
            name: lead.name,
            status: lead.status,
            sub: lead.sub,
            color: lead.color
          }))
        }));
        setLatestDate(data.data.latestActivity.date);
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  
  return (
    <div className="p-1 bg-[#f8fafc] font-['Calibri'] h-full text-slate-800 flex flex-col">
      <div className="max-w-8xl mx-auto space-y-4 w-full">
        
        {/* --- ROW 1: GLOBAL STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Clients in Database" value={stats.global.totalClients} icon={<Users size={20} />} accentColor="text-[#103c7f]" bgColor="bg-[#103c7f]/10" />
          <StatCard title="Total Onboarded" value={stats.global.totalOnboard} icon={<CheckCircle size={20} />} accentColor="text-[#a1db40]" bgColor="bg-[#a1db40]/10" />
          <StatCard title="Total Visits" value={stats.global.totalVisits} icon={<MapPin size={20} />} accentColor="text-[#1a4da1]" bgColor="bg-[#1a4da1]/10" />
        </div>

        {/* --- ROW 2: KPIs & PROJECTION --- */}
        {/* Fixed: h-21 invalid tha, h-28 kiya. items-stretch rakha taaki height same rahe */}
        <div className="flex flex-col lg:flex-row gap-3  mb-4 items-stretch">
          
          {/* 1. Month Indicator */}
          <div className="bg-[#103c7f] rounded-xl flex flex-col items-center justify-center w-10 shadow-sm shrink-0 py-1 hidden lg:flex">
            <div className="flex flex-col items-center leading-[1.1] text-white font-black text-[16px] uppercase tracking-tighter">
              {currentMonth.split("").map((char, i) => <span key={i}>{char}</span>)}
            </div>
          </div>

          {/* 2. KPIs (Fixed: Removed min-w-300px from children to prevent overflow) */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2"> 
          {/* CARD 1: Total Visit (Ab Goal Bhi Dikhega) */}
            {/* CARD 1: Total Visit (Target Always Visible) */}
            <CompactMonthCard
                label="Total Visit"
                value={stats.monthly.visitTarget}
                icon={<TrendingUp size={16} />}
                target={stats.monthly.visitGoal }
                progress={stats.monthly.visitGoal ? (parseInt(stats.monthly.visitTarget) / parseInt(stats.monthly.visitGoal)) * 100 : 0}
                trend="-1%"
            />
          {/* CARD 2: Individual Visits */}
          <CompactMonthCard
              label="Individual Visit"
              value={stats.monthly.individualVisits}
              icon={<Users size={16} />}
              target={null}
              // No progress, No trend passed here
          />

            {/* CARD 3: Onboard (String data "12/20") */}
            <CompactMonthCard
                label="Onboard (MTD)"
                value={stats.monthly.onboardMtd} // e.g., "12/20"
                icon={<CheckCircle size={16} />}
                target={stats.monthly.onboardGoal}
                progress={(() => {
                    const parts = stats.monthly.onboardMtd.toString().split('/');
                    const curr = Number(parts[0]) || 0;
                    const goal = stats.monthly.onboardGoal;
                    return (curr / goal) * 100;
                })()}
                trend="+5%" // Dummy trend
            />

            {/* CARD 4: Avg Visit (Fixed "Pending") */}
            <CompactMonthCard
                label="Avg Visit"
                value={stats.monthly.avgVisit || "0.0"}
                icon={<Activity size={16} />}
                target={null}
                // No progress passed here as per request
            />
          </div>

          {/* 3. Projection Card */}
          <div className="w-full lg:w-[350px] bg-[#103c7f] rounded-xl p-1 text-white shadow-md flex flex-col justify-center relative overflow-hidden border border-white/5 shrink-0">
            <div className="flex justify-between items-center mb-2 px-1 relative z-10">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-[#a1db40]">Projection</h3>
              <Target size={12} className="opacity-30" />
            </div>

            {/* Fixed: Grid gap logic */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 px-1 relative z-10">
               {/* Corrected Props passing */}
               <ProjItem label="MP < 50" value={stats.projections.mpLess50} />
               <ProjItem label="MP > 50" value={stats.projections.mpGreater50} />
               <ProjItem label="WP < 50" value={stats.projections.wpLess50} />
               <ProjItem label="WP > 50" value={stats.projections.wpGreater50} />
            </div>
            <Target size={50} className="absolute -right-3 -bottom-3 opacity-5 rotate-12" />
          </div>
        </div>

        {/* --- ROW 3: DATE SELECTOR --- */}
        <div className="bg-white rounded-2xl p-2 px-4 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#103c7f] shrink-0">
            <h3 className="font-black text-sm uppercase tracking-wide">Latest Visit</h3>
            {latestDate && <span className="text-xs font-bold text-gray-500">({latestDate})</span>}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <DateInput label="From" value={fromDate} onChange={setFromDate} />
            <DateInput label="To" value={toDate} onChange={setToDate} />
            <button onClick={() => fetchDashboard(fromDate, toDate)} className="bg-[#103c7f] text-white p-2.5 rounded-xl hover:bg-[#1a4da1] transition-all"><Filter size={16} /></button>
          </div>
        </div>

        {/* --- ROW 4: DYNAMIC METRICS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <DynamicCard label="Total Visit" value={stats.dynamicMetrics.total} color="border-l-[#103c7f]" />
          <DynamicCard label="Individual" value={stats.dynamicMetrics.individual} color="border-l-[#1a4da1]" />
          <DynamicCard label="Repeat" value={stats.dynamicMetrics.repeat} color="border-l-blue-400" />
          <DynamicCard label="Interested" value={stats.dynamicMetrics.interested} color="border-l-[#a1db40]" />
          <DynamicCard label="Not Interested" value={stats.dynamicMetrics.notInterested} color="border-l-red-400" />
          <DynamicCard label="Reached Out" value={stats.dynamicMetrics.reachedOut} color="border-l-orange-400" />
          <DynamicCard label="Onboarded" value={stats.dynamicMetrics.onboard} color="border-l-emerald-500" />
        </div>

        {/* --- ROW 5: SCROLLABLE TABLE (FIXED) --- */}
        {/* Fixed Height applied here */}
        <div className="h-[300px] bg-white rounded-[1rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col mb-4"> 
          {/*<div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between bg-[#103c7f]/5 shrink-0">
             <h3 className="text-[#103c7f] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                <Users size={14} className="text-[#a1db40]" /> Client Details
             </h3>
             <span className="text-[8px] font-bold text-gray-400 uppercase italic">{stats.clients.length} Records</span>
          </div>*/}

          <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 shadow-sm bg-white">
                <tr>
                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 tracking-wider border-b border-gray-100 bg-white">Date</th>
                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 tracking-wider border-b border-gray-100 bg-white">Client Name</th>
                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 tracking-wider border-b border-gray-100 bg-white text-center">Status</th>
                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 tracking-wider border-b border-gray-100 bg-white text-right">Substatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.clients.map((client, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition-all group">
                    <td className="px-6 py-2 text-xs font-bold text-slate-700">{client.date}</td>
                    <td className="px-6 py-2 text-xs font-bold text-slate-700">{client.name} </td>
                    <td className="px-6 py-2 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${client.color}`}>{client.status}</span>
                    </td>
                    <td className="px-6 py-2 text-[10px] font-bold text-gray-400 italic text-right group-hover:text-[#103c7f]">{client.sub}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

/* --- REUSABLE SUB-COMPONENTS --- */
function StatCard({ title, value, icon, accentColor, bgColor }) {
  return (
    <div className="bg-white border border-gray-100 p-3 px-4 rounded-xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`p-2.5 rounded-lg ${bgColor} ${accentColor} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-0.5 truncate">{title}</p>
        <p className="text-xl font-black text-slate-800 leading-none">{(value || 0).toLocaleString()}</p>
      </div>
    </div>
  );
}

// Fixed: Removed min-w-[300px] which was breaking the grid
function CompactMonthCard({ label, value, icon, trend, progress, target }) {
  // Logic to determine color
  const isPositive = trend && trend.includes("+");
  const trendColor = isPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50";
  const trendIcon = isPositive ? "↑" : "↓";

  return (
    // 👇 CHANGED: p-4 to p-2.5 (Less padding = Less height)
    <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col justify-between h-full w-full relative overflow-hidden group hover:shadow-md transition-all">
      
      {/* Top Row: Icon, Label & Trend */}
      <div className="flex justify-between items-start mb-1"> {/* Reduced mb-2 to mb-1 */}
        <div className="flex items-center gap-2">
           {/* 👇 CHANGED: w-10 h-10 to w-8 h-8 (Smaller Icon Box) */}
           <div className="w-8 h-8 rounded-lg bg-[#103c7f]/10 flex items-center justify-center text-[#103c7f] shrink-0 group-hover:bg-[#103c7f] group-hover:text-white transition-colors">
             {React.cloneElement(icon, { size: 18 })} {/* Icon size reduced to 16 */}
           </div>
           
           <div className="flex flex-col min-w-0">
             <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wide truncate">{label}</span>
             {(label === "Total Visit" || label === "Onboard (MTD)") && target != null && (
               <span className="text-[10px] font-semibold text-gray-300 leading-none mt-0.5">Goal: {target}</span>
             )}
           </div>
        </div>

        {/* Trend Badge */}
        {trend && (
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${trendColor} flex items-center leading-none`}>
            {trendIcon} {trend}
          </span>
        )}
      </div>

      {/* Middle: Big Value */}
      <div className="mt-0.5">
        <span className="text-2xl font-black text-[#103c7f] leading-none tracking-tight">{value}</span>
      </div>

      {/* Bottom: Progress Bar */}
      {progress !== undefined && (
        <div className="mt-2 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#103c7f] rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

// Fixed: Simplified props to match usage (Label + Value only)
function ProjItem({ label, value }) {
  const router = useRouter();

  const getProjectionParam = (label) => {
    return label;
  };

  const handleClick = () => {
    localStorage.setItem('projectionFilter', getProjectionParam(label));
    router.push('/domestic/fse/lead');
  };

  return (
    <button onClick={handleClick} className="flex justify-between items-center border-b border-white/10 py-1 w-full gap-2 hover:bg-white/10 transition-colors cursor-pointer">
      <span className="text-[12px] font-bold text-[#a1db40] uppercase tracking-tighter shrink-0">{label}</span>
      <span className="text-[12px] font-black text-white italic shrink-0">{value}</span>
    </button>
  );
}

function DynamicCard({ label, value, color }) {
  return (
    <div className={`bg-white p-3 rounded-xl border border-gray-100 border-l-4 ${color} shadow-sm text-center`}>
      <p className="text-[12px] font-black text-gray-400 uppercase mb-1 truncate">{label}</p>
      <p className="text-lg font-black text-[#103c7f]">{value}</p>
    </div>
  );
}

function DateInput({ label, value, onChange }) {
    return (
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors cursor-pointer group">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-[#103c7f] transition-colors">{label}</span>
            {/* Added cursor-pointer and improved text style */}
            <input 
              type="date" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer uppercase" 
            />
        </div>
    )
}