"use client";
import { useState, useMemo, useEffect } from "react";
import { 
    Calendar, Building2, Briefcase, IndianRupee, Target, Clock, 
    FileText, Send, TrendingUp, Database, UserCheck, MessageSquare, 
    LayoutDashboard, Search, Eye, X , User, File, Download, FileText as FileTextIcon, Loader2
} from "lucide-react";
import { jsPDF } from "jspdf";
import Image from 'next/image';

export default function RecruiterWorkbenchReport() {
    
    // --- STATE ---
    const [selectedDate, setSelectedDate] = useState("2026-03-02");
    const [searchTerm, setSearchTerm] = useState("");

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [totalCvs, setTotalCvs] = useState(0);
    const [totalSti, setTotalSti] = useState(0);
    const [trackerSent, setTrackerSent] = useState(0);
    const [totalAssets, setTotalAssets] = useState(0);
    const [conversions, setConversions] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [jdMatchCount, setJdMatchCount] = useState(0);
    const [trackerDetails, setTrackerDetails] = useState([]);
    
    // Workbench assignments data
    const [reportData, setReportData] = useState([]);
    
    // Fetch latest CV date and set date range on mount
    useEffect(() => {
        const fetchLatestDate = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                const response = await fetch('/api/corporate/recruiter/latest-cv-date', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.maxDate) {
                    setFromDate(result.maxDate);
                    setToDate(result.maxDate);
                } else {
                    const today = new Date().toISOString().split('T')[0];
                    setFromDate(today);
                    setToDate(today);
                }
            } catch (error) {
                console.error('Failed to fetch latest date:', error);
                const today = new Date().toISOString().split('T')[0];
                setFromDate(today);
                setToDate(today);
            }
        };
        
        fetchLatestDate();
    }, []);
    
    // Fetch total CVs when date range changes
    useEffect(() => {
        const fetchTotalCvs = async () => {
            if (!fromDate || !toDate) return;
            
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                const response = await fetch(`/api/corporate/recruiter/total-cvs?fromDate=${fromDate}&toDate=${toDate}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    setTotalCvs(result.totalCvs);
                }
            } catch (error) {
                console.error('Failed to fetch total CVs:', error);
            }
        };
        
        fetchTotalCvs();
    }, [fromDate, toDate]);
    
    // Fetch total STI when date range changes
    useEffect(() => {
        const fetchTotalSti = async () => {
            if (!fromDate || !toDate) return;
            
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                const response = await fetch(`/api/corporate/recruiter/total-sti?fromDate=${fromDate}&toDate=${toDate}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    setTotalSti(result.totalSti);
                }
            } catch (error) {
                console.error('Failed to fetch total STI:', error);
            }
        };
        
        fetchTotalSti();
    }, [fromDate, toDate]);
    
    // Fetch candidate stats (tracker sent, assets, conversions) when date range changes
    useEffect(() => {
        const fetchCandidateStats = async () => {
            if (!fromDate || !toDate) return;
            
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                const response = await fetch(`/api/corporate/recruiter/candidate-stats?fromDate=${fromDate}&toDate=${toDate}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log('Candidate stats result:', result);
                    setTrackerSent(result.trackerSent);
                    setTotalAssets(result.totalAssets);
                    setConversions(result.conversions);
                    setAccuracy(result.accuracy);
                    setJdMatchCount(result.jdMatchCount || 0);
                    setTrackerDetails(result.trackerDetails || []);
                }
            } catch (error) {
                console.error('Failed to fetch candidate stats:', error);
            }
        };
        
        fetchCandidateStats();
    }, [fromDate, toDate]);

    // Modal State for CV Breakdown
    const [cvModalData, setCvModalData] = useState(null);
    
    // Modal State for JD Preview
    const [jdPreviewData, setJdPreviewData] = useState(null);

    // Modal State for Accuracy Details
    const [accuracyModalOpen, setAccuracyModalOpen] = useState(false);
    const [cvPreviewUrl, setCvPreviewUrl] = useState(null);
    const [cvPreviewLoading, setCvPreviewLoading] = useState(false);
    const [cvPreviewName, setCvPreviewName] = useState('');

    // Fetch workbench data when date range changes
    useEffect(() => {
        const fetchWorkbenchData = async () => {
            if (!fromDate || !toDate) return;
            
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                const response = await fetch(`/api/corporate/recruiter/workbench-data?fromDate=${fromDate}&toDate=${toDate}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    setReportData(result.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch workbench data:', error);
            }
        };
        
        fetchWorkbenchData();
    }, [fromDate, toDate]);

    // --- CALCULATIONS ---
    // Filter data by date range and search term
    const filteredReports = useMemo(() => {
        return reportData.filter(item => {
            const matchesSearch = item.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [reportData, searchTerm]);

    // Calculate Top KPI Totals for the selected date
    const kpiTotals = useMemo(() => {
        return {
            total_cvs: totalCvs,
            total_sti: totalSti,
            total_conversion: conversions,
            total_asset: totalAssets,
            total_trackers: trackerSent,
            accuracy: accuracy,
            jd_match_count: jdMatchCount
        };
    }, [totalCvs, totalSti, conversions, totalAssets, trackerSent, accuracy, jdMatchCount]);

    return (
        <div className="min-h-screen bg-gray-50 font-['Calibri'] p-2 md:p-3">
            
            {/* --- HEADER & DATE SELECTOR --- */}
           {/* --- HEADER & DATE RANGE SELECTOR --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                        <LayoutDashboard size={24}/> My Workbench Report
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        View your performance & logged activities over time
                    </p>
                </div>
                
                {/* Date Range Selector */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-blue-50 p-2 rounded-xl border border-blue-100">
                    <label className="text-[11px] font-black text-blue-800 uppercase tracking-wide ml-1 md:ml-2">Date Range:</label>
                    
                    <div className="flex items-center gap-2">
                        {/* FROM DATE */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-blue-600">
                                <Calendar size={14} />
                            </div>
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="pl-8 pr-2 py-1.5 md:py-2 border-none rounded-lg text-xs md:text-sm font-bold text-[#103c7f] bg-white shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
                            />
                        </div>

                        <span className="text-blue-400 font-black text-[10px] uppercase">To</span>

                        {/* TO DATE */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-blue-600">
                                <Calendar size={14} />
                            </div>
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="pl-8 pr-2 py-1.5 md:py-2 border-none rounded-lg text-xs md:text-sm font-bold text-[#103c7f] bg-white shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TOP KPI SUMMARY CARDS (Now 6 Cards) --- */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                
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

                {/* 6. Accuracy */}
                <div 
                    className="bg-white p-4 rounded-2xl shadow-sm border border-cyan-100 flex items-center gap-3 relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setAccuracyModalOpen(true)}
                >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center shrink-0 z-10">
                        <Target size={20} />
                    </div>
                    <div className="z-10">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Accuracy</p>
                        <p className="text-2xl font-black text-cyan-700 leading-none mt-1">{kpiTotals.accuracy}%</p>
                    </div>
                </div>

            </div>

           {/* --- ANALYTICS DATA TABLE --- */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col mt-4">
                
                {/* Table Toolbar */}
                <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16}/> Assignment Breakdown
                    </h3>
                    <div className="relative">
                        <input 
                            type="text" placeholder="Search Profile/TL..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold w-60 outline-none focus:border-[#103c7f]"
                        />
                        <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-3 border-r border-blue-800 min-w-[100px]"><div className="flex items-center gap-1.5"><Calendar size={12}/> Date</div></th>
                                <th className="p-3 border-r border-blue-800 min-w-[120px]"><div className="flex items-center gap-1.5"><Building2 size={12}/> Client</div></th>
                                <th className="p-3 border-r border-blue-800 min-w-[140px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Profile</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Pkg / Req</div></th>
                                <th className="p-3 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> JD</div></th>
                                <th className="p-3 border-r border-blue-800 min-w-[120px]"><div className="flex items-center gap-1.5"><User size={12}/> Assigned By (TL)</div></th>
                                <th className="p-3 border-r border-blue-800"><div className="flex items-center gap-1.5"><Clock size={12}/> Slot</div></th>
                                
                                {/* CV Column */}
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
                                    // const totalRowCv = row.cv_naukri + row.cv_indeed + row.cv_other;
                                    const cvSourced = row.cv_sourced || 0;
                                    
                                    return (
                                        <tr key={row.workbench_id || index} className="hover:bg-blue-50/50 transition">
                                            
                                            {/* Date */}
                                            <td className="p-3 border-r border-gray-200 font-bold text-gray-600 bg-gray-50">{row.date}</td>
                                            
                                            {/* Client */}
                                            <td className="p-3 border-r border-gray-200 font-bold text-[#103c7f]">{row.client_name || '-'}</td>
                                            
                                            {/* Profile */}
                                            <td className="p-3 border-r border-gray-200 font-black text-[#103c7f]">{row.job_title}</td>
                                            
                                            {/* Pkg / Req */}
                                            <td className="p-3 border-r border-gray-200 text-center">
                                                <span className="text-green-700 font-bold">{row.package}</span> <span className="text-gray-300 mx-1">|</span> <span className="text-gray-800 font-black">{row.requirement}</span>
                                            </td>

                                            {/* JD Link / View */}
                                            <td className="p-3 border-r border-gray-200 text-center">
                                                {row.jd_link ? (
                                                    <button 
                                                        onClick={() => setJdPreviewData(row)}
                                                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"
                                                        title="View JD PDF"
                                                    >
                                                        <File size={18} />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-[10px] italic">N/A</span>
                                                )}
                                            </td>

                                            {/* Assigned By (TL) */}
                                            <td className="p-3 border-r border-gray-200 font-bold text-gray-700">{row.tl_name}</td>
                                            
                                            {/* Slot */}
                                            <td className="p-3 border-r border-gray-200 text-[11px] font-bold text-gray-600">{row.slot}</td>

                                            {/* --- CLICKABLE CV COLUMN --- */}
                                            <td className="p-2 border-r border-gray-200 text-center bg-blue-50/50 hover:bg-blue-100 transition cursor-pointer" onClick={() => setCvModalData(row)}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="font-black text-blue-700 text-sm">{cvSourced}</span>
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
                                            <td className="p-3 text-[11px] text-gray-600 italic max-w-[250px] truncate" title={row.rc_remarks}>
                                                {row.rc_remarks ? `"${row.rc_remarks}"` : <span className="text-gray-400 not-italic">No remarks</span>}
                                            </td>

                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="13" className="p-12 text-center bg-white">
                                        <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
                                        <h4 className="text-lg font-black text-gray-500 uppercase tracking-widest">No Work Logged</h4>
                                        <p className="text-sm font-bold text-gray-400 mt-1">No activities were recorded for the selected date range.</p>
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
                            <h4 className="text-sm font-black text-[#103c7f] mb-1">{cvModalData.profile || cvModalData.job_title}</h4>
                            
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Naukri</p>
                                    <span className="text-xl font-black text-blue-600">{cvModalData.cv_naukri || 0}</span>
                                </div>
                                <div className="w-px h-10 bg-gray-200"></div>
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Indeed</p>
                                    <span className="text-xl font-black text-blue-600">{cvModalData.cv_indeed || 0}</span>
                                </div>
                                <div className="w-px h-10 bg-gray-200"></div>
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Other</p>
                                    <span className="text-xl font-black text-blue-600">{cvModalData.cv_other || 0}</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 text-xs font-bold text-gray-600 bg-blue-50 py-2 rounded-lg border border-blue-100">
                                Total CVs Sourced: <span className="text-[#103c7f] font-black ml-1 text-sm">{(cvModalData.cv_naukri || 0) + (cvModalData.cv_indeed || 0) + (cvModalData.cv_other || 0)}</span>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* --- JD PREVIEW MODAL --- */}
            {jdPreviewData && (
                <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[9999] p-0 md:p-4">
                    
                    <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl">
                        
                        {/* Header */}
                        <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900">
                            <div className="flex items-center gap-3">
                                <FileText size={20} />
                                <h3 className="font-bold text-lg uppercase tracking-wide">Job Description Preview</h3>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setJdPreviewData(null)} className="hover:bg-white/20 p-2 rounded-full transition">
                                    <X size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* --- PDF CONTENT --- */}
                        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 custom-scrollbar">
                            <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative">
                                
                                {/* 1. Header Logo */}
                                <div className="mb-10">
                                    <Image src="/maven-logo.png" alt="Maven Jobs" width={220} height={70} className="object-contain" priority />
                                </div>

                                {/* 2. Bordered Container */}
                                <div className="border border-black p-8 min-h-[850px] relative">
                                    
                                    {/* Key Value Pairs */}
                                    <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                                        {jdPreviewData.job_title && <p><span className="font-bold">JOB TITLE : </span> {jdPreviewData.job_title}</p>}
                                        {jdPreviewData.location && <p><span className="font-bold">LOCATION : </span> {jdPreviewData.location}</p>}
                                        {jdPreviewData.experience && <p><span className="font-bold">EXPERIENCE : </span> {jdPreviewData.experience}</p>}
                                        {jdPreviewData.employment_type && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {jdPreviewData.employment_type}</p>}
                                        {jdPreviewData.working_days && <p><span className="font-bold">WORKING DAYS : </span> {jdPreviewData.working_days}</p>}
                                        {jdPreviewData.timings && <p><span className="font-bold">TIMINGS : </span> {jdPreviewData.timings}</p>}
                                        {jdPreviewData.package && <p><span className="font-bold">PACKAGE : </span> {jdPreviewData.package}</p>}
                                        {jdPreviewData.tool_requirement && <p><span className="font-bold">TOOL REQUIREMENT : </span> {jdPreviewData.tool_requirement}</p>}
                                    </div>

                                    {/* Sections */}
                                    <div className="space-y-8 text-[15px]">
                                        {jdPreviewData.job_summary && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{jdPreviewData.job_summary}</p></div>
                                        )}
                                        
                                        {jdPreviewData.rnr && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {jdPreviewData.rnr.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {jdPreviewData.req_skills && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {jdPreviewData.req_skills.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {jdPreviewData.preferred_qual && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {jdPreviewData.preferred_qual.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {jdPreviewData.company_offers && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {jdPreviewData.company_offers.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {jdPreviewData.contact_details && (
                                            <div className="mt-12 pt-6 border-t border-black/20">
                                                <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                                <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{jdPreviewData.contact_details}</div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* --- ACCURACY DETAILS MODAL --- */}
            {accuracyModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={() => setAccuracyModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="bg-cyan-600 p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                                <Target size={20}/> Accuracy Details
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 px-3 py-1 rounded-full">
                                    <span className="text-lg font-black">{kpiTotals.accuracy}%</span>
                                </div>
                                <button onClick={() => setAccuracyModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition bg-white/10">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 pb-0">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Trackers Sent</p>
                                    <p className="text-3xl font-black text-blue-800">{kpiTotals.total_trackers}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">JD Match</p>
                                    <p className="text-3xl font-black text-green-800">{kpiTotals.jd_match_count}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Strip */}
                        <div className="bg-gray-100 p-3 text-center border-t border-gray-200">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                JD Match / Total Trackers Sent × 100
                            </p>
                        </div>

                        {/* Details Table */}
                        <div className="p-4 max-h-[300px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold sticky top-0">
                                    <tr>
                                        <th className="p-2 border border-slate-200">Sno.</th>
                                        <th className="p-2 border border-slate-200">Date</th>
                                        <th className="p-2 border border-slate-200">Profile</th>
                                        <th className="p-2 border border-slate-200">Candidate Name</th>
                                        <th className="p-2 border border-slate-200">CV</th>
                                        <th className="p-2 border border-slate-200">CV Status (BY TL)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs text-slate-800 font-medium">
                                    {trackerDetails.length > 0 ? (
                                        trackerDetails.map((row) => (
                                            <tr key={row.sno} className="hover:bg-slate-50">
                                                <td className="p-2 border border-slate-200">{row.sno}</td>
                                                <td className="p-2 border border-slate-200">{row.date}</td>
                                                <td className="p-2 border border-slate-200">{row.profile}</td>
                                                <td className="p-2 border border-slate-200">{row.candidateName}</td>
                                                <td className="p-2 border border-slate-200">
                                                    {row.cvUrl ? (
                                                        <button 
                                                            onClick={async () => {
                                                                setCvPreviewLoading(true);
                                                                setCvPreviewName(row.candidateName);
                                                                try {
                                                                    const response = await fetch(row.cvUrl);
                                                                    const blob = await response.blob();
                                                                    const fileType = blob.type;
                                                                    
                                                                    // Handle images - convert to PDF
                                                                    if (fileType.startsWith('image/')) {
                                                                        const imgUrl = URL.createObjectURL(blob);
                                                                        const img = document.createElement('img');
                                                                        img.src = imgUrl;
                                                                        await new Promise((resolve, reject) => {
                                                                            img.onload = resolve;
                                                                            img.onerror = reject;
                                                                        });
                                                                        const orientation = img.width > img.height ? 'landscape' : 'portrait';
                                                                        const pdf = new jsPDF({
                                                                            orientation: orientation,
                                                                            unit: 'px',
                                                                            format: [img.width, img.height]
                                                                        });
                                                                        pdf.addImage(imgUrl, 'JPEG', 0, 0, img.width, img.height);
                                                                        const pdfBlob = pdf.output('blob');
                                                                        const pdfUrl = URL.createObjectURL(pdfBlob);
                                                                        setCvPreviewUrl(pdfUrl);
                                                                    } 
                                                                    // Handle Word documents - show download option
                                                                    else if (fileType === 'application/msword' || 
                                                                            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                                                                        setCvPreviewUrl('word');
                                                                    }
                                                                    // Handle PDF and other files
                                                                    else {
                                                                        const fileUrl = URL.createObjectURL(blob);
                                                                        setCvPreviewUrl(fileUrl);
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Error fetching CV:', err);
                                                                    setCvPreviewUrl('error');
                                                                } finally {
                                                                    setCvPreviewLoading(false);
                                                                }
                                                            }}
                                                            disabled={cvPreviewLoading}
                                                            className="text-blue-600 hover:underline text-xs font-bold"
                                                        >
                                                            {cvPreviewLoading ? 'Loading...' : 'View CV'}
                                                        </button>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-2 border border-slate-200">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        row.cvStatus === 'JD Match' ? 'bg-green-100 text-green-700' :
                                                        row.cvStatus === 'Average Match' ? 'bg-amber-100 text-amber-700' :
                                                        row.cvStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {row.cvStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-4 text-center text-slate-500 text-xs">No data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            )}

            {/* --- CV PREVIEW MODAL --- */}
            {cvPreviewUrl && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4" onClick={() => setCvPreviewUrl(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                                <FileTextIcon size={20}/> CV Preview - {cvPreviewName}
                            </h3>
                            <button onClick={() => setCvPreviewUrl(null)} className="hover:bg-white/20 p-1 rounded-full transition bg-white/10">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-200 p-4">
                            {cvPreviewUrl === 'word' ? (
                                <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 rounded-lg p-4">
                                    <FileTextIcon size={64} className="text-blue-500 mb-4" />
                                    <p className="text-sm font-bold text-slate-700 mb-2">Word Document</p>
                                    <p className="text-xs text-slate-500 mb-4 text-center">
                                        Preview not available for Word documents.<br/>Please download to view.
                                    </p>
                                    <a 
                                        href={trackerDetails.find(t => t.candidateName === cvPreviewName)?.cvUrl} 
                                        download={`${cvPreviewName}_CV.docx`}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                                    >
                                        Download CV
                                    </a>
                                </div>
                            ) : cvPreviewUrl === 'error' ? (
                                <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 rounded-lg p-4">
                                    <File size={48} className="text-red-500 mb-4" />
                                    <p className="text-lg font-black uppercase tracking-widest mb-1">Error Loading File</p>
                                    <p className="text-xs font-bold text-slate-500">Could not load the CV file</p>
                                </div>
                            ) : (
                                <iframe src={cvPreviewUrl} className="w-full h-full rounded-lg border border-slate-300" title="CV Preview" />
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}