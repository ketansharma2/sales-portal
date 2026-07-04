"use client";
import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, UserCheck, Calendar, Search, Clock, 
  CheckCircle2, XCircle, AlertCircle, PhoneCall, FileText, 
  TrendingUp, Award, Zap, Briefcase, SlidersHorizontal, ChevronDown,Target, X
} from "lucide-react";
import * as API from '@/lib/api-client';

export default function DomesticDeliveryPage() {
  const [crmOptions, setCrmOptions] = useState([]);
  const [accuracyModalOpen, setAccuracyModalOpen] = useState(false);
  const [rcAccuracyModalOpen, setRcAccuracyModalOpen] = useState(false);
  const [tlOptions, setTlOptions] = useState([]);
  const [rcOptions, setRcOptions] = useState([]);
  const [selectedCrm, setSelectedCrm] = useState(null);
  const [selectedTl, setSelectedTl] = useState(null);
  const [crmFilter, setCrmFilter] = useState("All");
  const [tlFilter, setTlFilter] = useState("All");
  const [rcFilter, setRcFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mounted, setMounted] = useState(false);

  const [metrics, setMetrics] = useState({
    trackerToClient: 0, shortlisted: 0, interviewed: 0, selected: 0, joining: 0, ghosted: 0, rejected: 0,
    trackerToCrm: 0, delayedCv: 0, cvParsed: 0, calls: 0, advSti: 0, asset: 0, trackerToTl: 0,
    pipeline: 0, tlPipelineCv: 0, tlAccuracy: "0.0", rcConversion: "0.0", rcAccuracy: "0.0"
  });
  const [metricsLoading, setMetricsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCrms = async () => {
      try {
        const response = await API.apiGet("/api/hod/domestic/delivery/filters?type=crms");
        const data = await response.json();
        if (data.success) {
          setCrmOptions(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching CRMs:', error);
      }
    };

    if (mounted) {
      fetchCrms();
    }
  }, [mounted]);

  const handleCrmChange = async (e) => {
    const val = e.target.value; // now user_id or "All"
    setCrmFilter(val);
    setTlFilter("All"); setRcFilter("All");
    setTlOptions([]); setRcOptions([]);
    
    if (val !== "All") {
      const crm = crmOptions.find(c => c.user_id === val);
      if (crm) {
        setSelectedCrm(crm);
        try {
          const res = await API.apiGet(`/api/hod/domestic/delivery/filters?type=tls&sector=${crm.sector || 'Domestic'}`);
          const data = await res.json();
          if (data.success) setTlOptions(data.data || []);
        } catch (error) {
          console.error('Error fetching TLs:', error);
        }
      }
    } else {
      setSelectedCrm(null);
    }
  };

  const handleTlChange = async (e) => {
    const val = e.target.value;
    setTlFilter(val); setRcFilter("All"); setRcOptions([]);
    const tl = tlOptions.find(t => t.user_id === val);
    
    if (tl) {
      setSelectedTl(tl);
      try {
        const res = await API.apiGet(`/api/hod/domestic/delivery/filters?type=rcs&tlId=${tl.user_id}`);
        const data = await res.json();
        if (data.success) setRcOptions(data.data || []);
      } catch (error) {
        console.error('Error fetching RCs:', error);
      }
    } else setSelectedTl(null);
  };

const fetchMetrics = async () => {
  try {
    setMetricsLoading(true);
    const params = new URLSearchParams();
    if (crmFilter !== 'All') {
      params.append('user_id', crmFilter);  // ✅ Pass the selected CRM's user_id
    }

     if (tlFilter !== 'All') {
    params.append('tl_id', tlFilter);
    }
      if (rcFilter !== 'All') {
      params.append('rc_id', rcFilter);
     params.append('rc_id', rcFilter);
      params.append('rc_id', rcFilter);
    }
    if (dateFrom) {
      params.append('from', dateFrom);
      params.append('from', dateFrom);
      params.append('from', dateFrom);
    }
    if (dateTo) {
      params.append('to', dateTo);
      params.append('to', dateTo);
      params.append('to', dateTo);
    }
     
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);

    const [crmRes, tlRes, rcRes, cvRes, stiRes] = await Promise.all([
    API.apiGet(`/api/hod/domestic/delivery/crm-metrics?${params.toString()}`),
    API.apiGet(`/api/hod/domestic/delivery/tl-metrics?${params.toString()}`),
    API.apiGet(`/api/hod/domestic/delivery/rc-metrics?${params.toString()}`),
    API.apiGet(`/api/hod/domestic/delivery/rc-metrics/total-cvs?${params.toString()}`),
    API.apiGet(`/api/hod/domestic/delivery/rc-metrics/total-sti?${params.toString()}`)
]);

    const [crmData, tlData, rcData, cvData, stiData] = await Promise.all([
      crmRes.json(),
      tlRes.json(),
      rcRes.json(),
      cvRes.json(),
      stiRes.json()
    ]);

    // Calculate KPIs from CRM data array
    // Your API returns { success: true, data: [...] }
    const candidates = crmData?.success ? crmData.data : [];
      let filteredCandidates = candidates;
    
    if (dateFrom) {
      filteredCandidates = filteredCandidates.filter(c => 
        c.shared_date && c.shared_date >= dateFrom
      );
    }
    
    if (dateTo) {
      filteredCandidates = filteredCandidates.filter(c => 
        c.shared_date && c.shared_date <= dateTo
      );
    }
    // Map statuses from your data - note: using latest_interview_status field
    const kpiCounts = {
      shared: filteredCandidates.length,
      shortlisted: filteredCandidates.filter(c => c.latest_interview_status === 'Shortlisted').length,
      interviewed: filteredCandidates.filter(c => c.latest_interview_status === 'Interviewed').length,
      selected: filteredCandidates.filter(c => c.latest_interview_status === 'Selected').length,
      joining: filteredCandidates.filter(c => c.latest_interview_status === 'Joining').length,
      pipeline: filteredCandidates.filter(c => c.latest_interview_status === 'Pipeline').length,
      ghosted: filteredCandidates.filter(c => c.latest_interview_status === 'Ghosted').length,
      rejected: filteredCandidates.filter(c => c.latest_interview_status === 'Rejected').length,
    };

    console.log('Calculated CRM KPIs:', rcData);

    // Merge all metrics properly
    setMetrics({
      // CRM metrics
      trackerToClient: kpiCounts.shared,
      shortlisted: kpiCounts.shortlisted,
      interviewed: kpiCounts.interviewed,
      selected: kpiCounts.selected,
      joining: kpiCounts.joining,
      pipeline: kpiCounts.pipeline,
      ghosted: kpiCounts.ghosted,
      rejected: kpiCounts.rejected,
      
      // TL metrics - adjust based on your actual TL API response structure
      trackerToCrm: tlData?.success ? (tlData.data?.trackerToCrm || 0) : 0,
      delayedCv: tlData?.success ? (tlData.data?.delayedCv || 0) : 0,
      tlPipelineCv: tlData?.success ? (tlData.data?.tlPipelineCv || 0) : 0,
      tlAccuracy: tlData?.success && tlData.data?.trackerToCrm > 0 
  ? Math.round(((tlData.data?.joining || 0) / (tlData.data?.trackerToCrm || 0) * 100)).toString()
  : "0",
        joining: tlData?.success ? (tlData.data?.joining || 0) : 0,
      rejectedCv: tlData?.success ? (tlData.data?.rejectedCv || 0) : 0,
      // RC metrics - adjust based on your actual RC API response structure
     
      calls: rcData?.success ? (rcData.totalCalls || 0) : 0,
     
      asset: rcData?.success ? (rcData.asset || 0) : 0,
      trackerToTl: rcData?.success ? (rcData.newTrackerSent + rcData.oldTrackerSent || 0) : 0,
      rcConversion: rcData?.success ? (rcData.conversions || "0.0") : "0.0",
      rcAccuracy: rcData?.success && rcData.trackerSent > 0 
  ? Math.round((rcData.jdMatchCount || 0) / (rcData.trackerSent || 0) * 100)
  : 0,
  jdMatchCount
: rcData?.success ? (rcData.jdMatchCount || 0) : 0,
      asset: rcData?.success ? (rcData.totalAssets || 0) : 0,
      cvParsed: cvData?.success ? (cvData.data?.cvParsed || 0) : 0,
      advSti: stiData?.success ? (stiData.data?.advSti || 0) : 0
    });
    
  } catch (error) {
    console.error('Error fetching delivery metrics:', error);
  } finally {
    setMetricsLoading(false);
  }
};

  useEffect(() => {
    if (mounted) {
      fetchMetrics();
    }
  }, [crmFilter, tlFilter, rcFilter, dateFrom, dateTo, mounted]);

  // Static sample data removed - CRM card now uses real API data from crm-metrics

  // Metrics now come from API via fetchMetrics

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-['Calibri',sans-serif] p-2 md:p-2 text-slate-800 antialiased">
      
      {/* --- HEADER --- */}
      <div className="max-w-9xl mx-auto mb-2 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/60 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-white shadow-md">
            <Briefcase size={18} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#0b1b3d] tracking-tight uppercase leading-none">
              Domestic Delivery
            </h1>
          </div>
        </div>
      </div>

      {/* --- DROPDOWN FILTER ENGINE --- */}
      <div className="max-w-9xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xl shadow-slate-200/40 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5 mb-1">crm name</label>
            <div className="relative">
              <select 
                value={crmFilter}
                onChange={handleCrmChange}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none appearance-none focus:border-blue-600 focus:bg-white transition-all shadow-inner cursor-pointer"
              >
                <option value="All">All CRMs</option>
                {crmOptions.map(c => <option key={c.user_id} value={c.user_id}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5 mb-1">tl name</label>
            <div className="relative">
              <select 
                value={tlFilter}
                onChange={handleTlChange}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none appearance-none focus:border-blue-600 focus:bg-white transition-all shadow-inner cursor-pointer"
              >
                <option value="All">All Team Leaders</option>
                {tlOptions.map(t => <option key={t.user_id} value={t.user_id}>{t.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5 mb-1">rc name</label>
            <div className="relative">
              <select 
                value={rcFilter}
                onChange={(e) => setRcFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none appearance-none focus:border-blue-600 focus:bg-white transition-all shadow-inner cursor-pointer"
              >
                <option value="All">All Recruiters</option>
                {rcOptions.map(r => <option key={r.user_id} value={r.user_id}>{r.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5 mb-1">from date</label>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl text-xs font-bold shadow-inner focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5 mb-1">to date</label>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl text-xs font-bold shadow-inner focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* --- SINGLE ROW PERFORMANCE PANEL LAYOUTS --- */}
      <div className="max-w-9xl mx-auto space-y-2">
        
        {/* ========================================================= */}
        {/* ROW 1: CRM CONTAINER                                      */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-3 space-y-2">
          <div className="flex items-center gap-2 border-l-4 border-blue-600 pl-2 py-0.5 shrink-0">
            <h3 className="text-xs font-black text-[#0b1b3d] uppercase tracking-widest">
              Client Relationship Manager
            </h3>
          </div>
          
          <div className="flex flex-row gap-3 overflow-x-auto pb-1 scrollbar-thin">
            <CompactCard name="Tracker shared to client" value={metrics.trackerToClient} icon={<FileText size={14}/>} theme="blue" />
            <CompactCard name="Shortlisted" value={metrics.shortlisted} icon={<CheckCircle2 size={14}/>} theme="indigo" />
            <CompactCard name="interviewed" value={metrics.interviewed} icon={<Users size={14}/>} theme="purple" />
            <CompactCard name="selected" value={metrics.selected} icon={<Award size={14}/>} theme="emerald" />
            <CompactCard name="joining" value={metrics.joining} icon={<UserCheck size={14}/>} theme="green" />
            <CompactCard name="pipeline" value={metrics.pipeline} icon={<Clock size={14}/>} theme="amber" hint="Selected context" />
            <CompactCard name="ghosted" value={metrics.ghosted} icon={<AlertCircle size={14}/>} theme="rose" />
            <CompactCard name="rejected" value={metrics.rejected} icon={<XCircle size={14}/>} theme="red" />
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 2: TL CONTAINER                                       */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-3 space-y-2">
          <div className="flex items-center gap-2 border-l-4 border-purple-600 pl-2 py-0.5 shrink-0">
            <h3 className="text-xs font-black text-[#0b1b3d] uppercase tracking-widest">
              Team Leader
            </h3>
          </div>
          
          <div className="flex flex-row gap-3 overflow-x-auto pb-1 scrollbar-thin">
            <CompactCard name="Tracker sent to CRM" value={metrics.trackerToCrm} icon={<FileText size={14}/>} theme="indigo" />
            <CompactCard name="pipeline CV" value={metrics.tlPipelineCv} icon={<Clock size={14}/>} theme="blue" hint="Pending schedule breakdown" />
            <CompactCard name="rejected CV" value={metrics.rejectedCv} icon={<XCircle size={14}/>} theme="red" />
            <CompactCard name="Joining" value={metrics.joining} icon={<UserCheck size={14}/>} theme="green" />
            <CompactCard name="Accuracy %" value={`${metrics.tlAccuracy}%`} icon={<TrendingUp size={14}/>} theme="emerald"  onClick={() => setAccuracyModalOpen(true)} />
            
            {/* EXPLICIT DESIGN: Delayed Pipeline CV Box Shape */}
            <div className={`p-3.5 bg-white rounded-xl border border-slate-200 border-t-4 flex flex-col justify-between min-w-[160px] max-w-[160px] h-24 shrink-0 transition-all shadow-sm ${
              metrics.delayedCv > 0 ? 'border-rose-200 border-t-rose-500 bg-gradient-to-b from-white to-rose-50/10' : 'border-slate-200'
            }`}>
              <div className="flex justify-between items-start w-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight">Delayed Pipeline CV</p>
                <div className={`p-1 rounded-lg ${metrics.delayedCv > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                  <AlertCircle size={14}/>
                </div>
              </div>
              <div className="mt-auto">
                <h4 className={`text-xl font-black tracking-tight leading-none ${metrics.delayedCv > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{metrics.delayedCv}</h4>
                <p className="text-[7px] font-black text-slate-400 uppercase mt-1 leading-tight tracking-wide line-clamp-2">
                  In panel &gt; 2 days aging
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 3: RC CONTAINER                                       */}
        {/* ========================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-3 space-y-2">
          <div className="flex items-center gap-2 border-l-4 border-teal-600 pl-2 py-0.5 shrink-0">
            <h3 className="text-xs font-black text-[#0b1b3d] uppercase tracking-widest">
              Recruiter
            </h3>
          </div>
          
          <div className="flex flex-row gap-3 overflow-x-auto pb-1 scrollbar-thin">
            <CompactCard name="New CV Parsed" value={metrics.cvParsed} icon={<FileText size={14}/>} theme="teal" />
            <CompactCard name="Candidate  calling" value={metrics.calls} icon={<PhoneCall size={14}/>} theme="blue" />
            <CompactCard name="Adv STI" value={metrics.advSti} icon={<TrendingUp size={14}/>} theme="indigo" />
            <CompactCard name="Conversion" value={`${metrics.rcConversion}`} icon={<Zap size={14}/>} theme="purple" hint="Call shift rate matrix" />
            <CompactCard name="Asset" value={metrics.asset} icon={<Users size={14}/>} theme="amber" />
<CompactCard 
  name="Accuracy %" 
  value={`${metrics.rcAccuracy}%`} 
  icon={<Award size={14}/>} 
  theme="emerald" 
  hint="TL validation score" 
  onClick={() => setRcAccuracyModalOpen(true)}  // ✅ Changed to RC modal
/>     
       <CompactCard name="Tracker sent to TL" value={metrics.trackerToTl} icon={<CheckCircle2 size={14}/>} theme="green" />
          </div>
        </div>

      </div>

      {/* Embedded low footprint scrollbar custom style support */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-thin::-webkit-scrollbar { height: 5px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />

      {/* RC Accuracy Modal */}
{rcAccuracyModalOpen && (
  <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={() => setRcAccuracyModalOpen(false)}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
      
      {/* Header */}
      <div className="bg-teal-600 p-4 flex justify-between items-center text-white shrink-0">
        <h3 className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
          <Target size={20}/> RC Accuracy Details
        </h3>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="text-lg font-black">{metrics.rcAccuracy}%</span>
          </div>
          <button onClick={() => setRcAccuracyModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition bg-white/10">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 pb-0">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">JD Match Count</p>
            <p className="text-3xl font-black text-blue-800">{metrics.jdMatchCount || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Tracker Sent to TL</p>
            <p className="text-3xl font-black text-green-800">{metrics.trackerToTl}</p>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="bg-gray-100 p-3 text-center border-t border-gray-200">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
          JD Match Count / Tracker Sent to TL × 100
        </p>
      </div>

    </div>
  </div>
)}

      {/* Accuracy Modal */}
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
            <span className="text-lg font-black">{metrics.tlAccuracy}%</span>
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
            <p className="text-3xl font-black text-blue-800">{metrics.trackerToCrm}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Candidates Joined</p>
            <p className="text-3xl font-black text-green-800">{metrics.joining}</p>
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

    </div>
  );
}

{/* --- REUSABLE CANVA ULTRA-COMPACT RECTANGLE CARD COMPONENT --- */}
function CompactCard({ name, value, icon, theme, hint,onClick }) {
  const styles = {
    blue: { bg: "border-t-blue-500 bg-gradient-to-b from-white to-blue-50/5", icon: "bg-blue-50 text-blue-600" },
    indigo: { bg: "border-t-indigo-500 bg-gradient-to-b from-white to-indigo-50/5", icon: "bg-indigo-50 text-indigo-600" },
    purple: { bg: "border-t-purple-500 bg-gradient-to-b from-white to-purple-50/5", icon: "bg-purple-50 text-purple-600" },
    emerald: { bg: "border-t-emerald-500 bg-gradient-to-b from-white to-emerald-50/5", icon: "bg-emerald-50 text-emerald-600" },
    green: { bg: "border-t-green-500 bg-gradient-to-b from-white to-green-50/5", icon: "bg-green-50 text-green-600" },
    amber: { bg: "border-t-amber-500 bg-gradient-to-b from-white to-amber-50/5", icon: "bg-amber-50 text-amber-600" },
    rose: { bg: "border-t-rose-500 bg-gradient-to-b from-white to-rose-50/5", icon: "bg-rose-50 text-rose-600" },
    red: { bg: "border-t-red-500 bg-gradient-to-b from-white to-red-50/5", icon: "bg-red-50 text-red-600" },
    teal: { bg: "border-t-teal-500 bg-gradient-to-b from-white to-teal-50/5", icon: "bg-teal-50 text-teal-600" },
  };

  const current = styles[theme] || styles.blue;

  return (
    <div  onClick={onClick} className={`p-3.5 bg-white rounded-xl border border-slate-200 border-t-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-w-[160px] max-w-[160px] h-24 shrink-0 group ${current.bg}`}>
      <div className="flex justify-between items-start gap-1 w-full">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight group-hover:text-slate-600 transition-colors line-clamp-2">
          {name}
        </p>
        <div className={`p-1 rounded-lg shrink-0 scale-90 ${current.icon}`}>
          {icon}
        </div>
      </div>
      <div className="mt-auto">
        <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h4>
        {hint && <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-1 leading-none truncate">{hint}</p>}
      </div>
    </div>
  );
}