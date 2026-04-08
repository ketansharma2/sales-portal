"use client";
import { useState, useMemo } from "react";
import { 
    Calendar, Briefcase, IndianRupee, Clock, 
    FileText, Send, TrendingUp, Database, UserCheck, MessageSquare, 
    Search, Eye, X, Users, LayoutDashboard, Settings , Award,CheckCircle,Target,
} from "lucide-react";

export default function TLWorkbenchReport() {
    
    // --- STATE ---
    const [fromDate, setFromDate] = useState("2026-03-02"); 
    const [toDate, setToDate] = useState("2026-03-03");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRecruiter, setSelectedRecruiter] = useState("All");
    
    // Modals State
    const [cvModalData, setCvModalData] = useState(null);
    const [jdModalData, setJdModalData] = useState(null); // New state for JD View Modal

    // --- MOCK DATA: Whole Team's logged work (TL View) ---
    const recruitersList = ["Pooja", "Sneha", "Khushi Chawla", "Amit Kumar"];

    const [reportData, setReportData] = useState([
        { 
            id: 1, date: "2026-03-02", recruiter: "Pooja", profile: "Telecouncellor", package: "30k", requirement: "350", slot: "09:30 AM - 01:00 PM",
            jdText: "Looking for excellent communication skills in Hindi & English. Minimum 6 months of BPO experience required. 6 days working.",
            cv_naukri: 45, cv_indeed: 20, cv_other: 5, advance_sti: 15, conversion: 2, asset: 5, tracker_sent: 2, notes: "Good response today. Focused mostly on Naukri database.",
            tlRemark: "Asked Pooja to focus only on immediate joiners."
        },
        { 
            id: 2, date: "2026-03-02", recruiter: "Sneha", profile: "Telesales Executive", package: "21k", requirement: "30", slot: "Full Day (10-6)",
            jdText: "Outbound sales for financial products. Target-oriented role. Freshers with good convincing power can apply.",
            cv_naukri: 10, cv_indeed: 30, cv_other: 2, advance_sti: 8, conversion: 1, asset: 3, tracker_sent: 1, notes: "Indeed is giving better regional candidates for this profile.",
            tlRemark: "Good progress. Maintain the momentum."
        },
        { 
            id: 3, date: "2026-03-02", recruiter: "Khushi Chawla", profile: "Senior Merchandiser", package: "70k", requirement: "2", slot: "02:00 PM - 06:00 PM",
            jdText: "", // Blank JD to show how it looks when JD is missing
            cv_naukri: 5, cv_indeed: 2, cv_other: 1, advance_sti: 1, conversion: 0, asset: 1, tracker_sent: 0, notes: "Very niche profile. Hard to find relevant experience.",
            tlRemark: "Try boolean search on Naukri tomorrow."
        },
        { 
            id: 4, date: "2026-03-03", recruiter: "Amit Kumar", profile: "AutoCAD Draftsman", package: "40k", requirement: "2", slot: "09:30 AM - 01:00 PM",
            jdText: "Must be proficient in AutoCAD 2D/3D. Knowledge of architectural drawings is a must. Immediate joiner preferred.",
            cv_naukri: 15, cv_indeed: 5, cv_other: 0, advance_sti: 4, conversion: 1, asset: 2, tracker_sent: 1, notes: "Profiles sent to you. Waiting for client feedback.",
            tlRemark: ""
        },
        { 
            id: 5, date: "2026-03-02", recruiter: "Pooja", profile: "Java Developer", package: "12LPA", requirement: "5", slot: "Full Day (10-6)",
            jdText: "Spring Boot, Microservices, REST APIs. 3-5 years of hardcore development experience. Hybrid mode.",
            cv_naukri: 25, cv_indeed: 15, cv_other: 0, advance_sti: 5, conversion: 0, asset: 2, tracker_sent: 1, notes: "Notice period issues with max candidates.",
            tlRemark: ""
        }
    ]);

    // --- CALCULATIONS ---
    // Filter data by date range, search term (only profile now), and recruiter
    const filteredReports = useMemo(() => {
        return reportData.filter(item => {
            const rowDate = new Date(item.date);
            const startDate = fromDate ? new Date(fromDate) : new Date("2000-01-01");
            const endDate = toDate ? new Date(toDate) : new Date("2100-01-01");
            
            const matchesDate = rowDate >= startDate && rowDate <= endDate;
            
            const matchesSearch = item.profile.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRecruiter = selectedRecruiter === "All" || item.recruiter === selectedRecruiter;
            
            return matchesDate && matchesSearch && matchesRecruiter;
        });
    }, [reportData, fromDate, toDate, searchTerm, selectedRecruiter]);

    // Calculate Top KPI Totals for the filtered view
    const kpiTotals = useMemo(() => {
        return filteredReports.reduce((acc, curr) => {
            acc.total_cvs += (curr.cv_naukri + curr.cv_indeed + curr.cv_other);
            acc.total_sti += curr.advance_sti;
            acc.total_conversion += curr.conversion;
            acc.total_asset += curr.asset;
            acc.total_trackers += curr.tracker_sent; 
            return acc;
        }, { total_cvs: 0, total_sti: 0, total_conversion: 0, total_asset: 0, total_trackers: 0 });
    }, [filteredReports]);

    return (
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-2 md:p-2">
            
            {/* --- HEADER & FILTERS --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-6 bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2 mb-1">
                        <LayoutDashboard size={24}/> Team Workbench Report
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Monitor your team's performance over time
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Recruiter Filter */}
                    <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 flex items-center shadow-sm">
                        <label className="text-[10px] font-black text-blue-800 uppercase tracking-wide ml-2 mr-2 flex items-center gap-1">
                            <Users size={12}/> Team Member:
                        </label>
                        <select 
                            className="px-3 py-1.5 border-none rounded-lg text-xs font-bold text-[#103c7f] bg-white shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
                            value={selectedRecruiter}
                            onChange={(e) => setSelectedRecruiter(e.target.value)}
                        >
                            <option value="All">All Recruiters</option>
                            {recruitersList.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-xl border border-blue-100 shadow-sm">
                        <label className="text-[10px] font-black text-blue-800 uppercase tracking-wide ml-2 hidden sm:block">Date Range:</label>
                        
                        <div className="relative flex items-center">
                            <Calendar size={12} className="absolute left-2.5 text-blue-600 pointer-events-none" />
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="pl-7 pr-2 py-1.5 border-none rounded-lg text-xs font-bold text-[#103c7f] bg-white shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        <span className="text-blue-400 font-black text-[10px] uppercase mx-1">To</span>

                        <div className="relative flex items-center">
                            <Calendar size={12} className="absolute left-2.5 text-blue-600 pointer-events-none" />
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="pl-7 pr-2 py-1.5 border-none rounded-lg text-xs font-bold text-[#103c7f] bg-white shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    </div>

                </div>
            </div>

           {/* ============================================== */}
            {/* --- SECTION 1: TL LEVEL HIGHLIGHTED CARDS --- */}
            {/* ============================================== */}
           {/* ============================================== */}
            {/* --- SECTION 1: TL LEVEL METRICS (CLEAN DESIGN) --- */}
            {/* ============================================== */}
            <div className="mb-4">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Award size={14} className="text-[#103c7f]"/> TL Level Metrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    
                    {/* TL Card 1: Tracker Sent to CRM */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-3 relative overflow-hidden group hover:border-blue-300 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-blue-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <Send size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tracker Sent To CRM</p>
                            <p className="text-2xl font-black text-blue-700 leading-none mt-1">120</p>
                        </div>
                    </div>

                    {/* TL Card 2: Pipeline CV */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex items-center gap-3 relative overflow-hidden group hover:border-indigo-300 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <Database size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Pipeline CV</p>
                            <p className="text-2xl font-black text-indigo-700 leading-none mt-1">45</p>
                        </div>
                    </div>

                    {/* TL Card 3: Rejected CV */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 flex items-center gap-3 relative overflow-hidden group hover:border-red-300 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <X size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Rejected CV</p>
                            <p className="text-2xl font-black text-red-700 leading-none mt-1">12</p>
                        </div>
                    </div>

                    {/* TL Card 4: Joining */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 relative overflow-hidden group hover:border-emerald-300 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <CheckCircle size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Joining</p>
                            <p className="text-2xl font-black text-emerald-700 leading-none mt-1">8</p>
                        </div>
                    </div>

                    {/* TL Card 5: Accuracy % */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-3 relative overflow-hidden group hover:border-amber-300 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-amber-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <Target size={20} />
                        </div>
                        <div className="z-10 flex items-baseline gap-1">
                            <div>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Accuracy %</p>
                                <p className="text-2xl font-black text-amber-700 leading-none mt-1">88<span className="text-sm ml-0.5">%</span></p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ============================================== */}
            {/* --- SECTION 2: TEAM LEVEL KPI SUMMARY CARDS ---*/}
            {/* ============================================== */}
            <div className="mb-6">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users size={14} className="text-blue-500"/> Team Operational Metrics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-3 relative overflow-hidden group hover:border-blue-300 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-blue-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <FileText size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total CVs</p>
                            <p className="text-2xl font-black text-[#103c7f] leading-none mt-1">{kpiTotals.total_cvs}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 flex items-center gap-3 relative overflow-hidden group hover:border-purple-300 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-purple-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <Send size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Adv. STI</p>
                            <p className="text-2xl font-black text-purple-700 leading-none mt-1">{kpiTotals.total_sti}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 relative overflow-hidden group hover:border-emerald-300 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <TrendingUp size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Conversions</p>
                            <p className="text-2xl font-black text-emerald-700 leading-none mt-1">{kpiTotals.total_conversion}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-3 relative overflow-hidden group hover:border-orange-300 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-orange-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <Database size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total Assets</p>
                            <p className="text-2xl font-black text-orange-700 leading-none mt-1">{kpiTotals.total_asset}</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3 relative overflow-hidden group hover:border-gray-400 transition-colors">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <UserCheck size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Trackers Sent By Team</p>
                            <p className="text-2xl font-black text-slate-700 leading-none mt-1">{kpiTotals.total_trackers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ANALYTICS DATA TABLE (TEAM POV) --- */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                
                {/* Table Toolbar */}
                <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16}/> Assignment Breakdown
                    </h3>
                    <div className="relative">
                        <input 
                            type="text" placeholder="Search Profile..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold w-60 outline-none focus:border-[#103c7f] shadow-sm"
                        />
                        <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1300px]">
                        <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-3 border-r border-blue-800 w-10 text-center">#</th>
                                <th className="p-3 border-r border-blue-800 min-w-[100px]"><div className="flex items-center gap-1.5"><Calendar size={12}/> Date</div></th>
                                <th className="p-3 border-r border-blue-800 min-w-[160px]"><div className="flex items-center gap-1.5 text-yellow-300"><Users size={12}/> Recruiter & Slot</div></th>
                                
                                {/* Profile & JD Column */}
                                <th className="p-3 border-r border-blue-800 min-w-[180px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Profile & JD</div></th>
                                
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Pkg / Req</div></th>
                                
                                <th className="p-3 border-r border-blue-800 text-center bg-blue-600"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> CV Sourced</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Send size={12}/> Adv STI</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><TrendingUp size={12}/> Conv.</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Database size={12}/> Asset</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><UserCheck size={12}/> Tracker</div></th>
                                
                                <th className="p-3 border-r border-blue-800 w-48"><div className="flex items-center gap-1.5"><MessageSquare size={12}/> RC Notes</div></th>
                                <th className="p-3 w-48 bg-[#0d316a] text-yellow-300"><div className="flex items-center gap-1.5"><Settings size={12}/> TL Remarks</div></th>
                            </tr>
                        </thead>
                        <tbody className="text-xs text-gray-800 font-medium divide-y divide-gray-200">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((row, index) => {
                                    const totalRowCv = row.cv_naukri + row.cv_indeed + row.cv_other;
                                    
                                    return (
                                        <tr key={row.id} className="hover:bg-blue-50/50 transition">
                                            
                                            <td className="p-3 border-r border-gray-200 text-center text-gray-400 font-bold bg-gray-50">{index + 1}</td>
                                            
                                            {/* Date */}
                                            <td className="p-3 border-r border-gray-200 font-bold text-gray-600 bg-gray-50">{row.date}</td>
                                            
                                            {/* Recruiter & Slot Combined Column */}
                                            <td className="p-2 border-r border-gray-200">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-center">
                                                        {row.recruiter}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-500 text-center flex items-center justify-center gap-1">
                                                        <Clock size={10} className="text-orange-500"/> {row.slot}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                           {/* Profile & JD View Button */}
                                            <td className="p-3 border-r border-gray-200">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <span className="font-black text-[#103c7f] leading-tight">{row.profile}</span>
                                                    {row.jdText ? (
                                                        <button 
                                                            onClick={() => setJdModalData(row)}
                                                            className="text-blue-600 hover:text-white hover:bg-blue-600 font-black text-[8px] uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded transition-colors border border-blue-200"
                                                        >
                                                            View JD
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 text-[8px] italic uppercase tracking-widest">No JD</span>
                                                    )}
                                                </div>
                                            </td>
                                            
                                            {/* Pkg / Req */}
                                            <td className="p-3 border-r border-gray-200 text-center">
                                                <span className="text-green-700 font-bold">{row.package}</span> <span className="text-gray-300 mx-1">|</span> <span className="text-gray-800 font-black">{row.requirement}</span>
                                            </td>

                                            {/* Clickable CV Column */}
                                            <td className="p-2 border-r border-gray-200 text-center bg-blue-50/50 hover:bg-blue-100 transition cursor-pointer" onClick={() => setCvModalData(row)}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="font-black text-blue-700 text-sm">{totalRowCv}</span>
                                                    <Eye size={12} className="text-blue-400" />
                                                </div>
                                            </td>

                                            {/* Performance Data Group */}
                                            <td className="p-3 border-r border-gray-200 text-center font-black text-purple-700 bg-purple-50/20">{row.advance_sti}</td>
                                            <td className="p-3 border-r border-gray-200 text-center font-black text-green-700 bg-green-50/20">{row.conversion}</td>
                                            <td className="p-3 border-r border-gray-200 text-center font-black text-orange-600 bg-orange-50/20">{row.asset}</td>
                                            <td className="p-3 border-r border-gray-200 text-center font-black text-gray-800 bg-gray-50">{row.tracker_sent}</td>

                                            {/* RC Notes */}
                                            <td className="p-3 text-[11px] text-gray-600 italic bg-yellow-50/30">
                                                {row.notes ? `"${row.notes}"` : <span className="text-gray-400 not-italic">No notes</span>}
                                            </td>

                                            {/* TL Remarks */}
                                            <td className="p-3 text-[11px] font-bold text-[#103c7f] bg-blue-50/20 border-l border-blue-100">
                                                {row.tlRemark ? row.tlRemark : <span className="text-gray-400 font-normal italic">No remark added</span>}
                                            </td>

                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="12" className="p-12 text-center bg-white">
                                        <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
                                        <h4 className="text-lg font-black text-gray-500 uppercase tracking-widest">No Work Logged</h4>
                                        <p className="text-sm font-bold text-gray-400 mt-1">No activities found for the selected filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- SMALL MODAL FOR CV BREAKDOWN --- */}
            {cvModalData && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={() => setCvModalData(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[#103c7f] p-3 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                                <Search size={16}/> CV Breakdown
                            </h3>
                            <button onClick={() => setCvModalData(null)} className="hover:bg-white/20 p-1 rounded-full transition bg-white/10">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 bg-gray-50 text-center">
                            <h4 className="text-sm font-black text-[#103c7f] mb-1">{cvModalData.profile}</h4>
                            <p className="text-xs font-bold text-gray-500 mb-4">By: {cvModalData.recruiter}</p>
                            
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Naukri</p>
                                    <span className="text-xl font-black text-blue-600">{cvModalData.cv_naukri}</span>
                                </div>
                                <div className="w-px h-10 bg-gray-200"></div>
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Indeed</p>
                                    <span className="text-xl font-black text-blue-600">{cvModalData.cv_indeed}</span>
                                </div>
                                <div className="w-px h-10 bg-gray-200"></div>
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Other</p>
                                    <span className="text-xl font-black text-blue-600">{cvModalData.cv_other}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL FOR VIEWING JD CONTENT --- */}
            {jdModalData && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={() => setJdModalData(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[#103c7f] p-3 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                                <FileText size={16}/> Job Description
                            </h3>
                            <button onClick={() => setJdModalData(null)} className="hover:bg-white/20 p-1 rounded-full transition bg-white/10">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 bg-gray-50">
                            <h4 className="text-lg font-black text-[#103c7f] mb-3 border-b border-gray-200 pb-2">
                                {jdModalData.profile}
                            </h4>
                            <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {jdModalData.jdText}
                            </p>
                        </div>
                        <div className="p-3 bg-white border-t border-gray-100 flex justify-end">
                            <button onClick={() => setJdModalData(null)} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}