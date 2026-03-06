"use client";
import { useState, useMemo } from "react";
import { 
    Calendar, Building2, Briefcase, IndianRupee, Clock, 
    FileText, Send, TrendingUp, Database, UserCheck, MessageSquare, 
    Search, Eye, X, Users, LayoutDashboard, BarChart3, Settings
} from "lucide-react";

export default function TLWorkbenchReport() {
    
    // --- STATE ---
    const [selectedDate, setSelectedDate] = useState("2026-03-02");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRecruiter, setSelectedRecruiter] = useState("All");
    
    // Tabs State
    const [activeTab, setActiveTab] = useState("Workbench Report");

    // Modal State for CV Breakdown
    const [cvModalData, setCvModalData] = useState(null);

    // --- MOCK DATA: Whole Team's logged work (TL View) ---
    const recruitersList = ["Pooja", "Sneha", "Khushi Chawla", "Amit Kumar"];
    const tabs = ["Workbench Report", "Client Overview", "Submission Stats"];

    const [reportData, setReportData] = useState([
        { 
            id: 1, date: "2026-03-02", recruiter: "Pooja", client: "Frankfin", profile: "Telecouncellor", package: "30k", requirement: "350", slot: "09:30 AM - 01:00 PM",
            cv_naukri: 45, cv_indeed: 20, cv_other: 5, advance_sti: 15, conversion: 2, asset: 5, tracker_sent: 2, notes: "Good response today. Focused mostly on Naukri database.",
            tlRemark: "Asked Pooja to focus only on immediate joiners."
        },
        { 
            id: 2, date: "2026-03-02", recruiter: "Sneha", client: "Urban Money", profile: "Telesales Executive", package: "21k", requirement: "30", slot: "Full Day (10-6)",
            cv_naukri: 10, cv_indeed: 30, cv_other: 2, advance_sti: 8, conversion: 1, asset: 3, tracker_sent: 1, notes: "Indeed is giving better regional candidates for this profile.",
            tlRemark: "Good progress. Maintain the momentum."
        },
        { 
            id: 3, date: "2026-03-02", recruiter: "Khushi Chawla", client: "Steel Craft Export", profile: "Senior Merchandiser", package: "70k", requirement: "2", slot: "02:00 PM - 06:00 PM",
            cv_naukri: 5, cv_indeed: 2, cv_other: 1, advance_sti: 1, conversion: 0, asset: 1, tracker_sent: 0, notes: "Very niche profile. Hard to find relevant experience.",
            tlRemark: "Try boolean search on Naukri tomorrow."
        },
        { 
            id: 4, date: "2026-03-03", recruiter: "Amit Kumar", client: "MKS", profile: "AutoCAD", package: "40k", requirement: "2", slot: "09:30 AM - 01:00 PM",
            cv_naukri: 15, cv_indeed: 5, cv_other: 0, advance_sti: 4, conversion: 1, asset: 2, tracker_sent: 1, notes: "Profiles sent to you. Waiting for client feedback.",
            tlRemark: ""
        },
        { 
            id: 5, date: "2026-03-02", recruiter: "Pooja", client: "TechCorp Solutions", profile: "Java Developer", package: "12LPA", requirement: "5", slot: "Full Day (10-6)",
            cv_naukri: 25, cv_indeed: 15, cv_other: 0, advance_sti: 5, conversion: 0, asset: 2, tracker_sent: 1, notes: "Notice period issues with max candidates.",
            tlRemark: ""
        }
    ]);

    // --- CALCULATIONS ---
    // Filter data by selected date, search term, and recruiter
    const filteredReports = useMemo(() => {
        return reportData.filter(item => {
            const matchesDate = item.date === selectedDate;
            const matchesSearch = item.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.profile.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRecruiter = selectedRecruiter === "All" || item.recruiter === selectedRecruiter;
            
            return matchesDate && matchesSearch && matchesRecruiter;
        });
    }, [reportData, selectedDate, searchTerm, selectedRecruiter]);

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
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-4 md:p-6">
            
            {/* --- TOP TABS NAVIGATION --- */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto custom-scrollbar">
                {tabs.map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-t-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                            activeTab === tab 
                            ? 'bg-[#103c7f] text-white shadow-md' 
                            : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 border-b-0'
                        }`}
                    >
                        {tab === "Workbench Report" && <LayoutDashboard size={14} />}
                        {tab === "Client Overview" && <Building2 size={14} />}
                        {tab === "Submission Stats" && <BarChart3 size={14} />}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Render content only for Workbench Report for now */}
            {activeTab === "Workbench Report" && (
                <>
                    {/* --- HEADER & FILTERS --- */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                        <div>
                            <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                                <Users size={24}/> Team Workbench Report
                            </h1>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                                Monitor your team's daily performance & logged activities
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            
                            {/* Recruiter Filter */}
                            <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 flex items-center">
                                <label className="text-[10px] font-black text-blue-800 uppercase tracking-wide ml-2 mr-2">Team Member:</label>
                                <select 
                                    className="px-3 py-1.5 border-none rounded-lg text-xs font-bold text-[#103c7f] bg-white shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
                                    value={selectedRecruiter}
                                    onChange={(e) => setSelectedRecruiter(e.target.value)}
                                >
                                    <option value="All">All Recruiters</option>
                                    {recruitersList.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            {/* Date Filter */}
                            <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 flex items-center">
                                <label className="text-[10px] font-black text-blue-800 uppercase tracking-wide ml-2 mr-2">Date:</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-blue-600">
                                        <Calendar size={12} />
                                    </div>
                                    <input 
                                        type="date" 
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="pl-7 pr-3 py-1.5 border-none rounded-lg text-xs font-bold text-[#103c7f] bg-white shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* --- TOP KPI SUMMARY CARDS --- */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Trackers Sent</p>
                                <p className="text-2xl font-black text-gray-800 leading-none mt-1">{kpiTotals.total_trackers}</p>
                            </div>
                        </div>
                    </div>

                    {/* --- ANALYTICS DATA TABLE (TEAM POV) --- */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        
                        {/* Table Toolbar */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                                <FileText size={16}/> Team Assignment Breakdown
                            </h3>
                            <div className="relative">
                                <input 
                                    type="text" placeholder="Search Client/Profile..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold w-60 outline-none focus:border-[#103c7f]"
                                />
                                <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[1250px]">
                              <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 border-r border-blue-800 w-10 text-center">#</th>
                                        
                                        {/* Updated Recruiter Header */}
                                        <th className="p-3 border-r border-blue-800 min-w-[150px]"><div className="flex items-center gap-1.5 text-yellow-300"><Users size={12}/> Recruiter & Slot</div></th>
                                        
                                        <th className="p-3 border-r border-blue-800 min-w-[140px]"><div className="flex items-center gap-1.5"><Building2 size={12}/> Client</div></th>
                                        <th className="p-3 border-r border-blue-800 min-w-[140px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Profile</div></th>
                                        <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Pkg / Req</div></th>
                                        
                                        {/* SLOT HEADER REMOVED FROM HERE */}
                                        
                                        <th className="p-3 border-r border-blue-800 text-center bg-blue-600"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> CVs</div></th>
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
                                                    
                                                    {/* UPDATED: Recruiter & Slot Combined Column */}
                                                    <td className="p-2 border-r border-gray-200">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-center">
                                                                {row.recruiter}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-gray-500 text-center flex items-center justify-center gap-1">
                                                                <Clock size={10} className="text-orange-500"/> {row.slot}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    
                                                    <td className="p-3 border-r border-gray-200 font-black text-[#103c7f]">{row.client}</td>
                                                    <td className="p-3 border-r border-gray-200 font-bold text-gray-700">{row.profile}</td>
                                                    
                                                    <td className="p-3 border-r border-gray-200 text-center">
                                                        <span className="text-green-700 font-bold">{row.package}</span> <span className="text-gray-300 mx-1">|</span> <span className="text-gray-800 font-black">{row.requirement}</span>
                                                    </td>

                                                    {/* SLOT TD REMOVED FROM HERE */}

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
                                                        {row.tlRemark ? row.tlRemark : <span className="text-gray-400 font-normal">No remark added</span>}
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
                </>
            )}

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
                            <p className="text-xs font-bold text-gray-500 mb-4">{cvModalData.client} <span className="mx-1">•</span> By: {cvModalData.recruiter}</p>
                            
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

        </div>
    );
}