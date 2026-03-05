"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { 
  FileText, Plus, Send, Download, Edit, 
  X, CheckCircle, Briefcase, Users, Phone, Mail,
  MapPin, IndianRupee, Calendar , Clock, Globe
} from "lucide-react";

export default function JobRequirementsPage() {
  
  // --- STATE ---
  const [jds, setJds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch JDs from Supabase
  useEffect(() => {
    fetchJDs();
  }, []);

  const fetchJDs = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/domestic/crm/jd', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setJds(data || []);
    } catch (error) {
      console.error('Error fetching JDs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [selectedJD, setSelectedJD] = useState(null);
  
  // Send to Poster Modal States
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [jobPostUsers, setJobPostUsers] = useState([]);
  const [selectedPosterUser, setSelectedPosterUser] = useState('');

  // CV Modal Data States
  const [cvModalData, setCvModalData] = useState({ postings: [], cvLogs: [] });
  const [cvModalLoading, setCvModalLoading] = useState(false);

  // Form State - matching database columns
  const initialForm = {
      client_name: "", job_title: "", location: "", experience: "", employment_type: "", working_days: "",
      timings: "", package: "", tool_requirement: "", job_summary: "", rnr: "",
      req_skills: "", preferred_qual: "", company_offers: "", contact_details: ""
  };
  const [formData, setFormData] = useState(initialForm);

  // --- REUSABLE TAILWIND CLASSES ---
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1";
  const inputClass = "w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#103c7f] outline-none font-medium";
  const textAreaClass = "w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#103c7f] outline-none h-20 resize-none font-medium";

  // --- HANDLERS ---
  const handleEdit = (jd) => {
      setFormData(jd);
      setIsFormOpen(true);
  };

  const handlePreview = (jd) => {
      setSelectedJD(jd);
      setIsPreviewOpen(true);
  };

  const handleSendToPoster = async (jd_id) => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch('/api/domestic/crm/jd/jobpost-users', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        setJobPostUsers(data || []);
        setSelectedJD(jds.find(j => j.jd_id === jd_id));
        setSelectedPosterUser('');
        setIsSendModalOpen(true);
      } catch (error) {
        console.error('Error fetching jobpost users:', error);
        alert('Failed to load job posting users');
      }
  };

  const handleConfirmHandover = async () => {
    if (!selectedPosterUser) {
      alert('Please select a job posting person');
      return;
    }
    
    const jdId = selectedJD?.jd_id;
    console.log('Sending JD - selectedJD:', selectedJD, 'jdId:', jdId);
    
    if (!jdId) {
      alert('Error: JD ID not found');
      return;
    }
    
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch(`/api/domestic/crm/jd?jd_id=${jdId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          status: 'Sent',
          sent_to: selectedPosterUser || null,
          sent_date: new Date().toISOString().split('T')[0]
        })
      });
      const data = await response.json();
      
      // Even if there's an error, refresh the list to see actual state
      fetchJDs();
      setIsSendModalOpen(false);
      
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        alert("JD sent to Job Posting Team!");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      fetchJDs(); // Refresh anyway
      setIsSendModalOpen(false);
      alert('Failed to update, but refreshing list...');
    }
  };

  // Fetch postings and CV data for modal
  const fetchCVModalData = async (jdId) => {
    setCvModalLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      
      // Fetch job_postings for this JD
      const postingsRes = await fetch(`/api/domestic/crm/jd/job-postings?jd_id=${jdId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const postingsData = await postingsRes.json();
      
      // Fetch posting_data for this JD
      const cvRes = await fetch(`/api/domestic/crm/jd/posting-data?jd_id=${jdId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const cvData = await cvRes.json();
      
      setCvModalData({
        postings: postingsData.error ? [] : (postingsData || []),
        cvLogs: cvData.error ? [] : (cvData || [])
      });
    } catch (error) {
      console.error('Error fetching CV modal data:', error);
      setCvModalData({ postings: [], cvLogs: [] });
    } finally {
      setCvModalLoading(false);
    }
  };

  const handleSave = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        
        // Remove computed fields that shouldn't be saved to database
        const { totalCVs, sent_to_name, created_date, ...cleanFormData } = formData;
        
        const method = formData.jd_id ? 'PUT' : 'POST';
        const url = formData.jd_id 
          ? `/api/domestic/crm/jd?jd_id=${formData.jd_id}`
          : '/api/domestic/crm/jd';
        
        const response = await fetch(url, {
          method,
          headers: { 
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ ...cleanFormData, status: 'Draft' })
        });
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        if (formData.jd_id) {
          // Use the response data from API to ensure consistency
          setJds(jds.map(item => item.jd_id === formData.jd_id ? data : item));
        } else {
          setJds([data, ...jds]);
        }
        setIsFormOpen(false);
        setFormData(initialForm);
      } catch (error) {
        console.error('Error saving JD:', error);
        alert('Failed to save JD');
      }
  };

  // NATIVE, HIGH-QUALITY PDF GENERATION
  const downloadPDF = () => {
      window.print(); 
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] p-6 print:p-0 print:bg-white">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-end mb-6 print:hidden">
         <div>
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Job Requirements (JD)</h1>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Create & Manage JDs for Clients</p>
         </div>
         <button 
            onClick={() => { setFormData(initialForm); setIsFormOpen(true); }}
            className="bg-[#103c7f] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-900 transition flex items-center gap-2"
         >
            <Plus size={18}/> Create New JD
         </button>
      </div>

      {/* 2. TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print:hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-[#103c7f] text-white text-[11px] font-bold uppercase sticky top-0 z-10">
                    <tr>
                        <th className="p-3 border-r border-blue-800 whitespace-nowrap">Create Date</th>
                        <th className="p-3 border-r border-blue-800">Client Name</th>
                        <th className="p-3 border-r border-blue-800 w-64">Job Title</th>
                        <th className="p-3 border-r border-blue-800">Location & Package</th>
                        <th className="p-3 border-r border-blue-800 text-center">JD</th>
                        <th className="p-3 border-r border-blue-800 text-center">Status</th>
                        <th className="p-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                    ) : jds.length === 0 ? (
                      <tr><td colSpan={7} className="p-4 text-center text-gray-500">No Job Descriptions found. Click "Create New JD" to add one.</td></tr>
                    ) : (
                    jds.map((jd) => (
                        <tr key={jd.jd_id} className="hover:bg-blue-50/20 transition group">
                            <td className="p-2 border-r border-gray-100 whitespace-nowrap text-gray-500 font-bold align-middle">
                                <div className="flex items-center gap-1.5"><Calendar size={12} className="text-gray-400"/> {jd.created_date || "N/A"}</div>
                            </td>
                            <td className="p-2 border-r border-gray-100 font-bold text-gray-800">
                                {jd.client_name || "Internal"}
                            </td>
                            <td className="p-2 border-r border-gray-100 font-bold text-[#103c7f] text-sm leading-tight">
                                {jd.job_title}
                            </td>
                            <td className="p-2 border-r border-gray-100">
                                <div className="flex flex-col gap-1.5">
                                    <span className="flex items-start gap-1 text-gray-600"><MapPin size={12} className="mt-0.5 shrink-0"/> {jd.location}</span>
                                    <span className="flex items-center gap-1 font-mono font-bold text-green-700 bg-green-50 w-fit px-2 py-0.5 rounded border border-green-100"><IndianRupee size={12}/> {jd.package}</span>
                                </div>
                            </td>
                            <td className="p-2 border-r border-gray-100 text-center align-middle">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => handlePreview(jd)} title="Preview JD" className="p-1.5 bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-600 hover:text-white transition">
                                        <FileText size={14}/>
                                    </button>
                                    <button onClick={() => handleEdit(jd)} title="Edit JD" className="p-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded hover:bg-gray-600 hover:text-white transition">
                                        <Edit size={14}/>
                                    </button>
                                </div>
                            </td>
                            <td className="p-2 border-r border-gray-100 text-center">
                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border whitespace-nowrap ${
                                    jd.status === 'Sent' ? 'bg-green-50 text-green-700 border-green-200' :
                                    jd.status === 'Live' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    jd.status === 'Paused' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    jd.status === 'Deleted' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-gray-100 text-gray-500 border-gray-200'
                                }`}>
                                    {jd.status === 'Sent' && jd.sent_to_name ? `Sent to ${jd.sent_to_name}` : (jd.status || 'Draft')}
                                </span>
                            </td>
                            <td className="p-2 text-center align-middle">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => handleSendToPoster(jd.jd_id)} disabled={jd.status !== 'Draft'} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded hover:bg-blue-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-[10px] uppercase tracking-wider">
                                        <Send size={12}/> Send
                                    </button>
                                    <button onClick={() => { setSelectedJD(jd); setIsCVModalOpen(true); fetchCVModalData(jd.jd_id); }} className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded border border-purple-100 hover:bg-purple-100 transition font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
                                        <Users size={12}/> {jd.totalCVs || 0} Apps
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )))}
                </tbody>
             </table>
         </div>
      </div>

      {/* --- 3. CREATE / EDIT FORM MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 border-4 border-white relative z-[10000]">
                <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-lg uppercase flex items-center gap-2"><Edit size={20}/> {formData.jd_id ? 'Edit' : 'Create'} Job Description</h3>
                    <button onClick={() => setIsFormOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-4">
                    <div className="col-span-2"><h4 className="text-xs font-black text-gray-400 uppercase border-b pb-1 mb-2">Job Details</h4></div>
                    
                    <div><label className={labelClass}>Client / Company Name (Internal)</label><input type="text" placeholder="e.g. TechCorp Solutions" className={inputClass} value={formData.client_name || ""} onChange={(e)=>setFormData({...formData, client_name: e.target.value})}/></div>
                    <div><label className={labelClass}>Job Title</label><input type="text" className={inputClass} value={formData.job_title || ""} onChange={(e)=>setFormData({...formData, job_title: e.target.value})}/></div>
                    
                    <div><label className={labelClass}>Location</label><input type="text" className={inputClass} value={formData.location || ""} onChange={(e)=>setFormData({...formData, location: e.target.value})}/></div>
                    <div><label className={labelClass}>Experience</label><input type="text" className={inputClass} value={formData.experience || ""} onChange={(e)=>setFormData({...formData, experience: e.target.value})}/></div>
                    <div><label className={labelClass}>Employment Type</label><input type="text" className={inputClass} value={formData.employment_type || ""} onChange={(e)=>setFormData({...formData, employment_type: e.target.value})}/></div>
                    <div><label className={labelClass}>Working Days</label><input type="text" className={inputClass} value={formData.working_days || ""} onChange={(e)=>setFormData({...formData, working_days: e.target.value})}/></div>
                    <div><label className={labelClass}>Timings</label><input type="text" className={inputClass} value={formData.timings || ""} onChange={(e)=>setFormData({...formData, timings: e.target.value})}/></div>
                    <div><label className={labelClass}>Package (LPA)</label><input type="text" className={inputClass} value={formData.package || ""} onChange={(e)=>setFormData({...formData, package: e.target.value})}/></div>
                    <div className="col-span-2"><label className={labelClass}>Tool Requirement</label><input type="text" className={inputClass} value={formData.tool_requirement || ""} onChange={(e)=>setFormData({...formData, tool_requirement: e.target.value})}/></div>

                    <div className="col-span-2 mt-4"><h4 className="text-xs font-black text-gray-400 uppercase border-b pb-1 mb-2">Description & Requirements</h4></div>
                    <div className="col-span-2"><label className={labelClass}>Job Summary</label><textarea className={textAreaClass} value={formData.job_summary || ""} onChange={(e)=>setFormData({...formData, job_summary: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className={labelClass}>Role & Responsibilities</label><textarea className={`${textAreaClass} h-24`} value={formData.rnr || ""} onChange={(e)=>setFormData({...formData, rnr: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className={labelClass}>Required Skills</label><textarea className={textAreaClass} value={formData.req_skills || ""} onChange={(e)=>setFormData({...formData, req_skills: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className={labelClass}>Preferred Qualifications</label><textarea className={textAreaClass} value={formData.preferred_qual || ""} onChange={(e)=>setFormData({...formData, preferred_qual: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className={labelClass}>What Company Offers</label><textarea className={textAreaClass} value={formData.company_offers || ""} onChange={(e)=>setFormData({...formData, company_offers: e.target.value})}></textarea></div>
                    
                    <div className="col-span-2 mt-4"><h4 className="text-xs font-black text-gray-400 uppercase border-b pb-1 mb-2">Contact Info</h4></div>
                    <div className="col-span-2"><label className={labelClass}>Contact Details</label><textarea className={textAreaClass} value={formData.contact_details || ""} onChange={(e)=>setFormData({...formData, contact_details: e.target.value})}></textarea></div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-200 transition">Cancel</button>
                    <button onClick={handleSave} className="bg-[#103c7f] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-900 transition">Save JD</button>
                </div>
            </div>
        </div>
      )}

      {/* --- 4. PDF PREVIEW MODAL --- */}
      {isPreviewOpen && selectedJD && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[9999] p-0 md:p-4 print:static print:block print:bg-white print:p-0 print:z-auto">
            
            <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl print:block print:h-auto print:max-w-full print:shadow-none print:rounded-none print:overflow-visible">
                
                {/* Header (Hidden in Print) */}
                <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900 print:hidden">
                    <div className="flex items-center gap-3">
                        <FileText size={20} />
                        <h3 className="font-bold text-lg uppercase tracking-wide">Document Preview</h3>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={downloadPDF} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wider">
                            <Download size={16}/> Save as PDF
                        </button>
                        <button onClick={() => setIsPreviewOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* --- PDF CONTENT --- */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-gray-200 p-4 md:p-8 block print:block print:overflow-visible print:bg-white print:p-0">
                    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max mx-auto p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative print:w-full print:max-w-none print:shadow-none print:m-0 print:border-none" id="pdf-content">
                        
                        {/* 1. Header Logo */}
                        <div className="mb-10">
                            <Image src="/maven-logo.png" alt="Maven Jobs" width={220} height={70} className="object-contain" priority />
                        </div>

                        {/* 2. Bordered Container */}
                        <div className="border border-black p-8 min-h-[850px] relative print:border-none print:p-0">
                            
                            {/* Key Value Pairs */}
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

                            {/* Sections */}
                            <div className="space-y-8 text-[15px]">
                                {selectedJD.job_summary && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{selectedJD.job_summary}</p></div>
                                )}
                                
                                {selectedJD.rnr && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {selectedJD.rnr.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {selectedJD.req_skills && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {selectedJD.req_skills.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {selectedJD.preferred_qual && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {selectedJD.preferred_qual.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {selectedJD.company_offers && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {selectedJD.company_offers.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {selectedJD.contact_details && (
                                    <div className="mt-12 pt-6 border-t border-black/20">
                                        <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                        <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{selectedJD.contact_details}</div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
      )}

      {/* --- 5. SEND TO POSTER MODAL --- */}
      {isSendModalOpen && selectedJD && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border-4 border-white relative z-[10000]">
                <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-lg uppercase flex items-center gap-2">Send to Job Poster</h3>
                    <button onClick={() => setIsSendModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20}/></button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Select the job posting person to whom you want to handover this JD:
                    </p>
                    
                    <div className="mb-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Job Title</label>
                        <div className="w-full border border-gray-200 rounded-lg p-3 text-sm bg-gray-50 font-bold text-[#103c7f]">
                            {selectedJD.job_title}
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Select Job Posting Person</label>
                        <select 
                            value={selectedPosterUser}
                            onChange={(e) => setSelectedPosterUser(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#103c7f] outline-none font-medium"
                        >
                            <option value="">-- Select Person --</option>
                            {jobPostUsers.map(user => (
                                <option key={user.user_id} value={user.user_id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {jobPostUsers.length === 0 && (
                        <p className="text-sm text-red-500 mb-4">No job posting users found.</p>
                    )}
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button onClick={() => setIsSendModalOpen(false)} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-200 transition">Cancel</button>
                    <button onClick={handleConfirmHandover} className="bg-[#103c7f] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-900 transition">Confirm Handover</button>
                </div>
            </div>
        </div>
      )}

      {/* --- 6. VIEW APPLICANTS MODAL --- */}
      {isCVModalOpen && selectedJD && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 print:hidden">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl h-[70vh] flex flex-col overflow-hidden animate-in zoom-in-95 border-4 border-white relative z-[10000]">
                
                {/* 1. Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-start bg-white shrink-0">
                    <div className="flex gap-4 items-center">
                        <div className="p-3 bg-blue-50 text-[#103c7f] rounded-xl border border-blue-100">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#103c7f] uppercase tracking-tight">Applications Data</h2>
                            <div className="flex flex-col gap-1 mt-0.5">
                                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    <Briefcase size={12} /> {selectedJD.job_title}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                    For Client: {selectedJD.client_name || "Internal"}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsCVModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 transition bg-gray-50 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* 2. Content - Two Vertical Sections */}
                <div className="flex-1 overflow-hidden flex flex-col gap-4 p-6 bg-gray-50">
                    {/* Section 1: Postings */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-blue-600 px-4 py-2 flex justify-between items-center">
                            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Globe size={14}/> Job Postings (Platform Links)
                            </h3>
                            <span className="text-[10px] font-bold text-blue-200">{cvModalData.postings.length} platforms</span>
                        </div>
                        <div className="p-4">
                            {cvModalLoading ? (
                                <p className="text-center text-gray-500 py-4">Loading...</p>
                            ) : cvModalData.postings.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">No postings yet</p>
                            ) : (
                                <table className="w-full text-left text-xs">
                                    <thead className="text-[10px] uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-2">Platform</th>
                                            <th className="p-2">Posted On</th>
                                            <th className="p-2">Live URL</th>
                                            <th className="p-2 text-center">Stage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cvModalData.postings.map(pub => (
                                            <tr key={pub.id} className="hover:bg-gray-50">
                                                <td className="p-2 font-bold text-gray-800">{pub.platform}</td>
                                                <td className="p-2 text-gray-600">{pub.posted_on || '-'}</td>
                                                <td className="p-2">
                                                    {pub.live_url ? (
                                                        <a href={pub.live_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Link</a>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        pub.current_stage === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {pub.current_stage}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Section 2: CV Data */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-purple-600 px-4 py-2 flex justify-between items-center">
                            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Users size={14}/> CVs / Applications Received
                            </h3>
                            <span className="text-[10px] font-bold text-purple-200">{cvModalData.cvLogs.reduce((sum, log) => sum + (log.cv_received || 0), 0)} total CVs</span>
                        </div>
                        <div className="p-4">
                            {cvModalLoading ? (
                                <p className="text-center text-gray-500 py-4">Loading...</p>
                            ) : cvModalData.cvLogs.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">No CV data logged yet</p>
                            ) : (
                                <table className="w-full text-left text-xs">
                                    <thead className="text-[10px] uppercase text-gray-400 bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="p-2">Date</th>
                                            <th className="p-2">Platform</th>
                                            <th className="p-2 text-center">CVs Received</th>
                                            <th className="p-2 text-center">Calls Done</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cvModalData.cvLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="p-2 text-gray-600 font-mono">{log.date}</td>
                                                <td className="p-2 font-bold text-gray-800">{log.platform}</td>
                                                <td className="p-2 text-center font-black text-purple-600">{log.cv_received || 0}</td>
                                                <td className="p-2 text-center font-black text-green-600">{log.calls_done || 0}</td>
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

    </div>
  );
}
