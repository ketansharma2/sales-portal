"use client";
import { useState, useEffect } from "react";
import { 
  Target, Users, Save, AlertCircle, TrendingUp, 
  CheckCircle, Calculator, Calendar, MapPin, Phone, Briefcase, BarChart3
} from "lucide-react";

export default function ManagerTargetPage() {

  // --- HOD ASSIGNMENT DATA ---
  const [hodAssignment, setHodAssignment] = useState({
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    workingDays: 24,
    totalVisits: 0,
    totalOnboards: 0,
    totalCalls: 0,
    visitPerDay: 0,
    onboardPerMonth: 0,
    callsPerDay: 0
  });
  const [loading, setLoading] = useState(true);

  // --- FETCH HOD ASSIGNMENT ---
  const fetchHodAssignment = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`/api/corporate/manager/targets?month=${new Date().toISOString().split('T')[0].substring(0, 7) + '-01'}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHodAssignment({
          month: new Date(data.data.month).toLocaleString('default', { month: 'long', year: 'numeric' }),
          workingDays: data.data.workingDays,
          totalVisits: data.data.totalVisits,
          totalOnboards: data.data.totalOnboards,
          totalCalls: data.data.totalCalls,
          visitPerDay: data.data.visitPerDay,
          onboardPerMonth: data.data.onboardPerMonth,
          callsPerDay: data.data.callsPerDay
        });
      }
    } catch (error) {
      console.error('Failed to fetch HOD assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHodAssignment();
    fetchTeam();
  }, []);

  // --- TEAM MEMBERS (With Previous Achievement) ---
  const [team, setTeam] = useState([]);

  // --- FETCH TEAM ---
  const fetchTeam = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/manager/team-members', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Transform to UI format with default values
        const formattedTeam = data.data.map(member => ({
          id: member.user_id,
          name: member.name,
          role: member.role.includes('FSE') ? 'FSE' : 'LeadGen', // Simplify role
          prevAch: "85%", // Default, can be calculated later
          visits: member.role.includes('FSE') ? 192 : 0, // Default 192 for FSE
          onboards: member.role.includes('FSE') ? 12 : 0, // Default 12 for FSE
          calls: member.role.includes('LeadGen') ? 0 : 0
        }));
        setTeam(formattedTeam);
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
    }
  };

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

  const handleSave = async () => {
    if (stats.remVisits !== 0 || stats.remOnboards !== 0 || stats.remCalls !== 0) {
        if(!confirm("Warning: Targets are not perfectly distributed. Save anyway?")) return;
    }

    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      // Prepare targets array
      const targets = team.map(member => ({
        user_id: member.id,
        visits: member.visits,
        onboards: member.onboards,
        calls: member.calls
      }));

      const response = await fetch('/api/corporate/manager/targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          month: new Date().toISOString().split('T')[0].substring(0, 7) + '-01',
          targets
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || "Team Targets Published Successfully!");
      } else {
        alert('Failed to publish targets: ' + (data.details || data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to publish targets:', error);
      alert('Network error while publishing targets');
    }
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
                     <TrendingUp size={10}/> Ideal: {hodAssignment.visitPerDay} / Day per FSE
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
                     <CheckCircle size={10}/> Ideal: {hodAssignment.onboardPerMonth} / Mon per FSE
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
                     <Phone size={10}/> Ideal: {hodAssignment.callsPerDay} / Day per Caller
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