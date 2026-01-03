"use client";
import { useState } from "react";
import { 
  Target, Users, Save, Search, TrendingUp, 
  ChevronDown, CheckCircle, AlertCircle, BarChart3 
} from "lucide-react";

export default function HODTargets() {
  
  // 👇 MOCK DATA: Managers and their FSEs
  const [teams, setTeams] = useState([
    {
      managerId: 101,
      managerName: "Diwakar",
      region: "North Zone",
      fses: [
        { id: 1, name: "Monu", role: "Sr. FSE", visitTarget: 5, onboardTarget: 10, lastMonthPerf: "110%" },
        { id: 2, name: "Amit Verma", role: "FSE", visitTarget: 4, onboardTarget: 8, lastMonthPerf: "85%" },
        
      ]
    },
    {
      managerId: 102,
      managerName: "Monu",
      region: "South Zone",
      fses: [
        { id: 4, name: "Saurabh", role: "Sr. FSE", visitTarget: 6, onboardTarget: 12, lastMonthPerf: "105%" },
        { id: 5, name: "Priya Das", role: "FSE", visitTarget: 4, onboardTarget: 8, lastMonthPerf: "78%" },
      ]
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState(null); // To show loading state on specific button

  // --- HANDLE INPUT CHANGE ---
  const handleTargetChange = (managerId, fseId, field, value) => {
    setTeams(prevTeams => prevTeams.map(team => {
      if (team.managerId !== managerId) return team;
      return {
        ...team,
        fses: team.fses.map(fse => 
          fse.id === fseId ? { ...fse, [field]: Number(value) } : fse
        )
      };
    }));
  };

  // --- SAVE FUNCTION ---
  const saveIndividualTarget = (fseId) => {
    setSavingId(fseId);
    // Simulate API Call
    setTimeout(() => {
      setSavingId(null);
      alert("Target Updated Successfully!");
    }, 1000);
  };

  // Filter Logic
  const filteredTeams = teams.filter(team => 
    team.managerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    team.fses.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
<div className="h-screen overflow-y-auto bg-[#f8fafc] w-full font-['Calibri'] p-2 flex flex-col pb-20">      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
           <h1 className="text-3xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">
             Target Configuration
           </h1>
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> 
              Goal Setting Console
           </p>
        </div>
        
        {/* GLOBAL STATS WIDGET */}
        <div className="flex gap-4">
            <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-[#103c7f]"><Users size={20}/></div>
                <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total FSEs</p>
                    <p className="text-xl font-black text-[#103c7f]">24</p>
                </div>
            </div>
            <div className="bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="bg-green-50 p-2 rounded-lg text-green-600"><Target size={20}/></div>
                <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Revenue Goal</p>
                    <p className="text-xl font-black text-green-600">₹ 45L</p>
                </div>
            </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm mb-6 flex items-center gap-3 w-full max-w-md">
         <Search size={18} className="text-gray-300"/>
         <input 
            type="text" 
            placeholder="Search Manager or FSE Name..." 
            className="w-full text-sm font-bold text-[#103c7f] placeholder:text-gray-300 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
         />
      </div>

      {/* TEAMS GRID */}
      <div className="grid grid-cols-1 gap-8 pb-10">
        
        {filteredTeams.map((team) => (
            <div key={team.managerId} className="bg-white rounded-[24px] border border-gray-200 shadow-lg shadow-gray-100/50 overflow-hidden">
                
                {/* TEAM HEADER */}
                <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-white font-black uppercase tracking-wide text-lg">{team.managerName}</h2>
                            <span className="text-blue-200 text-[10px] font-bold uppercase tracking-widest bg-blue-900/50 px-2 py-0.5 rounded">
                                {team.region} • {team.fses.length} Members
                            </span>
                        </div>
                    </div>
                    {/* Bulk Action (Optional) */}
                    <button className="text-[10px] font-bold text-white uppercase bg-white/10 px-3 py-1.5 rounded-lg hover:bg-[#a1db40] hover:text-[#103c7f] transition-all">
                        Set Team Default
                    </button>
                </div>

                {/* FSE TABLE */}
                <div className="p-2">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-[10px] uppercase font-black text-gray-400 tracking-widest bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Team Member</th>
                                <th className="px-6 py-3">Performance (Last Month)</th>
                                <th className="px-6 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <TrendingUp size={12}/> Daily Visit Target
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Target size={12}/> Monthly Onboarding
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {team.fses.map((fse) => (
                                <tr key={fse.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-all">
                                    
                                    {/* Name */}
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-[#103c7f]">{fse.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{fse.role}</p>
                                    </td>

                                    {/* Performance Badge */}
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black ${
                                            parseInt(fse.lastMonthPerf) >= 100 
                                            ? 'bg-green-50 text-green-600' 
                                            : 'bg-orange-50 text-orange-600'
                                        }`}>
                                            {fse.lastMonthPerf} Achieved
                                        </span>
                                    </td>

                                    {/* Daily Visit Input */}
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <input 
                                                type="number" 
                                                value={fse.visitTarget}
                                                onChange={(e) => handleTargetChange(team.managerId, fse.id, 'visitTarget', e.target.value)}
                                                className="w-16 p-2 text-center font-black text-[#103c7f] bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a1db40] outline-none"
                                            />
                                        </div>
                                    </td>

                                    {/* Monthly Onboarding Input */}
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <input 
                                                type="number" 
                                                value={fse.onboardTarget}
                                                onChange={(e) => handleTargetChange(team.managerId, fse.id, 'onboardTarget', e.target.value)}
                                                className="w-16 p-2 text-center font-black text-[#103c7f] bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a1db40] outline-none"
                                            />
                                        </div>
                                    </td>

                                    {/* Save Button */}
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => saveIndividualTarget(fse.id)}
                                            className="bg-[#103c7f] text-white p-2 rounded-lg hover:bg-[#a1db40] hover:text-[#103c7f] transition-all shadow-md active:scale-95"
                                            title="Save Target"
                                        >
                                            {savingId === fse.id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <Save size={16} />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ))}

      </div>
    </div>
  );
}