"use client";
import { useState, useEffect } from "react";
import { 
    FileText, ArrowLeft, Briefcase, Users, 
    Laptop, SunMedium , TrendingUp, Building2, Home, Rocket,IndianRupee, CheckCircle2, Globe2, Store
} from "lucide-react";

export default function MorningReportPage() {
    // --- STATE FOR TABS ---
    const [activeTab, setActiveTab] = useState("Sales & Delivery");

    // --- GET CURRENT MONTH ---
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

    // --- GET YESTERDAY'S DATE ---
    // If yesterday is Sunday (day 0), use Saturday instead
    const getLastWorkingDay = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        // If Sunday (0), go back to Saturday (6)
        if (yesterday.getDay() === 0) {
            yesterday.setDate(yesterday.getDate() - 1);
        }
        return yesterday;
    };
    
    const lastWorkingDay = getLastWorkingDay();
    const yesterdayDate = lastWorkingDay.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // e.g., "08 Mar"

    // --- STATE FOR DOMESTIC SECTOR DATA ---
    const [domesticStats, setDomesticStats] = useState({
        totalVisits: 0,
        yesterdayVisits: 0,
        totalOnboarded: 0,
        yesterdayOnboarded: 0,
        yesterdayOnboardNames: [],
        individualVisits: 0,
        repeatVisits: 0,
        yesterdayReachedOut: 0,
        yesterdayInterested: 0,
        loading: true
    });

    // --- FETCH DOMESTIC SECTOR DATA ---
    useEffect(() => {
        const fetchDomesticStats = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch('/api/admin/morning-report/domestic', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await response.json();
                
                if (data.success) {
                    setDomesticStats({
                        totalVisits: data.data.totalVisits || 0,
                        yesterdayVisits: data.data.yesterdayVisits || 0,
                        totalOnboarded: data.data.totalOnboarded || 0,
                        yesterdayOnboarded: data.data.yesterdayOnboarded || 0,
                        yesterdayOnboardNames: data.data.yesterdayOnboardNames || [],
                        individualVisits: data.data.individualVisits || 0,
                        repeatVisits: data.data.repeatVisits || 0,
                        yesterdayReachedOut: data.data.yesterdayReachedOut || 0,
                        yesterdayInterested: data.data.yesterdayInterested || 0,
                        loading: false
                    });
                }
            } catch (error) {
                console.error('Error fetching domestic stats:', error);
                setDomesticStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchDomesticStats();
    }, []);

    // --- TAB DEFINITIONS ---
    const tabs = [
        { name: "Sales & Delivery", icon: <Briefcase size={16} /> },
        { name: "HR and IT", icon: <Users size={16} /> },
        { name: "Tech", icon: <Laptop size={16} /> }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6">
            
            {/* --- HEADER WITH BACK BUTTON --- */}
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.history.back()} 
                        className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                            <SunMedium size={24} className="text-orange-500"/> Morning Report
                        </h1>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            Daily Department-Wise Morning Updates
                        </p>
                    </div>
                </div>
            </div>

            {/* --- TABS NAVIGATION --- */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`px-5 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeTab === tab.name
                            ? 'bg-[#103c7f] text-white shadow-md'
                            : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200 border-b-0'
                        }`}
                    >
                        {tab.icon}
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* --- TAB CONTENT AREA --- */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 min-h-[500px] animate-in fade-in zoom-in-95 duration-300">
                
                {/* 1. SALES & DELIVERY TAB */}
                {/* 1. SALES & DELIVERY TAB */}
                {activeTab === "Sales & Delivery" && (
                    <div className="animate-in fade-in duration-500">
                        
                        {/* ========================================= */}
                        {/* ---------- SALES DEPARTMENT BLOCK --------- */}
                        {/* ========================================= */}
                        <div className="mb-8">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <TrendingUp size={18} className="text-blue-600"/> Sales
                            </h2>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                
                               {/* --- CORPORATE SALES (SPLIT-CARD DESIGN) --- */}
                                <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-indigo-50 p-3 border-b border-indigo-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={16} className="text-indigo-600"/>
                                            <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Corporate Sector</h4>
                                        </div>
                                        <span className="bg-white text-indigo-500 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-200">Sales</span>
                                    </div>
                                    
                                    {/* High-Density Split-Card Grid */}
                                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 bg-slate-50/30">
                                        
                                        {/* Client Search */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Client Search</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">150</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-indigo-50/50"><p className="text-[8px] font-black text-indigo-400 uppercase">Yest</p><p className="text-base font-black text-indigo-700 leading-none mt-1">12</p></div>
                                            </div>
                                        </div>

                                        {/* Client Calling */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Client Calling</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">320</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-indigo-50/50"><p className="text-[8px] font-black text-indigo-400 uppercase">Yest</p><p className="text-base font-black text-indigo-700 leading-none mt-1">45</p></div>
                                            </div>
                                        </div>

                                        {/* Contract Share */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Contract Share</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">24</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-indigo-50/50"><p className="text-[8px] font-black text-indigo-400 uppercase">Yest</p><p className="text-base font-black text-indigo-700 leading-none mt-1">2</p></div>
                                            </div>
                                        </div>

                                        {/* Startup Search */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Startup Search</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">85</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-orange-50/50"><p className="text-[8px] font-black text-orange-400 uppercase">Yest</p><p className="text-base font-black text-orange-700 leading-none mt-1">8</p></div>
                                            </div>
                                        </div>

                                        {/* Startup Calling */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Startup Calling</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">190</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-orange-50/50"><p className="text-[8px] font-black text-orange-400 uppercase">Yest</p><p className="text-base font-black text-orange-700 leading-none mt-1">20</p></div>
                                            </div>
                                        </div>

                                        {/* Master Union Clients (Only Total) */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Master Union Clients</p></div>
                                            <div className="flex-1 p-1.5 text-center bg-purple-50/30 flex flex-col justify-center">
                                                <p className="text-[8px] font-black text-purple-400 uppercase">Total Only</p>
                                                <p className="text-base font-black text-purple-800 leading-none mt-1">42</p>
                                            </div>
                                        </div>

                                        {/* Master Union Profiles (Only Total) */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Master Union Profiles</p></div>
                                            <div className="flex-1 p-1.5 text-center bg-purple-50/30 flex flex-col justify-center">
                                                <p className="text-[8px] font-black text-purple-400 uppercase">Total Only</p>
                                                <p className="text-base font-black text-purple-800 leading-none mt-1">110</p>
                                            </div>
                                        </div>

                                        {/* Master Union Calling (Only Total) */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Master Union Calling</p></div>
                                            <div className="flex-1 p-1.5 text-center bg-purple-50/30 flex flex-col justify-center">
                                                <p className="text-[8px] font-black text-purple-400 uppercase">Total Only</p>
                                                <p className="text-base font-black text-purple-800 leading-none mt-1">315</p>
                                            </div>
                                        </div>

                                        {/* Franchise Discussed */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-rose-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Fran. Discussed</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">55</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-rose-50/50"><p className="text-[8px] font-black text-rose-400 uppercase">Yest</p><p className="text-base font-black text-rose-700 leading-none mt-1">5</p></div>
                                            </div>
                                        </div>

                                        {/* Form Ask */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-rose-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Form Ask</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">28</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-rose-50/50"><p className="text-[8px] font-black text-rose-400 uppercase">Yest</p><p className="text-base font-black text-rose-700 leading-none mt-1">2</p></div>
                                            </div>
                                        </div>

                                        {/* Form Shared */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-rose-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Form Shared</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">20</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-rose-50/50"><p className="text-[8px] font-black text-rose-400 uppercase">Yest</p><p className="text-base font-black text-rose-700 leading-none mt-1">1</p></div>
                                            </div>
                                        </div>

                                    </div>
                                    
                                    {/* Editable Remarks Area */}
                                    <div className="p-3 bg-indigo-50/50 border-t border-indigo-100 mt-auto">
                                        <label className="text-[10px] font-black text-indigo-800 uppercase mb-1 block">Remarks</label>
                                        <textarea 
                                            className="w-full text-xs font-bold text-slate-700 p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white shadow-inner resize-none" 
                                            rows="2" 
                                            placeholder="Enter your remarks for the Corporate Sales team..."
                                            defaultValue="Good progress on Startup Calling, focus more on Contract conversions today."
                                        ></textarea>
                                    </div>
                                </div>

                               {/* --- DOMESTIC SALES --- */}
                                <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-orange-50 p-3 border-b border-orange-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Home size={16} className="text-orange-600"/>
                                            <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest">Domestic Sector</h4>
                                        </div>
                                        <span className="bg-white text-orange-500 text-[9px] font-bold px-2 py-0.5 rounded border border-orange-200">Sales</span>
                                    </div>
                                    
                                    {/* High-Density Metrics Grid */}
                                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 bg-slate-50/30">
                                        
                                        {/* Visit Metrics */}
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">{currentMonth} Visits (Tot)</p>
                                            <div className="flex items-end justify-center gap-1">
                                                <p className="text-lg font-black text-slate-800 leading-none">
                                                    {domesticStats.loading ? '-' : domesticStats.totalVisits}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Yest. Visits ({yesterdayDate})</p>
                                            <div className="flex items-end justify-center gap-1">
                                                <p className="text-lg font-black text-slate-800 leading-none">
                                                    {domesticStats.loading ? '-' : domesticStats.yesterdayVisits}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Individual / Repeat</p>
                                            <div className="flex items-end justify-center gap-2">
                                                <p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.individualVisits} <span className="text-[9px] font-bold text-slate-400">Ind</span></p>
                                                <p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.repeatVisits} <span className="text-[9px] font-bold text-slate-400">Rep</span></p>
                                            </div>
                                        </div>

                                        {/* Pipeline Metrics */}
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Reached Out (Yest)</p>
                                            <div className="flex items-end justify-center gap-1"><p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.yesterdayReachedOut}</p></div>
                                        </div>
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Interested (Yest)</p>
                                            <div className="flex items-end justify-center gap-1"><p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.yesterdayInterested}</p></div>
                                        </div>
                                        <div className="border border-emerald-200 p-2 rounded-lg bg-emerald-50 text-center shadow-sm hover:border-emerald-300 transition-all">
                                            <p className="text-[9px] font-black text-emerald-700 uppercase leading-tight mb-1 truncate">Total Onboard ({currentMonth})</p>
                                            <div className="flex items-end justify-center gap-1">
                                                <p className="text-lg font-black text-emerald-900 leading-none">
                                                    {domesticStats.loading ? '-' : domesticStats.totalOnboarded}
                                                </p>
                                            </div>
                                        </div>

                                        {/* EDITABLE KPI: Total Expected CTC */}
                                        <div className="col-span-2 sm:col-span-3 border border-orange-200 p-2 rounded-lg bg-orange-50/50 text-center shadow-sm hover:border-orange-400 transition-all group relative">
                                            <p className="text-[9px] font-bold text-orange-600 uppercase leading-tight mb-1">Total CTC</p>
                                            <div className="flex items-center justify-center">
                                                <span className="text-lg font-black text-orange-800 mr-1">₹</span>
                                                <input 
                                                    type="text" 
                                                    className="text-lg font-black text-orange-800 bg-transparent border-b border-dashed border-orange-300 outline-none text-center w-32 focus:border-orange-600 transition-colors"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Onboarded Detail Row (Names) */}
                                        <div className="col-span-2 sm:col-span-3 border border-slate-200 p-2.5 rounded-lg bg-white flex flex-col justify-center gap-1 shadow-sm hover:border-orange-300 transition-all">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase">Onboarded (Yest) & Names</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl font-black text-slate-800 bg-slate-100 px-2 rounded">{domesticStats.loading ? '-' : domesticStats.yesterdayOnboarded}</span>
                                                <input 
                                                    type="text" 
                                                    className="text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-orange-400 focus:bg-white w-full transition-colors"
                                                    placeholder="Type client names here..."
                                                    defaultValue={domesticStats.yesterdayOnboardNames.join(', ')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Editable Remarks Area */}
                                    <div className="p-3 bg-orange-50/50 border-t border-orange-100 mt-auto">
                                        <label className="text-[10px] font-black text-orange-800 uppercase mb-1 block">Remarks</label>
                                        <textarea 
                                            className="w-full text-xs font-bold text-slate-700 p-2 border border-slate-300 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 bg-white shadow-inner resize-none" 
                                            rows="2" 
                                            placeholder="Enter your remarks for the Domestic Sales team..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                       {/* ========================================= */}
                        {/* --------- DELIVERY DEPARTMENT BLOCK ------- */}
                        {/* ========================================= */}
                        <div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Rocket size={18} className="text-purple-600"/> Delivery
                            </h2>
                            
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                
                                {/* --- CORPORATE DELIVERY (COMING SOON) --- */}
                                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 overflow-hidden flex flex-col justify-center items-center p-8 min-h-[180px] relative group cursor-not-allowed">
                                    <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[1px]"></div>
                                    <div className="z-10 flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Building2 size={32} className="text-slate-400 mb-2"/>
                                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Corporate Delivery</h4>
                                        <div className="mt-3 bg-white text-slate-800 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-200 shadow-sm uppercase tracking-wider">
                                            Coming Soon
                                        </div>
                                    </div>
                                </div>

                                {/* --- DOMESTIC DELIVERY (COMING SOON) --- */}
                                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 overflow-hidden flex flex-col justify-center items-center p-8 min-h-[180px] relative group cursor-not-allowed">
                                    <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[1px]"></div>
                                    <div className="z-10 flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Home size={32} className="text-slate-400 mb-2"/>
                                        <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Domestic Delivery</h4>
                                        <div className="mt-3 bg-white text-slate-800 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-200 shadow-sm uppercase tracking-wider">
                                            Coming Soon
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                )}

                {/* 2. HR & IT TAB */}
                {activeTab === "HR and IT" && (
                    <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Users size={16} className="text-purple-600"/> HR & IT Updates
                        </h2>
                        
                        <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                            <p className="text-sm font-bold uppercase tracking-widest">Waiting for HR & IT KPIs...</p>
                            <p className="text-[10px] mt-2">Attendance, Hiring pipeline, and System health metrics will be here.</p>
                        </div>
                    </div>
                )}

                {/* 3. TECH TAB */}
                {activeTab === "Tech" && (
                    <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Laptop size={16} className="text-emerald-600"/> Tech Department Updates
                        </h2>
                        
                        <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                            <p className="text-sm font-bold uppercase tracking-widest">Waiting for Tech KPIs...</p>
                            <p className="text-[10px] mt-2">Dev sprints, Bugs, and Deployment metrics will be rendered here.</p>
                        </div>
                    </div>
                )}

            </div>

        </div>
    );
}