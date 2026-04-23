"use client";
import { useState, useMemo, useEffect } from "react";
import { 
    Calendar, Briefcase, IndianRupee, Clock, 
    FileText, Send, TrendingUp, Database, UserCheck, MessageSquare, 
    Search, Eye, X, Users, LayoutDashboard, Settings, UserCog, Download
} from "lucide-react";

export default function CRMWorkbenchReport() {
    
    // --- STATE ---
    const [fromDate, setFromDate] = useState(""); 
    const [toDate, setToDate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTL, setSelectedTL] = useState("All");
    const [selectedRecruiter, setSelectedRecruiter] = useState("All");
    const [latestCvDate, setLatestCvDate] = useState("");
    const [isDateInitialized, setIsDateInitialized] = useState(false);
    
    // Users data from API
    const [allUsers, setAllUsers] = useState([]);

    // Fetch users from API
    useEffect(() => {
        async function fetchUsers() {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                const res = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.data) {
                    setAllUsers(data.data);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        }
        fetchUsers();
    }, []);

    // Filter TLs: role contains TL and sector = Corporate
    const tlList = useMemo(() => {
        return allUsers
            .filter(u => u.role && u.role.includes('TL') && u.sector === 'Corporate')
            .map(u => ({ user_id: u.user_id, name: u.name }));
    }, [allUsers]);

    // Filter RCs: role contains RC and sector = Corporate
    const allRecruiters = useMemo(() => {
        return allUsers
            .filter(u => u.role && u.role.includes('RC') && u.sector === 'Corporate')
            .map(u => ({ user_id: u.user_id, name: u.name, tl_id: u.tl_id }));
    }, [allUsers]);

    // Filter recruiters based on selected TL
    const recruitersList = useMemo(() => {
        if (selectedTL === "All") {
            return allRecruiters;
        }
        const selectedTlUser = tlList.find(t => t.name === selectedTL);
        if (selectedTlUser) {
            return allRecruiters.filter(r => r.tl_id === selectedTlUser.user_id);
        }
        return allRecruiters;
    }, [allRecruiters, selectedTL, tlList]);

    // Reset recruiter when TL changes
    useEffect(() => {
        if (selectedTL !== "All") {
            const selectedTlUser = tlList.find(t => t.name === selectedTL);
            const hasRcForThisTl = allRecruiters.some(r => r.tl_id === selectedTlUser?.user_id);
            if (!hasRcForThisTl) {
                setSelectedRecruiter("All");
            }
        }
    }, [selectedTL, tlList, allRecruiters]);

    // Get selected TL user_id
    const selectedTlUser = useMemo(() => {
        if (selectedTL === "All") return null;
        return tlList.find(t => t.name === selectedTL);
    }, [selectedTL, tlList]);

    // Get selected RC user_id
    const selectedRcUser = useMemo(() => {
        if (selectedRecruiter === "All") return null;
        return recruitersList.find(r => r.name === selectedRecruiter);
    }, [selectedRecruiter, recruitersList]);

    // Fetch latest CV date when allRecruiters is populated and apply to date fields

    // Fetch latest CV date when allRecruiters is populated and apply to date fields
    useEffect(() => {
        if (allRecruiters.length === 0) return;
        
        const fetchLatestDate = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;
                
                const userIds = allRecruiters.map(r => r.user_id).join(',');
                if (!userIds) return;
                
                const res = await fetch(`/api/corporate/crm/workbench/latest-date?userIds=${userIds}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                
                if (result.success && result.maxDate) {
                    setLatestCvDate(result.maxDate);
                    setFromDate(result.maxDate);
                    setToDate(result.maxDate);
                    setIsDateInitialized(true);
                } else {
                    const today = new Date().toISOString().split('T')[0];
                    setLatestCvDate(today);
                    setFromDate(today);
                    setToDate(today);
                    setIsDateInitialized(true);
                }
            } catch (error) {
                console.error('Error fetching latest date:', error);
                const today = new Date().toISOString().split('T')[0];
                setLatestCvDate(today);
                setFromDate(today);
                setToDate(today);
                setIsDateInitialized(true);
            }
        };
        
        fetchLatestDate();
    }, [allRecruiters]);

    // Cards data state
    const [cardsData, setCardsData] = useState({
        total_cvs: 0,
        total_sti: 0,
        total_conversion: 0,
        total_asset: 0,
        tracker_received: 0,
        tracker_shared: 0
    });

    // Fetch cards data when date range or selection changes
    useEffect(() => {
        if (!isDateInitialized || !fromDate || !toDate) return;

        const fetchCardsData = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;

                let url = `/api/corporate/crm/workbench/cards?fromDate=${fromDate}&toDate=${toDate}`;
                
                if (selectedRecruiter !== "All" && selectedRcUser) {
                    url += `&recruiter_id=${selectedRcUser.user_id}`;
                } else if (selectedTL !== "All" && selectedTlUser) {
                    url += `&tl_id=${selectedTlUser.user_id}`;
                }

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                
                if (result.success && result.data) {
                    setCardsData(prev => ({
                        ...prev,
                        total_cvs: result.data.total_cvs,
                        total_sti: result.data.total_sti,
                        total_conversion: result.data.total_conversion,
                        total_asset: result.data.total_asset,
                        tracker_received: result.data.tracker_received
                    }));
                }
            } catch (error) {
                console.error('Error fetching cards data:', error);
            }
        };

        const fetchTrackerShared = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;

                const url = `/api/corporate/crm/workbench/tracker-shared?fromDate=${fromDate}&toDate=${toDate}`;

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                
                if (result.success) {
                    setCardsData(prev => ({
                        ...prev,
                        tracker_shared: result.tracker_shared
                    }));
                }
            } catch (error) {
                console.error('Error fetching tracker shared:', error);
            }
        };

        fetchCardsData();
        fetchTrackerShared();
    }, [fromDate, toDate, selectedTL, selectedRecruiter, selectedTlUser, selectedRcUser, isDateInitialized]);
    
    // Modals State
    const [cvModalData, setCvModalData] = useState(null);
    const [jdModalData, setJdModalData] = useState(null);
    
    // JD View Modal State (PDF Style)
    const [isJdViewModalOpen, setIsJdViewModalOpen] = useState(false);
    const [currentJdView, setCurrentJdView] = useState(null);

    // Workbench data from API
    const [workbenchData, setWorkbenchData] = useState([]);

    // Fetch workbench data when date range or selection changes
    useEffect(() => {
        if (!isDateInitialized || !fromDate || !toDate) return;

        const fetchWorkbenchData = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;
                
                if (!token) return;

                let url = `/api/corporate/crm/workbench/data?fromDate=${fromDate}&toDate=${toDate}`;
                
                if (selectedRecruiter !== "All" && selectedRcUser) {
                    url += `&rc_id=${selectedRcUser.user_id}`;
                } else if (selectedTL !== "All" && selectedTlUser) {
                    url += `&tl_id=${selectedTlUser.user_id}`;
                }

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                
                if (result.success && result.data) {
                    setWorkbenchData(result.data);
                }
            } catch (error) {
                console.error('Error fetching workbench data:', error);
            }
        };

        fetchWorkbenchData();
    }, [fromDate, toDate, selectedTL, selectedRecruiter, selectedTlUser, selectedRcUser, isDateInitialized]);

    // --- CALCULATIONS ---
    // Filter workbench data based on search
    const filteredReports = useMemo(() => {
        return workbenchData.filter(item => {
            const matchesSearch = item.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [workbenchData, searchTerm]);

    const kpiTotals = useMemo(() => {
        return {
            total_cvs: cardsData.total_cvs || 0,
            total_sti: cardsData.total_sti || 0,
            total_conversion: cardsData.total_conversion || 0,
            total_asset: cardsData.total_asset || 0,
            total_trackers: cardsData.tracker_received || 0
        };
    }, [cardsData]);

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
                            {tlList.map(tl => <option key={tl.user_id} value={tl.name}>{tl.name}</option>)}
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
                            {recruitersList.map(r => <option key={r.user_id} value={r.name}>{r.name}</option>)}
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
            <div className="mb-6">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users size={14} className="text-blue-500"/> Team Operational Metrics
                    {latestCvDate && (
                        <span className="ml-2 bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Calendar size={10}/> {latestCvDate}
                        </span>
                    )}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
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
                            <p className="text-2xl font-black text-gray-800 leading-none mt-1">{cardsData.tracker_shared || 0}</p> 
                        </div>
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
                                                        TL: {row.tl_name}
                                                    </span>
                                                    <span className="text-[9px] font-black text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider w-full truncate">
                                                        RC: {row.recruiter_name}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Client, Profile & JD Combined */}
                                            <td className="p-2.5 border-r border-gray-200 align-top">
                                                <div className="flex flex-col gap-1 items-start w-full">
                                                    <span className="font-black text-[#103c7f] text-[11px] uppercase tracking-wide truncate w-full" title={row.client_name}>
                                                        {row.client_name}
                                                    </span>
                                                    <div className="flex items-center justify-between w-full gap-2">
                                                        <span className="font-bold text-gray-600 leading-tight truncate">{row.job_title}</span>
                                                        <button
                                                            onClick={() => {
                                                                setJdModalData(row);
                                                                setCurrentJdView({
                                                                    title: row.job_title,
                                                                    summary: row.job_summary,
                                                                    skills: row.req_skills || '',
                                                                    location: row.location || '',
                                                                    experience: row.experience || '',
                                                                    employment_type: row.employment_type || '',
                                                                    working_days: row.working_days || '',
                                                                    timings: row.timings || '',
                                                                    package_salary: row.package || '',
                                                                    tool_requirement: row.tool_requirement || '',
                                                                    rnr: row.rnr || '',
                                                                    preferred_qual: row.preferred_qual || '',
                                                                    company_offers: row.company_offers || '',
                                                                    contact_details: row.contact_details || ''
                                                                });
                                                                setIsJdViewModalOpen(true);
                                                            }}
                                                            className="text-blue-600 hover:text-white hover:bg-blue-600 font-black text-[8px] uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded transition-colors border border-blue-200 shrink-0"
                                                        >
                                                            View JD
                                                        </button>
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
                                                    <span className="font-black text-blue-700 text-sm">{row.totalCv}</span>
                                                    <Eye size={12} className="text-blue-400" />
                                                </div>
                                            </td>

                                            {/* KPIs */}
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-purple-700 bg-purple-50/20 align-top"><div className="mt-1">{row.advance_sti}</div></td>
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-green-700 bg-green-50/20 align-top"><div className="mt-1">{row.today_conversion}</div></td>
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-orange-600 bg-orange-50/20 align-top"><div className="mt-1">{row.today_asset}</div></td>
                                            
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-gray-800 bg-gray-50 align-top"><div className="mt-1">{row.tracker_sent || 0}</div></td>
                                            <td className="p-2.5 border-r border-gray-200 text-center font-black text-indigo-700 bg-indigo-50/40 align-top"><div className="mt-1">{row.tracker_shared || 0}</div></td>

                                            {/* Fix: Notes & Remarks separated properly with align-top and borders */}
                                            <td className="p-2.5 border-r border-gray-300 align-top w-48 bg-yellow-50/30">
                                                <div className="text-[10px] text-gray-600 italic whitespace-normal">
                                                    {row.rc_remarks ? `"${row.rc_remarks}"` : <span className="text-gray-400 not-italic">No notes</span>}
                                                </div>
                                            </td>

                                            <td className="p-2.5 align-top w-48 bg-blue-50/20">
                                                <div className="text-[10px] font-bold text-[#103c7f] whitespace-normal">
                                                    {row.tl_remarks ? row.tl_remarks : <span className="text-gray-400 font-normal italic">No remark added</span>}
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
                            <h4 className="text-sm font-black text-[#103c7f] mb-1">{cvModalData.job_title}</h4>
                            <p className="text-[10px] font-bold text-gray-500 mb-4 bg-gray-200 inline-block px-2 py-0.5 rounded-full">
                                TL: {cvModalData.tl_name} <span className="mx-1">•</span> RC: {cvModalData.recruiter_name}
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

            {jdModalData && isJdViewModalOpen && (
                <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[10000] p-0 md:p-4 print:static print:block print:bg-white print:p-0 print:z-auto" onClick={() => { setIsJdViewModalOpen(false); setJdModalData(null); }}>
                    
                    <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl print:block print:h-auto print:max-w-full print:shadow-none print:rounded-none print:overflow-visible" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header (Hidden in Print) */}
                        <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900 print:hidden">
                            <div className="flex items-center gap-3">
                                <FileText size={20} />
                                <h3 className="font-bold text-lg uppercase tracking-wide">Document Preview</h3>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => window.print()} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wider">
                                    <Download size={16}/> Save as PDF
                                </button>
                                <button onClick={() => { setIsJdViewModalOpen(false); setJdModalData(null); }} className="hover:bg-white/20 p-2 rounded-full transition">
                                    <X size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* --- PDF CONTENT --- */}
                        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 block print:block print:overflow-visible print:bg-white print:p-0 custom-scrollbar">
                            <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative print:w-full print:max-w-none print:shadow-none print:m-0 print:border-none" id="pdf-content">
                                
                                {/* 1. Header Logo */}
                                <div className="mb-10">
                                    <img src="/maven-logo.png" alt="Maven Jobs" style={{ width: '220px', height: '70px', objectFit: 'contain' }} />
                                </div>

                                {/* 2. Bordered Container */}
                                <div className="border border-black p-8 min-h-[850px] relative print:border-none print:p-0">
                                    
                                    {/* Key Value Pairs */}
                                    <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                                        {currentJdView.title && <p><span className="font-bold">JOB TITLE : </span> {currentJdView.title}</p>}
                                        {currentJdView.location && <p><span className="font-bold">LOCATION : </span> {currentJdView.location}</p>}
                                        {currentJdView.experience && <p><span className="font-bold">EXPERIENCE : </span> {currentJdView.experience}</p>}
                                        {currentJdView.employment_type && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {currentJdView.employment_type}</p>}
                                        {currentJdView.working_days && <p><span className="font-bold">WORKING DAYS : </span> {currentJdView.working_days}</p>}
                                        {currentJdView.timings && <p><span className="font-bold">TIMINGS : </span> {currentJdView.timings}</p>}
                                        {currentJdView.package_salary && <p><span className="font-bold">PACKAGE : </span> {currentJdView.package_salary}</p>}
                                        {currentJdView.tool_requirement && <p><span className="font-bold">TOOL REQUIREMENT : </span> {currentJdView.tool_requirement}</p>}
                                    </div>

                                    {/* Sections */}
                                    <div className="space-y-8 text-[15px]">
                                        {currentJdView.summary && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{currentJdView.summary}</p></div>
                                        )}
                                        
                                        {currentJdView.rnr && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {currentJdView.rnr.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {currentJdView.skills && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {currentJdView.skills.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {currentJdView.preferred_qual && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {currentJdView.preferred_qual.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {currentJdView.company_offers && (
                                            <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                                                <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                                    {currentJdView.company_offers.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {currentJdView.contact_details && (
                                            <div className="mt-12 pt-6 border-t border-black/20">
                                                <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                                <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{currentJdView.contact_details}</div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
