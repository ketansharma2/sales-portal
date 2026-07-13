"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    LayoutDashboard, FileText, 
    PhoneCall, CalendarDays, UserCheck, Users, Target, CheckCircle2, 
    TrendingUp, Search, Rocket, Globe2, Store,
    IndianRupee, Building2, Briefcase, MapPin, Sparkles, Handshake, Filter, Award,
    ChevronDown, ChevronUp
} from "lucide-react";
import * as API from '@/lib/api-client';
export default function DirectorDashboardPage() {
    // --- STATE VARIABLES ---
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    
    // Filter States
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [crmFilter, setCrmFilter] = useState("");
    const [clientFilter, setClientFilter] = useState("");
    const [candidateFilter, setCandidateFilter] = useState("");
    const [clientTypeFilter, setClientTypeFilter] = useState("All");
    const [candStatusFilter, setCandStatusFilter] = useState("All");
    const [payStatusFilter, setPayStatusFilter] = useState("All");
    const [retentionStatusFilter, setRetentionStatusFilter] = useState("All");

    // --- ROW LIMIT STATES ---
    const [showAllCorporate, setShowAllCorporate] = useState(false);
    const [showAllDomestic, setShowAllDomestic] = useState(false);
    const DEFAULT_ROWS = 5;

    // --- HELPER FUNCTIONS ---
    const parseCurrency = (str) => {
        if (!str) return 0; 
        return parseInt(String(str).replace(/,/g, ''), 10) || 0;
    };

    const formatCompactNumber = (number) => {
        if (!number) return "0";
        if (number >= 10000000) return (number / 10000000).toFixed(2) + " Cr";
        if (number >= 100000) return (number / 100000).toFixed(2) + " L";
        if (number >= 1000) return (number / 1000).toFixed(1) + " K";
        return number.toLocaleString('en-IN');
    };

    // --- FETCH BOTH APIS ---
    useEffect(() => {
        const fetchAllRevenueData = async () => {
            setLoading(true);
            try {
                const session = JSON.parse(localStorage.getItem('session') || '{}');
                const token = session.access_token;

                const [domesticRes, corporateRes] = await Promise.all([
                    API.apiGet("/api/domestic/revenue/history"),

                    API.apiGet("/api/corporate/revenue/history")
                ]);

                const domesticData = await domesticRes.json();
                const corporateData = await corporateRes.json();
                
                let combinedData = [];

                if (domesticData.success && domesticData.data) {
                    combinedData = combinedData.concat(
                        domesticData.data.map(item => ({ ...item, client_type: 'Domestic' }))
                    );
                }

                if (corporateData.success && corporateData.data) {
                    combinedData = combinedData.concat(
                        corporateData.data.map(item => ({ ...item, client_type: 'Corporate' }))
                    );
                }

                setData(combinedData);
            } catch (error) {
                console.error('Error fetching revenue data:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllRevenueData();
    }, []);

    // --- FILTER LOGIC ---
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Client Type Filter
            if (clientTypeFilter !== "All" && item.client_type !== clientTypeFilter) return false;
            
            // Date Range Filter
            if (fromDate || toDate) {
                if (!item.payment_due_date) return false;
                const itemDate = new Date(item.payment_due_date);
                itemDate.setHours(0, 0, 0, 0);
                if (fromDate && itemDate < new Date(fromDate)) return false;
                if (toDate) {
                    const tDate = new Date(toDate);
                    tDate.setHours(23, 59, 59, 999);
                    if (itemDate > tDate) return false;
                }
            }
            
            // Text Filters
            if (crmFilter && !item.crm_name?.toLowerCase().includes(crmFilter.toLowerCase())) return false;
            if (clientFilter && !item.client_name?.toLowerCase().includes(clientFilter.toLowerCase())) return false;
            if (candidateFilter && !item.candidate_name?.toLowerCase().includes(candidateFilter.toLowerCase())) return false;
            
            // Dropdown Filters
            if (candStatusFilter !== "All" && item.candidate_status !== candStatusFilter) return false;
            if (payStatusFilter !== "All" && item.payment_status !== payStatusFilter) return false;
            if (retentionStatusFilter !== "All" && item.retention_status !== retentionStatusFilter) return false;
            
            return true;
        });
    }, [data, fromDate, toDate, crmFilter, clientFilter, candidateFilter, 
        clientTypeFilter, candStatusFilter, payStatusFilter, retentionStatusFilter]);

    // --- SECTOR SPECIFIC DATA ---
    const corporateData = useMemo(() => {
        return filteredData.filter(item => item.client_type === 'Corporate');
    }, [filteredData]);

    const domesticData = useMemo(() => {
        return filteredData.filter(item => item.client_type === 'Domestic');
    }, [filteredData]);

    // --- LIMITED DATA FOR TABLES ---
    const limitedCorporateData = useMemo(() => {
        if (showAllCorporate) return corporateData;
        return corporateData.slice(0, DEFAULT_ROWS);
    }, [corporateData, showAllCorporate]);

    const limitedDomesticData = useMemo(() => {
        if (showAllDomestic) return domesticData;
        return domesticData.slice(0, DEFAULT_ROWS);
    }, [domesticData, showAllDomestic]);

    // --- CORPORATE KPI CALCULATIONS ---
    const corporateKPIs = useMemo(() => {
        let joined = 0, working = 0, absconded = 0, resigned = 0, terminate = 0;
        const pMetrics = {
            pending: { count: 0, amount: 0 },
            invoiceSent: { count: 0, amount: 0 },
            partial: { count: 0, amount: 0 },
            received: { count: 0, amount: 0 },
            cancelled: { count: 0, amount: 0 }
        };
        const rMetrics = {
            inProgress: { count: 0, amount: 0 },
            eligible: { count: 0, amount: 0 },
            invoiceSent: { count: 0, amount: 0 },
            received: { count: 0, amount: 0 },
            missed: { count: 0, amount: 0 }
        };

        corporateData.forEach(item => {
            if (item.candidate_status === 'Joined') joined++;
            else if (item.candidate_status === 'Working') working++;
            else if (item.candidate_status === 'Absconded') absconded++;
            else if (item.candidate_status === 'Resigned') resigned++;
            else if (item.candidate_status === 'Terminate') terminate++;

            const pStatus = item.payment_status;
            const baseAmount = parseCurrency(item.total_with_gst || item.base_invoice || item.payment_amount);
            
            if (!pStatus || pStatus === 'Pending') { 
                pMetrics.pending.count++; 
                pMetrics.pending.amount += baseAmount; 
            } else if (pStatus === 'Invoice Sent') { 
                pMetrics.invoiceSent.count++; 
                pMetrics.invoiceSent.amount += baseAmount; 
            } else if (pStatus === 'Partial Payment') { 
                pMetrics.partial.count++; 
                pMetrics.partial.amount += baseAmount; 
            } else if (pStatus === 'Received') { 
                pMetrics.received.count++; 
                pMetrics.received.amount += baseAmount; 
            } else if (pStatus === 'Cancelled') { 
                pMetrics.cancelled.count++; 
                pMetrics.cancelled.amount += baseAmount; 
            }

            const rStatus = item.retention_status;
            const retAmount = parseCurrency(item.retention_amount);
            
            if (rStatus === 'In Progress') { 
                rMetrics.inProgress.count++; 
                rMetrics.inProgress.amount += retAmount; 
            } else if (rStatus === 'Eligible') { 
                rMetrics.eligible.count++; 
                rMetrics.eligible.amount += retAmount; 
            } else if (rStatus === 'Invoice Sent') { 
                rMetrics.invoiceSent.count++; 
                rMetrics.invoiceSent.amount += retAmount; 
            } else if (rStatus === 'Received') { 
                rMetrics.received.count++; 
                rMetrics.received.amount += retAmount; 
            } else if (rStatus === 'Missed' || rStatus === 'Forfeited') { 
                rMetrics.missed.count++; 
                rMetrics.missed.amount += retAmount; 
            }
        });

        return {
            joinedCount: joined, 
            workingCount: working, 
            abscondedCount: absconded, 
            resignedCount: resigned, 
            terminateCount: terminate,
            paymentMetrics: pMetrics, 
            retentionMetrics: rMetrics
        };
    }, [corporateData]);

    // --- DOMESTIC KPI CALCULATIONS ---
    const domesticKPIs = useMemo(() => {
        let joined = 0, working = 0, absconded = 0, resigned = 0, terminate = 0;
        const pMetrics = {
            pending: { count: 0, amount: 0 },
            invoiceSent: { count: 0, amount: 0 },
            partial: { count: 0, amount: 0 },
            received: { count: 0, amount: 0 },
            cancelled: { count: 0, amount: 0 }
        };
        const rMetrics = {
            inProgress: { count: 0, amount: 0 },
            eligible: { count: 0, amount: 0 },
            invoiceSent: { count: 0, amount: 0 },
            received: { count: 0, amount: 0 },
            missed: { count: 0, amount: 0 }
        };

        domesticData.forEach(item => {
            if (item.candidate_status === 'Joined') joined++;
            else if (item.candidate_status === 'Working') working++;
            else if (item.candidate_status === 'Absconded') absconded++;
            else if (item.candidate_status === 'Resigned') resigned++;
            else if (item.candidate_status === 'Terminate') terminate++;

            const pStatus = item.payment_status;
            const baseAmount = parseCurrency(item.total_with_gst || item.base_invoice || item.payment_amount);
            
            if (!pStatus || pStatus === 'Pending') { 
                pMetrics.pending.count++; 
                pMetrics.pending.amount += baseAmount; 
            } else if (pStatus === 'Invoice Sent') { 
                pMetrics.invoiceSent.count++; 
                pMetrics.invoiceSent.amount += baseAmount; 
            } else if (pStatus === 'Partial Payment') { 
                pMetrics.partial.count++; 
                pMetrics.partial.amount += baseAmount; 
            } else if (pStatus === 'Received') { 
                pMetrics.received.count++; 
                pMetrics.received.amount += baseAmount; 
            } else if (pStatus === 'Cancelled') { 
                pMetrics.cancelled.count++; 
                pMetrics.cancelled.amount += baseAmount; 
            }

            const rStatus = item.retention_status;
            const retAmount = parseCurrency(item.retention_amount);
            
            if (rStatus === 'In Progress') { 
                rMetrics.inProgress.count++; 
                rMetrics.inProgress.amount += retAmount; 
            } else if (rStatus === 'Eligible') { 
                rMetrics.eligible.count++; 
                rMetrics.eligible.amount += retAmount; 
            } else if (rStatus === 'Invoice Sent') { 
                rMetrics.invoiceSent.count++; 
                rMetrics.invoiceSent.amount += retAmount; 
            } else if (rStatus === 'Received') { 
                rMetrics.received.count++; 
                rMetrics.received.amount += retAmount; 
            } else if (rStatus === 'Missed' || rStatus === 'Forfeited') { 
                rMetrics.missed.count++; 
                rMetrics.missed.amount += retAmount; 
            }
        });

        return {
            joinedCount: joined, 
            workingCount: working, 
            abscondedCount: absconded, 
            resignedCount: resigned, 
            terminateCount: terminate,
            paymentMetrics: pMetrics, 
            retentionMetrics: rMetrics
        };
    }, [domesticData]);

    // --- LOADING CHECK ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-[#103c7f] font-bold uppercase tracking-widest">
                Loading Dashboard...
            </div>
        );
    }

    // --- MAIN RETURN ---
    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-4">
            
            {/* --- HEADER --- */}
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
                        <LayoutDashboard size={24} className="text-blue-600"/> Director Dashboard
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 ml-8">
                        High-Level Executive Overview & Pipeline Tracking
                    </p>
                </div>
                <button 
                    onClick={() => window.location.href = '/admin/morning-report'} 
                    className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-5 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer w-max"
                >
                    <FileText size={16} /> Morning Report
                </button>
            </div>
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                
                {/* --- FILTERS SECTION --- */}
                <div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                        <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-2">
                            <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                                <Filter size={14}/> Dashboard Filters
                            </h3>
                            {(fromDate || toDate || crmFilter || clientFilter || candidateFilter || 
                              clientTypeFilter !== "All" || candStatusFilter !== "All" || 
                              payStatusFilter !== "All" || retentionStatusFilter !== "All") && (
                                <button 
                                    onClick={() => {
                                        setFromDate(""); 
                                        setToDate(""); 
                                        setCrmFilter(""); 
                                        setClientFilter(""); 
                                        setCandidateFilter("");
                                        setClientTypeFilter("All");
                                        setCandStatusFilter("All"); 
                                        setPayStatusFilter("All"); 
                                        setRetentionStatusFilter("All");
                                    }}
                                    className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors flex items-center gap-1 bg-red-50 px-2 py-1 rounded"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                            
                            {/* 1 & 2: Date Filters */}
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">From Payment Due</label>
                                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"/>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">To Payment Due</label>
                                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} min={fromDate} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"/>
                            </div>

                            {/* 3: Client Type */}
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Select Sector</label>
                                <select 
                                    value={clientTypeFilter} 
                                    onChange={e => setClientTypeFilter(e.target.value)} 
                                    className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
                                >
                                    <option value="All">All</option>
                                    <option value="Domestic">Domestic</option>
                                    <option value="Corporate">Corporate</option>
                                </select>
                            </div>

                            {/* 4: CRM Name */}
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">CRM Name</label>
                                <input type="text" placeholder="Search CRM..." value={crmFilter} onChange={e => setCrmFilter(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50"/>
                            </div>

                            {/* 5: Client Name */}
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Client Name</label>
                                <input type="text" placeholder="Search Client..." value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50"/>
                            </div>
                            
                            {/* 6: Candidate Name */}
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Candidate Name</label>
                                <input type="text" placeholder="Search Candidate..." value={candidateFilter} onChange={e => setCandidateFilter(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50"/>
                            </div>

                            {/* 7: Candidate Status */}
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Candidate Status</label>
                                <select value={candStatusFilter} onChange={e => setCandStatusFilter(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer">
                                    <option value="All">All</option>
                                    <option value="Working">Working</option>
                                    <option value="Joined">Joined</option>
                                    <option value="Absconded">Absconded</option>
                                    <option value="Resigned">Resigned</option>
                                    <option value="Terminate">Terminate</option>
                                </select>
                            </div>

                            {/* 8: Payment Status */}
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Payment Status</label>
                                <select value={payStatusFilter} onChange={e => setPayStatusFilter(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer">
                                    <option value="All">All</option>
                                    <option value="Received">Received</option>
                                    <option value="Invoice Sent">Invoice Sent</option>
                                    <option value="Partial Payment">Partial</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* 9: Retention Status - Hidden for Corporate */}
                            {clientTypeFilter !== "Corporate" && (
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Retention Status</label>
                                    <select 
                                        value={retentionStatusFilter} 
                                        onChange={e => setRetentionStatusFilter(e.target.value)} 
                                        className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
                                    >
                                        <option value="All">All</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Eligible">Eligible</option>
                                        <option value="Invoice Sent">Invoice Sent</option>
                                        <option value="Received">Received</option>
                                        <option value="Missed">Missed</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- SECTORS SECTION --- */}
                    <div className="flex flex-col gap-6 mt-6">
                        
                        {/* --- CORPORATE SECTOR --- */}
                        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-4 flex items-center justify-between">
                                <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2 text-sm">
                                    <Briefcase size={18}/> Corporate Sector
                                </h3>
                                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                    High Ticket
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-4">
                                
                                {/* Corporate Candidate Status KPIs */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                        <Users size={14} className="text-blue-500"/> Candidate Overview
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                                            <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Joined</p>
                                            <h4 className="text-xl font-black text-green-700">{corporateKPIs.joinedCount || 0}</h4>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Working</p>
                                            <h4 className="text-xl font-black text-blue-700">{corporateKPIs.workingCount || 0}</h4>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                                            <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Absconded</p>
                                            <h4 className="text-xl font-black text-red-700">{corporateKPIs.abscondedCount || 0}</h4>
                                        </div>
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-center">
                                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Resigned</p>
                                            <h4 className="text-xl font-black text-orange-700">{corporateKPIs.resignedCount || 0}</h4>
                                        </div>
                                        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-center">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Terminate</p>
                                            <h4 className="text-xl font-black text-slate-700">{corporateKPIs.terminateCount || 0}</h4>
                                        </div>
                                    </div>
                                </div>

                                {/* Corporate Payment Status KPIs */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                        <IndianRupee size={14} className="text-emerald-500"/> Payment Overview
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 h-full">
                                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 flex flex-col justify-center items-center text-center">
                                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Pending</p>
                                            <h4 className="text-xl font-black text-orange-700 leading-none">{corporateKPIs.paymentMetrics.pending.count}</h4>
                                            <div className="mt-2 w-full pt-1.5 border-t border-orange-200/50">
                                                <span className="text-[10px] font-bold text-orange-800 tracking-wider">₹ {corporateKPIs.paymentMetrics.pending.amount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Invoice Sent</p>
                                            <h4 className="text-xl font-black text-blue-700 leading-none">{corporateKPIs.paymentMetrics.invoiceSent.count}</h4>
                                            <div className="mt-2 w-full pt-1.5 border-t border-blue-200/50">
                                                <span className="text-[10px] font-bold text-blue-800 tracking-wider">₹ {corporateKPIs.paymentMetrics.invoiceSent.amount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100 flex flex-col justify-center items-center text-center">
                                            <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Partial</p>
                                            <h4 className="text-xl font-black text-purple-700 leading-none">{corporateKPIs.paymentMetrics.partial.count}</h4>
                                            <div className="mt-2 w-full pt-1.5 border-t border-purple-200/50">
                                                <span className="text-[10px] font-bold text-purple-800 tracking-wider">₹ {corporateKPIs.paymentMetrics.partial.amount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex flex-col justify-center items-center text-center">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Received</p>
                                            <h4 className="text-xl font-black text-emerald-700 leading-none">{corporateKPIs.paymentMetrics.received.count}</h4>
                                            <div className="mt-2 w-full pt-1.5 border-t border-emerald-200/50">
                                                <span className="text-[10px] font-bold text-emerald-800 tracking-wider">₹ {corporateKPIs.paymentMetrics.received.amount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 flex flex-col justify-center items-center text-center">
                                            <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Cancelled</p>
                                            <h4 className="text-xl font-black text-red-700 leading-none">{corporateKPIs.paymentMetrics.cancelled.count}</h4>
                                            <div className="mt-2 w-full pt-1.5 border-t border-red-200/50">
                                                <span className="text-[10px] font-bold text-red-800 tracking-wider">₹ {corporateKPIs.paymentMetrics.cancelled.amount.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Corporate Table */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
                                    <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14}/> Master Revenue Records
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-500">
                                        Showing {limitedCorporateData.length} of {corporateData.length} records
                                    </span>
                                </div>

                                <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
                                    <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
                                        <thead className="bg-[#103c7f] text-white sticky top-0 z-10">
                                            <tr>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800">CRM Name</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800">Client Name</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800">Candidate Name</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center">Joining Date</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center">Payment Due</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-right">Payment Amt (₹)</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center">Payment Status</th>
                                                <th className="p-2 text-[10px] uppercase font-bold text-center">Candidate Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {limitedCorporateData && limitedCorporateData.length > 0 ? (
                                                limitedCorporateData.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-2 font-bold text-[#103c7f] border-r border-gray-50">{item.crm_name || "-"}</td>
                                                        <td className="p-2 font-bold text-gray-800 border-r border-gray-50 flex items-center gap-1.5">
                                                            <Building2 size={12} className="text-gray-400"/> {item.client_name}
                                                        </td>
                                                        <td className="p-2 font-bold text-gray-800 border-r border-gray-50">{item.candidate_name}</td>
                                                        <td className="p-2 text-center font-mono text-gray-600 border-r border-gray-50">{item.joining_date || "-"}</td>
                                                        <td className="p-2 text-center font-mono font-bold text-indigo-600 border-r border-gray-50 bg-indigo-50/30">
                                                            {item.payment_due_date || "-"}
                                                        </td>
                                                        <td className="p-2 text-right font-black text-emerald-600 border-r border-gray-50">
                                                            {item.total_with_gst ? `₹ ${parseInt(item.total_with_gst).toLocaleString('en-IN')}` : "-"}
                                                        </td>
                                                        <td className="p-2 text-center border-r border-gray-50">
                                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-block ${
                                                                item.payment_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                                item.payment_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-orange-50 text-orange-700 border-orange-200'
                                                            }`}>
                                                                {item.payment_status || "Pending"}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-flex items-center gap-1 justify-center ${
                                                                item.candidate_status === 'Working' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                                item.candidate_status === 'Joined' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                item.candidate_status === 'Absconded' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                item.candidate_status === 'Resigned' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                                                                item.candidate_status === 'Terminate' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-amber-50 text-amber-700 border-amber-200'
                                                            }`}>
                                                                {item.candidate_status || "Pending Join"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="p-10 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        No corporate records found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Show More/Less Button for Corporate */}
                                {corporateData.length > DEFAULT_ROWS && (
                                    <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-center">
                                        <button 
                                            onClick={() => setShowAllCorporate(!showAllCorporate)}
                                            className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            {showAllCorporate ? (
                                                <>Show Less <ChevronUp size={14} /></>
                                            ) : (
                                                <>Show All ({corporateData.length} records) <ChevronDown size={14} /></>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* --- DOMESTIC SECTOR --- */}
                        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-4 flex items-center justify-between">
                                <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2 text-sm">
                                    <MapPin size={18}/> Domestic Sector
                                </h3>
                                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                    High Volume
                                </span>
                            </div>
                            
                            <div className="flex flex-col gap-2 p-4">
                                
                                {/* Domestic Candidate Status KPIs */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                                        <Users size={14} className="text-blue-500"/> Candidate Overview
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <div className="bg-green-50 p-2 rounded-lg border border-green-100 text-center flex flex-col justify-center h-full">
                                            <p className="text-[11px] font-black text-green-600 uppercase tracking-widest mb-1">Joined</p>
                                            <h4 className="text-xl font-black text-green-700">{domesticKPIs.joinedCount || 0}</h4>
                                        </div>
                                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-center flex flex-col justify-center h-full">
                                            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Working</p>
                                            <h4 className="text-xl font-black text-blue-700">{domesticKPIs.workingCount || 0}</h4>
                                        </div>
                                        <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-center flex flex-col justify-center h-full">
                                            <p className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-1">Absconded</p>
                                            <h4 className="text-xl font-black text-red-700">{domesticKPIs.abscondedCount || 0}</h4>
                                        </div>
                                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 text-center flex flex-col justify-center h-full">
                                            <p className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-1">Resigned</p>
                                            <h4 className="text-xl font-black text-orange-700">{domesticKPIs.resignedCount || 0}</h4>
                                        </div>
                                        <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 text-center flex flex-col justify-center h-full">
                                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1">Terminate</p>
                                            <h4 className="text-xl font-black text-slate-700">{domesticKPIs.terminateCount || 0}</h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    {/* Domestic Payment Status KPIs */}
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                            <IndianRupee size={14} className="text-emerald-500"/> Payment Overview
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 h-full">
                                            <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 flex flex-col justify-center items-center text-center">
                                                <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Pending</p>
                                                <h4 className="text-xl font-black text-orange-700 leading-none">{domesticKPIs.paymentMetrics.pending.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-orange-200/50">
                                                    <span className="text-[10px] font-bold text-orange-800 tracking-wider">₹ {formatCompactNumber(domesticKPIs.paymentMetrics.pending.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Invoice Sent</p>
                                                <h4 className="text-xl font-black text-blue-700 leading-none">{domesticKPIs.paymentMetrics.invoiceSent.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-blue-200/50">
                                                    <span className="text-[10px] font-bold text-blue-800 tracking-wider">₹ {formatCompactNumber(domesticKPIs.paymentMetrics.invoiceSent.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100 flex flex-col justify-center items-center text-center">
                                                <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Partial</p>
                                                <h4 className="text-xl font-black text-purple-700 leading-none">{domesticKPIs.paymentMetrics.partial.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-purple-200/50">
                                                    <span className="text-[10px] font-bold text-purple-800 tracking-wider">₹ {formatCompactNumber(domesticKPIs.paymentMetrics.partial.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex flex-col justify-center items-center text-center">
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Received</p>
                                                <h4 className="text-xl font-black text-emerald-700 leading-none">{domesticKPIs.paymentMetrics.received.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-emerald-200/50">
                                                    <span className="text-[10px] font-bold text-emerald-800 tracking-wider">₹ {formatCompactNumber(domesticKPIs.paymentMetrics.received.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 flex flex-col justify-center items-center text-center">
                                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Cancelled</p>
                                                <h4 className="text-xl font-black text-red-700 leading-none">{domesticKPIs.paymentMetrics.cancelled.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-red-200/50">
                                                    <span className="text-[10px] font-bold text-red-800 tracking-wider">₹ {formatCompactNumber(domesticKPIs.paymentMetrics.cancelled.amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Domestic Retention Bonus KPIs */}
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
                                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                                            <Award size={14} className="text-indigo-500"/> Retention Bonus Overview
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 h-full">
                                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center items-center text-center">
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">In Progress</p>
                                                <h4 className="text-xl font-black text-slate-700 leading-none">{domesticKPIs.retentionMetrics.inProgress.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-slate-200/50">
                                                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">₹ {formatCompactNumber(domesticKPIs.retentionMetrics.inProgress.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-yellow-50 p-2.5 rounded-lg border border-yellow-200 flex flex-col justify-center items-center text-center shadow-inner">
                                                <p className="text-[9px] font-black text-yellow-700 uppercase tracking-widest mb-1">Eligible</p>
                                                <h4 className="text-xl font-black text-yellow-700 leading-none">{domesticKPIs.retentionMetrics.eligible.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-yellow-300/50">
                                                    <span className="text-[10px] font-bold text-yellow-800 tracking-wider">₹ {formatCompactNumber(domesticKPIs.retentionMetrics.eligible.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Invoice Sent</p>
                                                <h4 className="text-xl font-black text-blue-700 leading-none">{domesticKPIs.retentionMetrics.invoiceSent.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-blue-200/50">
                                                    <span className="text-[10px] font-bold text-blue-800 tracking-wider">₹ {formatCompactNumber(domesticKPIs.retentionMetrics.invoiceSent.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex flex-col justify-center items-center text-center">
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Received</p>
                                                <h4 className="text-xl font-black text-emerald-700 leading-none">{domesticKPIs.retentionMetrics.received.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-emerald-200/50">
                                                    <span className="text-[10px] font-bold text-emerald-800 tracking-wider">₹ {formatCompactNumber(domesticKPIs.retentionMetrics.received.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 flex flex-col justify-center items-center text-center">
                                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Missed</p>
                                                <h4 className="text-xl font-black text-red-700 leading-none">{domesticKPIs.retentionMetrics.missed.count}</h4>
                                                <div className="mt-2 w-full pt-1.5 border-t border-red-200/50">
                                                    <span className="text-[10px] font-bold text-red-800 tracking-wider">₹ {formatCompactNumber(domesticKPIs.retentionMetrics.missed.amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Domestic Table */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
                                    <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14}/> Master Domestic Records
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-500">
                                        Showing {limitedDomesticData.length} of {domesticData.length} records
                                    </span>
                                </div>

                                <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
                                    <table className="w-full text-left text-xs whitespace-nowrap min-w-[1000px] table-fixed">
                                        <thead className="bg-[#103c7f] text-white sticky top-0 z-20 shadow-sm">
                                            <tr>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 w-[100px]">CRM Name</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 w-[120px]">Client Name</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 w-[120px]">Candidate Name</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center w-[100px]">Cand. Status</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center w-[80px]">Joining Date</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center w-[80px]">Payment Due</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-right w-[90px]">Payment Amt (₹)</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center w-[100px]">Payment Status</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center bg-indigo-900 w-[100px]">Ret. Target</th>
                                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-right bg-indigo-900 w-[60px]">Ret. Amt (₹)</th>
                                                <th className="p-2 text-[10px] uppercase font-bold text-center bg-indigo-900 w-[90px]">Ret. Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {limitedDomesticData && limitedDomesticData.length > 0 ? (
                                                limitedDomesticData.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-2 font-bold text-[#103c7f] border-r border-gray-50 overflow-hidden">
                                                            <span className="truncate block w-full" title={item.crm_name || "-"}>{item.crm_name || "-"}</span>
                                                        </td>
                                                        <td className="p-2 font-bold text-gray-800 border-r border-gray-50 overflow-hidden">
                                                            <div className="flex items-center gap-1.5 w-full">
                                                                <Building2 size={12} className="text-gray-400 shrink-0"/> 
                                                                <span className="truncate" title={item.client_name}>{item.client_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 font-bold text-gray-800 border-r border-gray-50 overflow-hidden">
                                                            <span className="truncate block w-full" title={item.candidate_name}>{item.candidate_name}</span>
                                                        </td>
                                                        <td className="p-2 text-center overflow-hidden border-r border-gray-50">
                                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-flex items-center justify-center truncate max-w-full ${
                                                                item.candidate_status === 'Working' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                                                item.candidate_status === 'Joined' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                item.candidate_status === 'Absconded' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                item.candidate_status === 'Resigned' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                item.candidate_status === 'Terminate' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                                                'bg-gray-50 text-gray-700 border-gray-200'
                                                            }`} title={item.candidate_status || "Pending"}>
                                                                {item.candidate_status || "Pending"}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-center font-mono text-gray-600 border-r border-gray-50">{item.joining_date || "-"}</td>
                                                        <td className="p-2 text-center font-mono font-bold text-indigo-600 border-r border-gray-50 bg-indigo-50/30">
                                                            {item.payment_due_date || "-"}
                                                        </td>
                                                        <td className="p-2 text-right font-black text-emerald-600 border-r border-gray-50">
                                                            {item.total_with_gst ? `₹ ${parseInt(item.total_with_gst).toLocaleString('en-IN')}` : "-"}
                                                        </td>
                                                        <td className="p-2 text-center border-r border-gray-50 overflow-hidden">
                                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-block truncate max-w-full ${
                                                                item.payment_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                                item.payment_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                item.payment_status === 'Partial Payment' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                item.payment_status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-orange-50 text-orange-700 border-orange-200'
                                                            }`} title={item.payment_status || "Pending"}>
                                                                {item.payment_status || "Pending"}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-center font-mono font-bold text-indigo-700 border-r border-indigo-50 bg-indigo-50/20">
                                                            {item.retention_target_date || "-"}
                                                        </td>
                                                        <td className="p-2 text-right font-black text-indigo-700 border-r border-indigo-50 bg-indigo-50/20">
                                                            {item.retention_amount ? `₹ ${parseInt(item.retention_amount).toLocaleString('en-IN')}` : "-"}
                                                        </td>
                                                        <td className="p-2 text-center overflow-hidden bg-indigo-50/20">
                                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-block truncate max-w-full ${
                                                                item.retention_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                                item.retention_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                item.retention_status === 'Eligible' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 shadow-inner' :
                                                                item.retention_status === 'Missed' || item.retention_status === 'Forfeited' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-slate-50 text-slate-500 border-slate-200'
                                                            }`} title={item.retention_status || "In Progress"}>
                                                                {item.retention_status || "In Progress"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="11" className="p-10 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        No domestic records found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* Show More/Less Button for Domestic */}
                                {domesticData.length > DEFAULT_ROWS && (
                                    <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-center">
                                        <button 
                                            onClick={() => setShowAllDomestic(!showAllDomestic)}
                                            className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest hover:text-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            {showAllDomestic ? (
                                                <>Show Less <ChevronUp size={14} /></>
                                            ) : (
                                                <>Show All ({domesticData.length} records) <ChevronDown size={14} /></>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}