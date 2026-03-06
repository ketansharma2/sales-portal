"use client";
import { useState, useMemo } from "react";
import { 
    Calendar, Building2, Briefcase, IndianRupee, Target, Clock, 
    FileText, Send, TrendingUp, Database, UserCheck, MessageSquare, 
    LayoutDashboard, Search, Eye, X
} from "lucide-react";

export default function RecruiterWorkbenchReport() {
    
    // --- STATE ---
    const [selectedDate, setSelectedDate] = useState("2026-03-02");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State for CV Breakdown
    const [cvModalData, setCvModalData] = useState(null);

    // --- MOCK DATA: Recruiter's logged work ---
    const [reportData, setReportData] = useState([
        { 
            id: 1, date: "2026-03-02", client: "Frankfin", profile: "Telecouncellor", package: "30k", requirement: "350", slot: "09:30 AM - 01:00 PM",
            cv_naukri: 45, cv_indeed: 20, cv_other: 5, advance_sti: 15, conversion: 2, asset: 5, tracker_sent: 2, notes: "Good response today. Focused mostly on Naukri database." 
        },
        { 
            id: 2, date: "2026-03-02", client: "Urban Money", profile: "Telesales Executive", package: "21k", requirement: "30", slot: "Full Day (10-6)",
            cv_naukri: 10, cv_indeed: 30, cv_other: 2, advance_sti: 8, conversion: 1, asset: 3, tracker_sent: 1, notes: "Indeed is giving better regional candidates for this profile." 
        },
        { 
            id: 3, date: "2026-03-02", client: "Steel Craft Export", profile: "Senior Merchandiser", package: "70k", requirement: "2", slot: "02:00 PM - 06:00 PM",
            cv_naukri: 5, cv_indeed: 2, cv_other: 1, advance_sti: 1, conversion: 0, asset: 1, tracker_sent: 0, notes: "Very niche profile. Hard to find relevant experience." 
        },
        { 
            id: 4, date: "2026-03-03", client: "MKS", profile: "AutoCAD", package: "40k", requirement: "2", slot: "09:30 AM - 01:00 PM",
            cv_naukri: 15, cv_indeed: 5, cv_other: 0, advance_sti: 4, conversion: 1, asset: 2, tracker_sent: 1, notes: "Profiles sent to TL. Waiting for client feedback." 
        }
    ]);

    // --- CALCULATIONS ---
    // Filter data by selected date and search term
    const filteredReports = useMemo(() => {
        return reportData.filter(item => {
            const matchesDate = item.date === selectedDate;
            const matchesSearch = item.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.profile.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesDate && matchesSearch;
        });
    }, [reportData, selectedDate, searchTerm]);

    // Calculate Top KPI Totals for the selected date
    const kpiTotals = useMemo(() => {
        return filteredReports.reduce((acc, curr) => {
            acc.total_cvs += (curr.cv_naukri + curr.cv_indeed + curr.cv_other);
            acc.total_sti += curr.advance_sti;
            acc.total_conversion += curr.conversion;
            acc.total_asset += curr.asset;
            acc.total_trackers += curr.tracker_sent; // Added tracker total calculation
            return acc;
        }, { total_cvs: 0, total_sti: 0, total_conversion: 0, total_asset: 0, total_trackers: 0 });
    }, [filteredReports]);

    return (
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-4 md:p-6">
            
            {/* --- HEADER & DATE SELECTOR --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <LayoutDashboard size={24}/> My Workbench Report
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        View your daily performance & logged activities
                    </p>
                </div>
                
                <div className="flex items-center gap-3 bg-blue-50 p-2 rounded-xl border border-blue-100">
                    <label className="text-[11px] font-black text-blue-800 uppercase tracking-wide ml-2">Select Date:</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-blue-600">
                            <Calendar size={14} />
                        </div>
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-9 pr-4 py-2 border-none rounded-lg text-sm font-bold text-[#103c7f] bg-white shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                </div>
            </div>

            {/* --- TOP KPI SUMMARY CARDS (Now 5 Cards) --- */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                
                {/* 1. Total CVs */}
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

                {/* 2. Advance STI */}
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

                {/* 3. Conversions */}
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

                {/* 4. Assets */}
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

                {/* 5. Trackers Sent */}
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

            {/* --- ANALYTICS DATA TABLE --- */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                
                {/* Table Toolbar */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16}/> Assignment Breakdown
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
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-3 border-r border-blue-800 w-10 text-center">#</th>
                                <th className="p-3 border-r border-blue-800 min-w-[140px]"><div className="flex items-center gap-1.5"><Building2 size={12}/> Client</div></th>
                                <th className="p-3 border-r border-blue-800 min-w-[140px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Profile</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Pkg / Req</div></th>
                                <th className="p-3 border-r border-blue-800"><div className="flex items-center gap-1.5"><Clock size={12}/> Slot</div></th>
                                
                                {/* Updated Single CV Column */}
                                <th className="p-3 border-r border-blue-800 text-center bg-blue-600"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> CV Sourced</div></th>
                                
                                {/* Performance Columns */}
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Send size={12}/> Adv STI</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><TrendingUp size={12}/> Conv.</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Database size={12}/> Asset</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><UserCheck size={12}/> Tracker</div></th>
                                
                                <th className="p-3"><div className="flex items-center gap-1.5"><MessageSquare size={12}/> RC Notes</div></th>
                            </tr>
                        </thead>
                        
                        <tbody className="text-xs text-gray-800 font-medium divide-y divide-gray-200">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((row, index) => {
                                    const totalRowCv = row.cv_naukri + row.cv_indeed + row.cv_other;
                                    
                                    return (
                                        <tr key={row.id} className="hover:bg-blue-50/50 transition">
                                            
                                            <td className="p-3 border-r border-gray-200 text-center text-gray-400 font-bold bg-gray-50">{index + 1}</td>
                                            
                                            <td className="p-3 border-r border-gray-200 font-black text-[#103c7f]">{row.client}</td>
                                            
                                            <td className="p-3 border-r border-gray-200 font-bold text-gray-700">{row.profile}</td>
                                            
                                            <td className="p-3 border-r border-gray-200 text-center">
                                                <span className="text-green-700 font-bold">{row.package}</span> <span className="text-gray-300 mx-1">|</span> <span className="text-gray-800 font-black">{row.requirement}</span>
                                            </td>
                                            
                                            <td className="p-3 border-r border-gray-200 text-[11px] font-bold text-gray-600">{row.slot}</td>

                                            {/* --- CLICKABLE CV COLUMN --- */}
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
                                            
                                            {/* Tracker */}
                                            <td className="p-3 border-r border-gray-200 text-center font-black text-gray-800 bg-gray-50">
                                                {row.tracker_sent}
                                            </td>

                                            {/* Notes */}
                                            <td className="p-3 text-[11px] text-gray-600 italic max-w-[250px] truncate" title={row.notes}>
                                                {row.notes ? `"${row.notes}"` : <span className="text-gray-400 not-italic">No notes</span>}
                                            </td>

                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="11" className="p-12 text-center bg-white">
                                        <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
                                        <h4 className="text-lg font-black text-gray-500 uppercase tracking-widest">No Work Logged</h4>
                                        <p className="text-sm font-bold text-gray-400 mt-1">No activities were recorded for the selected date.</p>
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
                    {/* onClick stopPropagation prevents closing when clicking inside the white box */}
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="bg-[#103c7f] p-3 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                                <Search size={16}/> CV Breakdown
                            </h3>
                            <button onClick={() => setCvModalData(null)} className="hover:bg-white/20 p-1 rounded-full transition bg-white/10">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 bg-gray-50 text-center">
                            <h4 className="text-sm font-black text-[#103c7f] mb-1">{cvModalData.profile}</h4>
                            <p className="text-xs font-bold text-gray-500 mb-4">{cvModalData.client}</p>
                            
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
                            
                            <div className="mt-4 text-xs font-bold text-gray-600 bg-blue-50 py-2 rounded-lg border border-blue-100">
                                Total Sourced: <span className="text-[#103c7f] font-black ml-1 text-sm">{cvModalData.cv_naukri + cvModalData.cv_indeed + cvModalData.cv_other}</span>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}