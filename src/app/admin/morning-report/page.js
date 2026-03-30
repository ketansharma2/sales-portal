"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
    FileText, ArrowLeft, Briefcase, Users,Search,Calendar,Send,UserCheck,MessageSquare,Settings,Clock,Eye,Printer,
    Laptop, SunMedium , TrendingUp, Building2, Home, Rocket,IndianRupee, CheckCircle2, Globe2, Store, FileSpreadsheet, Database, PhoneCall, File, X
} from "lucide-react";
import Image from "next/image";

export default function MorningReportPage() {
    const router = useRouter();
    // --- STATE FOR TABS ---
    const [activeTab, setActiveTab] = useState("Sales & Delivery");

    // --- GET CURRENT MONTH ---
    const [currentMonth, setCurrentMonth] = useState('');
    
    useEffect(() => {
        setCurrentMonth(new Date().toLocaleString('en-US', { month: 'long' }));
    }, []);

    // --- STATE FOR INPUT VALUES (from localStorage) ---
    const [inputValues, setInputValues] = useState({
        masterUnionProfiles: '',
        masterUnionCalling: '',
        totalCtc: '',
        corporateRemarks: '',
        domesticRemarks: '',
        jobPostRemarks: ''
    });

    // --- DELIVERY WORKBENCH REPORT STATES & MOCK DATA ---
    const [cvModalData, setCvModalData] = useState(null);
    const [jdModalData, setJdModalData] = useState(null);

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

    // --- LOAD FROM LOCALSTORAGE ON MOUNT ---
    useEffect(() => {
        const saved = localStorage.getItem('morningReportInputs');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setInputValues({
                    masterUnionProfiles: parsed.masterUnionProfiles || '',
                    masterUnionCalling: parsed.masterUnionCalling || '',
                    totalCtc: parsed.totalCtc || '',
                    corporateRemarks: parsed.corporateRemarks || '',
                    domesticRemarks: parsed.domesticRemarks || '',
                    jobPostRemarks: parsed.jobPostRemarks || ''
                });
            } catch (e) {
                console.error('Error loading from localStorage:', e);
            }
        }
    }, []);

    // --- SAVE TO LOCALSTORAGE ---
    const saveToLocalStorage = (key, value) => {
        const newValues = { ...inputValues, [key]: value };
        setInputValues(newValues);
        localStorage.setItem('morningReportInputs', JSON.stringify(newValues));
    };

    // --- GET YESTERDAY'S DATE ---
    // If yesterday is Sunday (day 0), use Saturday instead
    const [yesterdayDate, setYesterdayDate] = useState('');
    
    useEffect(() => {
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
        setYesterdayDate(lastWorkingDay.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
    }, []);

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
        lastWorkingDay: '',
        loading: true
    });

    // --- STATE FOR CORPORATE SECTOR DATA ---
    const [corporateStats, setCorporateStats] = useState({
        lastWorkingDay: '',
        clientSearchTotal: 0,
        clientSearchYesterday: 0,
        clientCallingTotal: 0,
        clientCallingYesterday: 0,
        contractShareTotal: 0,
        contractShareYesterday: 0,
        startupSearchTotal: 0,
        startupSearchYesterday: 0,
        startupCallingTotal: 0,
        startupCallingYesterday: 0,
        masterUnionClientsTotal: 0,
        masterUnionCallingTotal: 0,
        franchiseDiscussedTotal: 0,
        franchiseDiscussedYesterday: 0,
        formSharedTotal: 0,
        formSharedYesterday: 0,
        // NEW: Total Client Search (all rows)
        totalClientSearchNew: 0,
        totalClientSearchYesterdayNew: 0,
        // NEW: Total Client Calling (all rows)
        totalClientCallingNew: 0,
        totalClientCallingYesterdayNew: 0,
        loading: true
    });

    // --- STATE FOR JOB POSTING REPORT ---
    const [jobPostData, setJobPostData] = useState({
        selectedDate: null,
        jobs: [],
        stats: [],
        totals: { indeedCvs: 0, indeedCalls: 0, naukriCvs: 0, naukriCalls: 0 },
        loading: true
    });
    
    // JD Preview Modal State
    const [isJDPreviewOpen, setIsJDPreviewOpen] = useState(false);
    const [selectedJD, setSelectedJD] = useState(null);
    
    // Load jobPostRemarks from inputValues (already in localStorage)

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
                    const lastDay = data.data.lastWorkingDay || '';
                    const lastDayFormatted = lastDay ? new Date(lastDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
                    
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
                        lastWorkingDay: lastDayFormatted,
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

    // --- FETCH CORPORATE SECTOR DATA ---
    useEffect(() => {
        const fetchCorporateStats = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const response = await fetch('/api/admin/morning-report/corporate', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await response.json();
                
                if (data.success) {
                    const lastDay = data.data.lastWorkingDay || '';
                    const lastDayFormatted = lastDay ? new Date(lastDay).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
                    
                    setCorporateStats({
                        lastWorkingDay: lastDayFormatted,
                        clientSearchTotal: data.data.clientSearchTotal || 0,
                        clientSearchYesterday: data.data.clientSearchYesterday || 0,
                        clientCallingTotal: data.data.clientCallingTotal || 0,
                        clientCallingYesterday: data.data.clientCallingYesterday || 0,
                        contractShareTotal: data.data.contractShareTotal || 0,
                        contractShareYesterday: data.data.contractShareYesterday || 0,
                        startupSearchTotal: data.data.startupSearchTotal || 0,
                        startupSearchYesterday: data.data.startupSearchYesterday || 0,
                        startupCallingTotal: data.data.startupCallingTotal || 0,
                        startupCallingYesterday: data.data.startupCallingYesterday || 0,
                        masterUnionClientsTotal: data.data.masterUnionClientsTotal || 0,
                        masterUnionCallingTotal: data.data.masterUnionCallingTotal || 0,
                        franchiseDiscussedTotal: data.data.franchiseDiscussedTotal || 0,
                        franchiseDiscussedYesterday: data.data.franchiseDiscussedYesterday || 0,
                        formSharedTotal: data.data.formSharedTotal || 0,
                        formSharedYesterday: data.data.formSharedYesterday || 0,
                        // NEW: Total Client Search (all rows)
                        totalClientSearchNew: data.data.totalClientSearchNew || 0,
                        totalClientSearchYesterdayNew: data.data.totalClientSearchYesterdayNew || 0,
                        // NEW: Total Client Calling (all rows)
                        totalClientCallingNew: data.data.totalClientCallingNew || 0,
                        totalClientCallingYesterdayNew: data.data.totalClientCallingYesterdayNew || 0,
                        loading: false
                    });
                }
            } catch (error) {
                console.error('Error fetching corporate stats:', error);
                setCorporateStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchCorporateStats();
    }, []);

    // --- FETCH JOB POSTING DATA ---
    useEffect(() => {
        const fetchJobPostData = async () => {
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                
                // Fetch report date and all data from new unified API
                const res = await fetch('/api/jobpost/report-date', {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setJobPostData({
                        selectedDate: data.selectedDate,
                        jobs: data.jobs || [],
                        stats: data.stats || [],
                        totals: data.totals || { indeedCvs: 0, indeedCalls: 0, naukriCvs: 0, naukriCalls: 0 },
                        loading: false
                    });
                }
            } catch (error) {
                console.error('Error fetching job post data:', error);
                setJobPostData(prev => ({ ...prev, loading: false }));
            }
        };
        
        fetchJobPostData();
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
                {activeTab === "Sales & Delivery" && (
                    <div className="animate-in fade-in duration-500">
                        
                        {/* ========================================= */}
                        {/* ---------- SALES DEPARTMENT BLOCK --------- */}
                        {/* ========================================= */}
                        <div className="mb-8">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <TrendingUp size={18} className="text-blue-600"/> Sales
                            </h2>
                            
                            {/* Row 1: Corporate Sector */}
                            <div className="mb-6">
                                {/* --- CORPORATE SALES (SPLIT-CARD DESIGN) --- */}
                                <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-indigo-50 p-3 border-b border-indigo-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={16} className="text-indigo-600"/>
                                            <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Corporate Sector</h4>
                                        </div>
                                        <span className="bg-white text-indigo-500 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-200">Sales</span>
                                    </div>
                                    
                                     {/* High-Density Split-Card Grid - Row 1: 5 cards */}
                                    <div className="p-3 flex gap-2 bg-slate-50/30 overflow-x-auto">
                                        {/* Total Database Container */}
                                        <div className="w-[60%] border-2 border-blue-200 rounded-lg overflow-hidden">
                                            <div className="bg-blue-50 px-3 py-1.5 border-b border-blue-200">
                                                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Total Database</p>
                                            </div>
                                            <div className="p-2 flex gap-2 bg-white">
                                                {/* Total Client Search */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=client-search-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Total Client Search</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.totalClientSearchNew}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-indigo-700 leading-none">{corporateStats.loading ? '-' : corporateStats.totalClientSearchYesterdayNew}</p></div>
                                                    </div>
                                                </div>

                                                {/* Total Client Calling */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=client-calling-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Total Client Calling</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.totalClientCallingNew}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-indigo-700 leading-none">{corporateStats.loading ? '-' : corporateStats.totalClientCallingYesterdayNew}</p></div>
                                                    </div>
                                                </div>

                                                {/* Contract Share */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=contract-share-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Contract Share</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.contractShareTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-indigo-700 leading-none">{corporateStats.loading ? '-' : corporateStats.contractShareYesterday}</p></div>
                                                    </div>
                                                </div>

                                                {/* Yesterday Calls */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=yesterday-calls')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Yesterday Calls</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center bg-blue-50/50 flex flex-col justify-center"><p className="text-[8px] font-bold text-blue-500 uppercase">New</p><p className="text-base font-black text-blue-700 leading-none">-</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-amber-50/50 flex flex-col justify-center"><p className="text-[8px] font-bold text-amber-500 uppercase">Followup</p><p className="text-base font-black text-amber-700 leading-none">-</p></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Normal Clients Container */}
                                        <div className="w-[40%] border-2 border-green-200 rounded-lg overflow-hidden">
                                            <div className="bg-green-50 px-3 py-1.5 border-b border-green-200">
                                                <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Normal Clients</p>
                                            </div>
                                            <div className="p-2 flex gap-2 bg-white">
                                                {/* Client Search */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=client-search-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Client Search</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.clientSearchTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-indigo-700 leading-none">{corporateStats.loading ? '-' : corporateStats.clientSearchYesterday}</p></div>
                                                    </div>
                                                </div>

                                                {/* Client Calling */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=client-calling-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Client Calling</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.clientCallingTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-indigo-700 leading-none">{corporateStats.loading ? '-' : corporateStats.clientCallingYesterday}</p></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                   {/* Row 2: 4 cards (Startup & Master Union) */}
                                    <div className="p-3 flex gap-2 bg-slate-50/30 overflow-x-auto">
                                        
                                        {/* Startup Details Container */}
                                        <div className="w-1/2 border-2 border-orange-200 rounded-lg overflow-hidden">
                                            <div className="bg-orange-50 px-3 py-1.5 border-b border-orange-200">
                                                <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Startup Details</p>
                                            </div>
                                            <div className="p-2 flex gap-2 bg-white">
                                                {/* Startup Search */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=startup-search-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Startup Search</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.startupSearchTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-orange-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-orange-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-orange-700 leading-none">{corporateStats.loading ? '-' : corporateStats.startupSearchYesterday}</p></div>
                                                    </div>
                                                </div>

                                                {/* Startup Calling */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=startup-calling-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Startup Calling</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.startupCallingTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-orange-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-orange-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-orange-700 leading-none">{corporateStats.loading ? '-' : corporateStats.startupCallingYesterday}</p></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Master Union Container */}
                                        <div className="w-1/2 border-2 border-purple-200 rounded-lg overflow-hidden">
                                            <div className="bg-purple-50 px-3 py-1.5 border-b border-purple-200">
                                                <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Master Union Details</p>
                                            </div>
                                            <div className="p-2 flex gap-2 bg-white">
                                                {/* Master Union Clients (Updated to Dual Split) */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=master-union-clients-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Master Union Clients</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.masterUnionClientsTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-purple-50/30 flex flex-col justify-center"><p className="text-[8px] font-black text-purple-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-purple-700 leading-none">{corporateStats.loading ? '-' : corporateStats.masterUnionClientsYesterday}</p></div>
                                                    </div>
                                                </div>

                                                {/* Master Union Calling (Updated to Dual Split) */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[120px]" onClick={() => router.push('/admin/morning-report/corporate?filter=master-union-calling-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Master Union Calling</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.masterUnionCallingTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-purple-50/30 flex flex-col justify-center"><p className="text-[8px] font-black text-purple-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-purple-700 leading-none">{corporateStats.loading ? '-' : corporateStats.masterUnionCallingYesterday}</p></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: 3 cards + remarks */}
                                    <div className="p-3 flex gap-2 bg-slate-50/30 overflow-x-auto">
                                        {/* Franchise Details Container */}
                                        <div className="w-full border-2 border-rose-200 rounded-lg overflow-hidden">
                                            <div className="bg-rose-50 px-3 py-1.5 border-b border-rose-200">
                                                <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Franchise Details</p>
                                            </div>
                                            <div className="p-2 flex gap-2 bg-white">
                                                {/* Franchise Discussed */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-rose-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[180px]" onClick={() => router.push('/admin/morning-report/corporate?filter=franchise-discussed-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Fran. Discussed</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.franchiseDiscussedTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-rose-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-rose-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-rose-700 leading-none">{corporateStats.loading ? '-' : corporateStats.franchiseDiscussedYesterday}</p></div>
                                                    </div>
                                                </div>

                                                {/* Form Ask */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-rose-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[180px]" onClick={() => router.push('/admin/morning-report/corporate?filter=form-ask-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Form Ask</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.formSharedTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-rose-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-rose-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-rose-700 leading-none">{corporateStats.loading ? '-' : corporateStats.formSharedYesterday}</p></div>
                                                    </div>
                                                </div>

                                                {/* Form Shared */}
                                                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-rose-400 transition-all flex flex-col cursor-pointer flex-1 min-w-[180px]" onClick={() => router.push('/admin/morning-report/corporate?filter=form-shared-yesterday')}>
                                                    <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Form Shared</p></div>
                                                    <div className="flex divide-x divide-slate-100 h-[60px]">
                                                        <div className="flex-1 p-1.5 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none">{corporateStats.loading ? '-' : corporateStats.formSharedTotal}</p></div>
                                                        <div className="flex-1 p-1.5 text-center bg-rose-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-rose-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-rose-700 leading-none">{corporateStats.loading ? '-' : corporateStats.formSharedYesterday}</p></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Editable Remarks Area */}
                                    <div className="p-3 bg-indigo-50/50 border-t border-indigo-100">
                                        <label className="text-[10px] font-black text-indigo-800 uppercase mb-1 block">Remarks</label>
                                        <textarea 
                                            className="w-full text-xs font-bold text-slate-700 p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white shadow-inner resize-none" 
                                            rows="2" 
                                            placeholder="Enter your remarks for the Corporate Sales team..."
                                            value={inputValues.corporateRemarks}
                                            onChange={(e) => saveToLocalStorage('corporateRemarks', e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Row 2: Domestic Sector */}
                            <div>
                                {/* --- DOMESTIC SALES --- */}
                                <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-orange-50 p-3 border-b border-orange-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Home size={16} className="text-orange-600"/>
                                            <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest">Domestic Sector</h4>
                                        </div>
                                        <span className="bg-white text-orange-500 text-[9px] font-bold px-2 py-0.5 rounded border border-orange-200">Sales</span>
                                    </div>
                                    
                                    {/* Row 1: First 6 cards - using flex */}
                                    <div className="p-3 flex gap-2 bg-slate-50/30 overflow-x-auto">
                                        
                                        {/* Visit Metrics */}
                                        <div className="border border-slate-200 p-3 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all cursor-pointer w-1/6 min-w-[120px] h-[70px]" onClick={() => router.push('/admin/morning-report/domestic?filter=current-month-visits')}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Client Visits ({currentMonth}) </p>
                                            <div className="flex items-end justify-center gap-1">
                                                <p className="text-lg font-black text-slate-800 leading-none">
                                                    {domesticStats.loading ? '-' : domesticStats.totalVisits}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border border-slate-200 p-3 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all cursor-pointer w-1/6 min-w-[120px] h-[70px]" onClick={() => router.push('/admin/morning-report/domestic?filter=yesterday-visits')}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Yest. Visits ({domesticStats.lastWorkingDay})</p>
                                            <div className="flex items-end justify-center gap-1">
                                                <p className="text-lg font-black text-slate-800 leading-none">
                                                    {domesticStats.loading ? '-' : domesticStats.yesterdayVisits}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-300 transition-all flex flex-col cursor-pointer w-1/6 min-w-[120px] h-[70px]" onClick={() => router.push('/admin/morning-report/domestic?filter=individual-repeat')}>
                                            <div className="flex divide-x divide-slate-100 h-full">
                                                <div className="flex-1 p-2 text-center bg-blue-50/50 flex flex-col justify-center"><p className="text-[9px] font-bold text-blue-500 uppercase">Individual</p><p className="text-lg font-black text-blue-700 leading-none mt-1">{domesticStats.loading ? '-' : domesticStats.individualVisits}</p></div>
                                                <div className="flex-1 p-2 text-center bg-amber-50/50 flex flex-col justify-center"><p className="text-[9px] font-bold text-amber-500 uppercase">Repeat</p><p className="text-lg font-black text-amber-700 leading-none mt-1">{domesticStats.loading ? '-' : domesticStats.repeatVisits}</p></div>
                                            </div>
                                        </div>

                                        {/* Pipeline Metrics */}
                                        <div className="border border-slate-200 p-3 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all cursor-pointer w-1/6 min-w-[120px] h-[70px]" onClick={() => router.push('/admin/morning-report/domestic?filter=reached-out')}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Reached Out (Yest)</p>
                                            <div className="flex items-end justify-center gap-1"><p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.yesterdayReachedOut}</p></div>
                                        </div>
                                        <div className="border border-slate-200 p-3 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all cursor-pointer w-1/6 min-w-[120px] h-[70px]" onClick={() => router.push('/admin/morning-report/domestic?filter=interested')}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Interested (Yest)</p>
                                            <div className="flex items-end justify-center gap-1"><p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.yesterdayInterested}</p></div>
                                        </div>
                                        <div className="border border-emerald-200 p-3 rounded-lg bg-emerald-50 text-center shadow-sm hover:border-emerald-300 transition-all cursor-pointer w-1/6 min-w-[120px] h-[70px]" onClick={() => router.push('/admin/morning-report/domestic?filter=total-onboard')}>
                                            <p className="text-[9px] font-black text-emerald-700 uppercase leading-tight mb-1 truncate">Total Onboard ({currentMonth})</p>
                                            <div className="flex items-end justify-center gap-1">
                                                <p className="text-lg font-black text-emerald-900 leading-none">
                                                    {domesticStats.loading ? '-' : domesticStats.totalOnboarded}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Total CTC, Onboarded Yesterday Names, Remarks - using flex */}
                                    <div className="p-3 flex gap-2 bg-slate-50/30 overflow-x-auto">
                                        {/* EDITABLE KPI: Total Expected CTC */}
                                        <div className="border border-orange-200 p-2 rounded-lg bg-orange-50/50 text-center shadow-sm hover:border-orange-400 transition-all group relative w-1/3 min-w-[200px]">
                                            <p className="text-[9px] font-bold text-orange-600 uppercase leading-tight mb-1">Total CTC</p>
                                            <div className="flex items-center justify-center">
                                                <span className="text-lg font-black text-orange-800 mr-1">₹</span>
                                                <input 
                                                    type="text" 
                                                    className="text-lg font-black text-orange-800 bg-transparent border-b border-dashed border-orange-300 outline-none text-center w-32 focus:border-orange-600 transition-colors"
                                                    placeholder="0"
                                                    value={inputValues.totalCtc}
                                                    onChange={(e) => saveToLocalStorage('totalCtc', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Onboarded Detail Row (Names) */}
                                        <div className="border border-slate-200 p-2.5 rounded-lg bg-white flex flex-col justify-center gap-1 shadow-sm hover:border-orange-300 transition-all cursor-pointer w-1/3 min-w-[200px]" onClick={() => router.push('/admin/morning-report/domestic?filter=onboarded-yesterday')}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase">Onboarded (Yest) & Names</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl font-black text-slate-800 bg-slate-100 px-2 rounded">{domesticStats.loading ? '-' : domesticStats.yesterdayOnboarded}</span>
                                                <input 
                                                    type="text" 
                                                    className="text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-orange-400 focus:bg-white w-full transition-colors"
                                                    placeholder="Type client names here..."
                                                    defaultValue={domesticStats.yesterdayOnboardNames.join(', ')}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>

                                        {/* Editable Remarks Area */}
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white shadow-sm hover:border-orange-300 transition-all w-1/3 min-w-[200px]">
                                            <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Remarks</label>
                                            <textarea 
                                                className="w-full text-xs font-bold text-slate-700 p-2 border border-slate-300 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-200 bg-white shadow-inner resize-none" 
                                                rows="2" 
                                                placeholder="Enter your remarks for the Domestic Sales team..."
                                                value={inputValues.domesticRemarks}
                                                onChange={(e) => saveToLocalStorage('domesticRemarks', e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                       

                        {/* --------- DELIVERY DEPARTMENT BLOCK ------- */}

                        <div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Rocket size={18} className="text-purple-600"/> Delivery Workbench Reports
                            </h2>
                            
                            <div className="flex flex-col gap-8">
                                
                                {/* --- CORPORATE DELIVERY REPORT --- */}
                                <div className="bg-white border border-indigo-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                                    <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={18} className="text-indigo-600"/>
                                            <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest">
                                                Corporate Workbench
                                            </h3>
                                        </div>                                       
                                    </div>
                                   <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-[1250px] text-xs">
                                            <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                                                <tr>
                                                    <th className="p-2.5 border-r border-blue-800 w-8 text-center">#</th>
                                                    <th className="p-2.5 border-r border-blue-800 min-w-[110px]"><div className="flex items-center gap-1.5"><Calendar size={12}/> Date & Slot</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 min-w-[130px]"><div className="flex items-center gap-1.5 text-yellow-300"><Users size={12}/> CRM, TL & RC</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 min-w-[160px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Client, Profile & JD</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center min-w-[100px]"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Pkg / Req</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center bg-blue-600"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> CVs</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Send size={12}/> Adv STI</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><TrendingUp size={12}/> Conv.</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Database size={12}/> Asset</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center bg-gray-700/50"><div className="flex items-center justify-center gap-1.5"><UserCheck size={12}/> T. Rcvd</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center bg-indigo-700/50"><div className="flex items-center justify-center gap-1.5"><Send size={12}/> T. Shared</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 min-w-[160px]"><div className="flex items-center gap-1.5"><MessageSquare size={12}/> RC Notes</div></th>
                                                    <th className="p-2.5 min-w-[160px] bg-[#0d316a] text-yellow-300"><div className="flex items-center gap-1.5"><Settings size={12}/> TL Remarks</div></th>
                                                </tr>
                                            </thead>
                                        <tbody className="font-medium divide-y divide-gray-200">
                                                {reportData && reportData.length > 0 ? (
                                                    reportData.map((row, index) => {
                                                        const totalRowCv = (row.cv_naukri || 0) + (row.cv_indeed || 0) + (row.cv_other || 0);
                                                        return (
                                                            <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 text-center text-gray-400 font-bold bg-gray-50 align-middle">{index + 1}</td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 bg-gray-50 align-middle text-center">
                                                                    <div className="flex flex-col items-center justify-center gap-1 h-full">
                                                                        <span className="font-bold text-gray-800">{row.date}</span>
                                                                        <span className="text-[9px] font-bold text-orange-500 flex items-center justify-center gap-1 leading-tight"><Clock size={9}/> {row.slot}</span>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 align-middle text-center">
                                                                    <div className="flex flex-col items-center justify-center gap-1.5 w-full h-full">
                                                                        <span className="text-[9px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded shadow-sm w-max max-w-full truncate" title={row.crmName}>
                                                                            CRM: {row.crmName || "N/A"}
                                                                        </span>
                                                                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shadow-sm w-max max-w-full truncate" title={row.tlName}>
                                                                            TL: {row.tlName}
                                                                        </span>
                                                                        <span className="text-[9px] font-black text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider w-max max-w-full truncate" title={row.recruiter}>
                                                                            RC: {row.recruiter}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 align-middle text-center">
                                                                    <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                                                                        <span className="font-black text-[#103c7f] text-[11px] uppercase tracking-wide w-full break-words leading-tight" title={row.client}>{row.client}</span>
                                                                        <span className="font-bold text-gray-600 leading-tight w-full break-words">{row.profile}</span>
                                                                        {row.jdText ? (
                                                                            <button onClick={() => setJdModalData(row)} className="mt-1 text-blue-600 hover:text-white hover:bg-blue-600 font-black text-[8px] uppercase tracking-widest bg-blue-50 px-2 py-1 rounded transition-colors border border-blue-200 w-max">
                                                                                View JD
                                                                            </button>
                                                                        ) : (
                                                                            <span className="mt-1 text-gray-400 text-[8px] italic uppercase tracking-widest w-max">No JD</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 text-center align-middle">
                                                                    <div className="flex items-center justify-center gap-1.5"><span className="text-green-700 font-bold">{row.package}</span><span className="text-gray-300">|</span><span className="text-gray-800 font-black">{row.requirement}</span></div>
                                                                </td>
                                                                
                                                                <td className="p-2 border-r border-gray-200 text-center bg-blue-50/50 hover:bg-blue-100 transition cursor-pointer align-middle" onClick={() => setCvModalData(row)}>
                                                                    <div className="flex items-center justify-center gap-1"><span className="font-black text-blue-700 text-sm">{totalRowCv}</span><Eye size={12} className="text-blue-400" /></div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-purple-700 bg-purple-50/20 align-middle">{row.advance_sti}</td>
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-green-700 bg-green-50/20 align-middle">{row.conversion}</td>
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-orange-600 bg-orange-50/20 align-middle">{row.asset}</td>
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-gray-800 bg-gray-50 align-middle">{row.tracker_sent || 0}</td>
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-indigo-700 bg-indigo-50/40 align-middle">{row.tracker_shared || 0}</td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-300 align-middle text-center w-48 bg-yellow-50/30">
                                                                    <div className="text-[10px] text-gray-600 italic whitespace-normal break-words" title={row.notes}>{row.notes ? `"${row.notes}"` : <span className="text-gray-400 not-italic">No notes</span>}</div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 align-middle text-center w-48 bg-blue-50/20">
                                                                    <div className="text-[10px] font-bold text-[#103c7f] whitespace-normal break-words" title={row.tlRemark}>{row.tlRemark ? row.tlRemark : <span className="text-gray-400 font-normal italic">No remark added</span>}</div>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="13" className="p-12 text-center bg-white align-middle">
                                                            <Calendar size={40} className="text-indigo-200 mx-auto mb-3" />
                                                            <h4 className="text-lg font-black text-indigo-400 uppercase tracking-widest">No Corporate Data</h4>
                                                            <p className="text-sm font-bold text-gray-400 mt-1">No activities found for the corporate delivery team.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {/* --- TOTAL FOOTER ROW --- */}
                                            {reportData && reportData.length > 0 && (
                                                <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                                    <tr>
                                                        <td colSpan="3" className="p-3 text-right font-black text-slate-700 uppercase tracking-widest">
                                                            Total Summary
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle">
                                                            <div className="flex flex-col gap-1 items-center justify-center">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Unique</span>
                                                                <div className="flex gap-2 text-sm font-black text-[#103c7f]">
                                                                    <span>{new Set(reportData.map(r => r.client)).size} Clients</span>
                                                                    <span>|</span>
                                                                    <span>{new Set(reportData.map(r => r.profile)).size} Profiles</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-slate-200/50">
                                                            <span className="text-sm font-black text-slate-500">-</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-blue-100/50">
                                                            <span className="text-lg font-black text-blue-800">
                                                                {reportData.reduce((acc, curr) => acc + (curr.cv_naukri || 0) + (curr.cv_indeed || 0) + (curr.cv_other || 0), 0)}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-purple-100/50">
                                                            <span className="text-lg font-black text-purple-800">{reportData.reduce((acc, curr) => acc + (curr.advance_sti || 0), 0)}</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-green-100/50">
                                                            <span className="text-lg font-black text-green-800">{reportData.reduce((acc, curr) => acc + (curr.conversion || 0), 0)}</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-orange-100/50">
                                                            <span className="text-lg font-black text-orange-800">{reportData.reduce((acc, curr) => acc + (curr.asset || 0), 0)}</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-gray-200">
                                                            <span className="text-lg font-black text-gray-800">{reportData.reduce((acc, curr) => acc + (curr.tracker_sent || 0), 0)}</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-indigo-100/50">
                                                            <span className="text-lg font-black text-indigo-800">{reportData.reduce((acc, curr) => acc + (curr.tracker_shared || 0), 0)}</span>
                                                        </td>
                                                        <td colSpan="2" className="bg-slate-100"></td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>               
                                   {/* --- CORPORATE CLIENT HANDLING KPI CARDS & TABLE --- */}
                                    <div className="p-4 bg-indigo-50/20 border-t border-indigo-100">
                                        <h4 className="text-[11px] font-black text-indigo-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <UserCheck size={14}/> Corporate Client Handling
                                        </h4>
                                        
                                        {/* KPI CARDS */}
                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                                            {/* Client Calling (NEW) */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">CRM Client Calling</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-500 uppercase">Yest</p><p className="text-sm font-black text-indigo-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                            {/* Tracker to Client */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Tracker to Client</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-500 uppercase">Yest</p><p className="text-sm font-black text-indigo-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                            {/* Interview */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Interview</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-500 uppercase">Yest</p><p className="text-sm font-black text-indigo-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                            {/* Selection */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Selection</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-500 uppercase">Yest</p><p className="text-sm font-black text-indigo-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                            {/* Joining */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Joining</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-indigo-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-indigo-500 uppercase">Yest</p><p className="text-sm font-black text-indigo-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CLIENT CONVERSATION LOG TABLE */}
                                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
                                            <div className="bg-slate-50 p-2.5 border-b border-slate-200 flex justify-between items-center">
                                                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                                    <MessageSquare size={12}/> Client Conversation Log
                                                </h3>
                                            </div>
                                            <div className="overflow-x-auto custom-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                                                    <thead className="bg-slate-100/50 text-slate-500 text-[9px] uppercase font-bold">
                                                        <tr>
                                                            <th className="p-2.5 border-b border-slate-200 w-[15%]">Date & Mode</th>
                                                            <th className="p-2.5 border-b border-slate-200 w-[15%]">CRM</th>
                                                            <th className="p-2.5 border-b border-slate-200 w-[20%]">Company Name</th>
                                                            <th className="p-2.5 border-b border-slate-200 w-[20%]">Contact Info</th>
                                                            <th className="p-2.5 border-b border-slate-200 w-[30%]">Conversation</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {/* Static Mock Row (Replace with your map function) */}
                                                        <tr className="hover:bg-indigo-50/30 transition">
                                                            <td className="p-2.5 align-top">
                                                                <div className="flex flex-col gap-0.5 items-start">
                                                                    <span className="font-bold text-gray-800">2026-03-02</span>
                                                                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded w-max">On Call</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-2.5 align-top">
                                                                <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded shadow-sm w-max truncate">
                                                                    Rahul Verma
                                                                </span>
                                                            </td>
                                                            <td className="p-2.5 align-top font-black text-[#103c7f]">TechCorp Solutions</td>
                                                            <td className="p-2.5 align-top">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-bold text-gray-700">Mr. Amit Sharma</span>
                                                                    <span className="text-[9px] text-gray-500 uppercase tracking-wide">HR Manager</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-2.5 align-top text-[11px] text-gray-600 italic">
                                                                "Discussed the new Java Developer requirement. They need 5 candidates by next week. Shared tracker."
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                    </div>
                               

                                </div>



                                {/* --- DOMESTIC DELIVERY REPORT --- */}
                                <div className="bg-white border border-orange-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                                    <div className="bg-orange-50 p-4 border-b border-orange-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Home size={18} className="text-orange-600"/>
                                            <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest">
                                                Domestic Workbench
                                            </h3>
                                        </div>
                                        
                                        
                                    </div>

                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-[1250px] text-xs">
                                            <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                                                <tr>    
                                                    <th className="p-2.5 border-r border-blue-800 w-8 text-center">#</th>
                                                    <th className="p-2.5 border-r border-blue-800 min-w-[110px]"><div className="flex items-center gap-1.5"><Calendar size={12}/> Date & Slot</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 min-w-[120px]"><div className="flex items-center gap-1.5 text-yellow-300"><Users size={12}/> CRM, TL & RC</div></th>                                                    <th className="p-2.5 border-r border-blue-800 min-w-[180px]"><div className="flex items-center gap-1.5"><Briefcase size={12}/> Client, Profile & JD</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center min-w-[100px]"><div className="flex items-center justify-center gap-1.5"><IndianRupee size={12}/> Pkg / Req</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center bg-blue-600"><div className="flex items-center justify-center gap-1.5"><FileText size={12}/> CVs</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Send size={12}/> Adv STI</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><TrendingUp size={12}/> Conv.</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center"><div className="flex items-center justify-center gap-1.5"><Database size={12}/> Asset</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center bg-gray-700/50"><div className="flex items-center justify-center gap-1.5"><UserCheck size={12}/> T. Rcvd</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 text-center bg-indigo-700/50"><div className="flex items-center justify-center gap-1.5"><Send size={12}/> T. Shared</div></th>
                                                    <th className="p-2.5 border-r border-blue-800 min-w-[160px]"><div className="flex items-center gap-1.5"><MessageSquare size={12}/> RC Notes</div></th>
                                                    <th className="p-2.5 min-w-[160px] bg-[#0d316a] text-yellow-300"><div className="flex items-center gap-1.5"><Settings size={12}/> TL Remarks</div></th>
                                                </tr>
                                            </thead>
                                          <tbody className="font-medium divide-y divide-gray-200">
                                                {reportData && reportData.length > 0 ? (
                                                    reportData.map((row, index) => {
                                                        const totalRowCv = (row.cv_naukri || 0) + (row.cv_indeed || 0) + (row.cv_other || 0);
                                                        return (
                                                            <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 text-center text-gray-400 font-bold bg-gray-50 align-middle">{index + 1}</td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 bg-gray-50 align-middle text-center">
                                                                    <div className="flex flex-col items-center justify-center gap-1 h-full">
                                                                        <span className="font-bold text-gray-800">{row.date}</span>
                                                                        <span className="text-[9px] font-bold text-orange-500 flex items-center justify-center gap-1 leading-tight"><Clock size={9}/> {row.slot}</span>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 align-middle text-center">
                                                                    <div className="flex flex-col items-center justify-center gap-1.5 w-full h-full">
                                                                        <span className="text-[9px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded shadow-sm w-max max-w-full truncate" title={row.crmName}>
                                                                            CRM: {row.crmName || "N/A"}
                                                                        </span>
                                                                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shadow-sm w-max max-w-full truncate" title={row.tlName}>
                                                                            TL: {row.tlName}
                                                                        </span>
                                                                        <span className="text-[9px] font-black text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider w-max max-w-full truncate" title={row.recruiter}>
                                                                            RC: {row.recruiter}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 align-middle text-center">
                                                                    <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                                                                        <span className="font-black text-[#103c7f] text-[11px] uppercase tracking-wide w-full break-words leading-tight" title={row.client}>{row.client}</span>
                                                                        <span className="font-bold text-gray-600 leading-tight w-full break-words">{row.profile}</span>
                                                                        {row.jdText ? (
                                                                            <button onClick={() => setJdModalData(row)} className="mt-1 text-blue-600 hover:text-white hover:bg-blue-600 font-black text-[8px] uppercase tracking-widest bg-blue-50 px-2 py-1 rounded transition-colors border border-blue-200 w-max">
                                                                                View JD
                                                                            </button>
                                                                        ) : (
                                                                            <span className="mt-1 text-gray-400 text-[8px] italic uppercase tracking-widest w-max">No JD</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 text-center align-middle">
                                                                    <div className="flex items-center justify-center gap-1.5"><span className="text-green-700 font-bold">{row.package}</span><span className="text-gray-300">|</span><span className="text-gray-800 font-black">{row.requirement}</span></div>
                                                                </td>
                                                                
                                                                <td className="p-2 border-r border-gray-200 text-center bg-blue-50/50 hover:bg-blue-100 transition cursor-pointer align-middle" onClick={() => setCvModalData(row)}>
                                                                    <div className="flex items-center justify-center gap-1"><span className="font-black text-blue-700 text-sm">{totalRowCv}</span><Eye size={12} className="text-blue-400" /></div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-purple-700 bg-purple-50/20 align-middle">{row.advance_sti}</td>
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-green-700 bg-green-50/20 align-middle">{row.conversion}</td>
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-orange-600 bg-orange-50/20 align-middle">{row.asset}</td>
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-gray-800 bg-gray-50 align-middle">{row.tracker_sent || 0}</td>
                                                                <td className="p-2.5 border-r border-gray-200 text-center font-black text-indigo-700 bg-indigo-50/40 align-middle">{row.tracker_shared || 0}</td>
                                                                
                                                                <td className="p-2.5 border-r border-gray-300 align-middle text-center w-48 bg-yellow-50/30">
                                                                    <div className="text-[10px] text-gray-600 italic whitespace-normal break-words" title={row.notes}>{row.notes ? `"${row.notes}"` : <span className="text-gray-400 not-italic">No notes</span>}</div>
                                                                </td>
                                                                
                                                                <td className="p-2.5 align-middle text-center w-48 bg-blue-50/20">
                                                                    <div className="text-[10px] font-bold text-[#103c7f] whitespace-normal break-words" title={row.tlRemark}>{row.tlRemark ? row.tlRemark : <span className="text-gray-400 font-normal italic">No remark added</span>}</div>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="13" className="p-12 text-center bg-white align-middle">
                                                            <Calendar size={40} className="text-indigo-200 mx-auto mb-3" />
                                                            <h4 className="text-lg font-black text-indigo-400 uppercase tracking-widest">No Corporate Data</h4>
                                                            <p className="text-sm font-bold text-gray-400 mt-1">No activities found for the corporate delivery team.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {/* --- TOTAL FOOTER ROW --- */}
                                            {reportData && reportData.length > 0 && (
                                                <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                                    <tr>
                                                        <td colSpan="3" className="p-3 text-right font-black text-slate-700 uppercase tracking-widest">
                                                            Total Summary
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle">
                                                            <div className="flex flex-col gap-1 items-center justify-center">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Unique</span>
                                                                <div className="flex gap-2 text-sm font-black text-[#103c7f]">
                                                                    <span>{new Set(reportData.map(r => r.client)).size} Clients</span>
                                                                    <span>|</span>
                                                                    <span>{new Set(reportData.map(r => r.profile)).size} Profiles</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-slate-200/50">
                                                            <span className="text-sm font-black text-slate-500">-</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-blue-100/50">
                                                            <span className="text-lg font-black text-blue-800">
                                                                {reportData.reduce((acc, curr) => acc + (curr.cv_naukri || 0) + (curr.cv_indeed || 0) + (curr.cv_other || 0), 0)}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-purple-100/50">
                                                            <span className="text-lg font-black text-purple-800">{reportData.reduce((acc, curr) => acc + (curr.advance_sti || 0), 0)}</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-green-100/50">
                                                            <span className="text-lg font-black text-green-800">{reportData.reduce((acc, curr) => acc + (curr.conversion || 0), 0)}</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-orange-100/50">
                                                            <span className="text-lg font-black text-orange-800">{reportData.reduce((acc, curr) => acc + (curr.asset || 0), 0)}</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-gray-200">
                                                            <span className="text-lg font-black text-gray-800">{reportData.reduce((acc, curr) => acc + (curr.tracker_sent || 0), 0)}</span>
                                                        </td>
                                                        <td className="p-3 border-r border-slate-300 text-center align-middle bg-indigo-100/50">
                                                            <span className="text-lg font-black text-indigo-800">{reportData.reduce((acc, curr) => acc + (curr.tracker_shared || 0), 0)}</span>
                                                        </td>
                                                        <td colSpan="2" className="bg-slate-100"></td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>

                                    {/* --- DOMESTIC CLIENT HANDLING KPI CARDS & TABLE --- */}
                                    <div className="p-4 bg-orange-50/20 border-t border-orange-100">
                                        <h4 className="text-[11px] font-black text-orange-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <UserCheck size={14}/> Domestic Client Handling
                                        </h4>
                                        
                                        {/* KPI CARDS */}
                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                                            {/* Client Calling */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">CRM Client Calling</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-orange-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-orange-500 uppercase">Yest</p><p className="text-sm font-black text-orange-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                            {/* Tracker to Client */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Tracker to Client</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-orange-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-orange-500 uppercase">Yest</p><p className="text-sm font-black text-orange-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                            {/* Interview */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Interview</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-orange-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-orange-500 uppercase">Yest</p><p className="text-sm font-black text-orange-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                            {/* Selection */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Selection</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-orange-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-orange-500 uppercase">Yest</p><p className="text-sm font-black text-orange-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                            {/* Joining */}
                                            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col">
                                                <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Joining</p></div>
                                                <div className="flex divide-x divide-slate-100 h-[50px]">
                                                    <div className="flex-1 text-center flex flex-col justify-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-sm font-black text-slate-800 leading-none">0</p></div>
                                                    <div className="flex-1 text-center bg-orange-50/50 flex flex-col justify-center"><p className="text-[8px] font-black text-orange-500 uppercase">Yest</p><p className="text-sm font-black text-orange-700 leading-none">0</p></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CLIENT CONVERSATION LOG TABLE */}
                                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
                                            <div className="bg-slate-50 p-2.5 border-b border-slate-200 flex justify-between items-center">
                                                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                                    <MessageSquare size={12}/> Client Conversation Log
                                                </h3>
                                            </div>
                                            <div className="overflow-x-auto custom-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                                                    <thead className="bg-slate-100/50 text-slate-500 text-[9px] uppercase font-bold">
                                                        <tr>
                                                            <th className="p-2.5 border-b border-slate-200 w-[15%]">Date & Mode</th>
                                                            <th className="p-2.5 border-b border-slate-200 w-[15%]">CRM</th>
                                                            <th className="p-2.5 border-b border-slate-200 w-[20%]">Company Name</th>
                                                            <th className="p-2.5 border-b border-slate-200 w-[20%]">Contact Info</th>
                                                            <th className="p-2.5 border-b border-slate-200 w-[30%]">Conversation</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {/* Static Mock Row (Replace with your map function) */}
                                                        <tr className="hover:bg-orange-50/30 transition">
                                                            <td className="p-2.5 align-top">
                                                                <div className="flex flex-col gap-0.5 items-start">
                                                                    <span className="font-bold text-gray-800">2026-03-02</span>
                                                                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded w-max">On Call</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-2.5 align-top">
                                                                <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded shadow-sm w-max truncate">
                                                                    Priya Singh
                                                                </span>
                                                            </td>
                                                            <td className="p-2.5 align-top font-black text-[#103c7f]">Reliance Retail</td>
                                                            <td className="p-2.5 align-top">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-bold text-gray-700">Ms. Anjali Sharma</span>
                                                                    <span className="text-[9px] text-gray-500 uppercase tracking-wide">Talent Acquisition</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-2.5 align-top text-[11px] text-gray-600 italic">
                                                                "Follow-up regarding the Store Manager profiles. They shortlisted 3 candidates for the final round. Will schedule interviews for tomorrow."
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>

                         {/* ========================================= */}
                        {/* ------ JOB POSTING REPORT SECTION -------- */}
                        {/* ========================================= */}
                        <div className="mb-8 mt-8">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <FileSpreadsheet size={18} className="text-green-600"/> Job Post Report
                            </h2>
                            
                            {/* Report Container */}
                            <div className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
                                {/* Brand Header */}
                                <div className="bg-[#103c7f] text-white px-4 py-2 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-[0.15em]">Job Post Report</h3>
                                    </div>
                                    <div className="text-right border-l border-blue-400/30 pl-4">
                                        <p className="text-[8px] font-bold text-blue-200 uppercase tracking-widest">Report Date</p>
                                        <p className="text-sm font-black">{jobPostData.selectedDate ? new Date(jobPostData.selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}</p>
                                    </div>
                                </div>

                                {/* TWO COLUMN LAYOUT */}
                                <div className="flex flex-col lg:flex-row w-full border-b border-gray-200">
                                    
                                    {/* LEFT COLUMN: Jobs Posted */}
                                    <div className="w-full lg:w-[65%] border-r border-gray-200 flex flex-col">
                                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                                            <Briefcase size={14} className="text-[#103c7f]"/>
                                            <h4 className="font-black text-[#103c7f] uppercase text-xs tracking-widest">Jobs Posted ({jobPostData.jobs.length})</h4>
                                        </div>
                                        
                                        <div className="p-0 flex-1 max-h-[350px] overflow-y-auto">
                                            {jobPostData.loading ? (
                                                <div className="flex items-center justify-center py-6">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#103c7f]"></div>
                                                    <span className="ml-2 text-gray-500 text-xs">Loading...</span>
                                                </div>
                                            ) : (
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-white border-b border-gray-200 text-[9px] uppercase text-gray-400 font-bold sticky top-0">
                                                        <tr>
                                                         <th className="py-2 px-4 w-[20%]">Sector</th>
                                                         <th className="py-2 px-3 w-[20%]">Client</th>
                                                         <th className="py-2 px-3 w-[20%]">Profile</th>
                                                         <th className="py-2 px-3 w-[15%] text-center">Platform</th>
                                                         <th className="py-2 px-3 w-[10%] text-center">JD View</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                                         {jobPostData.jobs.length > 0 ? jobPostData.jobs.slice(0, 20).map(job => (
                                                             <tr key={job.id} className="hover:bg-gray-50">
                                                                 <td className="py-2 px-4">
                                                                     <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${job.sector === 'Domestic' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                                         {job.sector}
                                                                     </span>
                                                                 </td>
                                                                 <td className="py-2 px-3 font-bold truncate max-w-[120px]">{job.client_name}</td>
                                                                 <td className="py-2 px-3 text-[#103c7f] font-bold truncate max-w-[160px]">{job.job_title}</td>
                                                                 <td className="py-2 px-3 font-bold truncate max-w-[80px] text-center">
                                                                     {job.platforms && job.platforms.length > 0 ? (
                                                                         <span className="text-[8px] px-1 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                                                                             {job.platforms.join(', ')}
                                                                         </span>
                                                                     ) : (
                                                                         <span className="text-[8px] text-gray-400 italic">-</span>
                                                                     )}
                                                                 </td>
                                                                  <td className="py-2 px-3 text-center">
                                                                      <button 
                                                                          onClick={() => {
                                                                              setSelectedJD(job);
                                                                              setIsJDPreviewOpen(true);
                                                                          }}
                                                                          title="Preview JD"
                                                                          className="p-1.5 bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-600 hover:text-white transition"
                                                                      >
                                                                          <FileText size={14}/>
                                                                      </button>
                                                                  </td>
                                                             </tr>
                                                         )) : (
                                                             <tr><td colSpan="4" className="py-4 text-center text-gray-400 italic text-xs">No jobs posted.</td></tr>
                                                         )}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN: Today's Sourcing */}
                                    <div className="w-full lg:w-[35%] flex flex-col">
                                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                                            <Database size={14} className="text-green-700"/>
                                            <h4 className="font-black text-green-700 uppercase text-xs tracking-widest">Sourcing</h4>
                                        </div>
                                        
                                        <div className="p-3 flex-1 flex items-start justify-start">
                                            {jobPostData.loading ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700"></div>
                                                    <span className="ml-2 text-gray-500 text-xs">Loading...</span>
                                                </div>
                                            ) : (
                                                <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                                                    <thead className="bg-gray-100 text-[9px] uppercase text-gray-500 font-bold border-b border-gray-200 sticky top-0">
                                                        <tr>
                                                            <th className="py-2 px-3 w-[40%]">Platform</th>
                                                            <th className="py-2 px-2 w-[30%] text-center">CVs</th>
                                                            <th className="py-2 px-2 w-[30%] text-center">Calls</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 text-gray-800">
                                                        {jobPostData.stats.length > 0 ? jobPostData.stats.map((stat, index) => (
                                                            <tr key={index}>
                                                                <td className="py-2 px-3 font-black uppercase tracking-wider text-[9px]">{stat.platform}</td>
                                                                <td className="py-2 px-2 text-center font-black text-sm text-[#103c7f] bg-blue-50/30">{stat.cvsReceived}</td>
                                                                <td className="py-2 px-2 text-center font-black text-sm text-green-700 bg-green-50/30">{stat.callingDone}</td>
                                                            </tr>
                                                        )) : (
                                                            <tr><td colSpan="3" className="py-3 text-center text-gray-400 italic text-xs">No activity.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* FOOTER: Lifetime Totals */}
                                <div className="w-full bg-[#103c7f] text-white p-3 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 pb-2 mb-3 justify-center">
                                        <PhoneCall size={12} className="text-blue-300"/>
                                        <h4 className="font-black uppercase text-xs tracking-widest text-blue-100">Total Database</h4>
                                    </div>

                                    {jobPostData.loading ? (
                                        <div className="flex items-center justify-center py-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span className="ml-2 text-blue-200 text-xs">Loading...</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-3">
                                            {/* Remarks Section */}
                                            <div className="text-center bg-white rounded-lg p-2 border border-gray-200">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1">Remarks</p>
                                                <textarea 
                                                    className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded p-1.5 resize-none focus:outline-none focus:border-gray-400"
                                                    rows="2"
                                                    placeholder="Add remarks..."
                                                    value={inputValues.jobPostRemarks}
                                                    onChange={(e) => saveToLocalStorage('jobPostRemarks', e.target.value)}
                                                ></textarea>
                                            </div>

                                            {/* Indeed Lifetime */}
                                            <div className="text-center bg-white/10 rounded-lg p-2 border border-white/10">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200 mb-1">Indeed</p>
                                                <div className="flex justify-between items-center text-left px-2">
                                                    <div>
                                                        <p className="text-[8px] text-gray-300 uppercase">CVs</p>
                                                        <p className="text-base font-black">{jobPostData.totals.indeedCvs}</p>
                                                    </div>
                                                    <div className="w-px h-5 bg-blue-500"></div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] text-gray-300 uppercase">Calls</p>
                                                        <p className="text-base font-black text-green-400">{jobPostData.totals.indeedCalls}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Naukri Lifetime */}
                                            <div className="text-center bg-white/10 rounded-lg p-2 border border-white/10">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200 mb-1">Naukri</p>
                                                <div className="flex justify-between items-center text-left px-2">
                                                    <div>
                                                        <p className="text-[8px] text-gray-300 uppercase">CVs</p>
                                                        <p className="text-base font-black">{jobPostData.totals.naukriCvs}</p>
                                                    </div>
                                                    <div className="w-px h-5 bg-blue-500"></div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] text-gray-300 uppercase">Calls</p>
                                                        <p className="text-base font-black text-green-400">{jobPostData.totals.naukriCalls}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
                 
                 {/* JD Preview Modal */}
                 {isJDPreviewOpen && selectedJD && (
                     <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[9999] p-0 md:p-4 print:static print:block print:bg-white print:p-0 print:z-auto" style={{ zIndex: 99999 }}>
                         <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl print:block print:h-auto print:max-w-full print:shadow-none print:rounded-none">
                             
                             <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900 print:hidden">
                                 <div className="flex items-center gap-3">
                                     <FileText size={20} />
                                     <div>
                                         <h3 className="font-bold text-lg uppercase tracking-wide">Document Preview</h3>
                                         <p className="text-[10px] text-blue-200 font-bold tracking-widest uppercase">For Client: {selectedJD.client_name}</p>
                                     </div>
                                 </div>
                                 <div className="flex gap-3">
                                     <button onClick={() => setIsJDPreviewOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20}/></button>
                                 </div>
                             </div>
 
                             <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 block print:bg-white print:p-0">
                                 <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative print:shadow-none print:m-0" id="pdf-content">
                                     
                                     <div className="mb-10"><Image src="/maven-logo.png" alt="Maven Jobs" width={220} height={70} className="object-contain" priority /></div>
 
                                     <div className="border border-black p-8 min-h-[850px] relative print:border-none print:p-0">
                                         
                                         <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                                             {selectedJD.job_title && <p><span className="font-bold">JOB TITLE : </span> {selectedJD.job_title}</p>}
                                             {selectedJD.location && <p><span className="font-bold">LOCATION : </span> {selectedJD.location}</p>}
                                             {selectedJD.experience && <p><span className="font-bold">EXPERIENCE : </span> {selectedJD.experience}</p>}
                                             {selectedJD.employment_type && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {selectedJD.employment_type}</p>}
                                             {selectedJD.working_days && <p><span className="font-bold">WORKING DAYS : </span> {selectedJD.working_days}</p>}
                                             {selectedJD.timings && <p><span className="font-bold">TIMINGS : </span> {selectedJD.timings}</p>}
                                             {selectedJD.package && <p><span className="font-bold">PACKAGE : </span> {selectedJD.package}</p>}
                                             {selectedJD.tool_requirement && <p><span className="font-bold">TOOL REQUIREMENT : </span> {selectedJD.tool_requirement}</p>}
                                         </div>
 
                                         <div className="space-y-8 text-[15px]">
                                             {selectedJD.job_summary && <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{selectedJD.job_summary}</p></div>}
                                             {selectedJD.rnr && <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.rnr?.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}</ul></div>}
                                             {selectedJD.req_skills && <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.req_skills?.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}</ul></div>}
                                             {selectedJD.preferred_qual && <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.preferred_qual?.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}</ul></div>}
                                             {selectedJD.company_offers && <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.company_offers?.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}</ul></div>}
                                             {selectedJD.contact_details && <div className="mt-12 pt-6 border-t border-black/20"><h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4><div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{selectedJD.contact_details}</div></div>}
                                         </div>
 
                                     </div>
                                 </div>
                             </div>
 
                         </div>
                     </div>
                 )}
                 {/* ========================================================= */}
            {/* --- MODAL 1: SMALL MODAL FOR CV BREAKDOWN --- */}
            {/* ========================================================= */}
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
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* --- MODAL 2: MODAL FOR VIEWING JD CONTENT --- */}
            {/* ========================================================= */}
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
         </div>
     );
 }
