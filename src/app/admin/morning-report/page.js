"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { 
    FileText, ArrowLeft, Briefcase, Users, 
    Laptop, SunMedium , TrendingUp, Building2, Home, Rocket,IndianRupee, CheckCircle2, Globe2, Store, FileSpreadsheet, Database, PhoneCall
} from "lucide-react";

export default function MorningReportPage() {
    const router = useRouter();
    // --- STATE FOR TABS ---
    const [activeTab, setActiveTab] = useState("Sales & Delivery");

    // --- GET CURRENT MONTH ---
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

    // --- STATE FOR INPUT VALUES (from localStorage) ---
    const [inputValues, setInputValues] = useState({
        masterUnionProfiles: '',
        masterUnionCalling: '',
        totalCtc: '',
        corporateRemarks: '',
        domesticRemarks: '',
        jobPostRemarks: ''
    });

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
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col cursor-pointer" onClick={() => router.push('/admin/morning-report/corporate?filter=client-search-yesterday')}>
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Client Search</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.clientSearchTotal}</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-indigo-50/50"><p className="text-[8px] font-black text-indigo-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-indigo-700 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.clientSearchYesterday}</p></div>
                                            </div>
                                        </div>

                                        {/* Client Calling */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col cursor-pointer" onClick={() => router.push('/admin/morning-report/corporate?filter=client-calling-yesterday')}>
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Client Calling</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.clientCallingTotal}</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-indigo-50/50"><p className="text-[8px] font-black text-indigo-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-indigo-700 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.clientCallingYesterday}</p></div>
                                            </div>
                                        </div>

                                        {/* Contract Share */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-indigo-400 transition-all flex flex-col cursor-pointer" onClick={() => router.push('/admin/morning-report/corporate?filter=contract-share-yesterday')}>
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Contract Share</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.contractShareTotal}</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-indigo-50/50"><p className="text-[8px] font-black text-indigo-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-indigo-700 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.contractShareYesterday}</p></div>
                                            </div>
                                        </div>

                                        {/* Startup Search */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col cursor-pointer" onClick={() => router.push('/admin/morning-report/corporate?filter=startup-search-yesterday')}>
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Startup Search</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.startupSearchTotal}</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-orange-50/50"><p className="text-[8px] font-black text-orange-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-orange-700 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.startupSearchYesterday}</p></div>
                                            </div>
                                        </div>

                                        {/* Startup Calling */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-orange-400 transition-all flex flex-col cursor-pointer" onClick={() => router.push('/admin/morning-report/corporate?filter=startup-calling-yesterday')}>
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Startup Calling</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.startupCallingTotal}</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-orange-50/50"><p className="text-[8px] font-black text-orange-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-orange-700 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.startupCallingYesterday}</p></div>
                                            </div>
                                        </div>

                                        {/* Master Union Clients (Only Total) */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Master Union Clients</p></div>
                                            <div className="flex-1 p-1.5 text-center bg-purple-50/30 flex flex-col justify-center">
                                                <p className="text-[8px] font-black text-purple-400 uppercase">Total Only</p>
                                                <p className="text-base font-black text-purple-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.masterUnionClientsTotal}</p>
                                            </div>
                                        </div>

                                        {/* Master Union Profiles (Input Field) */}
                                        <div className="border border-purple-200 rounded-lg bg-purple-50/50 overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col">
                                            <div className="bg-purple-50 py-1.5 text-center border-b border-purple-100"><p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest truncate px-1">Master Union Profiles</p></div>
                                            <div className="flex-1 p-2 text-center flex flex-col justify-center items-center">
                                                <input 
                                                    type="text" 
                                                    className="text-lg font-black text-purple-800 bg-transparent border-b border-dashed border-purple-300 outline-none text-center w-20 focus:border-purple-600 transition-colors"
                                                    placeholder="0"
                                                    value={inputValues.masterUnionProfiles}
                                                    onChange={(e) => saveToLocalStorage('masterUnionProfiles', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Master Union Calling (Only Total) */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-purple-400 transition-all flex flex-col">
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Master Union Calling</p></div>
                                            <div className="flex-1 p-1.5 text-center bg-purple-50/30 flex flex-col justify-center">
                                                <p className="text-[8px] font-black text-purple-400 uppercase">Total Only</p>
                                                <p className="text-base font-black text-purple-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.masterUnionCallingTotal}</p>
                                            </div>
                                        </div>

                                        {/* Franchise Discussed */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-rose-400 transition-all flex flex-col cursor-pointer" onClick={() => router.push('/admin/morning-report/corporate?filter=franchise-discussed-yesterday')}>
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Fran. Discussed</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.franchiseDiscussedTotal}</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-rose-50/50"><p className="text-[8px] font-black text-rose-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-rose-700 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.franchiseDiscussedYesterday}</p></div>
                                            </div>
                                        </div>

                                        {/* Form Ask */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-rose-400 transition-all flex flex-col cursor-pointer" onClick={() => router.push('/admin/morning-report/corporate?filter=form-ask-yesterday')}>
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Form Ask</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.formSharedTotal}</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-rose-50/50"><p className="text-[8px] font-black text-rose-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-rose-700 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.formSharedYesterday}</p></div>
                                            </div>
                                        </div>

                                        {/* Form Shared */}
                                        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:border-rose-400 transition-all flex flex-col cursor-pointer" onClick={() => router.push('/admin/morning-report/corporate?filter=form-shared-yesterday')}>
                                            <div className="bg-slate-50 py-1.5 text-center border-b border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate px-1">Form Shared</p></div>
                                            <div className="flex divide-x divide-slate-100">
                                                <div className="flex-1 p-1.5 text-center"><p className="text-[8px] font-black text-slate-400 uppercase">Total</p><p className="text-base font-black text-slate-800 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.formSharedTotal}</p></div>
                                                <div className="flex-1 p-1.5 text-center bg-rose-50/50"><p className="text-[8px] font-black text-rose-400 uppercase">{corporateStats.lastWorkingDay || 'Yest'}</p><p className="text-base font-black text-rose-700 leading-none mt-1">{corporateStats.loading ? '-' : corporateStats.formSharedYesterday}</p></div>
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
                                            value={inputValues.corporateRemarks}
                                            onChange={(e) => saveToLocalStorage('corporateRemarks', e.target.value)}
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
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all cursor-pointer" onClick={() => router.push('/admin/morning-report/domestic?filter=yesterday-visits')}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Yest. Visits ({domesticStats.lastWorkingDay})</p>
                                            <div className="flex items-end justify-center gap-1">
                                                <p className="text-lg font-black text-slate-800 leading-none">
                                                    {domesticStats.loading ? '-' : domesticStats.yesterdayVisits}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all cursor-pointer" onClick={() => router.push('/admin/morning-report/domestic?filter=individual-repeat')}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Individual / Repeat</p>
                                            <div className="flex items-end justify-center gap-2">
                                                <p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.individualVisits} <span className="text-[9px] font-bold text-slate-400">Ind</span></p>
                                                <p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.repeatVisits} <span className="text-[9px] font-bold text-slate-400">Rep</span></p>
                                            </div>
                                        </div>

                                        {/* Pipeline Metrics */}
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all cursor-pointer" onClick={() => router.push('/admin/morning-report/domestic?filter=reached-out')}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Reached Out (Yest)</p>
                                            <div className="flex items-end justify-center gap-1"><p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.yesterdayReachedOut}</p></div>
                                        </div>
                                        <div className="border border-slate-200 p-2 rounded-lg bg-white text-center shadow-sm hover:border-orange-300 transition-all cursor-pointer" onClick={() => router.push('/admin/morning-report/domestic?filter=interested')}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-1 truncate">Interested (Yest)</p>
                                            <div className="flex items-end justify-center gap-1"><p className="text-lg font-black text-slate-800 leading-none">{domesticStats.loading ? '-' : domesticStats.yesterdayInterested}</p></div>
                                        </div>
                                        <div className="border border-emerald-200 p-2 rounded-lg bg-emerald-50 text-center shadow-sm hover:border-emerald-300 transition-all cursor-pointer" onClick={() => router.push('/admin/morning-report/domestic?filter=total-onboard')}>
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
                                                    value={inputValues.totalCtc}
                                                    onChange={(e) => saveToLocalStorage('totalCtc', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Onboarded Detail Row (Names) */}
                                        <div className="col-span-2 sm:col-span-3 border border-slate-200 p-2.5 rounded-lg bg-white flex flex-col justify-center gap-1 shadow-sm hover:border-orange-300 transition-all cursor-pointer" onClick={() => router.push('/admin/morning-report/domestic?filter=onboarded-yesterday')}>
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
                                    </div>

                                    {/* Editable Remarks Area */}
                                    <div className="p-3 bg-orange-50/50 border-t border-orange-100 mt-auto">
                                        <label className="text-[10px] font-black text-orange-800 uppercase mb-1 block">Remarks</label>
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

                        {/* ========================================= */}
                        {/* ------ JOB POSTING REPORT SECTION -------- */}
                        {/* ========================================= */}
                        <div className="mb-8">
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
                                                            <th className="py-2 px-3 w-[35%]">Client</th>
                                                            <th className="py-2 px-3 w-[45%]">Profile</th>
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
                                                                <td className="py-2 px-3 font-bold truncate max-w-[150px]">{job.client}</td>
                                                                <td className="py-2 px-3 text-[#103c7f] font-bold truncate max-w-[200px]">{job.profile}</td>
                                                            </tr>
                                                        )) : (
                                                            <tr><td colSpan="3" className="py-4 text-center text-gray-400 italic text-xs">No jobs posted.</td></tr>
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