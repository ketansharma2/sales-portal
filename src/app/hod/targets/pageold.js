"use client";
import { useState, useEffect } from "react";
import {
  Target, Calendar, Users, Save, TrendingUp,
  Phone, MapPin, Briefcase, Calculator, Building2, Home, Loader2
} from "lucide-react";

export default function HodTargetPage() {
  // --- STATE 1: GLOBAL SETTINGS ---
  const [workingDays, setWorkingDays] = useState(24);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7) + '-01'); // First day of current month

  // --- STATE 2: MANAGERS & TARGETS ---
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- FETCH MANAGERS ---
  const fetchManagers = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`/api/hod/targets?month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Transform API data to UI format
        const formattedManagers = data.data.managers.map(manager => ({
          id: manager.id,
          name: manager.name,
          region: manager.region || "Zone", // Use dynamic region from API
          sector: manager.sector || "-", // Use dynamic sector from API
          fseCount: manager.fseCount || 0, // Dynamic count from API
          leadGenCount: manager.leadGenCount || 0, // Dynamic count from API
          lastMonthAchieved: "85%", // Default, can calculate from actual data
          targetVisitPerDay: manager.targets ? (manager.targets["visit/day"] || Math.ceil(manager.targets.total_visits / workingDays / (manager.fseCount || 1))) : 8,
          targetOnboardPerMonth: manager.targets ? (manager.targets["onboard/month"] || Math.ceil(manager.targets.total_onboards / (manager.fseCount || 1))) : 12,
          targetCallPerDay: manager.targets ? (manager.targets["calls/day"] || Math.ceil(manager.targets.total_calls / workingDays / (manager.leadGenCount || 1))) : 50
        }));
        setManagers(formattedManagers);
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [selectedMonth]);

  const handleInputChange = (id, field, value) => {
    const updatedManagers = managers.map(manager =>
        manager.id === id ? { ...manager, [field]: Number(value) } : manager
    );
    setManagers(updatedManagers);
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      // Prepare targets array
      const targets = managers.map(manager => ({
        sm_id: manager.id,
        total_visits: manager.targetVisitPerDay * workingDays * manager.fseCount,
        total_onboards: manager.targetOnboardPerMonth * manager.fseCount,
        total_calls: manager.targetCallPerDay * workingDays * manager.leadGenCount,
        "visit/day": manager.targetVisitPerDay,
        "onboard/month": manager.targetOnboardPerMonth,
        "calls/day": manager.targetCallPerDay
      }));

      const response = await fetch('/api/hod/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          working_days: workingDays,
          targets
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || `Targets published successfully for ${managers.length} managers!`);
      } else {
        alert('Failed to publish targets: ' + (data.details || data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to publish targets:', error);
      alert('Network error while publishing targets');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Calibri'] p-4 pb-6">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-end mb-4">
          <div>
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                <Target size={28} /> Master Target Assignment
             </h1>
             <div className="flex items-center gap-2 mt-1">
               <input
                 type="month"
                 value={selectedMonth.substring(0, 7)}
                 onChange={(e) => setSelectedMonth(e.target.value + '-01')}
                 className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm font-bold text-[#103c7f] outline-none focus:ring-2 focus:ring-[#103c7f]/30"
               />
               <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                 {new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
               </p>
             </div>
          </div>
          <button
             onClick={handlePublish}
             disabled={saving || loading}
             className="bg-[#103c7f] hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center gap-2 transition transform active:scale-95 disabled:opacity-50"
          >
             {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Publish to Managers
          </button>
      </div>

      {/* 2. GLOBAL SETTINGS CARD */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-4 flex items-center gap-8">
         <div className="bg-blue-50 p-4 rounded-xl text-[#103c7f]">
            <Calendar size={32} />
         </div>
         <div className="flex-1">
            <h2 className="text-lg font-black text-gray-800 uppercase">Monthly Configuration</h2>
            <p className="text-xs text-gray-500">Set the standard working days for the entire company for this month.</p>
         </div>
         <div className="flex flex-col items-end">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Working Days</label>
            <input 
               type="number" 
               value={workingDays}
               onChange={(e) => setWorkingDays(Number(e.target.value))}
               className="text-3xl font-black text-[#103c7f] w-24 text-right border-b-2 border-gray-200 focus:border-[#103c7f] outline-none bg-transparent"
            />
         </div>
      </div>

      {/* 3. ASM ASSIGNMENT TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
         
         {/* Table Header */}
         <div className="grid grid-cols-12 bg-[#103c7f] text-white text-[11px] uppercase font-bold py-4 px-4 gap-4">
            <div className="col-span-2">ASM Details & Sector</div>
            <div className="col-span-2 text-center">Previous Achievement</div>
            <div className="col-span-3 text-center border-l border-blue-800/50">FSE Input</div>
            <div className="col-span-2 text-center border-l border-blue-800/50">LeadGen Input</div>
            {/* Split Header for Clarity */}
            <div className="col-span-3 text-center border-l border-blue-800/50 grid grid-cols-2">
               <span>Per Person (Mon)</span>
               <span>Team Total</span>
            </div>
         </div>

         {/* Table Body */}
         <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-[#103c7f]" size={32} />
                <span className="ml-2 text-gray-600">Loading managers...</span>
              </div>
            ) : managers.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-bold">
                No managers found under your supervision
              </div>
            ) : (
              managers.map((manager) => {
               
               // --- CALCULATIONS ---
               // 1. Per FSE Monthly
               const perFseMonthlyVisits = manager.targetVisitPerDay * workingDays;
               const perFseMonthlyOnboards = manager.targetOnboardPerMonth; // Direct input

               // 2. Per LeadGen Monthly
               const perLeadGenMonthlyCalls = manager.targetCallPerDay * workingDays;

               // 3. Team Totals
               const teamTotalVisits = perFseMonthlyVisits * manager.fseCount;
               const teamTotalOnboards = perFseMonthlyOnboards * manager.fseCount;
               const teamTotalCalls = perLeadGenMonthlyCalls * manager.leadGenCount;

               return (
                  <div key={manager.id} className="grid grid-cols-12 py-5 px-4 gap-4 items-center hover:bg-gray-50 transition">

                     {/* 1. Manager Details + Sector */}
                     <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="text-base font-black text-gray-800 leading-none">{manager.name}</h3>
                           
                           {/* Sector Badge */}
                           <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 border ${
                              manager.sector === 'Corporate' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'
                           }`}>
                              {manager.sector === 'Corporate' ? <Building2 size={8}/> : <Home size={8}/>} {manager.sector}
                           </span>
                        </div>

                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">{manager.region}</p>

                        <div className="flex gap-2">
                           <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold border border-gray-200">
                              {manager.fseCount} FSEs
                           </span>
                           <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold border border-gray-200">
                              {manager.leadGenCount} Callers
                           </span>
                        </div>
                     </div>

                     {/* 2. History */}
                     <div className="col-span-2 text-center">
                        <div className={`text-sm font-black ${parseInt(manager.lastMonthAchieved) >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                           {manager.lastMonthAchieved}
                        </div>
                        <p className="text-[9px] text-gray-400 uppercase">Last Mon.</p>
                     </div>

                     {/* 3. FSE Targets Inputs */}
                     <div className="col-span-3 px-2 border-l border-gray-100 grid grid-cols-2 gap-2">
                        <div>
                           <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                              <MapPin size={10}/> Visit/Day
                           </label>
                           <input
                              type="number"
                              value={manager.targetVisitPerDay}
                              onChange={(e) => handleInputChange(manager.id, 'targetVisitPerDay', e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg py-1.5 px-2 text-sm font-bold text-gray-800 focus:border-[#103c7f] outline-none text-center shadow-sm"
                           />
                        </div>
                        <div>
                           <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                              <Briefcase size={10}/> Onbd/Mon
                           </label>
                           <input
                              type="number"
                              value={manager.targetOnboardPerMonth}
                              onChange={(e) => handleInputChange(manager.id, 'targetOnboardPerMonth', e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded-lg py-1.5 px-2 text-sm font-bold text-gray-800 focus:border-[#103c7f] outline-none text-center shadow-sm"
                           />
                        </div>
                     </div>

                     {/* 4. LeadGen Inputs */}
                     <div className="col-span-2 px-2 border-l border-gray-100">
                        <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1 mb-1">
                           <Phone size={10}/> Calls/Day
                        </label>
                        <input
                           type="number"
                           value={manager.targetCallPerDay}
                           onChange={(e) => handleInputChange(manager.id, 'targetCallPerDay', e.target.value)}
                           className="w-full bg-white border border-gray-300 rounded-lg py-1.5 px-2 text-sm font-bold text-gray-800 focus:border-[#103c7f] outline-none text-center shadow-sm"
                        />
                     </div>

                     {/* 5. CALCULATIONS (Per Person vs Total) */}
                     <div className="col-span-3 pl-2 border-l border-gray-100 grid grid-cols-2 gap-4 text-right">
                        
                        {/* Per Person Column */}
                        <div className="flex flex-col gap-1 pr-2 border-r border-gray-100">
                           <div>
                              <p className="text-[9px] text-gray-400 uppercase">1 FSE Visits</p>
                              <p className="text-xs font-bold text-gray-700">{perFseMonthlyVisits}</p>
                           </div>
                           <div>
                              <p className="text-[9px] text-gray-400 uppercase">1 FSE Onboard</p>
                              <p className="text-xs font-bold text-gray-700">{perFseMonthlyOnboards}</p>
                           </div>
                           <div>
                              <p className="text-[9px] text-gray-400 uppercase">1 Caller Calls</p>
                              <p className="text-xs font-bold text-gray-700">{perLeadGenMonthlyCalls}</p>
                           </div>
                        </div>

                        {/* Team Total Column */}
                        <div className="flex flex-col gap-1">
                           <div>
                              <p className="text-[9px] text-gray-400 uppercase">Total Visits</p>
                              <p className="text-xs font-black text-[#103c7f]">{teamTotalVisits.toLocaleString()}</p>
                           </div>
                           <div>
                              <p className="text-[9px] text-gray-400 uppercase">Total Onboard</p>
                              <p className="text-xs font-black text-green-600">{teamTotalOnboards.toLocaleString()}</p>
                           </div>
                           <div>
                              <p className="text-[9px] text-gray-400 uppercase">Total Calls</p>
                              <p className="text-xs font-black text-orange-600">{teamTotalCalls.toLocaleString()}</p>
                           </div>
                        </div>

                     </div>

                  </div>
               )
              })
            )}
         </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-medium bg-white p-3 rounded-lg border border-gray-200 w-fit shadow-sm">
         <Calculator size={14} className="text-[#103c7f]" />
         <span>Calculations: <strong>Daily Target</strong> × <strong>{workingDays} Days</strong> = Monthly Per Person</span>
      </div>

    </div>
  );
}