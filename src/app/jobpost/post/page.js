"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Calendar, User, Briefcase, FileText, CheckCircle,
  X, ExternalLink, Clock, Building2, MapPin, Download,
  Globe, Link as LinkIcon, PlusCircle, Trash2, PlayCircle, PauseCircle,
  Database, BarChart2, Edit2, Loader2 // Naye icons CV tracking ke liye + Loader2
} from "lucide-react";

export default function JobPosterPanel() {
  
  // --- STATE ---
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch JDs from API
  useEffect(() => {
    fetchJDs();
  }, []);

  const fetchJDs = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/jobpost/jds', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setPostings(data || []);
    } catch (error) {
      console.error('Error fetching JDs:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- STATE ---
  const [selectedJD, setSelectedJD] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false); // Modal state for CV tracking
  const [editingLog, setEditingLog] = useState(null); // For editing CV log

   // New Link Form State
   const getTodayDate = () => new Date().toISOString().split('T')[0];
   const initialLinkForm = { platform: "Indeed", live_url: "", stage: "Active", postedOn: getTodayDate() };
   const [newLink, setNewLink] = useState(initialLinkForm);
   const [isSavingLink, setIsSavingLink] = useState(false);

  // New CV Log Form State
  const initialLogForm = { date: getTodayDate(), platform: "Indeed", count: "", callingCount: "" };
  const [newLog, setNewLog] = useState(initialLogForm);

  const platformOptions = [
    { label: "Indeed", value: "Indeed" },
    { label: "Naukri", value: "Naukri.com" }
  ];

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
  const handleAddLink = async () => {
      if(!newLink.live_url) return alert("Please enter the proof link!");
      setIsSavingLink(true);

      const session = JSON.parse(localStorage.getItem('session') || '{}');

      // Get user_id from session or decode from token
      let userId = session.user_id || session.id;

      // If not in session, try to get from API
      if (!userId && session.access_token) {
          try {
              const userRes = await fetch('/api/auth/get-current-user', {
                  headers: { 'Authorization': `Bearer ${session.access_token}` }
              });
              const userData = await userRes.json();
              userId = userData.user_id || userData.id;
          } catch (e) {
              console.error('Error getting user:', e);
          }
      }

      if (!userId) {
          alert('User not found. Please login again.');
          setIsSavingLink(false);
          return;
      }

      // Determine API base based on sector
      const apiBase = selectedJD.sector === 'Corporate' ? '/api/corporate/crm/jd' : '/api/domestic/crm/jd';

      try {
          const response = await fetch(`${apiBase}/job-postings`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                  jd_id: selectedJD.jd_id,
                  user_id: userId,
                  platform: newLink.platform,
                  live_url: newLink.live_url,
                  current_stage: newLink.stage,
                  posted_on: newLink.postedOn
              })
          });

          const result = await response.json();

          if (result.error) {
              alert('Error saving posting: ' + result.error);
              setIsSavingLink(false);
              return;
          }

          // Refresh the job postings list
          fetchJDs();

          // Reset form and show success
          setNewLink(initialLinkForm);
          alert('Posting saved successfully!');

          // Close the modal and reopen to refresh
          setIsManageModalOpen(false);
          setTimeout(async () => {
              const session = JSON.parse(localStorage.getItem('session') || '{}');
              const response = await fetch('/api/jobpost/jds', {
                  headers: { 'Authorization': `Bearer ${session.access_token}` }
              });
              const freshData = await response.json();
              const updatedPost = freshData.find(p => p.jd_id === selectedJD.jd_id);
              if (updatedPost) {
                  setSelectedJD(updatedPost);
                  setPostings(freshData);
              }
              setIsManageModalOpen(true);
          }, 100);
      } catch (error) {
          console.error('Error saving posting:', error);
          alert('Error saving posting');
      } finally {
          setIsSavingLink(false);
      }
  };

  // Toggle Stage (Active <-> Paused)
  const handleToggleStage = async (linkId, currentStage) => {
      const newStage = currentStage === "Active" ? "Paused" : "Active";
      
      // Determine API base based on sector
      const apiBase = selectedJD.sector === 'Corporate' ? '/api/corporate/crm/jd' : '/api/domestic/crm/jd';
      
      // Update in database
      try {
          const session = JSON.parse(localStorage.getItem('session') || '{}');
          const response = await fetch(`${apiBase}/job-postings`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                  id: linkId,
                  current_stage: newStage
              })
          });
          
          const result = await response.json();
          
          if (result.error) {
              alert('Error updating stage: ' + result.error);
              return;
          }
          
          // Update local state
          const updatedJob = {
              ...selectedJD,
              publishingDetails: selectedJD.publishingDetails.map(pub => 
                  pub.id === linkId ? { ...pub, stage: newStage } : pub
              )
          };

          setPostings(postings.map(post => post.jd_id === selectedJD.jd_id ? updatedJob : post));
          setSelectedJD(updatedJob);
      } catch (error) {
          console.error('Error toggling stage:', error);
          alert('Error updating stage');
      }
  };

  // Delete Link
  const handleDeleteLink = async (linkId) => {
      if(!confirm("Are you sure you want to delete this link?")) return;

      // Determine API base based on sector
      const apiBase = selectedJD.sector === 'Corporate' ? '/api/corporate/crm/jd' : '/api/domestic/crm/jd';
      
      // Delete from database
      try {
          const session = JSON.parse(localStorage.getItem('session') || '{}');
          const response = await fetch(`${apiBase}/job-postings?id=${linkId}`, {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${session.access_token}`
              }
          });
          
          const result = await response.json();
          
          if (result.error) {
              alert('Error deleting link: ' + result.error);
              return;
          }
          
          // Update local state
          const updatedJob = {
              ...selectedJD,
              publishingDetails: selectedJD.publishingDetails.filter(pub => pub.id !== linkId)
          };

          setPostings(postings.map(post => post.jd_id === selectedJD.jd_id ? updatedJob : post));
          setSelectedJD(updatedJob);
      } catch (error) {
          console.error('Error deleting link:', error);
          alert('Error deleting link');
      }
  };

  // Add CV Data Log
  const handleAddLog = async () => {
      if(!newLog.count || newLog.count <= 0) return alert("Please enter a valid CV count!");
      
      // Determine API base based on sector
      const apiBase = selectedJD.sector === 'Corporate' ? '/api/corporate/crm/jd' : '/api/domestic/crm/jd';
      
      // Save to database
      try {
          const session = JSON.parse(localStorage.getItem('session') || '{}');
          const response = await fetch(`${apiBase}/posting-data`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                  jd_id: selectedJD.jd_id,
                  date: newLog.date,
                  platform: newLog.platform,
                  cv_received: parseInt(newLog.count),
                  calls_done: parseInt(newLog.callingCount) || 0
              })
          });
          
          const result = await response.json();
          
          if (result.error) {
              alert('Error saving data: ' + result.error);
              return;
          }
          
          // Refresh the job postings list to get updated cvLogs
          fetchJDs();
          
          setNewLog(initialLogForm); 
          alert('Data saved successfully!');
          
          // Close and reopen modal to refresh
          setIsDataModalOpen(false);
          setTimeout(async () => {
              const session = JSON.parse(localStorage.getItem('session') || '{}');
              const response = await fetch('/api/jobpost/jds', {
                  headers: { 'Authorization': `Bearer ${session.access_token}` }
              });
              const freshData = await response.json();
              const updatedPost = freshData.find(p => p.jd_id === selectedJD.jd_id);
              if (updatedPost) {
                  setSelectedJD(updatedPost);
                  setPostings(freshData);
              }
              setIsDataModalOpen(true);
          }, 100);
      } catch (error) {
          console.error('Error saving CV data:', error);
          alert('Error saving data');
      }
  };

  // Edit CV Data Log
  const handleEditLog = (log) => {
      setEditingLog(log);
      setNewLog({
          date: log.date,
          platform: log.platform,
          count: log.count.toString(),
          callingCount: log.callingCount ? log.callingCount.toString() : ""
      });
  };

  // Update CV Data Log
  const handleUpdateLog = async () => {
      if(!newLog.count || newLog.count <= 0) return alert("Please enter a valid CV count!");
      
      // Determine API base based on sector
      const apiBase = selectedJD.sector === 'Corporate' ? '/api/corporate/crm/jd' : '/api/domestic/crm/jd';
      
      try {
          const session = JSON.parse(localStorage.getItem('session') || '{}');
          const response = await fetch(`${apiBase}/posting-data`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                  id: editingLog.id,
                  date: newLog.date,
                  platform: newLog.platform,
                  cv_received: parseInt(newLog.count),
                  calls_done: parseInt(newLog.callingCount) || 0
              })
          });
          
          const result = await response.json();
          
          if (result.error) {
              alert('Error updating data: ' + result.error);
              return;
          }
          
          // Refresh
          fetchJDs();
          
          setNewLog(initialLogForm);
          setEditingLog(null);
          alert('Data updated successfully!');
          
          setIsDataModalOpen(false);
          setTimeout(async () => {
              const session = JSON.parse(localStorage.getItem('session') || '{}');
              const response = await fetch('/api/jobpost/jds', {
                  headers: { 'Authorization': `Bearer ${session.access_token}` }
              });
              const freshData = await response.json();
              const updatedPost = freshData.find(p => p.jd_id === selectedJD.jd_id);
              if (updatedPost) {
                  setSelectedJD(updatedPost);
                  setPostings(freshData);
              }
              setIsDataModalOpen(true);
          }, 100);
      } catch (error) {
          console.error('Error updating CV data:', error);
          alert('Error updating data');
      }
  };

  // Cancel Edit
  const handleCancelEdit = () => {
      setEditingLog(null);
      setNewLog(initialLogForm);
  };

  // Delete CV Data Log
  const handleDeleteLog = async (logId) => {
      if(!confirm("Delete this data record?")) return;

      // Determine API base based on sector
      const apiBase = selectedJD.sector === 'Corporate' ? '/api/corporate/crm/jd' : '/api/domestic/crm/jd';
      
      // Delete from database
      try {
          const session = JSON.parse(localStorage.getItem('session') || '{}');
          const response = await fetch(`${apiBase}/posting-data?id=${logId}`, {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${session.access_token}`
              }
          });
          
          const result = await response.json();
          
          if (result.error) {
              alert('Error deleting record: ' + result.error);
              return;
          }
          
          // Update local state
          const updatedJob = { ...selectedJD, cvLogs: selectedJD.cvLogs.filter(log => log.id !== logId) };
          setPostings(postings.map(post => post.jd_id === selectedJD.jd_id ? updatedJob : post));
          setSelectedJD(updatedJob);
      } catch (error) {
          console.error('Error deleting CV data:', error);
          alert('Error deleting record');
      }
  };

  const downloadPDF = () => {
      window.print(); 
  };

  // Handle Status Change from dropdown
  const handleStatusChange = async (jdId, newStatus) => {
      // Find the posting to get its sector
      const post = postings.find(p => p.jd_id === jdId);
      if (!post) return;
      
      // Determine API base based on sector
      const apiBase = post.sector === 'Corporate' ? '/api/corporate/crm/jd' : '/api/domestic/crm/jd';
      
      try {
          const session = JSON.parse(localStorage.getItem('session') || '{}');
          const response = await fetch(`${apiBase}?jd_id=${jdId}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ status: newStatus })
          });
          
          const result = await response.json();
          
          if (result.error) {
              alert('Error updating status: ' + result.error);
              return;
          }
          
          // Update local state
          setPostings(postings.map(post => 
              post.jd_id === jdId ? { ...post, jdStatus: newStatus } : post
          ));
          
          alert('Status updated to ' + newStatus);
      } catch (error) {
          console.error('Error updating status:', error);
          alert('Error updating status');
      }
  };

  // --- HELPERS ---
  const getActiveCount = (details) => {
    if (!details || !Array.isArray(details)) return 0;
    return details.filter(d => d.stage === 'Active').length;
  };
  const getTotalCVs = (logs) => {
    if (!logs || !Array.isArray(logs)) return 0;
    return logs.reduce((sum, log) => sum + Number(log.count || 0), 0);
  };

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
                    {postings.filter(p => (p.jdStatus || 'Sent') === 'Sent').length}
                 </p>
             </div>
             <div className="text-center px-4 border-r border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Live</p>
                 <p className="text-xl font-black text-green-600">
                    {postings.filter(p => (p.jdStatus || 'Sent') === 'Live').length}
                 </p>
             </div>
             <div className="text-center px-4 border-r border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Paused</p>
                 <p className="text-xl font-black text-gray-500">
                    {postings.filter(p => (p.jdStatus || 'Sent') === 'Paused').length}
                 </p>
             </div>
             <div className="text-center px-4">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Deleted</p>
                 <p className="text-xl font-black text-red-500">
                    {postings.filter(p => (p.jdStatus || 'Sent') === 'Deleted').length}
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
                        <th className="p-4 border-r border-blue-800">Received Date</th>
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
                        const activeCount = getActiveCount(post.publishingDetails || []);
                        const totalCVs = getTotalCVs(post.cvLogs);
                        
                        return (
                        <tr key={post.jd_id} className="hover:bg-blue-50/30 transition group">
                            
                            <td className="p-2 border-r border-gray-100 whitespace-nowrap">
                                <span className="flex items-center gap-1.5 text-gray-600 font-bold bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                    <Calendar size={12} className="text-[#103c7f]"/> {post.sent_date}
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
                                        <User size={12} className="text-gray-400"/> {post.created_by_name || 'CRM'}
                                    </span>
                                </div>
                            </td>

                            <td className="p-2 border-r border-gray-100 font-bold text-gray-800">
                                <div className="flex items-center gap-1.5"><Building2 size={14} className="text-gray-400"/> {post.client_name}</div>
                            </td>

                            <td className="p-2 border-r border-gray-100">
                                <span className="font-black text-[#103c7f] text-sm">{post.job_title}</span>
                                
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
                                {/* Always show dropdown but default to current status */}
                                <select 
                                    value={post.jdStatus || 'Sent'}
                                    onChange={(e) => handleStatusChange(post.jd_id, e.target.value)}
                                    className={`text-[9px] font-black uppercase border rounded px-2 py-1 cursor-pointer ${
                                        (post.jdStatus || 'Sent') === 'Sent' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                        (post.jdStatus || 'Sent') === 'Live' ? 'bg-green-50 text-green-700 border-green-200' :
                                        (post.jdStatus || 'Sent') === 'Paused' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                        'bg-red-50 text-red-600 border-red-200'
                                    }`}
                                >
                                    <option value="Sent">Pending</option>
                                    <option value="Live">Live</option>
                                    <option value="Paused">Paused</option>
                                    <option value="Deleted">Deleted</option>
                                </select>
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
                                {selectedJD.job_title} <span className="text-indigo-400 mx-1">•</span> Total Logged: {getTotalCVs(selectedJD.cvLogs)} CVs
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
                                        {platformOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
                                <button onClick={editingLog ? handleUpdateLog : handleAddLog} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2 rounded-lg transition shadow-md w-full md:w-auto shrink-0 whitespace-nowrap">
                                    {editingLog ? 'Update Data' : 'Add Data'}
                                </button>
                                {editingLog && (
                                    <button onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white font-bold text-sm px-5 py-2 rounded-lg transition shadow-md w-full md:w-auto shrink-0 whitespace-nowrap">
                                        Cancel
                                    </button>
                                )}
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
                                                <tr key={log.id} className="hover:bg-gray-50"><td className="p-3 text-gray-600 font-mono text-xs">{log.date}</td><td className="p-3 font-bold text-gray-800">{log.platform}</td><td className="p-3 text-center font-black text-indigo-600 bg-indigo-50/50">{log.count || 0}</td><td className="p-3 text-center font-black text-green-700 bg-green-50/50">{log.callingCount || 0}</td><td className="p-3 text-center"><button onClick={() => handleEditLog(log)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition mr-1"><Edit2 size={16}/></button></td></tr>
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
                                {selectedJD.job_title} <span className="text-blue-400 mx-1">•</span> {selectedJD.client_name}
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
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Posted On</label>
                                    <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#103c7f]" value={newLink.postedOn} onChange={(e) => setNewLink({...newLink, postedOn: e.target.value})}/>
                                </div>
                                <div className="w-full md:w-1/4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Platform</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#103c7f]" value={newLink.platform} onChange={(e) => setNewLink({...newLink, platform: e.target.value})}>
                                        {platformOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-2/4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Live URL (Proof Link)</label>
                                    <div className="relative">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                        <input type="url" placeholder="https://..." className="w-full border border-gray-300 rounded-lg p-2 pl-8 text-sm font-medium outline-none focus:border-[#103c7f]" value={newLink.live_url} onChange={(e) => setNewLink({...newLink, live_url: e.target.value})}/>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Current Stage</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#103c7f] bg-green-50 text-green-700" value={newLink.stage} onChange={(e) => setNewLink({...newLink, stage: e.target.value})}>
                                        <option value="Active">Active</option>
                                        <option value="Paused">Paused</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddLink}
                                    disabled={isSavingLink}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2 rounded-lg transition shadow-md w-full md:w-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSavingLink ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Link'
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest m-5 mb-0 pb-2 border-b">Currently Posted On ({(selectedJD.publishingDetails || []).length})</h4>
                            <div className="p-5 overflow-y-auto">
                                {(selectedJD.publishingDetails || []).length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                        <Globe size={32} className="mx-auto mb-2 opacity-50"/>
                                        <p className="font-bold text-sm">No links added yet.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-[10px] uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3">Platform</th>
                                                <th className="p-3">Posted On</th>
                                                <th className="p-3">Proof Link</th>
                                                <th className="p-3 text-center">Stage Toggle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedJD.publishingDetails.map(pub => (
                                                <tr key={pub.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-bold text-gray-800">{pub.platform}</td>
                                                    <td className="p-3 text-gray-600 text-xs">{pub.postedOn || '-'}</td>
                                                    <td className="p-3">{pub.live_url ? (
                                                        <a href={pub.live_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 w-fit">
                                                            <LinkIcon size={12}/> View Link
                                                        </a>
                                                    ) : '-'}</td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => handleToggleStage(pub.id, pub.stage)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition border ${pub.stage === 'Active' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700'}`}>
                                                            {pub.stage === 'Active' ? <PlayCircle size={14}/> : <PauseCircle size={14}/>} {pub.stage}
                                                        </button>
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
                            <p className="text-[10px] text-blue-200 font-bold tracking-widest uppercase">For Client: {selectedJD.client_name}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={downloadPDF} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wider hidden">
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