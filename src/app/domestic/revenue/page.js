"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Users, Briefcase, CheckCircle, AlertCircle,
  Building2, Calendar, Clock, Filter,
  Target, BellRing, ArrowRight, PhoneCall, ShieldCheck,
  MessageSquare, IndianRupee, AlertTriangle, FileText, Award
} from "lucide-react";

export default function DomesticRevenueDashboard() {
  // --- 1. STATE INITIALIZATION ---
  const [loading, setLoading] = useState(true);
  
  // --- DUMMY DATA ---
  // API की जगह अब हम डमी डेटा का इस्तेमाल कर रहे हैं
  const [data, setData] = useState([
    {
      id: 1, crm_name: "Rahul Verma", client_name: "Tech Mahindra", candidate_name: "Amit Sharma", 
      candidate_status: "Working", joining_date: "2026-02-10", 
      payment_amount: "45000", payment_status: "Invoice Sent", payment_due_date: "2026-05-20",
      retention_amount: "15000", retention_status: "In Progress", retention_target_date: "2026-05-10"
    },
    {
      id: 2, crm_name: "Priya Singh", client_name: "TCS", candidate_name: "Neha Gupta", 
      candidate_status: "Joined", joining_date: "2026-05-01", 
      payment_amount: "55000", payment_status: "Pending", payment_due_date: "2026-06-01",
      retention_amount: "20000", retention_status: "In Progress", retention_target_date: "2026-08-01"
    },
    {
      id: 3, crm_name: "Rahul Verma", client_name: "Infosys", candidate_name: "Vikash Kumar", 
      candidate_status: "Working", joining_date: "2026-01-15", 
      payment_amount: "60000", payment_status: "Received", payment_due_date: "2026-02-15",
      retention_amount: "25000", retention_status: "Eligible", retention_target_date: "2026-04-15"
    },
    {
      id: 4, crm_name: "Sneha Patil", client_name: "Wipro", candidate_name: "Karan Johar", 
      candidate_status: "Absconded", joining_date: "2026-03-05", 
      payment_amount: "40000", payment_status: "Cancelled", payment_due_date: "2026-04-05",
      retention_amount: "10000", retention_status: "Missed", retention_target_date: "2026-06-05"
    },
    {
      id: 5, crm_name: "Priya Singh", client_name: "HCL", candidate_name: "Rohan Das", 
      candidate_status: "Resigned", joining_date: "2025-12-01", 
      payment_amount: "70000", payment_status: "Received", payment_due_date: "2026-01-01",
      retention_amount: "30000", retention_status: "Missed", retention_target_date: "2026-03-01"
    },
    {
      id: 6, crm_name: "Rahul Verma", client_name: "Tech Mahindra", candidate_name: "Pooja Hegde", 
      candidate_status: "Working", joining_date: "2025-10-10", 
      payment_amount: "50000", payment_status: "Received", payment_due_date: "2025-11-10",
      retention_amount: "15000", retention_status: "Received", retention_target_date: "2026-01-10"
    },
    {
      id: 7, crm_name: "Sneha Patil", client_name: "Cognizant", candidate_name: "Manish Pandey", 
      candidate_status: "Working", joining_date: "2026-04-20", 
      payment_amount: "48000", payment_status: "Invoice Sent", payment_due_date: "2026-05-18",
      retention_amount: "18000", retention_status: "In Progress", retention_target_date: "2026-07-20"
    },
    {
      id: 8, crm_name: "Priya Singh", client_name: "TCS", candidate_name: "Simran Kaur", 
      candidate_status: "Terminate", joining_date: "2026-02-25", 
      payment_amount: "42000", payment_status: "Partial Payment", payment_due_date: "2026-03-25",
      retention_amount: "12000", retention_status: "Missed", retention_target_date: "2026-05-25"
    },
    {
      id: 9, crm_name: "Rahul Verma", client_name: "Infosys", candidate_name: "Abhishek Jain", 
      candidate_status: "Working", joining_date: "2026-01-05", 
      payment_amount: "65000", payment_status: "Received", payment_due_date: "2026-02-05",
      retention_amount: "22000", retention_status: "Invoice Sent", retention_target_date: "2026-04-05"
    },
    {
      id: 10, crm_name: "Sneha Patil", client_name: "Wipro", candidate_name: "Riya Sharma", 
      candidate_status: "Working", joining_date: "2026-03-15", 
      payment_amount: "52000", payment_status: "Received", payment_due_date: "2026-04-15",
      retention_amount: "20000", retention_status: "In Progress", retention_target_date: "2026-06-15"
    }
  ]);

  // Filter States
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [crmFilter, setCrmFilter] = useState("");         // Added CRM Name State
  const [clientFilter, setClientFilter] = useState("");
  const [candidateFilter, setCandidateFilter] = useState(""); // Added Candidate Name State
  const [candStatusFilter, setCandStatusFilter] = useState("All");
  const [payStatusFilter, setPayStatusFilter] = useState("All");
  const [retentionStatusFilter, setRetentionStatusFilter] = useState("All");

  // --- CONFIG ---
  const TODAY = new Date("2026-05-16");

  // --- 2. FETCH DATA (Commented out API, using setTimeOut to simulate loading) ---
  useEffect(() => {
    // Simulate network request delay
    setTimeout(() => {
        setLoading(false);
    }, 800);
  }, []);

  // --- 3. HELPER FUNCTIONS ---
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

  const calculateDaysDiff = (dateString) => {
      if(!dateString) return null;
      const targetDate = new Date(dateString);
      const diffTime = targetDate - TODAY;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- 4. DATA FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Date Range Filter (Now applies to PAYMENT DUE DATE)
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
      
      // Text Filters (Case-insensitive matching)
      if (crmFilter && !item.crm_name?.toLowerCase().includes(crmFilter.toLowerCase())) return false;
      if (clientFilter && !item.client_name?.toLowerCase().includes(clientFilter.toLowerCase())) return false;
      if (candidateFilter && !item.candidate_name?.toLowerCase().includes(candidateFilter.toLowerCase())) return false;
      
      // Dropdown Filters
      if (candStatusFilter !== "All" && item.candidate_status !== candStatusFilter) return false;
      if (payStatusFilter !== "All" && item.payment_status !== payStatusFilter) return false;
      if (retentionStatusFilter !== "All" && item.retention_status !== retentionStatusFilter) return false;
      
      return true;
    });
  }, [data, fromDate, toDate, crmFilter, clientFilter, candidateFilter, candStatusFilter, payStatusFilter, retentionStatusFilter]);
  // --- 5. KPI CALCULATIONS ---
  const {
      joinedCount, workingCount, abscondedCount, resignedCount, terminateCount,
      paymentMetrics, retentionMetrics
  } = useMemo(() => {
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

      filteredData.forEach(item => {
          // 1. Candidate Status
          if (item.candidate_status === 'Joined') joined++;
          else if (item.candidate_status === 'Working') working++;
          else if (item.candidate_status === 'Absconded') absconded++;
          else if (item.candidate_status === 'Resigned') resigned++;
          else if (item.candidate_status === 'Terminate') terminate++;

          // 2. Base Payment Status
          const pStatus = item.payment_status;
          const baseAmount = parseCurrency(item.payment_amount || item.base_invoice); 

          if (!pStatus || pStatus === 'Pending') { pMetrics.pending.count++; pMetrics.pending.amount += baseAmount; }
          else if (pStatus === 'Invoice Sent') { pMetrics.invoiceSent.count++; pMetrics.invoiceSent.amount += baseAmount; }
          else if (pStatus === 'Partial Payment') { pMetrics.partial.count++; pMetrics.partial.amount += baseAmount; }
          else if (pStatus === 'Received') { pMetrics.received.count++; pMetrics.received.amount += baseAmount; }
          else if (pStatus === 'Cancelled') { pMetrics.cancelled.count++; pMetrics.cancelled.amount += baseAmount; }

          // 3. Retention Payment Status
          const rStatus = item.retention_status;
          const retAmount = parseCurrency(item.retention_amount); 

          if (rStatus === 'In Progress') { rMetrics.inProgress.count++; rMetrics.inProgress.amount += retAmount; }
          else if (rStatus === 'Eligible') { rMetrics.eligible.count++; rMetrics.eligible.amount += retAmount; }
          else if (rStatus === 'Invoice Sent') { rMetrics.invoiceSent.count++; rMetrics.invoiceSent.amount += retAmount; }
          else if (rStatus === 'Received') { rMetrics.received.count++; rMetrics.received.amount += retAmount; }
          else if (rStatus === 'Missed' || rStatus === 'Forfeited') { rMetrics.missed.count++; rMetrics.missed.amount += retAmount; }
      });

      return {
          joinedCount: joined, workingCount: working, abscondedCount: absconded, resignedCount: resigned, terminateCount: terminate,
          paymentMetrics: pMetrics, retentionMetrics: rMetrics
      };
  }, [filteredData]); 

  // --- 6. ALERTS GENERATION ---
  const allAlerts = [];
  data.forEach(d => {
      // Base Payment Alerts (If Due Date is within 2 days or overdue)
      if (d.payment_status !== 'Received' && d.payment_status !== 'Cancelled' && d.payment_due_date) {
          const payDiff = calculateDaysDiff(d.payment_due_date);
          if (payDiff <= 2) {
              allAlerts.push({
                  id: `pay-${d.id}`, type: 'Base Payment', title: d.client_name, subtitle: `Inv: ₹ ${parseCurrency(d.payment_amount).toLocaleString('en-IN')}`, 
                  dueDate: d.payment_due_date, diffDays: payDiff, actionText: "Update Base"
              });
          }
      }
      
      // Retention Eligibility Alert (If Target date is within 5 days or passed)
      if (d.retention_target_date && d.retention_status === 'In Progress' && d.candidate_status === 'Working') {
          const retDiff = calculateDaysDiff(d.retention_target_date);
          if (retDiff <= 5) {
               allAlerts.push({
                  id: `ret-${d.id}`, type: 'Retention Due', title: d.client_name, subtitle: `${d.candidate_name} completes tenure`, 
                  dueDate: d.retention_target_date, diffDays: retDiff, actionText: "Raise Invoice"
              });
          }
      }
  });
  
  allAlerts.sort((a, b) => a.diffDays - b.diffDays);

  if (loading) {
    return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-[#103c7f] font-bold uppercase tracking-widest">Loading Domestic Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-2 md:p-2">
      
      {/* HEADER */}
      <div className="flex flex-col mb-2">
         <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Domestic Revenue & Retention</h1>
         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Financial Health & Client Retention Bonuses</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-2">
          
        {/* LEFT SIDE: METRICS, FILTERS & TABLES */}
        <div className="flex-1 w-full space-y-2 min-w-0">
    
            {/* --- ADVANCED FILTERS SECTION --- */}
           {/* --- ADVANCED FILTERS SECTION --- */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-2">
                    <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                        <Filter size={14}/> Dashboard Filters
                    </h3>
                    {(fromDate || toDate || crmFilter || clientFilter || candidateFilter || candStatusFilter !== "All" || payStatusFilter !== "All" || retentionStatusFilter !== "All") && (
                        <button 
                            onClick={() => {
                                setFromDate(""); setToDate(""); 
                                setCrmFilter(""); setClientFilter(""); setCandidateFilter("");
                                setCandStatusFilter("All"); setPayStatusFilter("All"); setRetentionStatusFilter("All");
                            }}
                            className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors flex items-center gap-1 bg-red-50 px-2 py-1 rounded"
                        >
                            Clear All
                        </button>
                    )}
                </div>
                
                {/* Updated Grid for 8 items: 2 cols on mobile, 4 on tablet, 8 on large screens */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    
                    {/* 1 & 2: Date Filters (Payment Due) */}
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">From Payment Due</label>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"/>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">To Payment Due</label>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} min={fromDate} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"/>
                    </div>

                    {/* 3: CRM Name */}
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">CRM Name</label>
                        <input type="text" placeholder="Search CRM..." value={crmFilter} onChange={e => setCrmFilter(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50"/>
                    </div>

                    {/* 4: Client Name */}
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Client Name</label>
                        <input type="text" placeholder="Search Client..." value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50"/>
                    </div>
                    
                    {/* 5: Candidate Name */}
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Candidate Name</label>
                        <input type="text" placeholder="Search Candidate..." value={candidateFilter} onChange={e => setCandidateFilter(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50"/>
                    </div>

                    {/* 6: Candidate Status */}
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

                    {/* 7: Payment Status */}
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

                    {/* 8: Retention Status */}
                    <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Retention Status</label>
                        <select value={retentionStatusFilter} onChange={e => setRetentionStatusFilter(e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-[11px] font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer">
                            <option value="All">All</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Eligible">Eligible</option>
                            <option value="Invoice Sent">Invoice Sent</option>
                            <option value="Received">Received</option>
                            <option value="Missed">Missed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* --- KPI CARDS SECTION --- */}
            <div className="flex flex-col gap-2">
                
                {/* 1. Candidate Status KPIs */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                        <Users size={14} className="text-blue-500"/> Candidate Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-green-50 p-2 rounded-lg border border-green-100 text-center flex flex-col justify-center h-full">
                            <p className="text-[11px] font-black text-green-600 uppercase tracking-widest mb-1">Joined</p>
                            <h4 className="text-xl font-black text-green-700">{joinedCount || 0}</h4>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-center flex flex-col justify-center h-full">
                            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Working</p>
                            <h4 className="text-xl font-black text-blue-700">{workingCount || 0}</h4>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-center flex flex-col justify-center h-full">
                            <p className="text-[11px] font-black text-red-600 uppercase tracking-widest mb-1">Absconded</p>
                            <h4 className="text-xl font-black text-red-700">{abscondedCount || 0}</h4>
                        </div>
                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 text-center flex flex-col justify-center h-full">
                            <p className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-1">Resigned</p>
                            <h4 className="text-xl font-black text-orange-700">{resignedCount || 0}</h4>
                        </div>
                        <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 text-center flex flex-col justify-center h-full">
                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1">Terminate</p>
                            <h4 className="text-xl font-black text-slate-700">{terminateCount || 0}</h4>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {/* 2. Base Payment Status KPIs */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                            <IndianRupee size={14} className="text-emerald-500"/> Payment Overview
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 h-full">
                            <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Pending</p>
                                <h4 className="text-xl font-black text-orange-700 leading-none">{paymentMetrics.pending.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-orange-200/50">
                                    <span className="text-[10px] font-bold text-orange-800 tracking-wider">₹ {formatCompactNumber(paymentMetrics.pending.amount)}</span>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Invoice Sent</p>
                                <h4 className="text-xl font-black text-blue-700 leading-none">{paymentMetrics.invoiceSent.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-blue-200/50">
                                    <span className="text-[10px] font-bold text-blue-800 tracking-wider">₹ {formatCompactNumber(paymentMetrics.invoiceSent.amount)}</span>
                                </div>
                            </div>
                            <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Partial</p>
                                <h4 className="text-xl font-black text-purple-700 leading-none">{paymentMetrics.partial.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-purple-200/50">
                                    <span className="text-[10px] font-bold text-purple-800 tracking-wider">₹ {formatCompactNumber(paymentMetrics.partial.amount)}</span>
                                </div>
                            </div>
                            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Received</p>
                                <h4 className="text-xl font-black text-emerald-700 leading-none">{paymentMetrics.received.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-emerald-200/50">
                                    <span className="text-[10px] font-bold text-emerald-800 tracking-wider">₹ {formatCompactNumber(paymentMetrics.received.amount)}</span>
                                </div>
                            </div>
                            <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Cancelled</p>
                                <h4 className="text-xl font-black text-red-700 leading-none">{paymentMetrics.cancelled.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-red-200/50">
                                    <span className="text-[10px] font-bold text-red-800 tracking-wider">₹ {formatCompactNumber(paymentMetrics.cancelled.amount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. NEW: Retention Bonus KPIs */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                            <Award size={14} className="text-indigo-500"/> Retention Bonus Overview
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 h-full">
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center items-center text-center">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">In Progress</p>
                                <h4 className="text-xl font-black text-slate-700 leading-none">{retentionMetrics.inProgress.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-slate-200/50">
                                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">₹ {formatCompactNumber(retentionMetrics.inProgress.amount)}</span>
                                </div>
                            </div>
                            <div className="bg-yellow-50 p-2.5 rounded-lg border border-yellow-200 flex flex-col justify-center items-center text-center shadow-inner">
                                <p className="text-[9px] font-black text-yellow-700 uppercase tracking-widest mb-1">Eligible</p>
                                <h4 className="text-xl font-black text-yellow-700 leading-none">{retentionMetrics.eligible.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-yellow-300/50">
                                    <span className="text-[10px] font-bold text-yellow-800 tracking-wider">₹ {formatCompactNumber(retentionMetrics.eligible.amount)}</span>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Invoice Sent</p>
                                <h4 className="text-xl font-black text-blue-700 leading-none">{retentionMetrics.invoiceSent.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-blue-200/50">
                                    <span className="text-[10px] font-bold text-blue-800 tracking-wider">₹ {formatCompactNumber(retentionMetrics.invoiceSent.amount)}</span>
                                </div>
                            </div>
                            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Received</p>
                                <h4 className="text-xl font-black text-emerald-700 leading-none">{retentionMetrics.received.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-emerald-200/50">
                                    <span className="text-[10px] font-bold text-emerald-800 tracking-wider">₹ {formatCompactNumber(retentionMetrics.received.amount)}</span>
                                </div>
                            </div>
                            <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 flex flex-col justify-center items-center text-center">
                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Missed</p>
                                <h4 className="text-xl font-black text-red-700 leading-none">{retentionMetrics.missed.count}</h4>
                                <div className="mt-2 w-full pt-1.5 border-t border-red-200/50">
                                    <span className="text-[10px] font-bold text-red-800 tracking-wider">₹ {formatCompactNumber(retentionMetrics.missed.amount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

          {/* --- DETAILED REVENUE TABLE --- */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14}/> Master Domestic Records
                    </h3>
                </div>

                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                    {/* min-w-[1000px] कर दिया गया है ताकि नया कॉलम आसानी से फिट हो सके */}
                    <table className="w-full text-left text-xs whitespace-nowrap min-w-[1000px] table-fixed">
                        <thead className="bg-[#103c7f] text-white sticky top-0 z-20 shadow-sm">
                            <tr>
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 w-[100px]">CRM Name</th>
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 w-[120px]">Client Name</th>
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 w-[120px]">Candidate Name</th>
                                
                                {/* NEW: Candidate Status Column Header */}
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center w-[100px]">Cand. Status</th>
                                
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center w-[80px]">Joining Date</th>
                                
                                {/* BASE PAYMENT */}
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center w-[80px]">Payment Due</th>
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-right w-[90px]">Payment Amt (₹)</th>
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center w-[100px]">Payment Status</th>
                                
                                {/* RETENTION DATA */}
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center bg-indigo-900 w-[100px]">Ret. Target</th>
                                <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-right bg-indigo-900 w-[60px]">Ret. Amt (₹)</th>
                                <th className="p-2 text-[10px] uppercase font-bold text-center bg-indigo-900 w-[90px]">Ret. Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData && filteredData.length > 0 ? (
                                filteredData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        
                                        {/* 1. CRM Name */}
                                        <td className="p-2 font-bold text-[#103c7f] border-r border-gray-50 overflow-hidden">
                                            <span className="truncate block w-full" title={item.crm_name || "-"}>{item.crm_name || "-"}</span>
                                        </td>
                                        
                                        {/* 2. Client Name */}
                                        <td className="p-2 font-bold text-gray-800 border-r border-gray-50 overflow-hidden">
                                            <div className="flex items-center gap-1.5 w-full">
                                                <Building2 size={12} className="text-gray-400 shrink-0"/> 
                                                <span className="truncate" title={item.client_name}>{item.client_name}</span>
                                            </div>
                                        </td>
                                        
                                        {/* 3. Candidate Name */}
                                        <td className="p-2 font-bold text-gray-800 border-r border-gray-50 overflow-hidden">
                                            <span className="truncate block w-full" title={item.candidate_name}>{item.candidate_name}</span>
                                        </td>
                                        
                                        {/* 4. NEW: Candidate Status Data Cell */}
                                        <td className="p-2 text-center overflow-hidden border-r border-gray-50">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-flex items-center justify-center truncate max-w-full ${
                                                item.candidate_status === 'Working' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                                item.candidate_status === 'Joined' ? 'bg-green-50 text-green-700 border-green-200' :
                                                item.candidate_status === 'Absconded' ? 'bg-red-50 text-red-700 border-red-200' :
                                                item.candidate_status === 'Resigned' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                item.candidate_status === 'Terminate' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                                'bg-gray-50 text-gray-700 border-gray-200' // Default
                                            }`} title={item.candidate_status || "Pending"}>
                                                {item.candidate_status || "Pending"}
                                            </span>
                                        </td>
                                        
                                        {/* 5. Joining Date */}
                                        <td className="p-2 text-center font-mono text-gray-600 border-r border-gray-50">{item.joining_date || "-"}</td>
                                        
                                        {/* 6. Payment Due Date */}
                                        <td className="p-2 text-center font-mono font-bold text-indigo-600 border-r border-gray-50 bg-indigo-50/30">
                                            {item.payment_due_date || "-"}
                                        </td>
                                        
                                        {/* 7. Base Amount */}
                                        <td className="p-2 text-right font-black text-gray-600 border-r border-gray-50">
                                            {item.payment_amount ? `₹ ${parseInt(item.payment_amount).toLocaleString('en-IN')}` : "-"}
                                        </td>
                                        
                                        {/* 8. Payment Status */}
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
                                        
                                        {/* 9. Retention Target Date */}
                                        <td className="p-2 text-center font-mono font-bold text-indigo-700 border-r border-indigo-50 bg-indigo-50/20">
                                            {item.retention_target_date || "-"}
                                        </td>
                                        
                                        {/* 10. Retention Amount */}
                                        <td className="p-2 text-right font-black text-indigo-700 border-r border-indigo-50 bg-indigo-50/20">
                                            {item.retention_amount ? `₹ ${parseInt(item.retention_amount).toLocaleString('en-IN')}` : "-"}
                                        </td>
                                        
                                        {/* 11. Retention Status */}
                                        <td className="p-2 text-center overflow-hidden bg-indigo-50/20">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-block truncate max-w-full ${
                                                item.retention_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                item.retention_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                item.retention_status === 'Eligible' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 shadow-inner' :
                                                item.retention_status === 'Missed' || item.retention_status === 'Forfeited' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-slate-50 text-slate-500 border-slate-200' // In Progress
                                            }`} title={item.retention_status || "In Progress"}>
                                                {item.retention_status || "In Progress"}
                                            </span>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    {/* colSpan updated to 11 to match new number of columns */}
                                    <td colSpan="11" className="p-10 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        No records found matching filters
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* RIGHT SIDE: UNIVERSAL ALERTS PANEL */}
        <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-6">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <BellRing size={16} className="text-red-500 animate-pulse"/> Action Center
                    </h3>
                    <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">{allAlerts.length} Due</span>
                </div>

                {allAlerts.length > 0 ? (
                    <div className="space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto custom-scrollbar pr-2 pb-4">
                        {allAlerts.map(alert => {
                            const isOverdue = alert.diffDays < 0;
                            let bgStyle, icon, textColor;
                            
                            if (alert.type === 'Retention Due') {
                                bgStyle = 'bg-yellow-50/50 border-yellow-200 hover:border-yellow-400';
                                icon = <Award size={14}/>;
                                textColor = 'text-yellow-700';
                            } else if (alert.type === 'Base Payment') {
                                bgStyle = 'bg-orange-50/50 border-orange-100 hover:border-orange-300';
                                icon = <IndianRupee size={14}/>;
                                textColor = 'text-orange-600';
                            } else {
                                bgStyle = 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-300';
                                icon = <ShieldCheck size={14}/>;
                                textColor = 'text-indigo-600';
                            }
                            
                            return (
                                <div key={alert.id} className={`p-4 rounded-xl border relative group transition-all hover:shadow-md ${bgStyle}`}>
                                    <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${
                                        isOverdue ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-white text-gray-600 border-gray-200'
                                    }`}>
                                        {isOverdue ? 'Overdue' : `Due in ${alert.diffDays}D`}
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 bg-white shadow-sm border border-gray-100 ${textColor}`}>
                                            {icon}
                                        </div>
                                        <div className="flex-1 w-full">
                                            <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-0.5">
                                                {alert.type}
                                            </p>
                                            <p className="text-sm font-bold text-gray-800 leading-tight">{alert.title}</p>
                                            <p className="text-[10px] text-gray-600 mt-1 line-clamp-1 font-medium">{alert.subtitle}</p>
                                            
                                            <div className="mt-3 flex justify-between items-center border-t border-black/5 pt-2">
                                                <span className="text-[9px] font-mono opacity-60">{alert.dueDate}</span>
                                                <button className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline ${textColor}`}>
                                                    {alert.actionText} <ArrowRight size={10}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <CheckCircle size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-bold text-gray-600">All caught up!</p>
                        <p className="text-xs">No pending invoices or retention bonuses.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}