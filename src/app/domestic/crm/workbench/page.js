"use client";
import { useState, useMemo } from "react";
import { 
    Calendar, Briefcase, IndianRupee, Clock, 
    FileText, Send, TrendingUp, Database, UserCheck, MessageSquare, 
    Search, Eye, X, Users, LayoutDashboard, Settings, UserCog
} from "lucide-react";

export default function CRMWorkbenchReport() {
    
    // --- STATE ---
    const [fromDate, setFromDate] = useState("2026-03-02"); 
    const [toDate, setToDate] = useState("2026-03-03");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTL, setSelectedTL] = useState("All");
    const [selectedRecruiter, setSelectedRecruiter] = useState("All");
    
    // Modals State
    const [cvModalData, setCvModalData] = useState(null);
    const [jdModalData, setJdModalData] = useState(null);

    // --- MOCK DATA: Overall CRM View ---
    const tlList = ["Vikram Singh", "Neha Gupta", "Amit Desai"];
    const recruitersList = ["Pooja", "Sneha", "Khushi Chawla", "Amit Kumar"];

   const [reportData, setReportData] = useState([
        { 
            id: 1, date: "2026-03-02", tlName: "Vikram Singh", recruiter: "Pooja", client: "Frankfin", profile: "Telecouncellor", package: "30k", requirement: "350", jdText: "Looking for excellent communication skills in Hindi & English. Minimum 6 months of BPO experience required.", slot: "09:30 AM - 01:00 PM",
            cv_naukri: 45, cv_indeed: 20, cv_other: 5, advance_sti: 15, conversion: 2, asset: 5, tracker_sent: 2, tracker_shared: 1, notes: "Good response today. Focused mostly on Naukri database.",
            tlRemark: "Asked Pooja to focus only on immediate joiners."
        },
        { 
            id: 2, date: "2026-03-02", tlName: "Neha Gupta", recruiter: "Sneha", client: "Urban Money", profile: "Telesales Executive", package: "21k", requirement: "30", jdText: "Outbound sales for financial products. Target-oriented role.", slot: "Full Day (10-6)",
            cv_naukri: 10, cv_indeed: 30, cv_other: 2, advance_sti: 8, conversion: 1, asset: 3, tracker_sent: 1, tracker_shared: 1, notes: "Indeed is giving better regional candidates for this profile.",
            tlRemark: "Good progress. Maintain the momentum."
        },
        { 
            id: 3, date: "2026-03-02", tlName: "Amit Desai", recruiter: "Khushi Chawla", client: "Steel Craft Export", profile: "Senior Merchandiser", package: "70k", requirement: "2", jdText: "", slot: "02:00 PM - 06:00 PM",
            cv_naukri: 5, cv_indeed: 2, cv_other: 1, advance_sti: 1, conversion: 0, asset: 1, tracker_sent: 0, tracker_shared: 0, notes: "Very niche profile. Hard to find relevant experience.",
            tlRemark: "Try boolean search on Naukri tomorrow."
        },
        { 
            id: 4, date: "2026-03-03", tlName: "Vikram Singh", recruiter: "Amit Kumar", client: "MKS", profile: "AutoCAD Draftsman", package: "40k", requirement: "2", jdText: "Must be proficient in AutoCAD 2D/3D. Knowledge of architectural drawings is a must.", slot: "09:30 AM - 01:00 PM",
            cv_naukri: 15, cv_indeed: 5, cv_other: 0, advance_sti: 4, conversion: 1, asset: 2, tracker_sent: 1, tracker_shared: 0, notes: "Profiles sent to you. Waiting for client feedback.",
            tlRemark: ""
        },
        { 
            id: 5, date: "2026-03-02", tlName: "Neha Gupta", recruiter: "Pooja", client: "TechCorp Solutions", profile: "Java Developer", package: "12LPA", requirement: "5", jdText: "Spring Boot, Microservices, REST APIs. 3-5 years of hardcore development experience.", slot: "Full Day (10-6)",
            cv_naukri: 25, cv_indeed: 15, cv_other: 0, advance_sti: 5, conversion: 0, asset: 2, tracker_sent: 1, tracker_shared: 1, notes: "Notice period issues with max candidates.",
            tlRemark: ""
        }
    ]);

    // --- CALCULATIONS ---
    const filteredReports = useMemo(() => {
        return reportData.filter(item => {
            const rowDate = new Date(item.date);
            const startDate = fromDate ? new Date(fromDate) : new Date("2000-01-01");
            const endDate = toDate ? new Date(toDate) : new Date("2100-01-01");
            
            const matchesDate = rowDate >= startDate && rowDate <= endDate;
            
            const matchesSearch = item.profile.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTL = selectedTL === "All" || item.tlName === selectedTL;
            const matchesRecruiter = selectedRecruiter === "All" || item.recruiter === selectedRecruiter;
            
            return matchesDate && matchesSearch && matchesTL && matchesRecruiter;
        });
    }, [reportData, fromDate, toDate, searchTerm, selectedTL, selectedRecruiter]);

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
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-4 md:p-6">
            
            {/* --- HEADER & FILTERS --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2 mb-1">
                        <LayoutDashboard size={24}/> CRM Workbench Overview
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Monitor overall performance across all TLs and Teams
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* TL Filter (New for CRM) */}
                    <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100 flex items-center shadow-sm">
                        <label className="text-[10px] font-black text-indigo-800 uppercase tracking-wide ml-2 mr-2 flex items-center gap-1">
                            <UserCog size={12}/> TL:
                        </label>
                        <select 
                            className="px-3 py-1.5 border-none rounded-lg text-xs font-bold text-[#103c7f] bg-white shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-indigo-400"
                            value={selectedTL}
                            onChange={(e) => setSelectedTL(e.target.value)}
                        >
                            <option value="All">All Team Leads</option>
                            {tlList.map(tl => <option key={tl} value={tl}>{tl}</option>)}
                        </select>
                    </div>

                    {/* Recruiter Filter */}
                    <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 flex items-center shadow-sm">
                        <label className="text-[10px] font-black text-blue-800 uppercase tracking-wide ml-2 mr-2 flex items-center gap-1">
                            <Users size={12}/> RC:
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

           {/* --- TOP KPI SUMMARY CARDS --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 z-10">
                        <FileText size={20} />
                    </div>
                    <div className="z-10">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total CVs</p>
                        <p className="text-2xl font-black text-gray-800 leading-none mt-1">{kpiTotals.total_cvs}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-purple-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0 z-10">
                        <Send size={20} />
                    </div>
                    <div className="z-10">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Adv. STI</p>
                        <p className="text-2xl font-black text-gray-800 leading-none mt-1">{kpiTotals.total_sti}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-green-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 z-10">
                        <TrendingUp size={20} />
                    </div>
                    <div className="z-10">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Conversions</p>
                        <p className="text-2xl font-black text-gray-800 leading-none mt-1">{kpiTotals.total_conversion}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-orange-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0 z-10">
                        <Database size={20} />
                    </div>
                    <div className="z-10">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total Assets</p>
                        <p className="text-2xl font-black text-gray-800 leading-none mt-1">{kpiTotals.total_asset}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shrink-0 z-10">
                        <UserCheck size={20} />
                    </div>
                    <div className="z-10">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tracker Received</p>
                        <p className="text-2xl font-black text-gray-800 leading-none mt-1">{kpiTotals.total_trackers}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0 z-10">
                        <Send size={20} className="ml-0.5" />
                    </div>
                    <div className="z-10">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Tracker Shared (Client)</p>
                        {/* Note: Update kpiTotals calculation if you have a separate field for shared trackers */}
                        <p className="text-2xl font-black text-gray-800 leading-none mt-1">{kpiTotals.total_trackers}</p> 
                    </div>
                </div>
            </div>

          {/* --- ANALYTICS DATA TABLE (CRM POV - COMPACT) --- */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                
                {/* Table Toolbar */}
                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16}/> Assignment Breakdown
                    </h3>
                    <div className="relative">
                        <input 
                            type="text" placeholder="Search Profile/Client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold w-52 outline-none focus:border-[#103c7f] shadow-sm transition-colors"
                        />
                        <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                   <table className="w-full text-left border-collapse min-w-[1350px] text-xs">
                        <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-2.5 border-r border-blue-800 w-8 text-center">#</th>
                                
                                <th className="p-2.5 border-r border-blue-800 min-w-[110px]"><div className="flex items-center gap-1.5"><Calendar size={12}/> Date & Slot</div></th>
                                <th className="p-2.5 border-r border-blue-800 min-w-[120px]"><div className="flex items-center gap-1.5 text-yellow-300"><Users size={12}/> TL & Recruiter</div></th>
                                <th className="p-2.5 border-r border-blue-800 min-w-[180px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Client, Profile & JD</div></th>
                                <th className="p-2.5 border-r border-blue-800 text-center min-w-[100px]"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Pkg / Req</div></th>
                                
                                <th className="p-2.5 border-r border-blue-800 text-center bg-blue-600"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> CVs</div></th>
                                <th className="p-2.5 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Send size={12}/> Adv STI</div></th>
                                <th className="p-2.5 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><TrendingUp size={12}/> Conv.</div></th>
                                <th className="p-2.5 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Database size={12}/> Asset</div></th>
                                
                                <th className="p-2.5 border-r border-blue-800 text-center bg-gray-700/50"><div className="flex items-center justify-center gap-1.5"><UserCheck size={12}/> T. Rcvd</div></th>
                                <th className="p-2.5 border-r border-blue-800 text-center bg-indigo-700/50"><div className="flex items-center justify-center gap-1.5"><Send size={12}/> T. Shared</div></th>
                                
                                {/* Notes & Remarks Headers */}
                                <th className="p-2.5 border-r border-blue-800 min-w-[160px]"><div className="flex items-center gap-1.5"><MessageSquare size={12}/> RC Notes</div></th>
                                <th className="p-2.5 min-w-[160px] bg-[#0d316a] text-yellow-300"><div className="flex items-center gap-1.5"><Settings size={12}/> TL Remarks</div></th>
                            </tr>
                        </thead>
                        <tbody className="font-medium divide-y divide-gray-200">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((row, index) => {
                                    const totalRowCv = row.cv_naukri + row.cv_indeed + row.cv_other;
                                    
                                    return (
                                        <tr key={row.id} className="hover:bg-blue-50/50 transition">
                                            
                                            <td className="p-2.5 border-r border-gray-200 text-center text-gray-400 font-bold bg-gray-50">{index + 1}</td>
                                            
                                            {/* Date & Slot Combined */}
                                            <td className="p-2.5 border-r border-gray-200 bg-gray-50 align-top">
                                                <div className="flex flex-col gap-0.5 items-start">
                                                    <span className="font-bold text-gray-800">{row.date}</span>
                                                    <span className="text-[9px] font-bold text-orange-500 flex items-center gap-1 leading-tight mt-0.5">
                                                        <Clock size={9}/> {row.slot}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* TL & Recruiter Combined */}
                                            <td className="p-2.5 border-r border-gray-200 align-top">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shadow-sm w-full truncate">
                                                        TL: {row.tlName}
                                                    </span>
                                                    <span className="text-[9px] font-black text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider w-full truncate">
                                                        RC: {row.recruiter}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Client, Profile & JD Combined */}
                                            <td className="p-2.5 border-r border-gray-200 align-top">
                                                <div className="flex flex-col gap-1 items-start w-full">
                                                    <span className="font-black text-[#103c7f] text-[11px] uppercase tracking-wide truncate w-full" title={row.client}>
                                                        {row.client}
                                                    </span>
                                                    <div className="flex items-center justify-between w-full gap-2">
                                                        <span className="font-bold text-gray-600 leading-tight truncate">{row.profile}</span>
                                                        {row.jdText ? (
                                                            <button 
                                                                onClick={() => setJdModalData(row)}
                                                                className="text-blue-600 hover:text-white hover:bg-blue-600 font-black text-[8px] uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded transition-colors border border-blue-200 shrink-0"
                                                            >
                                                                View JD
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 text-[8px] italic uppercase tracking-widest shrink-0">No JD</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {/* Package / Req */}
                                            <td className="p-2.5 border-r border-gray-200 text-center align-top">
                                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                                    <span className="text-green-700 font-bold">{row.package}</span> 
                                                    <span className="text-gray-300">|</span> 
                                                    <span className="text-gray-800 font-black">{row.requirement}</span>
                                                </div>
                                            </td>

                                            {/* CV Sourced */}
                                            <td className="p-2 border-r border-gray-200 text-center bg-blue-50/50 hover:bg-blue-100 transition cursor-pointer align-top" onClick={() => setCvModalData(row)}>
                                                <div className="flex items-center justify-center gap-1 mt-1">
                                                    <span className="font-black text-blue-700 text-sm">{totalRowCv}</span>
                                                    <Eye size={12} className="text-blue-400" />
                                                </div>
                                            </td>

                                            {/* KPIs */}
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-purple-700 bg-purple-50/20 align-top"><div className="mt-1">{row.advance_sti}</div></td>
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-green-700 bg-green-50/20 align-top"><div className="mt-1">{row.conversion}</div></td>
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-orange-600 bg-orange-50/20 align-top"><div className="mt-1">{row.asset}</div></td>
                                            
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-gray-800 bg-gray-50 align-top"><div className="mt-1">{row.tracker_sent || 0}</div></td>
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-indigo-700 bg-indigo-50/40 align-top"><div className="mt-1">{row.tracker_shared || 0}</div></td>

                                            {/* Fix: Notes & Remarks separated properly with align-top and borders */}
                                            <td className="p-2.5 border-r border-gray-300 align-top w-48 bg-yellow-50/30">
                                                <div className="text-[10px] text-gray-600 italic whitespace-normal">
                                                    {row.notes ? `"${row.notes}"` : <span className="text-gray-400 not-italic">No notes</span>}
                                                </div>
                                            </td>

                                            <td className="p-2.5 align-top w-48 bg-blue-50/20">
                                                <div className="text-[10px] font-bold text-[#103c7f] whitespace-normal">
                                                    {row.tlRemark ? row.tlRemark : <span className="text-gray-400 font-normal italic">No remark added</span>}
                                                </div>
                                            </td>

                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="13" className="p-12 text-center bg-white">
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
                            <p className="text-[10px] font-bold text-gray-500 mb-4 bg-gray-200 inline-block px-2 py-0.5 rounded-full">
                                TL: {cvModalData.tlName} <span className="mx-1">•</span> RC: {cvModalData.recruiter}
                            </p>
                            
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