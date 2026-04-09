"use client";
import { useState, useMemo, useEffect } from "react";
import Image from 'next/image';
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
    const [recruitersList, setRecruitersList] = useState([]);
    const [latestCvDate, setLatestCvDate] = useState("");
    const [isDateInitialized, setIsDateInitialized] = useState(false);
    
        // TL Metrics State
        const [tlMetrics, setTlMetrics] = useState({
            trackerSentToCrm: 0,
            pipelineCv: 0,
            rejectedCv: 0,
            notResponding: 0,
            joining: 0,
            totalTrackersReceived: 0,
            jdMatchCount: 0
        });

        // Team Metrics State
        const [teamMetrics, setTeamMetrics] = useState({
            total_cvs: 0,
            total_conversion: 0,
            total_asset: 0,
            total_trackers: 0,
            total_sti: 0
        });
        
        // Assignment Breakdown State
        const [assignmentData, setAssignmentData] = useState([]);
    
    // Calculate accuracy percentage
    const accuracy = tlMetrics.trackerSentToCrm > 0 
        ? Math.round((tlMetrics.joining / tlMetrics.trackerSentToCrm) * 100) 
        : 0;
    
    // Modals State
    const [cvModalData, setCvModalData] = useState(null);
    const [jdModalData, setJdModalData] = useState(null);
    const [accuracyModalOpen, setAccuracyModalOpen] = useState(false);
    const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
    const [rejectedCvModalOpen, setRejectedCvModalOpen] = useState(false);
    const [rejectedCvData, setRejectedCvData] = useState([]);
    const [isLoadingRejectedCv, setIsLoadingRejectedCv] = useState(false);
    const [joiningModalOpen, setJoiningModalOpen] = useState(false);
    const [joiningData, setJoiningData] = useState([]);
    const [isLoadingJoining, setIsLoadingJoining] = useState(false);

    // Accuracy details data (mock)
    const accuracyStats = {
        totalTrackers: 120,
        jdMatch: 106,
        accuracy: 88
    };

    const trackerDetails = [
        { sno: 1, date: "2026-03-02", profile: "Telecouncellor", candidateName: "Rahul Sharma", cvUrl: null, cvStatus: "JD Match" },
        { sno: 2, date: "2026-03-02", profile: "Telecouncellor", candidateName: "Priya Singh", cvUrl: null, cvStatus: "JD Match" },
        { sno: 3, date: "2026-03-02", profile: "Telesales Executive", candidateName: "Amit Patel", cvUrl: null, cvStatus: "Average Match" },
        { sno: 4, date: "2026-03-03", profile: "AutoCAD Draftsman", candidateName: "Vikram Kumar", cvUrl: null, cvStatus: "JD Match" },
        { sno: 5, date: "2026-03-02", profile: "Java Developer", candidateName: "Sneha Gupta", cvUrl: null, cvStatus: "Rejected" },
    ];

    // Fetch RC users on mount
    useEffect(() => {
        const fetchRcUsers = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                const response = await fetch('/api/corporate/tl/rc-users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    setRecruitersList(result.data);
                    
                    // After getting recruiters, fetch latest CV date
                    const userIds = result.data.map(r => r.user_id).join(',');
                    if (userIds) {
                        const dateResponse = await fetch(`/api/corporate/tl/latest-cv-date?userIds=${userIds}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const dateResult = await dateResponse.json();
                        if (dateResult.success && dateResult.maxDate) {
                            setLatestCvDate(dateResult.maxDate);
                            setFromDate(dateResult.maxDate);
                            setToDate(dateResult.maxDate);
                            setIsDateInitialized(true);
                        } else {
                            const today = new Date().toISOString().split('T')[0];
                            setLatestCvDate(today);
                            setFromDate(today);
                            setToDate(today);
                            setIsDateInitialized(true);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch RC users:', error);
                const today = new Date().toISOString().split('T')[0];
                setLatestCvDate(today);
                setFromDate(today);
                setToDate(today);
                setIsDateInitialized(true);
            }
        };
        
        fetchRcUsers();
    }, []);

    // Fetch TL metrics when date range changes (only after date is initialized)
    useEffect(() => {
        if (!isDateInitialized || !fromDate || !toDate) return;
        
        const fetchTlMetrics = async () => {
            if (!fromDate || !toDate) return;
            
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                const response = await fetch(`/api/corporate/tl/metrics?fromDate=${fromDate}&toDate=${toDate}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    setTlMetrics(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch TL metrics:', error);
            }
        };
        
        fetchTlMetrics();
    }, [fromDate, toDate, isDateInitialized]);

    // Fetch Team metrics when date range or selected recruiter changes (only after date is initialized)
    useEffect(() => {
        if (!isDateInitialized || !fromDate || !toDate) return;
        
        const fetchTeamMetrics = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                let url = `/api/corporate/tl/team-metrics?fromDate=${fromDate}&toDate=${toDate}`;
                if (selectedRecruiter && selectedRecruiter !== "All") {
                    url += `&recruiter_id=${selectedRecruiter}`;
                }
                
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    setTeamMetrics(prev => ({
                        ...prev,
                        total_cvs: result.data.total_cvs || 0,
                        total_conversion: result.data.total_conversion || 0,
                        total_asset: result.data.total_asset || 0,
                        total_trackers: result.data.total_trackers || 0
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch team metrics:', error);
            }
        };
        
        fetchTeamMetrics();

        // Fetch STI data separately
        const fetchSti = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                let url = `/api/corporate/tl/team-sti?fromDate=${fromDate}&toDate=${toDate}`;
                if (selectedRecruiter && selectedRecruiter !== "All") {
                    url += `&recruiter_id=${selectedRecruiter}`;
                }
                
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    setTeamMetrics(prev => ({
                        ...prev,
                        total_sti: result.total_sti || 0
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch STI:', error);
            }
        };
        
        fetchSti();
    }, [fromDate, toDate, selectedRecruiter]);

    // Fetch Assignment Breakdown data when date range or selected recruiter changes (only after date is initialized)
    useEffect(() => {
        if (!isDateInitialized || !fromDate || !toDate) return;
        
        const fetchAssignmentData = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                let url = `/api/corporate/tl/workbench-data?fromDate=${fromDate}&toDate=${toDate}`;
                if (selectedRecruiter && selectedRecruiter !== "All") {
                    url += `&recruiter_id=${selectedRecruiter}`;
                }
                
                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const result = await response.json();
                
                if (result.success && result.data) {
                    setAssignmentData(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch assignment data:', error);
            }
        };
        
        fetchAssignmentData();
    }, [fromDate, toDate, selectedRecruiter, isDateInitialized]);

    // Fetch rejected CV data when modal opens
    useEffect(() => {
        if (rejectedCvModalOpen) {
            setIsLoadingRejectedCv(true);
            const fetchRejectedCv = async () => {
                try {
                    const session = JSON.parse(localStorage.getItem('session') || '{}');
                    const token = session.access_token;
                    
                    if (!token) return;
                    
                    const response = await fetch(`/api/corporate/tl/rejected-cv?fromDate=${fromDate}&toDate=${toDate}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                        setRejectedCvData(result.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch rejected CV:', error);
                } finally {
                    setIsLoadingRejectedCv(false);
                }
            };
            
            fetchRejectedCv();
        }
    }, [rejectedCvModalOpen, fromDate, toDate]);

    // Fetch joining data when modal opens
    useEffect(() => {
        if (joiningModalOpen) {
            setIsLoadingJoining(true);
            const fetchJoining = async () => {
                try {
                    const session = JSON.parse(localStorage.getItem('session') || '{}');
                    const token = session.access_token;
                    
                    if (!token) return;
                    
                    const response = await fetch(`/api/corporate/tl/joining?fromDate=${fromDate}&toDate=${toDate}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                        setJoiningData(result.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch joining:', error);
                } finally {
                    setIsLoadingJoining(false);
                }
            };
            
            fetchJoining();
        }
    }, [joiningModalOpen, fromDate, toDate]);

    // --- MOCK DATA: Whole Team's logged work (TL View) ---

    const [reportData, setReportData] = useState([]);

    // --- CALCULATIONS ---
    // Filter data by date range, search term, and recruiter
    const filteredReports = useMemo(() => {
        return assignmentData.filter(item => {
            const matchesSearch = (item.job_title || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRecruiter = selectedRecruiter === "All" || item.sent_to_rc === selectedRecruiter;
            
            return matchesSearch && matchesRecruiter;
        });
    }, [assignmentData, searchTerm, selectedRecruiter]);

    // Calculate Top KPI Totals from teamMetrics
    const kpiTotals = useMemo(() => {
        return {
            total_cvs: teamMetrics.total_cvs || 0,
            total_sti: teamMetrics.total_sti || 0,
            total_conversion: teamMetrics.total_conversion || 0,
            total_asset: teamMetrics.total_asset || 0,
            total_trackers: teamMetrics.total_trackers || 0
        };
    }, [teamMetrics]);

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
                            {recruitersList.map(r => <option key={r.user_id} value={r.user_id}>{r.name}</option>)}
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
                            <p className="text-2xl font-black text-blue-700 leading-none mt-1">{tlMetrics.trackerSentToCrm}</p>
                        </div>
                    </div>

                    {/* TL Card 2: Pipeline CV */}
                    <div 
                        className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 flex items-center gap-3 relative overflow-hidden group hover:border-indigo-300 transition-colors cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setPipelineModalOpen(true)}
                    >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <Database size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Pipeline CV</p>
                            <p className="text-2xl font-black text-indigo-700 leading-none mt-1">{tlMetrics.pipelineCv}</p>
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
                            <p className="text-2xl font-black text-red-700 leading-none mt-1">{tlMetrics.rejectedCv}</p>
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
                            <p className="text-2xl font-black text-emerald-700 leading-none mt-1">{tlMetrics.joining}</p>
                        </div>
                    </div>

                    {/* TL Card 5: Accuracy % */}
                    <div 
                        className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-3 relative overflow-hidden group hover:border-amber-300 transition-colors cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setAccuracyModalOpen(true)}
                    >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-amber-50 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0 z-10">
                            <Target size={20} />
                        </div>
                        <div className="z-10 flex items-baseline gap-1">
                            <div>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Accuracy %</p>
                                <p className="text-2xl font-black text-amber-700 leading-none mt-1">{accuracy}<span className="text-sm ml-0.5">%</span></p>
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
                    {latestCvDate && (
                        <span className="ml-2 bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Calendar size={10}/> {latestCvDate}
                        </span>
                    )}
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
                                    const totalRowCv = (row.cv_naukri || 0) + (row.cv_indeed || 0) + (row.cv_other || 0);
                                    
                                    return (
                                        <tr key={row.workbench_id || index} className="hover:bg-blue-50/50 transition">
                                            
                                            <td className="p-3 border-r border-gray-200 text-center text-gray-400 font-bold bg-gray-50">{index + 1}</td>
                                            
                                            {/* Date */}
                                            <td className="p-3 border-r border-gray-200 font-bold text-gray-600 bg-gray-50">{row.date}</td>
                                            
                                            {/* Recruiter & Slot Combined Column */}
                                            <td className="p-2 border-r border-gray-200">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-center">
                                                        {row.rc_name}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-500 text-center flex items-center justify-center gap-1">
                                                        <Clock size={10} className="text-orange-500"/> {row.slot}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                           {/* Profile & JD View Button */}
                                            <td className="p-3 border-r border-gray-200">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <span className="font-black text-[#103c7f] leading-tight">{row.job_title}</span>
                                                    <button 
                                                        onClick={() => setJdModalData(row)}
                                                        className="text-blue-600 hover:text-white hover:bg-blue-600 font-black text-[8px] uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded transition-colors border border-blue-200"
                                                    >
                                                        View JD
                                                    </button>
                                                </div>
                                            </td>
                                            
                                            {/* Pkg / Req */}
                                            <td className="p-3 border-r border-gray-200 text-center">
                                                <span className="text-green-700 font-bold">{row.package}</span> <span className="text-gray-300 mx-1">|</span> <span className="text-gray-800 font-black">{row.requirement}</span>
                                            </td>

                                            {/* CV Column */}
                                            <td className="p-2 border-r border-gray-200 text-center bg-blue-50/50">
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
                                                {row.rc_remarks ? `"${row.rc_remarks}"` : <span className="text-gray-400 not-italic">No notes</span>}
                                            </td>

                                            {/* TL Remarks */}
                                            <td className="p-3 text-[11px] font-bold text-[#103c7f] bg-blue-50/20 border-l border-blue-100">
                                                {row.tl_remarks ? row.tl_remarks : <span className="text-gray-400 font-normal italic">No remark added</span>}
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
                <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[9999] p-0 md:p-4">
                    <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl">
                        <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900">
                            <div className="flex items-center gap-3">
                                <FileText size={20} />
                                <h3 className="font-bold text-lg uppercase tracking-wide">Job Description Preview</h3>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setJdModalData(null)} className="hover:bg-white/20 p-2 rounded-full transition">
                                    <X size={20}/>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 custom-scrollbar">
                            <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative">
                                <div className="mb-10">
                                    <Image src="/maven-logo.png" alt="Maven Jobs" width={220} height={70} className="object-contain" priority />
                                </div>

                                <div className="border border-black p-8 min-h-[850px] relative">
                                    <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                                        {jdModalData.job_title && <p><span className="font-bold">JOB TITLE : </span> {jdModalData.job_title}</p>}
                                        {jdModalData.location && <p><span className="font-bold">LOCATION : </span> {jdModalData.location}</p>}
                                        {jdModalData.experience && <p><span className="font-bold">EXPERIENCE : </span> {jdModalData.experience}</p>}
                                        {jdModalData.employment_type && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {jdModalData.employment_type}</p>}
                                        {jdModalData.working_days && <p><span className="font-bold">WORKING DAYS : </span> {jdModalData.working_days}</p>}
                                        {jdModalData.timings && <p><span className="font-bold">TIMINGS : </span> {jdModalData.timings}</p>}
                                        {jdModalData.package && <p><span className="font-bold">PACKAGE : </span> {jdModalData.package}</p>}
                                        {jdModalData.tool_requirement && <p><span className="font-bold">TOOL REQUIREMENT : </span> {jdModalData.tool_requirement}</p>}
                                    </div>

                                    <div className="space-y-8 text-[15px]">
                                        {jdModalData.job_summary && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{jdModalData.job_summary}</p></div>
                                        )}

                                        {jdModalData.rnr && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {jdModalData.rnr.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {jdModalData.req_skills && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {jdModalData.req_skills.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {jdModalData.preferred_qual && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {jdModalData.preferred_qual.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {jdModalData.company_offers && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {jdModalData.company_offers.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {jdModalData.contact_details && (
                                            <div className="mt-12 pt-6 border-t border-black/20">
                                                <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                                <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{jdModalData.contact_details}</div>
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
                                    <span className="text-lg font-black">{accuracy}%</span>
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
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Trackers Sent TO CRM</p>
                                    <p className="text-3xl font-black text-blue-800">{tlMetrics.trackerSentToCrm}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Candidates Joined</p>
                                    <p className="text-3xl font-black text-green-800">{tlMetrics.joining}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Strip */}
                        <div className="bg-gray-100 p-3 text-center border-t border-gray-200">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                Candidates Joined / Trackers Sent TO CRM × 100
                            </p>
                        </div>

                    </div>
                </div>
            )}

            {/* --- PIPELINE CV MODAL --- */}
            {pipelineModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={() => setPipelineModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                                <Database size={20}/> Pipeline CV Details
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 px-3 py-1 rounded-full">
                                    <span className="text-lg font-black">{tlMetrics.pipelineCv}</span>
                                </div>
                                <button onClick={() => setPipelineModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition bg-white/10">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 pb-0">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Tracker Received</p>
                                    <p className="text-3xl font-black text-blue-800">{tlMetrics.totalTrackersReceived}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Sent to CRM</p>
                                    <p className="text-3xl font-black text-purple-800">{tlMetrics.trackerSentToCrm}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Not Responding</p>
                                    <p className="text-3xl font-black text-red-800">{tlMetrics.notResponding}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Rejected</p>
                                    <p className="text-3xl font-black text-orange-800">{tlMetrics.rejectedCv}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Strip */}
                        <div className="bg-gray-100 p-3 text-center border-t border-gray-200">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                (Tracker Received - Sent to CRM - Not Responding - Rejected)
                            </p>
                        </div>

                    </div>
                </div>
            )}

            {/* --- REJECTED CV MODAL --- */}
            {rejectedCvModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={() => setRejectedCvModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="bg-red-600 p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                                <X size={20}/> Rejected CV Details
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 px-3 py-1 rounded-full">
                                    <span className="text-lg font-black">{rejectedCvData.length}</span>
                                </div>
                                <button onClick={() => setRejectedCvModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition bg-white/10">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {isLoadingRejectedCv ? (
                                <div className="flex justify-center items-center py-10">
                                    <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                                </div>
                            ) : rejectedCvData.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-red-50 text-red-600 text-[10px] uppercase font-bold sticky top-0">
                                        <tr>
                                            <th className="p-2 border border-red-200">Sno.</th>
                                            <th className="p-2 border border-red-200">Date</th>
                                            <th className="p-2 border border-red-200">RC Name</th>
                                            <th className="p-2 border border-red-200">Profile</th>
                                            <th className="p-2 border border-red-200">Candidate</th>
                                            <th className="p-2 border border-red-200">Phone</th>
                                            <th className="p-2 border border-red-200">Location</th>
                                            <th className="p-2 border border-red-200">Exp</th>
                                            <th className="p-2 border border-red-200">CV</th>
                                            <th className="p-2 border border-red-200">Call Respond</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs text-slate-800 font-medium">
                                        {rejectedCvData.map((row, idx) => (
                                            <tr key={row.conversation_id} className="hover:bg-red-50">
                                                <td className="p-2 border border-red-200">{idx + 1}</td>
                                                <td className="p-2 border border-red-200">{row.sent_date || '-'}</td>
                                                <td className="p-2 border border-red-200">{row.rc_name || '-'}</td>
                                                <td className="p-2 border border-red-200">{row.profile}</td>
                                                <td className="p-2 border border-red-200">{row.candidate_name}</td>
                                                <td className="p-2 border border-red-200">{row.candidate_phone || '-'}</td>
                                                <td className="p-2 border border-red-200">{row.candidate_location || '-'}</td>
                                                <td className="p-2 border border-red-200">{row.experience || '-'}</td>
                                                <td className="p-2 border border-red-200">
                                                    {row.redacted_cv_url ? (
                                                        <a href={row.redacted_cv_url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline font-bold">View CV</a>
                                                    ) : row.cv_url ? (
                                                        <a href={row.cv_url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline font-bold">View CV</a>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-2 border border-red-200">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        row.call_respond === 'No' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {row.call_respond || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-10 text-slate-500 text-xs">No rejected CVs found</div>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* --- JOINING MODAL --- */}
            {joiningModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={() => setJoiningModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                                <CheckCircle size={20}/> Joining Details
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 px-3 py-1 rounded-full">
                                    <span className="text-lg font-black">{joiningData.length}</span>
                                </div>
                                <button onClick={() => setJoiningModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition bg-white/10">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {isLoadingJoining ? (
                                <div className="flex justify-center items-center py-10">
                                    <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                                </div>
                            ) : joiningData.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold sticky top-0">
                                        <tr>
                                            <th className="p-2 border border-emerald-200">Sno.</th>
                                            <th className="p-2 border border-emerald-200">Joining Date</th>
                                            <th className="p-2 border border-emerald-200">Profile</th>
                                            <th className="p-2 border border-emerald-200">Slot</th>
                                            <th className="p-2 border border-emerald-200">Candidate Name</th>
                                            <th className="p-2 border border-emerald-200">Email</th>
                                            <th className="p-2 border border-emerald-200">Phone</th>
                                            <th className="p-2 border border-emerald-200">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs text-slate-800 font-medium">
                                        {joiningData.map((row, idx) => (
                                            <tr key={row.conversation_id} className="hover:bg-emerald-50">
                                                <td className="p-2 border border-emerald-200">{idx + 1}</td>
                                                <td className="p-2 border border-emerald-200">{row.date || '-'}</td>
                                                <td className="p-2 border border-emerald-200">{row.profile || '-'}</td>
                                                <td className="p-2 border border-emerald-200">{row.slot || '-'}</td>
                                                <td className="p-2 border border-emerald-200">{row.candidate_name}</td>
                                                <td className="p-2 border border-emerald-200">{row.candidate_email || '-'}</td>
                                                <td className="p-2 border border-emerald-200">{row.candidate_phone || '-'}</td>
                                                <td className="p-2 border border-emerald-200">
                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700">
                                                        {row.interview_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-10 text-slate-500 text-xs">No joinings found</div>
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
