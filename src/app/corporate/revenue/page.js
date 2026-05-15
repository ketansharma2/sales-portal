"use client";
import { useState, useEffect , useMemo } from "react";
import {
  Users, Briefcase, CheckCircle, AlertCircle,
  Building2, Calendar, Clock, Filter,
  Target, BellRing, ArrowRight, PhoneCall, ShieldAlert,
  MessageSquare, IndianRupee, AlertTriangle, FileText
} from "lucide-react";

export default function RevenueDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // --- FILTER STATES (MOVED TO TOP) ---
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [crmFilter, setCrmFilter] = useState("");
  const [candStatusFilter, setCandStatusFilter] = useState("All");
  const [payStatusFilter, setPayStatusFilter] = useState("All");

  // --- CONFIG ---
  const TODAY = new Date("2026-04-09");
  const MONTHLY_REVENUE_TARGET = 500000; 

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        
        const response = await fetch('/api/corporate/revenue/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching revenue history:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  // --- HELPER FUNCTIONS ---
  const parseCurrency = (str) => {
    if (!str) return 0; 
    return parseInt(String(str).replace(/,/g, ''), 10) || 0;
  };
  const formatCurrency = (num) => `₹ ${num.toLocaleString('en-IN')}`;

  const calculateDaysDiff = (dateString) => {
      if(!dateString) return null;
      const targetDate = new Date(dateString);
      const diffTime = targetDate - TODAY;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- CALCULATIONS ---
  
  // 1. Financials
  const achievedRevenue = data.filter(d => d.payment_status === 'Received').reduce((sum, d) => sum + parseCurrency(d.base_invoice), 0);
  const pipelineRevenue = data.filter(d => d.payment_status === 'Invoice Sent' || d.payment_status === 'Pending').reduce((sum, d) => sum + parseCurrency(d.base_invoice), 0);
  const targetProgress = Math.min((achievedRevenue / MONTHLY_REVENUE_TARGET) * 100, 100);
  const pipelineProgress = Math.min((pipelineRevenue / MONTHLY_REVENUE_TARGET) * 100, 100 - targetProgress);

  // --- FILTERED DATA ---
 // --- FILTERED DATA ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      
      // --- NEW DATE RANGE LOGIC ---
      if (fromDate || toDate) {
        if (!item.payment_due_date) return false;
        
        const itemDate = new Date(item.payment_due_date);
        itemDate.setHours(0, 0, 0, 0); // Normalize time
        
        if (fromDate) {
            const fDate = new Date(fromDate);
            fDate.setHours(0, 0, 0, 0);
            if (itemDate < fDate) return false;
        }
        
        if (toDate) {
            const tDate = new Date(toDate);
            tDate.setHours(23, 59, 59, 999); // Include entire end day
            if (itemDate > tDate) return false;
        }
      }
      
      // Rest of your filters remain exactly the same
      if (clientFilter && !item.client_name?.toLowerCase().includes(clientFilter.toLowerCase())) return false;
      if (crmFilter && !item.crm_name?.toLowerCase().includes(crmFilter.toLowerCase())) return false;
      if (candStatusFilter !== "All" && item.candidate_status !== candStatusFilter) return false;
      if (payStatusFilter !== "All") {
        if (payStatusFilter === "Pending") {
          if (item.payment_status !== "Pending") return false;
        } else {
          if (item.payment_status !== payStatusFilter) return false;
        }
      }
      return true;
    });
  }, [data, fromDate, toDate, clientFilter, crmFilter, candStatusFilter, payStatusFilter]); // Updated dependencies

  // 2. UNIFIED ALERTS (Payments + Calls)
  const allAlerts = [];
  data.forEach(d => {
      // Payment Alerts
      if (d.payment_status !== 'Received' && d.payment_due_date) {
          const payDiff = calculateDaysDiff(d.payment_due_date);
          if (payDiff <= 2) {
              allAlerts.push({
                  id: `pay-${d.id}`, type: 'Payment', title: d.client_name, subtitle: `Invoice: ₹ ${d.base_invoice}`, 
                  dueDate: d.payment_due_date, diffDays: payDiff, actionText: "Update Payment"
              });
          }
      }
      // Client Follow-up
      if (d.next_client_followup) {
          const clientDiff = calculateDaysDiff(d.next_client_followup);
          if (clientDiff <= 2) {
              allAlerts.push({
                  id: `client-${d.id}`, type: 'Client Call', title: d.client_name, subtitle: `Ref: ${d.candidate_name}`, 
                  dueDate: d.next_client_followup, diffDays: clientDiff, actionText: "Log Discussion"
              });
          }
      }
      // Candidate Follow-up
      if (d.next_candidate_followup) {
          const candDiff = calculateDaysDiff(d.next_candidate_followup);
          if (candDiff <= 2) {
              allAlerts.push({
                  id: `cand-${d.id}`, type: 'Candidate Call', title: d.candidate_name, subtitle: `Client: ${d.client_name}`, 
                  dueDate: d.next_candidate_followup, diffDays: candDiff, actionText: "Log Check-in"
              });
          }
      }
  });
  
  // Sort all alerts by urgency (most overdue first)
  allAlerts.sort((a, b) => a.diffDays - b.diffDays);

  // 3. Operational Metrics
  const totalPlacements = data.length;

  // --- CALCULATE KPI AGGREGATIONS FOR CARDS ---
  // --- 5. KPI CALCULATIONS (Counts & Amounts) ---
  const {
      joinedCount,
      workingCount,
      abscondedCount,
      resignedCount,
      terminateCount,
      // --- Payment Metrics (Count & Amount) ---
      paymentMetrics
  } = useMemo(() => {
      let joined = 0, working = 0, absconded = 0, resigned = 0, terminate = 0;
      
      // Payment की गिनती और अमाउंट दोनों स्टोर करने के लिए ऑब्जेक्ट
      const pMetrics = {
          pending: { count: 0, amount: 0 },
          invoiceSent: { count: 0, amount: 0 },
          partial: { count: 0, amount: 0 },
          received: { count: 0, amount: 0 },
          cancelled: { count: 0, amount: 0 }
      };

      filteredData.forEach(item => {
          // 1. Candidate Status Counts
          if (item.candidate_status === 'Joined') joined++;
          else if (item.candidate_status === 'Working') working++;
          else if (item.candidate_status === 'Absconded') absconded++;
          else if (item.candidate_status === 'Resigned') resigned++;
          else if (item.candidate_status === 'Terminate') terminate++;

          // 2. Payment Status Counts & Amounts
          const pStatus = item.payment_status;
          
          // यहाँ हम amount निकाल रहे हैं (parseCurrency फंक्शन का इस्तेमाल करके)
          const amount = parseCurrency(item.payment_amount || item.base_invoice); 

          if (!pStatus || pStatus === 'Pending') {
              pMetrics.pending.count++;
              pMetrics.pending.amount += amount;
          } else if (pStatus === 'Invoice Sent') {
              pMetrics.invoiceSent.count++;
              pMetrics.invoiceSent.amount += amount;
          } else if (pStatus === 'Partial Payment') {
              pMetrics.partial.count++;
              pMetrics.partial.amount += amount;
          } else if (pStatus === 'Received') {
              pMetrics.received.count++;
              pMetrics.received.amount += amount;
          } else if (pStatus === 'Cancelled') {
              pMetrics.cancelled.count++;
              pMetrics.cancelled.amount += amount;
          }
      });

      return {
          joinedCount: joined,
          workingCount: working,
          abscondedCount: absconded,
          resignedCount: resigned,
          terminateCount: terminate,
          paymentMetrics: pMetrics // यहाँ हम पूरा ऑब्जेक्ट भेज रहे हैं
      };
  }, [filteredData]);
  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-2 md:p-3">
      
      {/* HEADER */}
      <div className="flex flex-col mb-2">
         <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Revenue Overview</h1>
      </div>

      {/* --- MAIN CONTENT SPLIT --- */}
      <div className="flex flex-col lg:flex-row gap-4">
          
         {/* LEFT SIDE: METRICS, FILTERS & TABLES */}
<div className="flex-1 w-full space-y-3 min-w-0">
    
   {/* --- 1. ADVANCED FILTERS SECTION --- */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                <Filter size={14}/> Dashboard Filters
            </h3>
            {/* Clear All Condition Updated */}
            {(fromDate || toDate || clientFilter || crmFilter || candStatusFilter !== "All" || payStatusFilter !== "All") && (
                <button 
                    onClick={() => {
                        setFromDate("");
                        setToDate("");
                        setClientFilter("");
                        setCrmFilter("");
                        setCandStatusFilter("All");
                        setPayStatusFilter("All");
                    }}
                    className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors"
                >
                    Clear All
                </button>
            )}
        </div>
        
        {/* Changed grid to 6 cols to accommodate two date fields cleanly */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* FROM DATE Filter */}
            <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">From Date</label>
                <input 
                    type="date"
                    value={fromDate} 
                    onChange={e => setFromDate(e.target.value)} 
                    className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
                />
            </div>

            {/* TO DATE Filter */}
            <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">To Date</label>
                <input 
                    type="date"
                    value={toDate} 
                    onChange={e => setToDate(e.target.value)} 
                    min={fromDate} // Prevents selecting a 'To' date earlier than 'From' date
                    className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
                />
            </div>

            {/* Client Name Filter */}
            <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Client Name</label>
                <input 
                    type="text" 
                    placeholder="Search Client..." 
                    value={clientFilter} 
                    onChange={e => setClientFilter(e.target.value)} 
                    className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50"
                />
            </div>

            {/* CRM Name Filter */}
            <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">CRM Name</label>
                <input 
                    type="text" 
                    placeholder="Search CRM..." 
                    value={crmFilter} 
                    onChange={e => setCrmFilter(e.target.value)} 
                    className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50"
                />
            </div>

            {/* Candidate Status Filter */}
            <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Candidate Status</label>
                <select 
                    value={candStatusFilter} 
                    onChange={e => setCandStatusFilter(e.target.value)} 
                    className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
                >
                    <option value="All">All Statuses</option>
                    <option value="Working">Working</option>
                    <option value="Joined">Joined</option>
                    <option value="Absconded">Absconded</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminate">Terminate</option>
                </select>
            </div>

            {/* Payment Status Filter */}
            <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Payment Status</label>
                <select 
                    value={payStatusFilter} 
                    onChange={e => setPayStatusFilter(e.target.value)} 
                    className="w-full border border-gray-200 p-2 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
                >
                    <option value="All">All Statuses</option>
                    <option value="Received">Received</option>
                    <option value="Invoice Sent">Invoice Sent</option>
                    <option value="Pending">Pending</option>
                </select>
            </div>
        </div>
    </div>

    {/* --- 2. KPI CARDS SECTION --- */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* Candidate Status KPIs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <Users size={14} className="text-blue-500"/> Candidate Overview
            </h3>
           {/* 5 KPI Cards for Candidate Status */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                
                {/* 1. Joined (Green) */}
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                    <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Joined</p>
                    <h4 className="text-xl font-black text-green-700">{joinedCount || 0}</h4>
                </div>

                {/* 2. Working (Blue) */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Working</p>
                    <h4 className="text-xl font-black text-blue-700">{workingCount || 0}</h4>
                </div>

                {/* 3. Absconded (Red) */}
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Absconded</p>
                    <h4 className="text-xl font-black text-red-700">{abscondedCount || 0}</h4>
                </div>

                {/* 4. Resigned (Orange/Amber) */}
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-center">
                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Resigned</p>
                    <h4 className="text-xl font-black text-orange-700">{resignedCount || 0}</h4>
                </div>

                {/* 5. Terminate (Slate/Gray) */}
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Terminate</p>
                    <h4 className="text-xl font-black text-slate-700">{terminateCount || 0}</h4>
                </div>
                
            </div>
        </div>

        {/* Payment Status KPIs */}
      {/* Payment Status KPIs */}
        {/* Payment Status KPIs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                <IndianRupee size={14} className="text-emerald-500"/> Payment Overview
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 h-full">
                
                {/* 1. Pending (Orange) */}
                <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 flex flex-col justify-center items-center text-center">
                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Pending</p>
                    <h4 className="text-xl font-black text-orange-700 leading-none">{paymentMetrics.pending.count}</h4>
                    <div className="mt-2 w-full pt-1.5 border-t border-orange-200/50">
                        <span className="text-[10px] font-bold text-orange-800 tracking-wider">₹ {paymentMetrics.pending.amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* 2. Invoice Sent (Blue) */}
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex flex-col justify-center items-center text-center">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Invoice Sent</p>
                    <h4 className="text-xl font-black text-blue-700 leading-none">{paymentMetrics.invoiceSent.count}</h4>
                    <div className="mt-2 w-full pt-1.5 border-t border-blue-200/50">
                        <span className="text-[10px] font-bold text-blue-800 tracking-wider">₹ {paymentMetrics.invoiceSent.amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* 3. Partial Payment (Purple) */}
                <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100 flex flex-col justify-center items-center text-center">
                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Partial</p>
                    <h4 className="text-xl font-black text-purple-700 leading-none">{paymentMetrics.partial.count}</h4>
                    <div className="mt-2 w-full pt-1.5 border-t border-purple-200/50">
                        <span className="text-[10px] font-bold text-purple-800 tracking-wider">₹ {paymentMetrics.partial.amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* 4. Received (Green) */}
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex flex-col justify-center items-center text-center">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Received</p>
                    <h4 className="text-xl font-black text-emerald-700 leading-none">{paymentMetrics.received.count}</h4>
                    <div className="mt-2 w-full pt-1.5 border-t border-emerald-200/50">
                        <span className="text-[10px] font-bold text-emerald-800 tracking-wider">₹ {paymentMetrics.received.amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* 5. Cancelled (Red) */}
                <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 flex flex-col justify-center items-center text-center">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Cancelled</p>
                    <h4 className="text-xl font-black text-red-700 leading-none">{paymentMetrics.cancelled.count}</h4>
                    <div className="mt-2 w-full pt-1.5 border-t border-red-200/50">
                        <span className="text-[10px] font-bold text-red-800 tracking-wider">₹ {paymentMetrics.cancelled.amount.toLocaleString('en-IN')}</span>
                    </div>
                </div>

            </div>
        </div>
    </div>

    {/* --- 3. DETAILED REVENUE TABLE --- */}
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                <FileText size={14}/> Master Revenue Records
            </h3>
        </div>

        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
                <thead className="bg-[#103c7f] text-white sticky top-0 z-10">
                    <tr>
                        <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800">CRM Name</th>
                        <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800">Client Name</th>
                        <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800">Candidate Name</th>
                        <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center">Joining Date</th>
                        <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center">Payment Due Date</th>
                        <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-right">Payment Amount (₹)</th>
                        <th className="p-2 text-[10px] uppercase font-bold border-r border-blue-800 text-center">Payment Status</th>
                        <th className="p-2 text-[10px] uppercase font-bold text-center">Candidate Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {/* Assuming filteredData is your array mapped to the table */}
                    {filteredData && filteredData.length > 0 ? (
                        filteredData.map((item, idx) => (
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
                                    {item.payment_amount ? `₹ ${parseInt(item.payment_amount).toLocaleString('en-IN')}` : "-"}
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
                                No records found matching filters
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
</div>

          {/* RIGHT SIDE: UNIVERSAL ALERTS PANEL (Sticky) */}
          <div className="w-full lg:w-96 shrink-0">
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
                              
                              // Determine styling based on type of alert
                              let bgStyle, icon, textColor;
                              if (alert.type === 'Payment') {
                                bgStyle = 'bg-orange-50/50 border-orange-100 hover:border-orange-300';
                                icon = <IndianRupee size={14}/>;
                                textColor = 'text-orange-600';
                              } else if (alert.type === 'Client Call') {
                                bgStyle = 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-300';
                                icon = <Building2 size={14}/>;
                                textColor = 'text-indigo-600';
                              } else {
                                bgStyle = 'bg-purple-50/50 border-purple-100 hover:border-purple-300';
                                icon = <Users size={14}/>;
                                textColor = 'text-purple-600';
                              }
                              
                              return (
                                  <div key={alert.id} className={`p-4 rounded-xl border relative group transition-all hover:shadow-md ${bgStyle}`}>
                                      
                                      {/* Alert Badge */}
                                      <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${
                                          isOverdue ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-600 border-gray-200'
                                      }`}>
                                          {isOverdue ? 'Overdue' : `Due in ${alert.diffDays}D`}
                                      </div>

                                      {/* Content */}
                                      <div className="flex items-start gap-2.5">
                                          <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 bg-white shadow-sm border border-gray-100 ${textColor}`}>
                                              {icon}
                                          </div>
                                          <div className="flex-1 w-full">
                                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                                                  {alert.type}
                                              </p>
                                              <p className="text-sm font-bold text-gray-800 leading-tight">{alert.title}</p>
                                              <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{alert.subtitle}</p>
                                              
                                              <div className="mt-3 flex justify-between items-center border-t border-black/5 pt-2">
                                                  <span className="text-[9px] font-mono text-gray-400">{alert.dueDate}</span>
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
                          <p className="text-xs">No pending actions for today.</p>
                      </div>
                  )}

              </div>
          </div>

      </div>

    </div>
  );
}