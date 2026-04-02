"use client";
import { 
    LayoutDashboard, FileText, 
    PhoneCall, CalendarDays, UserCheck , Users, Target, CheckCircle2, TrendingUp, Search, Rocket, Globe2, Store,
    IndianRupee, Building2, Briefcase, MapPin, Sparkles, Handshake
} from "lucide-react";

export default function DirectorDashboardPage() {
    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-4">
            
           {/* --- HEADER --- */}
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                        <LayoutDashboard size={24} className="text-blue-600"/> Director Dashboard
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 ml-8">
                        High-Level Executive Overview & Pipeline Tracking
                    </p>
                </div>
                {/* Button to navigate to Morning Report */}
                <button 
                    onClick={() => window.location.href = '/admin/morning-report'} 
                    className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-5 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer w-max"
                >
                    <FileText size={16} /> Morning Report
                </button>
            </div>
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                
                {/* ========================================================= */}
                {/* SECTION 1: EXECUTIVE OVERVIEW (GOOD NEWS KPIs)            */}
                {/* ========================================================= */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={20} className="text-amber-500" />
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Today's Highlights</h2>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* --- CORPORATE SECTOR --- */}
                        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-4 flex items-center justify-between">
                                <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2 text-sm">
                                    <Briefcase size={18}/> Corporate Sector
                                </h3>
                                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                    High Ticket
                                </span>
                            </div>
                            
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/30">
                                <DirectorKPICard 
                                    title="Revenue Generated" 
                                    value="₹ 12,50,000" 
                                    icon={<IndianRupee size={20}/>} 
                                    iconBg="bg-emerald-100 text-emerald-600"
                                    trend="+ 15% this month" 
                                    trendPositive={true}
                                />
                                <DirectorKPICard 
                                    title="Clients Onboarded" 
                                    value="08" 
                                    icon={<Building2 size={20}/>} 
                                    iconBg="bg-blue-100 text-blue-600"
                                    trend="+ 2 today" 
                                    trendPositive={true}
                                />
                                <DirectorKPICard 
                                    title="Candidates Joined" 
                                    value="24" 
                                    icon={<Handshake size={20}/>} 
                                    iconBg="bg-purple-100 text-purple-600"
                                    trend="+ 5 this week" 
                                    trendPositive={true}
                                />
                            </div>
                        </div>

                        {/* --- DOMESTIC SECTOR --- */}
                        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-4 flex items-center justify-between">
                                <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2 text-sm">
                                    <MapPin size={18}/> Domestic Sector
                                </h3>
                                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                    High Volume
                                </span>
                            </div>
                            
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50/30">
                                <DirectorKPICard 
                                    title="Revenue Generated" 
                                    value="₹ 4,20,000" 
                                    icon={<IndianRupee size={20}/>} 
                                    iconBg="bg-emerald-100 text-emerald-600"
                                    trend="+ 8% this month" 
                                    trendPositive={true}
                                />
                                <DirectorKPICard 
                                    title="Clients Onboarded" 
                                    value="15" 
                                    icon={<Building2 size={20}/>} 
                                    iconBg="bg-orange-100 text-orange-600"
                                    trend="+ 4 today" 
                                    trendPositive={true}
                                />
                                <DirectorKPICard 
                                    title="Candidates Joined" 
                                    value="45" 
                                    icon={<Handshake size={20}/>} 
                                    iconBg="bg-rose-100 text-rose-600"
                                    trend="+ 12 this week" 
                                    trendPositive={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>

              
            </div>
        </div>
    );
}

/* --- REUSABLE COMPONENT FOR NEW EXECUTIVE VIEW --- */
function DirectorKPICard({ title, value, icon, iconBg, trend, trendPositive }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                        {icon}
                    </div>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight">
                        {title}
                    </p>
                </div>
            </div>
            <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${trendPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trend}
                </p>
            </div>
        </div>
    );
}