"use client";
import { useState } from "react";
import { 
    LayoutDashboard, Filter, ChevronRight, FileText, 
    PhoneCall, CalendarDays, UserCheck , Users, Target, CheckCircle2, TrendingUp, Search, Rocket, Globe2, Store
} from "lucide-react";

export default function DirectorDashboardPage() {
    // --- STATE ---
    const [department, setDepartment] = useState("Sales"); 
    const [sector, setSector] = useState("All"); 
    const [role, setRole] = useState("All"); 
    const [employee, setEmployee] = useState("All"); 

    // --- DEPENDENT LIST LOGIC ---
    const departmentsList = ["Sales", "Delivery", "Finance", "Tech", "Operations"];

    const getSectors = (dept) => {
        if (dept === "Sales" || dept === "Delivery") return ["Corporate", "Domestic"];
        if (dept === "Operations") return ["HR", "IT"];
        if (dept === "Tech") return ["Digital Marketing", "Data Management", "Development"];
        return ["NA"];
    };

    const getRoles = (dept) => {
        if (dept === "Sales") return ["HOD", "SM", "FSE", "Leadgen"];
        if (dept === "Delivery") return ["CRM", "TL", "Recruiter (RC)"];
        return ["NA"];
    };

    const getEmployees = (roleName) => {
        if (roleName === "Leadgen") return ["Khushi Chawla", "Aman", "Riya"];
        if (roleName === "FSE") return ["Rahul", "Vikash", "Priya"];
        if (roleName === "SM") return ["Gurmeet", "Shruti"];
        if (roleName === "Recruiter (RC)") return ["Pooja", "Sneha"];
        return ["NA"];
    };

    // --- HANDLERS FOR CASCADING DROPDOWNS ---
    const handleDepartmentChange = (e) => {
        setDepartment(e.target.value);
        setSector("All");
        setRole("All");
        setEmployee("All");
    };

    const handleRoleChange = (e) => {
        setRole(e.target.value);
        setEmployee("All");
    };

    // Current dependent lists based on selections
    const currentSectors = getSectors(department);
    const currentRoles = getRoles(department);
    const currentEmployees = getEmployees(role);

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-2">
            
           {/* --- HEADER --- */}
            <div className="mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                        <LayoutDashboard size={24} className="text-blue-600"/> Director Dashboard
                    </h1>
                </div>
                {/* Updated Button to navigate to Morning Report */}
                <button 
                    onClick={() => window.location.href = '/admin/morning-report'} // Next.js me aap <Link href="/admin/morning-report"> use kar sakte hain
                    className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
                >
                    <FileText size={16} /> Morning Report
                </button>
            </div>

            {/* --- CASCADING FILTER BAR --- */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-2 flex flex-wrap lg:flex-nowrap items-center gap-2">
                <div className="flex items-center justify-center px-3 border-r border-slate-200">
                    <Filter size={18} className="text-blue-600"/>
                </div>

                {/* 1. Department */}
                <select 
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[120px]"
                    value={department} onChange={handleDepartmentChange}
                >
                    {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <ChevronRight size={14} className="text-slate-300"/>

                {/* 2. Sector */}
                <select 
                    className={`text-xs font-bold rounded-lg px-3 py-2 outline-none cursor-pointer transition-colors ${currentSectors[0] === "NA" ? 'bg-slate-100 border border-slate-100 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500'}`}
                    value={sector} onChange={(e) => setSector(e.target.value)}
                    disabled={currentSectors[0] === "NA"}
                >
                    <option value="All">All Sectors</option>
                    {currentSectors[0] !== "NA" && currentSectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <ChevronRight size={14} className="text-slate-300"/>

                {/* 3. Role */}
                <select 
                    className={`text-xs font-bold rounded-lg px-3 py-2 outline-none cursor-pointer transition-colors ${currentRoles[0] === "NA" ? 'bg-slate-100 border border-slate-100 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500'}`}
                    value={role} onChange={handleRoleChange}
                    disabled={currentRoles[0] === "NA"}
                >
                    <option value="All">All Roles</option>
                    {currentRoles[0] !== "NA" && currentRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <ChevronRight size={14} className="text-slate-300"/>

                {/* 4. Employee */}
                <select 
                    className={`border text-xs font-bold rounded-lg px-3 py-2 outline-none cursor-pointer transition-colors ${role === 'All' || currentEmployees[0] === "NA" ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 border-blue-200 text-blue-700 focus:ring-2 focus:ring-blue-500'}`}
                    value={employee} onChange={(e) => setEmployee(e.target.value)}
                    disabled={role === "All" || currentEmployees[0] === "NA"}
                >
                    <option value="All">Select Employee</option>
                    {currentEmployees[0] !== "NA" && currentEmployees.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
            </div>   
            
          {role === "Leadgen" && employee !== "All" ? (
                /* --- RENDER LEADGEN PANEL (E.G., KHUSHI CHAWLA) --- */
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    
                    {/* --- 1. SUCCESS METRICS (TOP HIGHLIGHT) --- */}
                    <div>
                        <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Target size={16}/> Ultimate Success Metrics
                        </h3>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            
                            {/* Onboarded Card (Compact & Modern) */}
                            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] p-4 flex flex-col md:flex-row md:items-center gap-4 transition-all hover:shadow-md">
                                
                                {/* Left Section: Main Stat */}
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                                        <CheckCircle2 size={22} strokeWidth={2.5}/>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Onboarded</p>
                                        <div className="flex items-end gap-2 mt-0.5">
                                            <p className="text-3xl font-black text-slate-800 leading-none">45</p>
                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded mb-0.5" title="Yesterday">+ 2</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider (Hidden on mobile) */}
                                <div className="hidden md:block w-px h-10 bg-slate-200"></div>

                                {/* Right Section: Source Breakdown */}
                                <div className="flex-1 flex items-center justify-between bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                    <div className="text-center flex-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Client Search</p>
                                        <p className="text-sm font-black text-slate-700">20 <span className="text-[10px] font-bold text-emerald-500 ml-0.5">(+1)</span></p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                                    <div className="text-center flex-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Startup</p>
                                        <p className="text-sm font-black text-slate-700">15 <span className="text-[10px] font-bold text-emerald-500 ml-0.5">(+1)</span></p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                                    <div className="text-center flex-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Master Union</p>
                                        <p className="text-sm font-black text-slate-700">10 <span className="text-[10px] font-bold text-slate-400 ml-0.5">(0)</span></p>
                                    </div>
                                </div>

                            </div>

                            {/* Interested (Hot Leads) Card (Compact & Modern) */}
                            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-500 shadow-[0_2px_10px_-3px_rgba(59,130,246,0.1)] p-4 flex flex-col md:flex-row md:items-center gap-4 transition-all hover:shadow-md">
                                
                                {/* Left Section: Main Stat */}
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                        <TrendingUp size={22} strokeWidth={2.5}/>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Interested</p>
                                        <div className="flex items-end gap-2 mt-0.5">
                                            <p className="text-3xl font-black text-slate-800 leading-none">120</p>
                                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded mb-0.5" title="Yesterday">+ 8</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider (Hidden on mobile) */}
                                <div className="hidden md:block w-px h-10 bg-slate-200"></div>

                                {/* Right Section: Source Breakdown */}
                                <div className="flex-1 flex items-center justify-between bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                    <div className="text-center flex-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Client Search</p>
                                        <p className="text-sm font-black text-slate-700">60 <span className="text-[10px] font-bold text-blue-500 ml-0.5">(+4)</span></p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                                    <div className="text-center flex-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Startup</p>
                                        <p className="text-sm font-black text-slate-700">40 <span className="text-[10px] font-bold text-blue-500 ml-0.5">(+3)</span></p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                                    <div className="text-center flex-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Master Union</p>
                                        <p className="text-sm font-black text-slate-700">20 <span className="text-[10px] font-bold text-blue-500 ml-0.5">(+1)</span></p>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                

          {/* --- OPERATIONAL HEADS (ULTRA-COMPACT HORIZONTAL DESIGN) --- */}
                 {/* --- OPERATIONAL HEADS (ULTRA-COMPACT WITH BALANCED GRID & READABLE TEXT) --- */}
                    <div className="flex flex-col gap-4 mt-6">

                        {/* 2. CLIENT SEARCH */}
                        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm flex flex-col md:flex-row md:items-stretch overflow-hidden transition-all hover:shadow-md">
                            <div className="bg-slate-50 p-4 md:w-56 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Search size={18} />
                                </div>
                                <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest leading-tight">Client Search<br/>Pipeline</h4>
                            </div>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Done</p>
                                    <p className="text-2xl font-black text-slate-800">500 <span className="text-[11px] font-bold text-indigo-500 ml-1">(+25)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contacts Added</p>
                                    <p className="text-2xl font-black text-slate-800">350 <span className="text-[11px] font-bold text-indigo-500 ml-1">(+15)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Client Calling</p>
                                    <p className="text-2xl font-black text-slate-800">800 <span className="text-[11px] font-bold text-indigo-500 ml-1">(+45)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center bg-indigo-50/30">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contract Shared</p>
                                    <p className="text-2xl font-black text-slate-800">50 <span className="text-[11px] font-bold text-indigo-500 ml-1">(+3)</span></p>
                                </div>
                            </div>
                        </div>

                        {/* 3. STARTUP SEARCH */}
                        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-orange-500 shadow-sm flex flex-col md:flex-row md:items-stretch overflow-hidden transition-all hover:shadow-md">
                            <div className="bg-slate-50 p-4 md:w-56 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                    <Rocket size={18} />
                                </div>
                                <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest leading-tight">Startup Search<br/>Pipeline</h4>
                            </div>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search Done</p>
                                    <p className="text-2xl font-black text-slate-800">300 <span className="text-[11px] font-bold text-orange-500 ml-1">(+20)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contacts Added</p>
                                    <p className="text-2xl font-black text-slate-800">200 <span className="text-[11px] font-bold text-orange-500 ml-1">(+10)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Startup Calling</p>
                                    <p className="text-2xl font-black text-slate-800">450 <span className="text-[11px] font-bold text-orange-500 ml-1">(+30)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center bg-orange-50/30">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contract Shared</p>
                                    <p className="text-2xl font-black text-slate-800">30 <span className="text-[11px] font-bold text-orange-500 ml-1">(+2)</span></p>
                                </div>
                            </div>
                        </div>

                        {/* 4. MASTER UNION */}
                        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-purple-500 shadow-sm flex flex-col md:flex-row md:items-stretch overflow-hidden transition-all hover:shadow-md">
                            <div className="bg-slate-50 p-4 md:w-56 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                    <Globe2 size={18} />
                                </div>
                                <h4 className="text-[11px] font-black text-purple-900 uppercase tracking-widest leading-tight">Master Union<br/>Pipeline</h4>
                            </div>
                            <div className="flex-1 grid grid-cols-2 divide-x divide-slate-100">
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Client Entries</p>
                                    <p className="text-2xl font-black text-slate-800">150 <span className="text-[11px] font-bold text-purple-500 ml-1">(+5)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Calling Done</p>
                                    <p className="text-2xl font-black text-slate-800">300 <span className="text-[11px] font-bold text-purple-500 ml-1">(+12)</span></p>
                                </div>
                            </div>
                        </div>

                        {/* 5. FRANCHISE */}
                        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm flex flex-col md:flex-row md:items-stretch overflow-hidden transition-all hover:shadow-md">
                            <div className="bg-slate-50 p-4 md:w-56 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                    <Store size={18} />
                                </div>
                                <h4 className="text-[11px] font-black text-rose-900 uppercase tracking-widest leading-tight">Franchise<br/>Pipeline</h4>
                            </div>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-100">
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Discussed</p>
                                    <p className="text-xl font-black text-slate-800">80 <span className="text-[10px] font-bold text-rose-500 ml-1">(+4)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Form Ask</p>
                                    <p className="text-xl font-black text-slate-800">40 <span className="text-[10px] font-bold text-rose-500 ml-1">(+2)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Form Shared</p>
                                    <p className="text-xl font-black text-slate-800">35 <span className="text-[10px] font-bold text-rose-500 ml-1">(+2)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Form Filled</p>
                                    <p className="text-xl font-black text-slate-800">15 <span className="text-[10px] font-bold text-slate-400 ml-1">(0)</span></p>
                                </div>
                                <div className="p-3 text-center flex flex-col justify-center bg-emerald-50/50">
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1">Accepted</p>
                                    <p className="text-xl font-black text-emerald-800">5 <span className="text-[10px] font-bold text-emerald-600 ml-1">(0)</span></p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            ) : (
                /* --- DEFAULT STATE (WHEN NO SPECIFIC EMPLOYEE IS SELECTED) --- */
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <UserCheck size={32} className="text-slate-300"/>
                    </div>
                    <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest">Select an Employee</h3>
                    <p className="text-xs font-bold mt-2 max-w-sm text-center">
                        Please select a Department, Sector, Role, and a specific Employee from the filters above to view their actual working dashboard.
                    </p>
                </div>
            )}

        </div>
    );
}