"use client";
import { useState, useEffect } from "react";
import { 
  Users, Briefcase, CheckCircle, AlertCircle, 
  Building2, Calendar, Clock,
  Target, BellRing, ArrowRight, PhoneCall, ShieldAlert,
  MessageSquare, IndianRupee, AlertTriangle
} from "lucide-react";

export default function RevenueDashboard() {
  const [loading, setLoading] = useState(true);

  // --- CONFIG ---
  const TODAY = new Date("2026-04-09");
  const MONTHLY_REVENUE_TARGET = 500000; 

  // --- DUMMY DATA ---
  const dummyRevenueData = [
    {
      id: 1, entry_date: "2026-04-10", client_name: "TechNova Solutions", candidate_name: "Amit Verma", 
      position: "Frontend Developer", joining_date: "2026-04-15", candidate_status: "Working", 
      payment_status: "Invoice Sent", payment_due_date: "2026-04-10", 
      base_invoice: "1,00,000", total_amount: "1,18,000",
      next_client_followup: "2026-04-10", 
      next_candidate_followup: "2026-04-16" 
    },
    {
      id: 2, entry_date: "2026-03-25", client_name: "Global Finance", candidate_name: "Sneha Patil", 
      position: "Data Analyst", joining_date: "2026-03-01", candidate_status: "Working", 
      payment_status: "Received", payment_due_date: "2026-03-30", 
      base_invoice: "1,50,000", total_amount: "1,77,000",
      next_client_followup: "2026-04-15",
      next_candidate_followup: "2026-04-08" 
    },
    {
      id: 3, entry_date: "2026-04-05", client_name: "Urban Builders", candidate_name: "Ravi Teja", 
      position: "Civil Engineer", joining_date: "2026-04-02", candidate_status: "Working", 
      payment_status: "Pending", payment_due_date: "2026-04-08", 
      base_invoice: "80,000", total_amount: "94,400",
      next_client_followup: "2026-04-07", 
      next_candidate_followup: "2026-04-10" 
    },
    {
      id: 4, entry_date: "2026-02-15", client_name: "Apex Retail", candidate_name: "Kiran Rao", 
      position: "Store Manager", joining_date: "2026-02-25", candidate_status: "Absconded", 
      payment_status: "Pending Replacement", payment_due_date: "", 
      base_invoice: "60,000", total_amount: "70,800",
      next_client_followup: "",
      next_candidate_followup: ""
    },
    {
      id: 5, entry_date: "2026-04-08", client_name: "Stellar Jobs", candidate_name: "Priya Sharma", 
      position: "UX Designer", joining_date: "2026-04-18", candidate_status: "Pending Join", 
      payment_status: "Pending", payment_due_date: "2026-05-18", 
      base_invoice: "1,20,000", total_amount: "1,41,600",
      next_client_followup: "2026-04-12",
      next_candidate_followup: "2026-04-17"
    }
  ];

  const [data, setData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(dummyRevenueData);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
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
  const workingCandidates = data.filter(d => d.candidate_status === 'Working').length;
  const pendingJoins = data.filter(d => d.candidate_status === 'Pending Join').length;
  const abscondedCandidates = data.filter(d => d.candidate_status === 'Absconded').length;

  if (loading) {
    return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-[#103c7f] font-bold uppercase tracking-widest">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6">
      
      {/* HEADER */}
      <div className="flex flex-col mb-6">
         <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Revenue & Targets</h1>
         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Financial Health & Action Items for April 2026</p>
      </div>

      {/* --- MAIN CONTENT SPLIT --- */}
      <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT SIDE: METRICS & TABLES */}
          <div className="flex-1 w-full space-y-6">
              
              {/* --- REVENUE TARGET VS ACHIEVED --- */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex justify-between items-end mb-6">
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                          <Target size={18} className="text-[#103c7f]"/> Monthly Revenue Target
                      </h3>
                      <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Set</p>
                          <p className="text-xl font-black text-gray-800">{formatCurrency(MONTHLY_REVENUE_TARGET)}</p>
                      </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-6 mb-4 overflow-hidden flex relative shadow-inner">
                      <div className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all duration-1000" style={{ width: `${targetProgress}%` }}>
                          {targetProgress > 5 ? `${targetProgress.toFixed(0)}%` : ''}
                      </div>
                      <div className="bg-blue-400 h-full opacity-80 flex items-center justify-center text-[10px] text-white font-bold transition-all duration-1000" style={{ width: `${pipelineProgress}%` }}></div>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      <div>
                          <p className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Achieved
                          </p>
                          <p className="text-xl lg:text-2xl font-black text-emerald-600">{formatCurrency(achievedRevenue)}</p>
                      </div>
                      <div>
                          <p className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                              <span className="w-2 h-2 rounded-full bg-blue-400"></span> Pipeline
                          </p>
                          <p className="text-xl lg:text-2xl font-black text-blue-600">{formatCurrency(pipelineRevenue)}</p>
                      </div>
                      <div>
                          <p className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                              <span className="w-2 h-2 rounded-full bg-gray-200"></span> Shortfall
                          </p>
                          <p className="text-xl lg:text-2xl font-black text-gray-800">
                              {formatCurrency(Math.max(MONTHLY_REVENUE_TARGET - achievedRevenue - pipelineRevenue, 0))}
                          </p>
                      </div>
                  </div>
              </div>

              {/* --- CANDIDATE & OPERATIONAL METRICS --- */}
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
                  <Briefcase size={14} className="text-[#103c7f]"/> Operational Overview (April)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 group hover:border-[#103c7f] transition-all">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-[#103c7f] group-hover:text-white transition-colors"><Briefcase size={18}/></div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Placed</p>
                        <h3 className="text-xl font-black text-slate-800 leading-none">{totalPlacements}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 group hover:border-emerald-500 transition-all">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors"><CheckCircle size={18}/></div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Active</p>
                        <h3 className="text-xl font-black text-slate-800 leading-none">{workingCandidates}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 group hover:border-amber-500 transition-all">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors"><Clock size={18}/></div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pending</p>
                        <h3 className="text-xl font-black text-slate-800 leading-none">{pendingJoins}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 group hover:border-red-500 transition-all">
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors"><AlertTriangle size={18}/></div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Absconded</p>
                        <h3 className="text-xl font-black text-slate-800 leading-none">{abscondedCandidates}</h3>
                    </div>
                </div>
              </div>

              {/* --- RECENT PIPELINE / JOININGS --- */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                  <div className="flex justify-between items-center mb-5">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={14} className="text-[#103c7f]"/> Recent Placements
                      </h3>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-xs whitespace-nowrap min-w-[600px]">
                          <thead className="text-[10px] uppercase font-black text-gray-400 border-b border-gray-100">
                              <tr>
                                  <th className="pb-3 pr-4">Candidate / Client</th>
                                  <th className="pb-3 pr-4">Joining Date</th>
                                  <th className="pb-3 pr-4 text-center">Status</th>
                                  <th className="pb-3 text-center">Payment</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {data.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                      <td className="py-3 pr-4">
                                          <div className="font-bold text-gray-800">{item.candidate_name} <span className="text-[10px] text-gray-400 ml-1">({item.position})</span></div>
                                          <div className="text-[10px] font-bold text-[#103c7f] mt-0.5"><Building2 size={10} className="inline mr-1"/>{item.client_name}</div>
                                      </td>
                                      <td className="py-3 pr-4 font-mono text-gray-600 font-bold">
                                          {item.joining_date}
                                      </td>
                                      <td className="py-3 pr-4 text-center">
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                              item.candidate_status === 'Working' ? 'bg-green-50 text-green-700 border-green-200' : 
                                              item.candidate_status === 'Pending Join' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                              'bg-red-50 text-red-700 border-red-200'
                                          }`}>
                                              {item.candidate_status}
                                          </span>
                                      </td>
                                      <td className="py-3 text-center">
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                              item.payment_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                              item.payment_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                              'bg-orange-50 text-orange-700 border-orange-200'
                                          }`}>
                                              {item.payment_status}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
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