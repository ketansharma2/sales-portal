"use client";
import { useState, useEffect } from "react";
import {
  Target, Calendar, Phone, MapPin, Briefcase, 
  Loader2, Edit2, Trash2, Check, X, User, Send
} from "lucide-react";

export default function HodTargetPage() {
  const [workingDays, setWorkingDays] = useState(24);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7) + '-01');
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState(null); 
  const [editFormData, setEditFormData] = useState({}); 
  const [sendingId, setSendingId] = useState(null); 

  // --- FETCH MANAGERS ---
  const fetchManagers = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`/api/hod/targets?month=${selectedMonth}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (data.success) {
        const formattedManagers = data.data.managers.map(manager => ({
          id: manager.id,
          name: manager.name,
          region: manager.region || "Zone",
          sector: manager.sector || "General",
          fseCount: manager.fseCount || 0,
          leadGenCount: manager.leadGenCount || 0,
          targetVisitPerDay: manager.targets ? (manager.targets["visit/day"] || 0) : 8,
          targetOnboardPerMonth: manager.targets ? (manager.targets["onboard/month"] || 0) : 12,
          targetCallPerDay: manager.targets ? (manager.targets["calls/day"] || 0) : 50
        }));
        setManagers(formattedManagers);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [selectedMonth]);

  // --- HANDLERS ---
  const handleEditClick = (manager) => {
    setEditingId(manager.id);
    setEditFormData({
      visitPerDay: manager.targetVisitPerDay,
      onboardPerMonth: manager.targetOnboardPerMonth,
      callsPerDay: manager.targetCallPerDay
    });
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveLocal = (id) => {
    setManagers(prev => prev.map(mgr => {
      if (mgr.id === id) {
        return {
          ...mgr,
          targetVisitPerDay: Number(editFormData.visitPerDay),
          targetOnboardPerMonth: Number(editFormData.onboardPerMonth),
          targetCallPerDay: Number(editFormData.callsPerDay)
        };
      }
      return mgr;
    }));
    setEditingId(null);
  };

  const handleDeleteClick = (id) => {
    if(confirm("Are you sure you want to reset targets for this manager?")) {
        setManagers(prev => prev.map(mgr => {
            if (mgr.id === id) {
              return { ...mgr, targetVisitPerDay: 0, targetOnboardPerMonth: 0, targetCallPerDay: 0 };
            }
            return mgr;
        }));
    }
  };

  const handleSendToManager = async (manager) => {
    try {
      setSendingId(manager.id); 
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      
      const singleTarget = {
        sm_id: manager.id,
        total_visits: manager.targetVisitPerDay * workingDays * manager.fseCount,
        total_onboards: manager.targetOnboardPerMonth * manager.fseCount,
        total_calls: manager.targetCallPerDay * workingDays * manager.leadGenCount,
        "visit/day": manager.targetVisitPerDay,
        "onboard/month": manager.targetOnboardPerMonth,
        "calls/day": manager.targetCallPerDay
      };

      const response = await fetch('/api/hod/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          working_days: workingDays,
          targets: [singleTarget] 
        })
      });

      const data = await response.json();
      if (data.success) {
         alert(`Targets sent to ${manager.name} successfully!`);
      } else {
         alert('Failed: ' + (data.details || data.error));
      }
      
    } catch (error) {
      console.error(error);
      alert('Network error');
    } finally {
      setSendingId(null); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Calibri'] p-4 pb-12">
      
      {/* TOP HEADER */}
      <div className="flex justify-between items-end mb-4">
          <div>
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                <Target size={28} /> Master Target Assignment
             </h1>
             <div className="flex items-center gap-3 mt-2">
               <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input
                    type="month"
                    value={selectedMonth.substring(0, 7)}
                    onChange={(e) => setSelectedMonth(e.target.value + '-01')}
                    className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-[#103c7f] outline-none shadow-sm cursor-pointer"
                  />
               </div>
               <div className="h-4 w-[1px] bg-gray-300"></div>
               <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Working Days:</label>
                  <input 
                    type="number" 
                    value={workingDays}
                    onChange={(e) => setWorkingDays(Number(e.target.value))}
                    className="w-10 text-center font-black text-[#103c7f] focus:border-blue-500 outline-none bg-transparent"
                  />
               </div>
             </div>
          </div>
      </div>

      {/* MAIN TABLE (Restored to Original Clean Format) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-[#103c7f]/5 border-b border-[#103c7f]/10 text-[10px] font-black text-[#103c7f] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 w-[25%]">Manager Details</th>
              <th className="px-6 py-4 text-center w-[10%]">Team</th>
              <th className="px-6 py-4 w-[20%] border-l border-gray-100 bg-blue-50/20 text-center">FSE Targets (Daily)</th>
              <th className="px-6 py-4 w-[15%] border-l border-gray-100 bg-orange-50/20 text-center">Caller Targets</th>
              <th className="px-6 py-4 w-[20%] border-l border-gray-100 bg-gray-50/50 text-[#103c7f] text-center">Team Output</th> {/* Output Column Restored */}
              <th className="px-6 py-4 text-center w-[10%]">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
                <tr><td colSpan="6" className="py-10 text-center text-gray-400"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
            ) : managers.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-400">No managers found</td></tr>
            ) : (
                managers.map((mgr) => {
                  const isEditing = editingId === mgr.id;
                  const isSending = sendingId === mgr.id;

                  // --- CALCULATIONS ---
                  const visitVal = isEditing ? Number(editFormData.visitPerDay) : mgr.targetVisitPerDay;
                  const onboardVal = isEditing ? Number(editFormData.onboardPerMonth) : mgr.targetOnboardPerMonth;
                  const callVal = isEditing ? Number(editFormData.callsPerDay) : mgr.targetCallPerDay;
                  
                  // Monthly Per Person
                  const monthlyVisitPerPerson = visitVal * workingDays;
                  
                  // Team Totals (For Output Column)
                  const teamTotalVisits = monthlyVisitPerPerson * mgr.fseCount;
                  const teamTotalOnboards = onboardVal * mgr.fseCount; 
                  const teamTotalCalls = (callVal * workingDays) * mgr.leadGenCount;

                  return (
                    <tr key={mgr.id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-blue-50/10' : ''}`}>
                      
                      {/* 1. Manager Details */}
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200 shadow-sm">
                                {mgr.name.charAt(0)}
                            </div>
                            <div>
                               <p className="font-bold text-gray-800 text-sm">{mgr.name}</p>
                               <div className="flex gap-2 mt-1">
                                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 uppercase font-bold">{mgr.region}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${mgr.sector === 'Corporate' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                    {mgr.sector}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </td>

                      {/* 2. Team Counts */}
                      <td className="px-6 py-4 text-center">
                         <div className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between">
                               <span className="font-bold text-gray-400">FSE:</span>
                               <span className="font-black text-gray-800">{mgr.fseCount}</span>
                            </div>
                            <div className="flex justify-between">
                               <span className="font-bold text-gray-400">Call:</span>
                               <span className="font-black text-gray-800">{mgr.leadGenCount}</span>
                            </div>
                         </div>
                      </td>

                     {/* 3. FSE Targets (Side-by-Side Units) */}
                      <td className="px-6 py-4 border-l border-gray-100 bg-blue-50/10 text-center">
                         {isEditing ? (
                            <div className="flex gap-2 justify-center">
                               <div className="text-center">
                                  <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Visits</label>
                                  <input 
                                    type="number" 
                                    value={editFormData.visitPerDay} 
                                    onChange={(e) => setEditFormData({...editFormData, visitPerDay: e.target.value})}
                                    className="w-14 border border-blue-300 rounded px-1 py-1 text-sm font-bold text-center outline-none"
                                  />
                               </div>
                               <div className="text-center">
                                  <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Onboard</label>
                                  <input 
                                    type="number" 
                                    value={editFormData.onboardPerMonth} 
                                    onChange={(e) => setEditFormData({...editFormData, onboardPerMonth: e.target.value})}
                                    className="w-14 border border-blue-300 rounded px-1 py-1 text-sm font-bold text-center outline-none"
                                  />
                               </div>
                            </div>
                         ) : (
                            <div className="flex justify-center gap-6 items-center">
                               {/* Visit Target */}
                               <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-black text-gray-800">{mgr.targetVisitPerDay}</span>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase">/Day</span>
                               </div>
                               
                               {/* Separator Line */}
                               <div className="h-6 w-[1px] bg-blue-200/50"></div>
                               
                               {/* Onboard Target */}
                               <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-black text-gray-800">{mgr.targetOnboardPerMonth}</span>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase">/Mo</span>
                               </div>
                            </div>
                         )}
                      </td>

                      {/* 4. Caller Targets (Side-by-Side Units) */}
                      <td className="px-6 py-4 border-l border-gray-100 bg-orange-50/10 text-center">
                         {isEditing ? (
                            <div className="text-center flex flex-col items-center">
                               <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Calls</label>
                               <input 
                                  type="number" 
                                  value={editFormData.callsPerDay} 
                                  onChange={(e) => setEditFormData({...editFormData, callsPerDay: e.target.value})}
                                  className="w-16 border border-orange-300 rounded px-1 py-1 text-sm font-bold text-center outline-none"
                               />
                            </div>
                         ) : (
                            <div className="flex justify-center items-baseline gap-1">
                               <span className="text-lg font-black text-gray-800">{mgr.targetCallPerDay}</span>
                               <span className="text-[9px] font-bold text-gray-400 uppercase">/Day</span>
                            </div>
                         )}
                      </td>

                      {/* 5. TEAM OUTPUT (Separate Calculation Column) */}
                      <td className="px-6 py-4 border-l border-gray-100 bg-gray-50/30">
                         <div className="space-y-1.5">
                             <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-blue-600 uppercase text-[10px]">Visits</span>
                                <span className="font-black text-gray-800">{teamTotalVisits.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-green-600 uppercase text-[10px]">Onboard</span>
                                <span className="font-black text-gray-800">{teamTotalOnboards.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs ">
                                <span className="font-bold text-orange-600 uppercase text-[10px]">Calls</span>
                                <span className="font-black text-gray-800">{teamTotalCalls.toLocaleString()}</span>
                             </div>
                         </div>
                      </td>

                      {/* 6. Action */}
                      <td className="px-6 py-4 text-center">
                         {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                               <button 
                                 onClick={() => handleSaveLocal(mgr.id)}
                                 className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                               >
                                  <Check size={14} strokeWidth={3}/>
                               </button>
                               <button 
                                 onClick={handleCancelClick}
                                 className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                               >
                                  <X size={14} strokeWidth={3}/>
                               </button>
                            </div>
                         ) : (
                            <div className="flex items-center justify-center gap-2">
                               <button 
                                 onClick={() => handleEditClick(mgr)}
                                 className="p-1.5 border border-blue-200 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                               >
                                  <Edit2 size={14}/>
                               </button>
                               <button 
                                 onClick={() => handleSendToManager(mgr)}
                                 disabled={isSending}
                                 className={`p-1.5 border rounded transition-colors ${isSending ? 'bg-blue-50 border-blue-200 text-blue-400' : 'border-green-200 text-green-600 hover:bg-green-50'}`} 
                               >
                                  {isSending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                               </button>
                               <button 
                                 onClick={() => handleDeleteClick(mgr.id)}
                                 className="p-1.5 border border-red-200 text-red-500 rounded hover:bg-red-50 transition-colors"
                               >
                                  <Trash2 size={14}/>
                               </button>
                            </div>
                         )}
                      </td>

                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}