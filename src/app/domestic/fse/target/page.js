"use client";
import React, { useState, useEffect } from "react";
import { 
  Calendar, Briefcase, X, Target, 
  BarChart2, Percent, Eye, User, CheckCircle
} from "lucide-react";

export default function FSEDomesticTargetPage() {
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [myTargetsData, setMyTargetsData] = useState([]);
  
  // My Targets State (Assigned by Domestic SM)
  const [myTargetMonth, setMyTargetMonth] = useState("April");

  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // --- OPTIONS & LOGIC ---
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Fetch my targets from API
  const fetchMyTargets = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      
      if (!token) return;
      
      const response = await fetch('/api/domestic/fse/my-targets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setMyTargetsData(result.data);
      }
    } catch (error) {
      console.error('Error fetching my targets:', error);
    }
  };

  useEffect(() => {
    fetchMyTargets();
    setLoading(false);
  }, []);

  // Filters
  const filteredMyTargets = myTargetsData.filter(t => t.month === myTargetMonth);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 pb-20">
      
      {/* ========================================== */}
      {/* 1. MY TARGETS (Assigned by SM) SECTION     */}
      {/* ========================================== */}
      <div className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
             <div>
                <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <CheckCircle size={24} className="text-emerald-500"/> Domestic Targets (FSE)
                </h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Field sales targets assigned to you by your Manager</p>
             </div>
             
             {/* Month Filter for My Targets */}
             <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                 <Calendar size={14} className="text-gray-400"/>
                 <select value={myTargetMonth} onChange={(e) => setMyTargetMonth(e.target.value)} className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer pr-4">
                     {months.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
             </div>
          </div>

          {/* TABLE SECTION FOR MY TARGETS */}
          <div className="bg-white border-2 border-emerald-100 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
             <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                   <thead className="text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm tracking-widest bg-emerald-700">
                      <tr>
                         <th className="p-3 border-r border-white/10 w-24 text-center">Period</th>
                         <th className="p-3 border-r border-white/10 w-24 text-center">Work Days</th>
                         <th className="p-3 border-r border-white/10 w-56">Assigned By</th>
                         <th className="p-3 border-r border-white/10 min-w-[200px]">Guideline</th>
                         <th className="p-3 border-r border-white/10 w-40">KPI Metric</th>
                         <th className="p-3 border-r border-white/10 text-center w-24">Freq.</th>
                         <th className="p-3 border-r border-white/10 text-center bg-black/10 w-24">Target</th>
                         <th className="p-3 border-r border-white/10 text-center bg-black/10 w-24">Achieved</th>
                         <th className="p-3 border-r border-white/10 text-center bg-black/20 w-24">%</th>
                         <th className="p-3 text-center bg-black/10 sticky right-0 z-20 w-20 shadow-[-4px_0px_5px_rgba(0,0,0,0.1)]">Action</th>
                      </tr>
                   </thead>
                   <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                      {filteredMyTargets.length > 0 ? filteredMyTargets.map((item, idx) => {
                          const percentage = item.target > 0 ? Math.min(Math.round((item.achieved / item.target) * 100), 100) : 0;
                          let percColor = "text-red-600 bg-red-50 border-red-200";
                          if(percentage >= 100) percColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                          else if(percentage >= 50) percColor = "text-amber-600 bg-amber-50 border-amber-200";

                          return (
                          <tr key={item.id || idx} className="hover:bg-emerald-50/30 transition group">
                             
                             <td className="p-3 border-r border-gray-100 text-center align-middle">
                                <div className="flex flex-col items-center gap-1">
                                   <span className="font-black text-gray-800">{item.month}</span>
                                   <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.year}</span>
                                </div>
                             </td>

                             <td className="p-3 border-r border-gray-100 text-center align-middle">
                                 <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 text-[11px]">
                                     {item.workingDays} <span className="text-[9px] text-emerald-500 uppercase">Days</span>
                                 </span>
                             </td>

                             <td className="p-3 border-r border-gray-100 align-middle">
                                 <div className="flex flex-col gap-1">
                                     <span className="font-black text-gray-900 flex items-center gap-1.5"><User size={12} className="text-emerald-500"/> {item.assignedBy}</span>
                                     <span className="font-bold text-gray-400 text-[9px] uppercase tracking-wider flex items-center gap-1"><Briefcase size={10}/>{item.assignedRole}</span>
                                 </div>
                             </td>
                             
                             <td className="p-3 border-r border-gray-100 align-middle"><p className="text-[11px] text-gray-600 leading-relaxed">{item.guideline}</p></td>
                             <td className="p-3 border-r border-gray-100 align-middle"><span className="font-bold text-emerald-700 flex items-center gap-1.5"><BarChart2 size={12}/>{item.kpi_metric}</span></td>
                             
                             <td className="p-3 border-r border-gray-100 text-center align-middle">
                                 <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${item.frequency === 'Daily' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{item.frequency}</span>
                             </td>
                             
<td className="p-3 border-r border-gray-100 text-center align-middle bg-gray-50/50"><span className="text-sm font-mono font-black text-gray-800">{item.totalTarget?.toLocaleString('en-IN')}</span></td>
                              <td className="p-3 border-r border-gray-100 text-center align-middle bg-gray-50/50"><span className="text-sm font-mono font-black text-emerald-700">{item.achieved?.toLocaleString('en-IN')}</span></td>
                             
                             <td className="p-3 border-r border-gray-100 text-center align-middle">
                                 <span className={`px-2 py-1 rounded-md text-[10px] font-black inline-flex items-center gap-0.5 border ${percColor}`}>{percentage} <Percent size={10}/></span>
                             </td>
                             
                             <td className="p-2 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)] align-middle group-hover:bg-emerald-50 transition-colors">
                                <div className="flex flex-row items-center gap-2 w-full px-1 justify-center">
                                    <button onClick={() => {
                                         setViewData({ role: item.assignedRole, assignedTo: item.assignedBy, kpi_metric: item.kpi_metric });
                                         setIsViewModalOpen(true);
                                    }} className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-800 hover:text-white px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1">
                                        <Eye size={10} /> View
                                    </button>
                                </div>
                             </td>
                             
                          </tr>
                      )}) : (
                          <tr><td colSpan="10" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">No targets assigned for {myTargetMonth}</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
      </div>

      {/* --- VIEW TARGET MODAL --- */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 flex justify-between items-center text-white bg-[#103c7f]">
                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        <Target size={16}/> My KPI Detail
                    </h3>
                    <button onClick={() => setIsViewModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
                </div>
                <div className="p-5 flex flex-col items-center justify-center text-center">
                    <User size={40} className="text-emerald-200 mb-3" />
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assigned By</p>
                    <h4 className="text-base font-black text-gray-800">{viewData.assignedTo}</h4>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{viewData.role}</p>
                    <div className="w-full bg-gray-100 h-px my-4"></div>
                    <p className="text-xs text-gray-600">Daily update logs for your <b>{viewData.kpi_metric}</b> will be displayed here.</p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}