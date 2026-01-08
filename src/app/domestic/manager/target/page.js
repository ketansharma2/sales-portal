"use client";
import { useState, useEffect } from "react";
import { 
  Target, Users, Save, AlertCircle, TrendingUp, 
  CheckCircle, Calculator, Calendar, MapPin, Phone, Briefcase, BarChart3
} from "lucide-react";

export default function ManagerTargetPage() {

  // --- MOCK DATA: HOD SE AAYA HUA ASSIGNMENT ---
  const [hodAssignment, setHodAssignment] = useState({
    month: "January 2026",
    workingDays: 24,
    totalVisits: 768,    
    totalOnboards: 40,   
    totalCalls: 5760,    
    // HOD logic for reference (1 Person Target)
    fseDailyVisit: 4,
    fseMonthlyOnboard: 5,
    leadGenDailyCall: 60
  });

  // --- TEAM MEMBERS (With Previous Achievement) ---
  const [team, setTeam] = useState([
    { id: 1, name: "Amit Kumar", role: "FSE", prevAch: "105%", visits: 96, onboards: 5, calls: 0 },
    { id: 2, name: "Rohan Singh", role: "FSE", prevAch: "92%", visits: 96, onboards: 5, calls: 0 },
    { id: 3, name: "Vikram Malhotra", role: "FSE", prevAch: "80%", visits: 90, onboards: 4, calls: 0 },
    { id: 4, name: "Rahul Sharma", role: "LeadGen", prevAch: "100%", visits: 0, onboards: 0, calls: 1440 },
    { id: 5, name: "Priya Singh", role: "LeadGen", prevAch: "98%", visits: 0, onboards: 0, calls: 1440 },
  ]);

  // --- REAL-TIME CALCULATION ---
  const [stats, setStats] = useState({
    distVisits: 0, distOnboards: 0, distCalls: 0,
    remVisits: 0, remOnboards: 0, remCalls: 0
  });

  useEffect(() => {
    const v = team.reduce((acc, curr) => acc + Number(curr.visits), 0);
    const o = team.reduce((acc, curr) => acc + Number(curr.onboards), 0);
    const c = team.reduce((acc, curr) => acc + Number(curr.calls), 0);
    
    setStats({
        distVisits: v, distOnboards: o, distCalls: c,
        remVisits: hodAssignment.totalVisits - v,
        remOnboards: hodAssignment.totalOnboards - o,
        remCalls: hodAssignment.totalCalls - c
    });
  }, [team, hodAssignment]);

  const handleInputChange = (id, field, value) => {
    setTeam(team.map(m => m.id === id ? { ...m, [field]: Number(value) } : m));
  };

  const handleSave = () => {
    if (stats.remVisits !== 0 || stats.remOnboards !== 0 || stats.remCalls !== 0) {
        if(!confirm("Warning: Targets are not perfectly distributed. Save anyway?")) return;
    }
    alert("Team Targets Published Successfully!");
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50/50 font-['Calibri'] pb-24">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-end mb-4">
         <div>
            <div className="flex items-center gap-3">
               <div className="bg-[#103c7f] p-2 rounded-lg text-white shadow-lg shadow-blue-900/20">
                  <Target size={22} />
               </div>
               <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Team Target Distribution</h1>
            </div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-2 ml-1">
               {hodAssignment.month} • <span className="text-[#103c7f]">Working Days: {hodAssignment.workingDays}</span>
            </p>
         </div>
         <button onClick={handleSave} className="bg-[#103c7f] hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-blue-900/20 flex items-center gap-2 transition transform active:scale-95">
            <Save size={18} /> Publish Targets
         </button>
      </div>

      {/* 2. HOD TARGET CARDS (Updated UI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
         
         {/* VISITS CARD */}
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
               <span className="bg-blue-50 text-[#103c7f] p-2 rounded-xl border border-blue-100"><MapPin size={20} /></span>
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Total Visits Target</h3>
            </div>
            <div className="flex justify-between items-end">
               <div>
                  <span className="text-2xl font-black text-gray-800 leading-none">{hodAssignment.totalVisits}</span>
                  <div className="text-[10px] font-bold text-blue-600 uppercase mt-2 flex items-center gap-1">
                     <TrendingUp size={10}/> Ideal: {hodAssignment.fseDailyVisit} / Day per FSE
                  </div>
               </div>
               <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${stats.remVisits === 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                  Rem: {stats.remVisits}
               </div>
            </div>
         </div>

         {/* ONBOARDS CARD */}
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
               <span className="bg-green-50 text-green-600 p-2 rounded-xl border border-green-100"><Briefcase size={20} /></span>
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Total Onboarding</h3>
            </div>
            <div className="flex justify-between items-end">
               <div>
                  <span className="text-2xl font-black text-gray-800 leading-none">{hodAssignment.totalOnboards}</span>
                  <div className="text-[10px] font-bold text-green-600 uppercase mt-2 flex items-center gap-1">
                     <CheckCircle size={10}/> Ideal: {hodAssignment.fseMonthlyOnboard} / Mon per FSE
                  </div>
               </div>
               <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${stats.remOnboards === 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                  Rem: {stats.remOnboards}
               </div>
            </div>
         </div>

         {/* CALLS CARD */}
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
               <span className="bg-orange-50 text-orange-600 p-2 rounded-xl border border-orange-100"><Phone size={20} /></span>
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Total Calling Target</h3>
            </div>
            <div className="flex justify-between items-end">
               <div>
                  <span className="text-2xl font-black text-gray-800 leading-none">{hodAssignment.totalCalls}</span>
                  <div className="text-[10px] font-bold text-orange-600 uppercase mt-2 flex items-center gap-1">
                     <Phone size={10}/> Ideal: {hodAssignment.leadGenDailyCall} / Day per Caller
                  </div>
               </div>
               <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${stats.remCalls === 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                  Rem: {stats.remCalls}
               </div>
            </div>
         </div>

      </div>

      {/* 3. DISTRIBUTION TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
               <Calculator size={18} className="text-[#103c7f]"/> Target Allocation Logic
            </h3>
            <div className="flex gap-6">
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Distributed Visits</span>
                  <span className="text-sm font-black text-[#103c7f]">{stats.distVisits} / {hodAssignment.totalVisits}</span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Distributed Onboards</span>
                  <span className="text-sm font-black text-green-600">{stats.distOnboards} / {hodAssignment.totalOnboards}</span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Distributed Calls</span>
                  <span className="text-sm font-black text-orange-600">{stats.distCalls} / {hodAssignment.totalCalls}</span>
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-[#103c7f] text-white text-[11px] uppercase font-bold tracking-wider">
                  <tr>
                     <th className="px-6 py-4">Member Name</th>
                     <th className="px-6 py-4">Role</th>
                     <th className="px-6 py-4 text-center">Previous Achievement</th>
                     <th className="px-6 py-4 text-center bg-white/10">Monthly Visits</th>
                     <th className="px-6 py-4 text-center bg-white/10">Monthly Onboards</th>
                     <th className="px-6 py-4 text-center bg-white/10">Monthly Calls</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 text-sm">
                  {team.map((member) => (
                     <tr key={member.id} className="hover:bg-blue-50/30 transition group">
                        <td className="px-6 py-5">
                           <div className="font-black text-gray-800 text-base">{member.name}</div>
                        </td>
                        <td className="px-6 py-5">
                           <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border shadow-sm ${
                              member.role === 'FSE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                           }`}>
                              {member.role}
                           </span>
                        </td>
                        
                        {/* 👉 PREVIOUS ACHIEVEMENT COLUMN */}
                        <td className="px-6 py-5 text-center">
                           <div className={`inline-flex items-center gap-1 font-black text-sm ${
                              parseInt(member.prevAch) >= 100 ? 'text-green-600' : 'text-orange-500'
                           }`}>
                              <BarChart3 size={14}/> {member.prevAch}
                           </div>
                           <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Last Month</p>
                        </td>
                        
                        {/* Visits Input */}
                        <td className="px-6 py-5 bg-gray-50/30">
                           <div className="flex flex-col items-center gap-1">
                              <input type="number" value={member.visits} onChange={(e) => handleInputChange(member.id, 'visits', e.target.value)} disabled={member.role === 'LeadGen'} className="w-20 bg-white border border-gray-300 rounded-lg py-2 text-center font-black text-gray-800 focus:border-[#103c7f] outline-none shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200" />
                              <span className="text-[9px] text-gray-400 font-bold uppercase">
                                 {member.role === 'FSE' ? `~${(member.visits / hodAssignment.workingDays).toFixed(1)} / day` : '-'}
                              </span>
                           </div>
                        </td>

                        {/* Onboards Input */}
                        <td className="px-6 py-5 bg-gray-50/30">
                           <input type="number" value={member.onboards} onChange={(e) => handleInputChange(member.id, 'onboards', e.target.value)} disabled={member.role === 'LeadGen'} className="w-20 mx-auto block bg-white border border-gray-300 rounded-lg py-2 text-center font-black text-gray-800 focus:border-[#103c7f] outline-none shadow-sm disabled:bg-gray-100 disabled:text-gray-400" />
                        </td>

                        {/* Calls Input */}
                        <td className="px-6 py-5 bg-gray-50/30">
                           <div className="flex flex-col items-center gap-1">
                              <input type="number" value={member.calls} onChange={(e) => handleInputChange(member.id, 'calls', e.target.value)} disabled={member.role === 'FSE'} className="w-24 bg-white border border-gray-300 rounded-lg py-2 text-center font-black text-gray-800 focus:border-orange-500 outline-none shadow-sm disabled:bg-gray-100 disabled:text-gray-400" />
                              <span className="text-[9px] text-gray-400 font-bold uppercase">
                                 {member.role === 'LeadGen' ? `~${(member.calls / hodAssignment.workingDays).toFixed(0)} / day` : '-'}
                              </span>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Info Footer */}
      <div className="mt-8 flex justify-center">
         <div className="bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <Calculator size={20} className="text-[#103c7f]"/>
            <p className="text-xs text-gray-500 font-medium">
               Allocation Tip: Check <strong>Previous Achievement</strong> to balance workload. <br/>
               Total Distributed must ideally match the <strong>Total Target</strong> assigned by HOD.
            </p>
         </div>
      </div>

    </div>
  );
}