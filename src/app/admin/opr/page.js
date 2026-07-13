"use client";
import React, { useState, useEffect } from "react";
import { 
  Printer, AlertTriangle 
} from "lucide-react";
import * as API from '@/lib/api-client';
export default function OperationsReport() {
  // --- SECTOR FILTER STATE ---
  const [activeTab, setActiveTab] = useState("All");
  const [reportData, setReportData] = useState(null);
  const [cafeData, setCafeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

const formatIndianNumber = (num) => {
  // Handle null, undefined, or empty
  if (num === null || num === undefined || num === '') return '0';
  
  // Convert to number if it's a string
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  // Check if it's a valid number
  if (isNaN(number) || !isFinite(number)) return '0';
  
  // Round to nearest integer
  const numStr = Math.round(number).toString();
  const lastThree = numStr.slice(-3);
  const otherNumbers = numStr.slice(0, -3);
  
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }
  return lastThree;
};
  const flagKpi = true;
  const flagData = false;
  const [dbs] = useState(['items', 'orders', 'users']);

  // Fetch main report data
  const fetchReportData = async (start, end) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      
      let url = '/api/admin/operation-report';
      const params = new URLSearchParams();
      
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

     const response = await API.apiGet(url);
      
      const data = await response.json();
      if (data.success) {
        setReportData(data.data);
        return data.data;
      } else {
        setError(data.error || 'Failed to fetch report data');
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      setError(error.message);
      return null;
    }
  };

  // Fetch Cafe App data
  const fetchCafeData = async (start, end) => {
    try {
      const tablesParam = dbs.join(',');
      let url = `/api/admin/operation-report/cafe-app-api?tables=${tablesParam}&kpiFlag=${flagKpi}&dataFlag=${flagData}`;
      
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;
      
    const response = await API.apiGet(url);
      const data = await response.json();
      if (data.success) {
        setCafeData(data?.data?.data);
        return data?.data?.data;
      }
    } catch (error) {
      console.error('Failed to fetch cafe app data:', error);
    }
    return null;
  };

  // Fetch all data
  const fetchAllData = async (start, end) => {
    setLoading(true);
    await fetchReportData(start, end);
    await fetchCafeData(start, end);
    setLoading(false);
  };

  // Initial fetch on mount with default dates
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
    const defaultEnd = today.toISOString().split('T')[0];
    
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    fetchAllData(defaultStart, defaultEnd);
  }, []);

  // Handle date filter application
  const handleApplyFilter = () => {
    if (startDate && endDate) {
      fetchAllData(startDate, endDate);
    }
  };

  // Reset date filter
  const handleResetFilter = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
    const defaultEnd = today.toISOString().split('T')[0];
    
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    fetchAllData(defaultStart, defaultEnd);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#103c7f] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading Operations Report...</p>
        </div>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-slate-50 flex items-center justify-center">
  //       <div className="text-center bg-red-50 p-8 rounded-xl border border-red-200">
  //         <AlertTriangle className="text-red-500 h-12 w-12 mx-auto mb-4" />
  //         <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Data</h2>
  //         <p className="text-gray-600">{error}</p>
  //         <button 
  //           onClick={() => fetchAllData(startDate, endDate)}
  //           className="mt-4 px-4 py-2 bg-[#103c7f] text-white rounded-lg hover:bg-blue-800"
  //         >
  //           Retry
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // Destructure data with fallbacks
  const data = reportData || {};
  const cafe = cafeData || {};

  // Get total users from report data
  const totalUsers = data?.totalUsers || 0;

  // Get corporate data
  const corporate = data?.corporate || {};
  const domestic = data?.domestic || {};
  const deliveryCorporate = data?.deliveryCorporate || {};
  const deliveryDomestic = data?.deliveryDomestic || {};
  const tech = data?.tech || {};

  // Cafe App data
  const cafeKpi = cafe?.kpi || {};

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-2 font-['Cambria',sans-serif]">
      
      {/* UNIFIED HEADER */}
      <div className="flex justify-between items-center mb-3 max-w-7xl mx-auto border-b-2 border-[#103c7f] pb-4">
        <div className="flex items-center gap-4">
          <img src="/maven-logo.png" alt="Maven Logo" className="h-10 md:h-12 w-auto object-contain" />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#103c7f] uppercase tracking-tight">Operations Report</h1>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Master Executive Tracker</p>
          </div>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="bg-[#103c7f] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md transition-all print:hidden"
        >
          <Printer size={14} /> Print Report
        </button>
      </div>

      {/* TIER 1: EXECUTIVE SCREEN DASHBOARD */}
      <div className="print:hidden max-w-7xl mx-auto space-y-3 mb-3">
        
        {/* INTERACTIVE CONTROLS */}
        <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex-wrap gap-4">
          
          {/* Left Side: Category Toggles */}
          <div className="flex gap-1.5 overflow-x-auto">
            {["All", "Sales", "Delivery", "Tech"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab 
                    ? "bg-[#103c7f] text-white shadow-sm" 
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab === "All" ? "Complete View" : `${tab} Section`}
              </button>
            ))}
          </div>

          {/* Right Side: Date Range Filter */}
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                className="text-[10px] p-1.5 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#103c7f]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-[10px] font-bold text-gray-400">TO</span>
              <input 
                type="date" 
                className="text-[10px] p-1.5 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#103c7f]"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <button 
              onClick={handleApplyFilter}
              className="px-3 py-1.5 bg-[#103c7f] text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition-all uppercase tracking-wider"
            >
              Apply
            </button>
            
            <button 
              onClick={handleResetFilter}
              className="px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-all uppercase tracking-wider"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* TIER 2: MASTER SPREADSHEET */}
      <div className="max-w-7xl mx-auto print:max-w-full print:w-full bg-white shadow-xl print:shadow-none overflow-x-auto print:overflow-visible print:mx-0 rounded-xl border border-gray-200 print:border-none">
        
        <table className="w-full text-center border-collapse border border-gray-400 text-xs md:text-sm print:text-[10px]">
          <tbody className="divide-y divide-gray-400">
            
            {/* ======================= SALES SECTION ======================= */}
            {(activeTab === "All" || activeTab === "Sales") && (
              <>
                <tr>
                  <td rowSpan={8} className="vertical-title border border-gray-400 font-bold bg-[#e2efda] text-gray-800 text-sm md:text-base w-8 print:w-6" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Sales</td>              
                  {/* --- Corporate --- */}
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#38761d] text-white p-1">Corporate</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">Leads</td>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Leads</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Pipeline Clients</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Onboard</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Requirement Profiles</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Total Requirement</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Total CTC Generated</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{corporate?.leads || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{corporate?.pipelineClients || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{corporate?.onboard || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{corporate?.requirementProfiles || 0}</td>
                  <td className="border border-gray-400 font-bold p-1">{corporate?.totalRequirements || 0}</td>
                  <td className="border border-gray-400 font-bold p-1">{corporate?.totalCTC?.toFixed(2) || 0} lakh</td>
                </tr>
                
                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">Franchise</td>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Franchise discussed</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Form ask</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Franchise Form Shared</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Franchise Acceptance</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{corporate?.franchise?.discussed || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{corporate?.franchise?.formAsk || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{corporate?.franchise?.formShared || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{corporate?.franchise?.acceptance || 0}</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                {/* --- Domestic --- */}
                <tr>
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#0b5394] text-white p-1">Domestic</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">Leads</td>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Leads</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Pipeline Clients</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Onboard</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Requirement Profiles</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Total Requirement</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Total CTC Generated</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.leads || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.pipelineClients || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.onboard || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.requirementProfiles || 0}</td>
                  <td className="border border-gray-400 font-bold p-1">{domestic?.totalRequirements || 0}</td>
                  <td className="border border-gray-400 font-bold p-1">{domestic?.totalCTC?.toFixed(2) || 0} lakh</td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">Job Post</td>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">Total Job Post</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">Open</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">Paused</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">Flagged</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">CV by JOB Post</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">CV Calling</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.jobPosts?.total || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.jobPosts?.open || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.jobPosts?.paused || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.jobPosts?.flagged || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.jobPosts?.cvByJobPost || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{domestic?.jobPosts?.cvCalling || 0}</td>
                </tr>
              </>
            )}

            {/* ======================= DELIVERY SECTION ======================= */}
            {(activeTab === "All" || activeTab === "Delivery") && (
              <>
                <tr>
                  <td rowSpan={8} className="vertical-title border border-gray-400 font-bold bg-[#cfe2f3] text-gray-800 text-sm md:text-base w-8 print:w-6" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Delivery</td>              
                  {/* --- Corporate --- */}
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#38761d] text-white p-1">Corporate</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">RC</td>
                  <th className="border border-gray-400 font-bold bg-[#d9d2e9] p-1 text-[#351c75]">CV Parse</th>
                  <th className="border border-gray-400 font-bold bg-[#d9d2e9] p-1 text-[#351c75]">Tracker Share by RC</th>
                  <th className="border border-gray-400 font-bold bg-[#d9d2e9] p-1 text-[#351c75]">Tracker Share by TL</th>
                  <th className="border border-gray-400 font-bold bg-[#b4a7d6] p-1 text-[#351c75]">Tracker Share BY CRM</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{deliveryCorporate?.rc?.cvParse || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{deliveryCorporate?.rc?.trackerShareRC || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{deliveryCorporate?.rc?.trackerShareTL || 0}</td>
                  <td className="border border-gray-400 font-bold p-1">{deliveryCorporate?.rc?.trackerShareCRM || 0}</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

{/* --- Corporate Delivery --- */}
<tr>
  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">CRM</td>
  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Interview</th>
  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Joining</th>
  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Recovery by</th>
  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Total Amt</th>
  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Received</th>
  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Pending</th>
  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Partial</th>
</tr>
<tr>
  <td className="border border-gray-400 font-semibold p-1">{deliveryCorporate?.crm?.interview || 0}</td>
  <td className="border border-gray-400 font-semibold p-1">{deliveryCorporate?.crm?.joining || 0}</td>
  <td className="border border-gray-400 font-semibold p-1">{deliveryCorporate?.crm?.recoveryBy || 0}</td>
  <td className="border border-gray-400 font-semibold p-1">₹{formatIndianNumber(deliveryCorporate?.crm?.totalAmt ?? 0) }</td>
  <td className="border border-gray-400 font-semibold p-1">₹{formatIndianNumber(deliveryCorporate?.crm?.received ?? 0) }</td>
  <td className="border border-gray-400 font-semibold p-1">₹{formatIndianNumber(deliveryCorporate?.crm?.pending ?? 0) }</td>
  <td className="border border-gray-400 font-semibold p-1">₹{formatIndianNumber(deliveryCorporate?.crm?.partial ?? 0) }</td>
</tr>

                {/* --- Domestic --- */}
                <tr>
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#0b5394] text-white p-1">Domestic</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">RC</td>
                  <th className="border border-gray-400 font-bold bg-[#fff2cc] p-1 text-[#b45f06]">CV Parse</th>
                  <th className="border border-gray-400 font-bold bg-[#fff2cc] p-1 text-[#b45f06]">Tracker Share by RC</th>
                  <th className="border border-gray-400 font-bold bg-[#fff2cc] p-1 text-[#b45f06]">Tracker Share by TL</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Tracker Share by CRM</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{deliveryDomestic?.rc?.cvParse || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{deliveryDomestic?.rc?.trackerShareRC || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{deliveryDomestic?.rc?.trackerShareTL || 0}</td>
                  <td className="border border-gray-400 font-bold p-1">{deliveryDomestic?.rc?.trackerShareCRM || 0}</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

{/* --- Domestic Delivery --- */}
<tr>
  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">CRM</td>
  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Interview</th>
  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Joining</th>
  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Recovery by</th>
  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Total Amt</th>
  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Received</th>
  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Pending</th>
  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Partial</th>
</tr>
<tr>
  <td className="border border-gray-400 font-semibold p-1">{deliveryDomestic?.crm?.interview || 0}</td>
  <td className="border border-gray-400 font-semibold p-1">{deliveryDomestic?.crm?.joining || 0}</td>
  <td className="border border-gray-400 font-semibold p-1">{deliveryDomestic?.crm?.recoveryBy || 0}</td>
  <td className="border border-gray-400 font-semibold p-1">₹{formatIndianNumber(deliveryDomestic?.crm?.totalAmt ?? 0) }</td>
  <td className="border border-gray-400 font-semibold p-1">₹{formatIndianNumber(deliveryDomestic?.crm?.received ?? 0) }</td>
  <td className="border border-gray-400 font-semibold p-1">₹{formatIndianNumber(deliveryDomestic?.crm?.pending ?? 0)}</td>
  <td className="border border-gray-400 font-semibold p-1">₹{formatIndianNumber(deliveryDomestic?.crm?.partial ?? 0)}</td>
</tr>
              </>
            )}

            {/* ======================= TECH SECTION ======================= */}
            {(activeTab === "All" || activeTab === "Tech") && (
              <>
                <tr>
                  <td rowSpan={22} className="vertical-title border border-gray-400 font-bold bg-[#d9d2e9] text-gray-800 text-sm md:text-base w-8 print:w-6" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Tech</td>
                  
                  {/* --- Data Mgmt --- */}
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-[#a61c00] text-white p-1">Data Mgmt</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white text-[#cc0000] p-1">Tech</td>
                  <th className="border border-gray-400 font-bold bg-[#f4cccc] p-1 text-[#a61c00]">Sheets</th>
                  <th className="border border-gray-400 font-bold bg-[#f4cccc] p-1 text-[#a61c00]">Mail ID</th>
                  <th className="border border-gray-400 font-bold bg-[#f4cccc] p-1 text-[#a61c00]">Tools</th>
                  <th className="border border-gray-400 font-bold bg-[#f4cccc] p-1 text-[#a61c00]">Data Cleanup</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.dataMgmt?.sheets || 'Not able to count -'}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.dataMgmt?.mailId || 65}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.dataMgmt?.tools || 'Need to sort'}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.dataMgmt?.dataCleanup || '100+ Sheets , files'}</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                {/* --- Monitor --- */}
                <tr>
                  <td rowSpan={10} className="border border-gray-400 font-bold bg-[#a64d79] text-white p-1">Monitor</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Scanner</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Application</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Company</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">User</th>
                  <td colSpan={3} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.monitor?.scanner?.application || 'Not able to count due to dummy data'}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.monitor?.scanner?.company || 'Not able to count due to dummy data'}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.monitor?.scanner?.user || 1}</td>
                  <td colSpan={3} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Searchbar</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">CV uploaded</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">View</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Cv Download</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">User</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.monitor?.searchbar?.cvUploaded || 48667}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.monitor?.searchbar?.view || 'Saloni , Nikita'}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.monitor?.searchbar?.cvDownload || '49 (only saloni)'}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.monitor?.searchbar?.user || '10 RC , 1 Admin'}</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">WPR</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Total User</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Fill</th>
                  <td colSpan={4} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.monitor?.wpr?.totalUser || 29}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.monitor?.wpr?.fill || 'Most - 13'}</td>
                  <td colSpan={4} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Cafe App</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Orders</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Completed</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Rejected</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Menu Items</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">User</th>
                  <td colSpan={1} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{(cafeData?.orders?.completed || 0) + (cafeData?.orders?.rejected || 0)}</td>
                  <td className="border border-gray-400 font-semibold p-1">{cafeData?.orders?.completed || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{cafeData?.orders?.rejected || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{cafeData?.menu?.available || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{cafeData?.users?.active || 0}</td>
                  <td colSpan={1} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Sales / Delivery</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Total User</th>
                  <td colSpan={5} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{totalUsers}</td>
                  <td colSpan={5} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                {/* --- Development --- */}
                <tr>
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#134f5c] text-white p-1">Development</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">In - House</td>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Total Project</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Done</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">In Progress</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Pending</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.development?.inHouse?.total || 2}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.development?.inHouse?.done || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.development?.inHouse?.inProgress || 2}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.development?.inHouse?.pending || 0}</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Out - Source</td>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Total Project</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Done</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">In Progress</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Pending</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.development?.outSource?.total || 2}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.development?.outSource?.done || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.development?.outSource?.inProgress || 2}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.development?.outSource?.pending || 0}</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                {/* --- DM --- */}
                <tr>
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#e69138] text-white p-1">DM</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">In - House</td>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Company</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Platforms</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Pages</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Post Design</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Post Publish</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Linkedin Connection</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.digitalMarketing?.inHouse?.company || 3}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.digitalMarketing?.inHouse?.platforms || 6}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.digitalMarketing?.inHouse?.pages || 22}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.digitalMarketing?.inHouse?.postDesign || '197 + 16'}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.digitalMarketing?.inHouse?.postPublish || '191 + 5'}</td>
                  <td className="border border-gray-400 font-semibold p-1 leading-tight">
                    Bhavishya - {tech?.digitalMarketing?.inHouse?.linkedinConnections?.bhavishya || 1121}<br/>
                    Ketan - {tech?.digitalMarketing?.inHouse?.linkedinConnections?.ketan || 3559}
                  </td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Out - Source</td>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Post Publish</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Leads Gen.</th>
                  <td colSpan={4} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.digitalMarketing?.outSource?.postPublish || 0}</td>
                  <td className="border border-gray-400 font-semibold p-1">{tech?.digitalMarketing?.outSource?.leadsGen || 0}</td>
                  <td colSpan={4} className="border border-gray-400 bg-gray-50"></td>
                </tr>
              </>
            )}

          </tbody>
        </table>
      </div>

      {/* PRINT CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 2mm 2mm 2mm 1mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          html, body, #__next, main, .min-h-screen {
            background-color: white !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            width: 100% !important;
          }

          div {
            overflow: visible !important;
            max-height: none !important;
          }

          .overflow-x-auto, .overflow-y-auto, .custom-scrollbar {
            overflow: visible !important;
            display: block !important;
          }

          .print\\:hidden { display: none !important; }

          table {
            width: 100% !important;
            max-width: 100% !important;
            height: 86vh !important; 
            border-collapse: collapse !important;
            table-layout: auto !important; 
          }

          th, td {
            border: 1px solid #4b5563 !important; 
            padding: 4px !important; 
            font-size: 14px !important; 
            word-wrap: break-word !important;
          }
          
          .vertical-title {
            font-size: 16px !important; 
            width: 35px !important;
            padding: 2px !important;
          }

          .print\\:rotate-0 {
            writing-mode: horizontal-tb !important;
            transform: none !important;
          }
          
          ::-webkit-scrollbar {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}