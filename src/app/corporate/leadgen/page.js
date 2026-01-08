"use client";
import Link from "next/link";
import { 
  Database, Phone, CheckCircle, Clock, Calendar,
  ArrowRight, Target, TrendingUp, Zap
} from "lucide-react";

export default function LeadGenHome() {
  
  // --- MOCK DATA ---
  const stats = {
    totalDb: 12500,
    pickedUp: 450,
    interested: 125,
    monthlyCallTarget: 1500,
    monthlyCallAchieved: 840,
    monthlyIntTarget: 50,
    monthlyIntAchieved: 12,
    dailyCallTarget: 60,
    dailyCallAchieved: 42,
    dailyIntTarget: 3,
    dailyIntAchieved: 1
  };

  const getPercent = (ach, tar) => Math.round((ach / tar) * 100);

  const followUps = {
    today: [
      { id: 1, company: "Tech Solutions", last_remark: "Send Rate Card" },
      { id: 2, company: "BuildWell Corp", last_remark: "Talk to Purchasing Mgr" },
    ],
    tomorrow: [
      { id: 3, company: "Alpha Traders",  last_remark: "Call for feedback" },
      { id: 4, company: "Delta Logistics",  last_remark: "Finalize deal" },
    ]
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-['Calibri']">
      
      {/* ================= LEFT SECTION (70%) ================= */}
      {/* Added flex flex-col and gap-10 for better row separation */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-10">
        
        {/* ROW 1: KPI CARDS */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-700"><Database size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Database</p>
              <h3 className="text-2xl font-black text-blue-900">{stats.totalDb.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-xl text-purple-700"><Phone size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calls Picked</p>
              <h3 className="text-2xl font-black text-purple-900">{stats.pickedUp}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl text-green-700"><CheckCircle size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interested Leads</p>
              <h3 className="text-2xl font-black text-green-900">{stats.interested}</h3>
            </div>
          </div>
        </div>

        {/* ROW 2: MONTHLY TARGETS */}
        <div>
           {/* Added pt-4 here to push the header down */}
           <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pt-4 flex items-center gap-2">
              <Calendar size={14} /> Monthly Performance Goal
           </h4>
           <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-indigo-500">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase">Monthly Call Target</span>
                    <span className="text-xs font-black text-indigo-600">{getPercent(stats.monthlyCallAchieved, stats.monthlyCallTarget)}%</span>
                 </div>
                 <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-gray-800">{stats.monthlyCallAchieved}</span>
                    <span className="text-sm font-bold text-gray-400">/ {stats.monthlyCallTarget}</span>
                 </div>
                 <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${getPercent(stats.monthlyCallAchieved, stats.monthlyCallTarget)}%` }}></div>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase">Monthly Interested Goal</span>
                    <span className="text-xs font-black text-emerald-600">{getPercent(stats.monthlyIntAchieved, stats.monthlyIntTarget)}%</span>
                 </div>
                 <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-black text-gray-800">{stats.monthlyIntAchieved}</span>
                    <span className="text-sm font-bold text-gray-400">/ {stats.monthlyIntTarget}</span>
                 </div>
                 <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${getPercent(stats.monthlyIntAchieved, stats.monthlyIntTarget)}%` }}></div>
                 </div>
              </div>
           </div>
        </div>

        {/* ROW 3: DAILY TARGETS */}
        <div>
           {/* Added pt-4 here to push the header down */}
           <h4 className="text-[11px] font-black text-orange-400 uppercase tracking-[0.2em] mb-4 pt-4 flex items-center gap-2">
              <Zap size={14} fill="currentColor" /> Today's Focus (DRR)
           </h4>
           <div className="grid grid-cols-2 gap-6">
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 relative">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-indigo-700 uppercase">Today's Call Count</span>
                    <div className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Live</div>
                 </div>
                 <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-black text-indigo-900">{stats.dailyCallAchieved}</span>
                    <span className="text-sm font-bold text-indigo-400">/ {stats.dailyCallTarget} Calls</span>
                 </div>
                 <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-indigo-100">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-700" style={{ width: `${getPercent(stats.dailyCallAchieved, stats.dailyCallTarget)}%` }}></div>
                 </div>
              </div>

              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 relative">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-emerald-700 uppercase">Today's Interested Leads</span>
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Goal</div>
                 </div>
                 <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-black text-emerald-900">{stats.dailyIntAchieved}</span>
                    <span className="text-sm font-bold text-emerald-400">/ {stats.dailyIntTarget} Leads</span>
                 </div>
                 <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-emerald-100">
                    <div className="h-full bg-emerald-600 rounded-full transition-all duration-700" style={{ width: `${getPercent(stats.dailyIntAchieved, stats.dailyIntTarget)}%` }}></div>
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* ================= RIGHT SECTION (SIDEBAR) ================= */}
      <div className="w-96 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl z-10">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-black text-[#103c7f] flex items-center gap-2">
            <Clock size={20} className="text-orange-500" /> Follow-up Schedule
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Today
            </h3>
            <div className="space-y-3">
              {followUps.today.map((item) => (
                <div key={item.id} className="p-3 bg-orange-50 border border-orange-100 rounded-xl hover:shadow-md transition-all group">
                  <h4 className="font-bold text-gray-800 text-sm mb-2">{item.company}</h4>
                  <div className="bg-white/60 p-2 rounded border border-orange-100 mb-3 text-xs italic text-gray-600">
                    <span className="font-bold text-orange-400 not-italic mr-1">Remark:</span> {item.last_remark}
                  </div>
                  <Link href={`/domestic/leadgen/leads?search=${item.company}`}>
                    <button className="w-full bg-white border border-orange-200 text-orange-700 text-xs font-bold py-1.5 rounded-lg hover:bg-orange-600 hover:text-white transition-colors flex items-center justify-center gap-1">
                      Call Now <ArrowRight size={12} />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
           <Link href="/domestic/leadgen/leads">
             <button className="w-full bg-[#103c7f] hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
               <Phone size={18} /> Open Master Database
             </button>
           </Link>
        </div>
      </div>

    </div>
  );
}