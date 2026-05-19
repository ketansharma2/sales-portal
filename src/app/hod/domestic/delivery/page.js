"use client";
import React, { useState, useMemo } from "react";
import { 
  Users, UserCheck, Calendar, Search, Clock, 
  CheckCircle2, XCircle, AlertCircle, PhoneCall, FileText, 
  TrendingUp, Award, Zap, Briefcase, SlidersHorizontal, ChevronDown
} from "lucide-react";

export default function DomesticDeliveryPage() {
  // --- 1. FILTER STATES ---
  const [crmFilter, setCrmFilter] = useState("All");
  const [tlFilter, setTlFilter] = useState("All");
  const [rcFilter, setRcFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // --- 2. SAMPLE DATA ENGINE ---
  const deliveryData = useMemo(() => {
    return [
      { id: 1, crm: "Saloni", tl: "Rahul", rc: "Nikita", date: "2026-05-10", cv_parsed: 140, calls: 450, adv_sti: 95, asset: 42, tracker_to_tl: 85, tracker_to_crm: 65, tracker_to_client: 55, shortlisted: 40, interviewed: 28, selected: 12, joining: 4, ghosted: 3, rejected: 9, delayed_cv: 5 },
      { id: 2, crm: "Nikita", tl: "Amit", rc: "Pooja", date: "2026-05-14", cv_parsed: 110, calls: 380, adv_sti: 80, asset: 35, tracker_to_tl: 72, tracker_to_crm: 54, tracker_to_client: 46, shortlisted: 32, interviewed: 20, selected: 8, joining: 2, ghosted: 1, rejected: 5, delayed_cv: 2 },
      { id: 3, crm: "Saloni", tl: "Amit", rc: "Nikita", date: "2026-05-18", cv_parsed: 165, calls: 510, adv_sti: 110, asset: 50, tracker_to_tl: 98, tracker_to_crm: 80, tracker_to_client: 70, shortlisted: 55, interviewed: 34, selected: 15, joining: 6, ghosted: 2, rejected: 11, delayed_cv: 3 }
    ];
  }, []);

  // Extract unique names dynamically for the dropdown options
  const uniqueNames = useMemo(() => {
    return {
      crms: Array.from(new Set(deliveryData.map(item => item.crm))),
      tls: Array.from(new Set(deliveryData.map(item => item.tl))),
      rcs: Array.from(new Set(deliveryData.map(item => item.rc)))
    };
  }, [deliveryData]);

  // --- 3. DYNAMIC FILTER FILTERING ---
  const filteredData = useMemo(() => {
    return deliveryData.filter(item => {
      const matchesCrm = crmFilter === "All" || item.crm === crmFilter;
      const matchesTl = tlFilter === "All" || item.tl === tlFilter;
      const matchesRc = rcFilter === "All" || item.rc === rcFilter;
      
      let matchesDate = true;
      if (dateFrom && dateTo) {
        const itemDate = new Date(item.date);
        matchesDate = itemDate >= new Date(dateFrom) && itemDate <= new Date(dateTo);
      }
      return matchesCrm && matchesTl && matchesRc && matchesDate;
    });
  }, [deliveryData, crmFilter, tlFilter, rcFilter, dateFrom, dateTo]);

  // --- 4. BUSINESS PERFORMANCE MATHEMATICS ---
  const metrics = useMemo(() => {
    let aggs = {
      trackerToClient: 0, shortlisted: 0, interviewed: 0, selected: 0, joining: 0, ghosted: 0, rejected: 0,
      trackerToCrm: 0, delayedCv: 0,
      cvParsed: 0, calls: 0, advSti: 0, asset: 0, trackerToTl: 0
    };

    filteredData.forEach(item => {
      aggs.trackerToClient += item.tracker_to_client;
      aggs.shortlisted += item.shortlisted;
      aggs.interviewed += item.interviewed;
      aggs.selected += item.selected;
      aggs.joining += item.joining;
      aggs.ghosted += item.ghosted;
      aggs.rejected += item.rejected;
      aggs.trackerToCrm += item.tracker_to_crm;
      aggs.delayedCv += item.delayed_cv;
      aggs.cvParsed += item.cv_parsed;
      aggs.calls += item.calls;
      aggs.advSti += item.adv_sti;
      aggs.asset += item.asset;
      aggs.trackerToTl += item.tracker_to_tl;
    });

    const pipeline = aggs.selected - aggs.joining;
    const tlPipelineCv = aggs.trackerToCrm - aggs.interviewed;

    const tlAccuracy = aggs.trackerToCrm > 0 ? ((aggs.interviewed / aggs.trackerToCrm) * 100).toFixed(1) : "0.0";
    const rcConversion = aggs.calls > 0 ? ((aggs.trackerToTl / aggs.calls) * 100).toFixed(1) : "0.0";
    const rcAccuracy = aggs.trackerToTl > 0 ? ((aggs.trackerToCrm / aggs.trackerToTl) * 100).toFixed(1) : "0.0";

    return { ...aggs, pipeline, tlPipelineCv, tlAccuracy, rcConversion, rcAccuracy };
  }, [filteredData]);

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
                onChange={(e) => setCrmFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none appearance-none focus:border-blue-600 focus:bg-white transition-all shadow-inner cursor-pointer"
              >
                <option value="All">All CRMs</option>
                {uniqueNames.crms.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5 mb-1">tl name</label>
            <div className="relative">
              <select 
                value={tlFilter}
                onChange={(e) => setTlFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none appearance-none focus:border-blue-600 focus:bg-white transition-all shadow-inner cursor-pointer"
              >
                <option value="All">All Team Leaders</option>
                {uniqueNames.tls.map(name => <option key={name} value={name}>{name}</option>)}
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
                {uniqueNames.rcs.map(name => <option key={name} value={name}>{name}</option>)}
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
            <CompactCard name="pipeline" value={metrics.pipeline} icon={<Clock size={14}/>} theme="amber" />
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
            <CompactCard name="pipeline CV" value={metrics.tlPipelineCv} icon={<Clock size={14}/>} theme="blue" />
            <CompactCard name="rejected CV" value={metrics.rejected} icon={<XCircle size={14}/>} theme="red" />
            <CompactCard name="Joining" value={metrics.joining} icon={<UserCheck size={14}/>} theme="green" />
            <CompactCard name="Accuracy %" value={`${metrics.tlAccuracy}%`} icon={<TrendingUp size={14}/>} theme="emerald" />
            
           {/* EXPLICIT DESIGN: Delayed Pipeline CV Box Shape */}
<div className={`p-3.5 bg-white rounded-xl border border-t-4 flex flex-col justify-between min-w-[160px] max-w-[160px] h-24 shrink-0 transition-all shadow-sm ${
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
            <CompactCard name="Conversion" value={`${metrics.rcConversion}%`} icon={<Zap size={14}/>} theme="purple" />
            <CompactCard name="Asset" value={metrics.asset} icon={<Users size={14}/>} theme="amber" />
            <CompactCard name="Accuracy %" value={`${metrics.rcAccuracy}%`} icon={<Award size={14}/>} theme="emerald" />
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

    </div>
  );
}

{/* --- REUSABLE CANVA ULTRA-COMPACT ROW COMPONENT --- */}
function CompactCard({ name, value, icon, theme, hint }) {
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
    <div className={`p-3.5 bg-white rounded-xl border border-slate-200 border-t-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-w-[160px] max-w-[160px] h-24 shrink-0 group ${current.bg}`}>
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