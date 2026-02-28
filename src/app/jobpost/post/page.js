"use client";
import { useState } from "react";
import Image from "next/image";
import { 
  Calendar, User, Briefcase, FileText, CheckCircle, 
  X, ExternalLink, Clock, Building2, MapPin, Download,
  Globe, Link as LinkIcon, PlusCircle, Trash2, PlayCircle, PauseCircle,
  Database, BarChart2 // Naye icons CV tracking ke liye
} from "lucide-react";

export default function JobPosterPanel() {
  
  // --- MOCK DATA (Updated with cvLogs) ---
  const [postings, setPostings] = useState([
    { 
      id: 101, 
      sentDate: "20 Feb 2026",
      sector: "Domestic",
      crmName: "Amit Verma",
      clientName: "TechCorp Solutions",
      title: "Business Development Executive [Male]", 
      location: "Ludhiana, Chandigarh, Delhi NCR",
      package: "2LPA - 3.96 LPA",
      experience: "0 months - 2 year",
      empType: "Full-time",
      workingDays: "6 Days",
      timings: "9:30 - 6:30 , 10:00 - 7:00",
      tools: "2 Wheeler Vehicle Mandatory",
      summary: "We are looking for a dynamic and result-oriented Field Sales Executive to join our team...",
      roles: "Generate and close sales leads in the assigned territory.\nBuild and maintain strong relationships.",
      skills: "Strong communication and negotiation skills\nAbility to build and maintain customer relationships",
      qualifications: "Graduate - Fresher\nUndergraduate with minimum 2 years of sales experience",
      offers: "Opportunity to generate new leads & convert into sales .\nTravel Allowance On Per km .",
      contact: "Interested candidates can call on: 8295761297\nEmail Address: Bd1@mavenjobs.in",
      cv_count: 5,
      publishingDetails: [], // Empty = Pending
      cvLogs: [] // CV Data Array
    },
    { 
      id: 102, 
      sentDate: "25 Feb 2026",
      sector: "Corporate",
      crmName: "Priya Singh",
      clientName: "Global Tech Inc.",
      title: "Senior React Developer",
      location: "Remote / Bangalore",
      package: "8.0 - 12.0 LPA",
      experience: "3 - 5 years",
      empType: "Full-time",
      workingDays: "5 Days",
      timings: "10:00 - 7:00",
      tools: "Own Laptop Required",
      summary: "Looking for an experienced React developer with Next.js knowledge.",
      roles: "Develop scalable web applications.\nCollaborate with backend teams.",
      skills: "React, Next.js, Tailwind CSS, REST APIs",
      qualifications: "B.Tech/BE in Computer Science",
      offers: "Health Insurance\nFlexible Timings",
      contact: "Email Address: careers@globaltech.com",
      cv_count: 12,
      publishingDetails: [
        { id: 1, platform: "Naukri.com", link: "https://naukri.com/job/123", stage: "Active" },
        { id: 2, platform: "LinkedIn", link: "https://linkedin.com/job/456", stage: "Paused" }
      ],
      cvLogs: [
        { id: 1, date: "2026-02-26", platform: "Naukri.com", count: 15 },
        { id: 2, date: "2026-02-26", platform: "LinkedIn", count: 4 }
      ]
    }
  ]);

  // --- STATE ---
  const [selectedJD, setSelectedJD] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false); // Modal state for CV tracking

  // New Link Form State
  const initialLinkForm = { platform: "Naukri.com", link: "", stage: "Active" };
  const [newLink, setNewLink] = useState(initialLinkForm);

  // New CV Log Form State
  const getTodayDate = () => new Date().toISOString().split('T')[0];
const initialLogForm = { date: getTodayDate(), platform: "Naukri.com", count: "", callingCount: "" };
  const [newLog, setNewLog] = useState(initialLogForm);

  const platformOptions = ["Naukri.com", "LinkedIn", "Indeed", "Apna", "Internshala", "Direct/Email", "Other"];

  // --- HANDLERS ---
  const handleViewJD = (job) => {
      setSelectedJD(job);
      setIsPreviewOpen(true);
  };

  const handleOpenManage = (job) => {
      setSelectedJD(job);
      setIsManageModalOpen(true);
      setNewLink(initialLinkForm);
  };

  // Open CV Data Log Modal
  const handleOpenDataLog = (job) => { 
      setSelectedJD(job); 
      setIsDataModalOpen(true); 
      setNewLog(initialLogForm); 
  };

  // Add new link to a JD
  const handleAddLink = () => {
      if(!newLink.link) return alert("Please enter the proof link!");
      
      const updatedJob = {
          ...selectedJD,
          publishingDetails: [...selectedJD.publishingDetails, { ...newLink, id: Date.now() }]
      };

      setPostings(postings.map(post => post.id === selectedJD.id ? updatedJob : post));
      setSelectedJD(updatedJob); 
      setNewLink(initialLinkForm); 
  };

  // Toggle Stage (Active <-> Paused)
  const handleToggleStage = (linkId, currentStage) => {
      const newStage = currentStage === "Active" ? "Paused" : "Active";
      
      const updatedJob = {
          ...selectedJD,
          publishingDetails: selectedJD.publishingDetails.map(pub => 
              pub.id === linkId ? { ...pub, stage: newStage } : pub
          )
      };

      setPostings(postings.map(post => post.id === selectedJD.id ? updatedJob : post));
      setSelectedJD(updatedJob);
  };

  // Delete Link
  const handleDeleteLink = (linkId) => {
      if(!confirm("Are you sure you want to delete this link?")) return;

      const updatedJob = {
          ...selectedJD,
          publishingDetails: selectedJD.publishingDetails.filter(pub => pub.id !== linkId)
      };

      setPostings(postings.map(post => post.id === selectedJD.id ? updatedJob : post));
      setSelectedJD(updatedJob);
  };

  // Add CV Data Log
  const handleAddLog = () => {
      if(!newLog.count || newLog.count <= 0) return alert("Please enter a valid CV count!");
      const updatedJob = { ...selectedJD, cvLogs: [{ ...newLog, id: Date.now() }, ...(selectedJD.cvLogs || [])] };
      setPostings(postings.map(post => post.id === selectedJD.id ? updatedJob : post));
      setSelectedJD(updatedJob);
      setNewLog(initialLogForm);
  };

  // Delete CV Data Log
  const handleDeleteLog = (logId) => {
      if(!confirm("Delete this data record?")) return;
      const updatedJob = { ...selectedJD, cvLogs: selectedJD.cvLogs.filter(log => log.id !== logId) };
      setPostings(postings.map(post => post.id === selectedJD.id ? updatedJob : post));
      setSelectedJD(updatedJob);
  };

  const downloadPDF = () => {
      window.print(); 
  };

  // --- HELPERS ---
  const getActiveCount = (details) => details.filter(d => d.stage === 'Active').length;
  const getTotalCVs = (logs) => logs?.reduce((sum, log) => sum + Number(log.count), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] p-2 print:p-0 print:bg-white">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-3 gap-4 print:hidden">
         <div>
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                 <ExternalLink size={24}/> Job Posting Panel
             </h1>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Manage & Track Published Links</p>
         </div>
         
         {/* Simple Stats Card */}
         <div className="flex gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
             <div className="text-center px-4 border-r border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Pending</p>
                 <p className="text-xl font-black text-orange-500">
                    {postings.filter(p => p.publishingDetails.length === 0).length}
                 </p>
             </div>
             <div className="text-center px-4">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Live (Active)</p>
                 <p className="text-xl font-black text-green-600">
                    {postings.filter(p => getActiveCount(p.publishingDetails) > 0).length}
                 </p>
             </div>
         </div>
      </div>

      {/* 2. TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm print:hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#103c7f] text-white text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                        <th className="p-4 border-r border-blue-800">Sent Date</th>
                        <th className="p-4 border-r border-blue-800">Sector / CRM</th>
                        <th className="p-4 border-r border-blue-800">Client</th>
                        <th className="p-4 border-r border-blue-800 w-1/4">Profile</th>
                        <th className="p-4 border-r border-blue-800 text-center">JD</th>
                        <th className="p-4 border-r border-blue-800 text-center">Status</th>
                        <th className="p-4 border-r border-blue-800 text-center">Tracking</th>
                        <th className="p-4 text-center">Data Received</th> 
                    </tr>
                </thead>
                <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                    {postings.map((post) => {
                        const activeCount = getActiveCount(post.publishingDetails);
                        const totalCVs = getTotalCVs(post.cvLogs);
                        
                        return (
                        <tr key={post.id} className="hover:bg-blue-50/30 transition group">
                            
                            <td className="p-2 border-r border-gray-100 whitespace-nowrap">
                                <span className="flex items-center gap-1.5 text-gray-600 font-bold bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                    <Calendar size={12} className="text-[#103c7f]"/> {post.sentDate}
                                </span>
                            </td>

                            <td className="p-2 border-r border-gray-100">
                                <div className="flex flex-col items-start gap-1">
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                                        post.sector === 'Domestic' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                                    }`}>
                                        {post.sector}
                                    </span>
                                    <span className="flex items-center gap-1 font-bold text-gray-800">
                                        <User size={12} className="text-gray-400"/> {post.crmName}
                                    </span>
                                </div>
                            </td>

                            <td className="p-2 border-r border-gray-100 font-bold text-gray-800">
                                <div className="flex items-center gap-1.5"><Building2 size={14} className="text-gray-400"/> {post.clientName}</div>
                            </td>

                            <td className="p-2 border-r border-gray-100">
                                <span className="font-black text-[#103c7f] text-sm">{post.title}</span>
                                
                            </td>

                            <td className="p-2 border-r border-gray-100 text-center align-middle">
                                <button 
                                    onClick={() => handleViewJD(post)} 
                                    className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 font-bold transition shadow-sm"
                                >
                                    <FileText size={14}/> View
                                </button>
                            </td>

                            {/* Dynamic Status Column */}
                            <td className="p-2 border-r border-gray-100 text-center">
                                {post.publishingDetails.length === 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase border bg-orange-50 text-orange-600 border-orange-200">
                                        <Clock size={10}/> Pending
                                    </span>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase border ${
                                            activeCount > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                        }`}>
                                            {activeCount > 0 ? <CheckCircle size={10}/> : <PauseCircle size={10}/>} 
                                            {activeCount > 0 ? 'Live' : 'Paused'}
                                        </span>
                                        <span className="text-[9px] text-gray-500 font-bold">{post.publishingDetails.length} Platforms</span>
                                    </div>
                                )}
                            </td>

                            {/* Manage Links Action */}
                            <td className="p-2 border-r border-gray-100 text-center align-middle">
                                <button 
                                    onClick={() => handleOpenManage(post)} 
                                    className="inline-flex items-center gap-1.5 bg-[#103c7f] hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-bold transition shadow-sm text-xs uppercase tracking-wide"
                                >
                                    <Globe size={14}/> Manage Postings
                                </button>
                            </td>

                            {/* NEW COLUMN: Data Received (CVs) */}
                            <td className="p-2 text-center align-middle">
                                <button 
                                    onClick={() => handleOpenDataLog(post)}
                                    className="inline-flex flex-col items-center justify-center p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition border border-indigo-100 min-w-[80px]"
                                    title="Click to Log CVs"
                                >
                                    <span className="text-lg font-black">{totalCVs}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"><Database size={10}/> CVs</span>
                                </button>
                            </td>

                        </tr>
                    )})}
                </tbody>
             </table>
         </div>
      </div>

      {/* --- 3. CV DATA LOGGING MODAL --- */}
      {isDataModalOpen && selectedJD && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 print:hidden">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 border-4 border-white">
                  
                  <div className="bg-indigo-600 px-6 py-4 flex justify-between items-start text-white shrink-0">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                                <Database size={20}/> Track Data / CVs Received
                            </h2>
                            <p className="text-xs text-indigo-200 font-bold mt-1">
                                {selectedJD.title} <span className="text-indigo-400 mx-1">•</span> Total Logged: {getTotalCVs(selectedJD.cvLogs)} CVs
                            </p>
                        </div>
                        <button onClick={() => setIsDataModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded transition bg-white/10">
                            <X size={20} />
                        </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar flex flex-col gap-6">
                        
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-2 flex items-center gap-1"><PlusCircle size={14}/> Log Sourcing & Calling</h4>
                            <div className="flex flex-col md:flex-row gap-3 items-end">
                                <div className="w-full md:w-[20%]">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Received Date</label>
                                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-indigo-600" value={newLog.date} onChange={(e) => setNewLog({...newLog, date: e.target.value})}/>
                                </div>
                                <div className="w-full md:w-[30%]">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Source / Platform</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-indigo-600" value={newLog.platform} onChange={(e) => setNewLog({...newLog, platform: e.target.value})}>
                                        {platformOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-[20%]">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">CVs Received</label>
                                    <input type="number" min="0" placeholder="e.g. 5" className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-indigo-600" value={newLog.count} onChange={(e) => setNewLog({...newLog, count: e.target.value})}/>
                                </div>
                                {/* NEW INPUT FOR CALLING */}
                                <div className="w-full md:w-[20%]">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Calling Done</label>
                                    <input type="number" min="0" placeholder="e.g. 10" className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-indigo-600" value={newLog.callingCount} onChange={(e) => setNewLog({...newLog, callingCount: e.target.value})}/>
                                </div>
                                <button onClick={handleAddLog} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2 rounded-lg transition shadow-md w-full md:w-auto shrink-0 whitespace-nowrap">
                                    Add Data
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest m-5 mb-0 pb-2 border-b flex items-center gap-2"><BarChart2 size={16}/> Data History</h4>
                            <div className="p-5 overflow-y-auto">
                                {!selectedJD.cvLogs || selectedJD.cvLogs.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                        <Database size={32} className="mx-auto mb-2 opacity-50"/>
                                        <p className="font-bold text-sm">No data logged yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-[10px] uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3">Date</th>
                                                <th className="p-3">Platform / Source</th>
                                                <th className="p-3 text-center">CVs Received</th>
                                                <th className="p-3 text-center">Calling Done</th> 
                                                <th className="p-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-medium">
                                            {selectedJD.cvLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="p-3 text-gray-600 font-mono text-xs">{log.date}</td>
                                                    <td className="p-3 font-bold text-gray-800">{log.platform}</td>
                                                    <td className="p-3 text-center font-black text-indigo-600 bg-indigo-50/50">{log.count || 0}</td>
                                                    <td className="p-3 text-center font-black text-green-700 bg-green-50/50">{log.callingCount || 0}</td> {/* NEW DATA */}
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => handleDeleteLog(log.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- 4. MANAGE POSTINGS MODAL --- */}
      {isManageModalOpen && selectedJD && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 print:hidden">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 border-4 border-white">
                  
                  <div className="bg-[#103c7f] px-6 py-4 flex justify-between items-start text-white shrink-0">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                                <Globe size={20}/> Publish Tracking
                            </h2>
                            <p className="text-xs text-blue-200 font-bold mt-1">
                                {selectedJD.title} <span className="text-blue-400 mx-1">•</span> {selectedJD.clientName}
                            </p>
                        </div>
                        <button onClick={() => setIsManageModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded transition bg-white/10">
                            <X size={20} />
                        </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar flex flex-col gap-6">
                        
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-2 flex items-center gap-1"><PlusCircle size={14}/> Add New Platform Link</h4>
                            <div className="flex flex-col md:flex-row gap-3 items-end">
                                <div className="w-full md:w-1/4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Platform</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#103c7f]" value={newLink.platform} onChange={(e) => setNewLink({...newLink, platform: e.target.value})}>
                                        {platformOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-2/4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Live URL (Proof Link)</label>
                                    <div className="relative">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                        <input type="url" placeholder="https://..." className="w-full border border-gray-300 rounded-lg p-2 pl-8 text-sm font-medium outline-none focus:border-[#103c7f]" value={newLink.link} onChange={(e) => setNewLink({...newLink, link: e.target.value})}/>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Current Stage</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#103c7f] bg-green-50 text-green-700" value={newLink.stage} onChange={(e) => setNewLink({...newLink, stage: e.target.value})}>
                                        <option value="Active">Active</option>
                                        <option value="Paused">Paused</option>
                                    </select>
                                </div>
                                <button onClick={handleAddLink} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2 rounded-lg transition shadow-md w-full md:w-auto shrink-0">
                                    Save Link
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest m-5 mb-0 pb-2 border-b">Currently Posted On ({selectedJD.publishingDetails.length})</h4>
                            <div className="p-5 overflow-y-auto">
                                {selectedJD.publishingDetails.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                        <Globe size={32} className="mx-auto mb-2 opacity-50"/>
                                        <p className="font-bold text-sm">No links added yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-[10px] uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3">Platform</th>
                                                <th className="p-3">Proof Link</th>
                                                <th className="p-3 text-center">Stage Toggle</th>
                                                <th className="p-3 text-center">Delete</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedJD.publishingDetails.map(pub => (
                                                <tr key={pub.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-bold text-gray-800">{pub.platform}</td>
                                                    <td className="p-3">
                                                        <a href={pub.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 w-fit">
                                                            <LinkIcon size={12}/> View Link
                                                        </a>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => handleToggleStage(pub.id, pub.stage)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition border ${pub.stage === 'Active' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700'}`}>
                                                            {pub.stage === 'Active' ? <PlayCircle size={14}/> : <PauseCircle size={14}/>} {pub.stage}
                                                        </button>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => handleDeleteLink(pub.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                  </div>
              </div>
          </div>
      )}

      {/* --- 5. PDF PREVIEW MODAL (Unchanged) --- */}
      {isPreviewOpen && selectedJD && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[9999] p-0 md:p-4 print:static print:block print:bg-white print:p-0 print:z-auto" style={{ zIndex: 99999 }}>
            <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl print:block print:h-auto print:max-w-full print:shadow-none print:rounded-none">
                
                <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900 print:hidden">
                    <div className="flex items-center gap-3">
                        <FileText size={20} />
                        <div>
                            <h3 className="font-bold text-lg uppercase tracking-wide">Document Preview</h3>
                            <p className="text-[10px] text-blue-200 font-bold tracking-widest uppercase">For Client: {selectedJD.clientName}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={downloadPDF} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wider">
                            <Download size={16}/> Save as PDF
                        </button>
                        <button onClick={() => setIsPreviewOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20}/></button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 block print:bg-white print:p-0">
                    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative print:shadow-none print:m-0" id="pdf-content">
                        
                        <div className="mb-10"><Image src="/maven-logo.png" alt="Maven Jobs" width={220} height={70} className="object-contain" priority /></div>

                        <div className="border border-black p-8 min-h-[850px] relative print:border-none print:p-0">
                            
                            <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                                {selectedJD.title && <p><span className="font-bold">JOB TITLE : </span> {selectedJD.title}</p>}
                                {selectedJD.location && <p><span className="font-bold">LOCATION : </span> {selectedJD.location}</p>}
                                {selectedJD.experience && <p><span className="font-bold">EXPERIENCE : </span> {selectedJD.experience}</p>}
                                {selectedJD.empType && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {selectedJD.empType}</p>}
                                {selectedJD.workingDays && <p><span className="font-bold">WORKING DAYS : </span> {selectedJD.workingDays}</p>}
                                {selectedJD.timings && <p><span className="font-bold">TIMINGS : </span> {selectedJD.timings}</p>}
                                {selectedJD.package && <p><span className="font-bold">PACKAGE : </span> {selectedJD.package}</p>}
                                {selectedJD.tools && <p><span className="font-bold">TOOL REQUIREMENT : </span> {selectedJD.tools}</p>}
                            </div>

                            <div className="space-y-8 text-[15px]">
                                {selectedJD.summary && <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{selectedJD.summary}</p></div>}
                                {selectedJD.roles && <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.roles?.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}</ul></div>}
                                {selectedJD.skills && <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.skills?.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}</ul></div>}
                                {selectedJD.qualifications && <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.qualifications?.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}</ul></div>}
                                {selectedJD.offers && <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.offers?.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}</ul></div>}
                                {selectedJD.contact && <div className="mt-12 pt-6 border-t border-black/20"><h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4><div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{selectedJD.contact}</div></div>}
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
      )}

      {/* --- PRINT MARGIN FIX --- */}
      <style jsx global>{`
        @media print {
            @page { margin: 10mm; }
            body { background-color: white !important; }
        }
      `}</style>

    </div>
  );
}