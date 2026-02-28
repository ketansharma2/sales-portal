"use client";
import { useState } from "react";
import Image from "next/image";
import { 
  FileText, Plus, Send, Download, Edit, 
  X, CheckCircle, Briefcase, Users, Phone, Mail,
  MapPin, IndianRupee, Calendar , Clock
} from "lucide-react";

export default function JobRequirementsPage() {
  
  // --- STATE ---
  const [jds, setJds] = useState([
    { 
      id: 1, 
      createDate: "15 Feb 2026",
      clientName: "TechCorp Solutions",
      title: "Business Development Executive [Male]",
      location: "Ludhiana, Chandigarh, Delhi NCR, Noida",
      experience: "0 months - 2 year",
      empType: "Full-time",
      workingDays: "6 Days",
      timings: "9:30 - 6:30 , 10:00 - 7:00",
      package: "2LPA - 3.96 LPA ( Negotiable )",
      tools: "2 Wheeler Vehicle Mandatory",
      summary: "We are looking for a dynamic and result-oriented Field Sales Executive to join our team...",
      roles: "Generate and close sales leads in the assigned territory.\nBuild and maintain strong relationships.",
      skills: "Strong communication and negotiation skills\nAbility to build and maintain customer relationships",
      qualifications: "Graduate - Fresher\nUndergraduate with minimum 2 years of sales experience",
      offers: "Opportunity to generate new leads & convert into sales .\nTravel Allowance On Per km .",
      contact: "Interested candidates can call on: 8295761297\nEmail Address : Bd1@mavenjobs.in",
      status: "Draft",
      cv_count: 5,
      applications: [
          { name: "Rahul Kumar", phone: "9876543210", email: "rahul@gmail.com", status: "Shortlisted", date: "2026-02-10" },
          { name: "Amit Singh", phone: "9988776655", email: "amit@yahoo.com", status: "Pending", date: "2026-02-09" },
      ]
    }
  ]);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [selectedJD, setSelectedJD] = useState(null);

  // Form State
  const initialForm = {
      clientName: "", title: "", location: "", experience: "", empType: "", workingDays: "",
      timings: "", package: "", tools: "", summary: "", roles: "",
      skills: "", qualifications: "", offers: "", contact: ""
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

  const handleSendToPoster = (id) => {
      setJds(jds.map(item => item.id === id ? { ...item, status: "Sent to Poster" } : item));
      alert("JD sent to Job Posting Team!");
  };

  const handleSave = () => {
      if(formData.id) {
          setJds(jds.map(item => item.id === formData.id ? formData : item));
      } else {
          const newDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          setJds([{ ...formData, id: Date.now(), createDate: newDate, status: "Draft", cv_count: 0, applications: [] }, ...jds]);
      }
      setIsFormOpen(false);
      setFormData(initialForm);
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
                    {jds.map((jd) => (
                        <tr key={jd.id} className="hover:bg-blue-50/20 transition group">
                            <td className="p-2 border-r border-gray-100 whitespace-nowrap text-gray-500 font-bold flex items-center gap-1.5">
                                <Calendar size={12} className="text-gray-400"/> {jd.createDate || "N/A"}
                            </td>
                            <td className="p-2 border-r border-gray-100 font-bold text-gray-800">
                                {jd.clientName || "Internal"}
                            </td>
                            <td className="p-2 border-r border-gray-100 font-bold text-[#103c7f] text-sm leading-tight">
                                {jd.title}
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
                                    jd.status === 'Sent to Poster' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}>
                                    {jd.status}
                                </span>
                            </td>
                            <td className="p-2 text-center align-middle">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => handleSendToPoster(jd.id)} disabled={jd.status === 'Sent to Poster'} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded hover:bg-blue-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-[10px] uppercase tracking-wider">
                                        <Send size={12}/> Send
                                    </button>
                                    <button onClick={() => { setSelectedJD(jd); setIsCVModalOpen(true); }} className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded border border-purple-100 hover:bg-purple-100 transition font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
                                        <Users size={12}/> {jd.cv_count} Apps
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
         </div>
      </div>

      {/* --- 3. CREATE / EDIT FORM MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 border-4 border-white relative z-[10000]">
                <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-lg uppercase flex items-center gap-2"><Edit size={20}/> {formData.id ? 'Edit' : 'Create'} Job Description</h3>
                    <button onClick={() => setIsFormOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-4">
                    <div className="col-span-2"><h4 className="text-xs font-black text-gray-400 uppercase border-b pb-1 mb-2">Job Details</h4></div>
                    
                    <div><label className={labelClass}>Client / Company Name (Internal)</label><input type="text" placeholder="e.g. TechCorp Solutions" className={inputClass} value={formData.clientName || ""} onChange={(e)=>setFormData({...formData, clientName: e.target.value})}/></div>
                    <div><label className={labelClass}>Job Title</label><input type="text" className={inputClass} value={formData.title || ""} onChange={(e)=>setFormData({...formData, title: e.target.value})}/></div>
                    
                    <div><label className={labelClass}>Location</label><input type="text" className={inputClass} value={formData.location || ""} onChange={(e)=>setFormData({...formData, location: e.target.value})}/></div>
                    <div><label className={labelClass}>Experience</label><input type="text" className={inputClass} value={formData.experience || ""} onChange={(e)=>setFormData({...formData, experience: e.target.value})}/></div>
                    <div><label className={labelClass}>Employment Type</label><input type="text" className={inputClass} value={formData.empType || ""} onChange={(e)=>setFormData({...formData, empType: e.target.value})}/></div>
                    <div><label className={labelClass}>Working Days</label><input type="text" className={inputClass} value={formData.workingDays || ""} onChange={(e)=>setFormData({...formData, workingDays: e.target.value})}/></div>
                    <div><label className={labelClass}>Timings</label><input type="text" className={inputClass} value={formData.timings || ""} onChange={(e)=>setFormData({...formData, timings: e.target.value})}/></div>
                    <div><label className={labelClass}>Package (LPA)</label><input type="text" className={inputClass} value={formData.package || ""} onChange={(e)=>setFormData({...formData, package: e.target.value})}/></div>
                    <div className="col-span-2"><label className={labelClass}>Tool Requirement</label><input type="text" className={inputClass} value={formData.tools || ""} onChange={(e)=>setFormData({...formData, tools: e.target.value})}/></div>

                    <div className="col-span-2 mt-4"><h4 className="text-xs font-black text-gray-400 uppercase border-b pb-1 mb-2">Description & Requirements</h4></div>
                    <div className="col-span-2"><label className={labelClass}>Job Summary</label><textarea className={textAreaClass} value={formData.summary || ""} onChange={(e)=>setFormData({...formData, summary: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className={labelClass}>Role & Responsibilities</label><textarea className={`${textAreaClass} h-24`} value={formData.roles || ""} onChange={(e)=>setFormData({...formData, roles: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className={labelClass}>Required Skills</label><textarea className={textAreaClass} value={formData.skills || ""} onChange={(e)=>setFormData({...formData, skills: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className={labelClass}>Preferred Qualifications</label><textarea className={textAreaClass} value={formData.qualifications || ""} onChange={(e)=>setFormData({...formData, qualifications: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className={labelClass}>What Company Offers</label><textarea className={textAreaClass} value={formData.offers || ""} onChange={(e)=>setFormData({...formData, offers: e.target.value})}></textarea></div>
                    
                    <div className="col-span-2 mt-4"><h4 className="text-xs font-black text-gray-400 uppercase border-b pb-1 mb-2">Contact Info</h4></div>
                    <div className="col-span-2"><label className={labelClass}>Contact Details</label><textarea className={textAreaClass} value={formData.contact || ""} onChange={(e)=>setFormData({...formData, contact: e.target.value})}></textarea></div>
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
                                {selectedJD.title && <p><span className="font-bold">JOB TITLE : </span> {selectedJD.title}</p>}
                                {selectedJD.location && <p><span className="font-bold">LOCATION : </span> {selectedJD.location}</p>}
                                {selectedJD.experience && <p><span className="font-bold">EXPERIENCE : </span> {selectedJD.experience}</p>}
                                {selectedJD.empType && <p><span className="font-bold">EMPLOYMENT TYPE : </span> {selectedJD.empType}</p>}
                                {selectedJD.workingDays && <p><span className="font-bold">WORKING DAYS : </span> {selectedJD.workingDays}</p>}
                                {selectedJD.timings && <p><span className="font-bold">TIMINGS : </span> {selectedJD.timings}</p>}
                                {selectedJD.package && <p><span className="font-bold">PACKAGE : </span> {selectedJD.package}</p>}
                                {selectedJD.tools && <p><span className="font-bold">TOOL REQUIREMENT : </span> {selectedJD.tools}</p>}
                            </div>

                            {/* Sections */}
                            <div className="space-y-8 text-[15px]">
                                {selectedJD.summary && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{selectedJD.summary}</p></div>
                                )}
                                
                                {selectedJD.roles && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {selectedJD.roles.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {selectedJD.skills && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {selectedJD.skills.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {selectedJD.qualifications && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {selectedJD.qualifications.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {selectedJD.offers && (
                                    <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4>
                                        <ul className="list-disc pl-5 space-y-1.5 text-gray-800">
                                            {selectedJD.offers.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {selectedJD.contact && (
                                    <div className="mt-12 pt-6 border-t border-black/20">
                                        <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                        <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{selectedJD.contact}</div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
      )}

      {/* --- 5. VIEW APPLICANTS MODAL --- */}
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
                                <h2 className="text-xl font-black text-[#103c7f] uppercase tracking-tight">Applications Received</h2>
                                <div className="flex flex-col gap-1 mt-0.5">
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                        <Briefcase size={12} /> {selectedJD.title}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                        For Client: {selectedJD.clientName || "Internal"}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsCVModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 transition bg-gray-50 hover:bg-gray-100 rounded-full">
                            <X size={20} />
                        </button>
                  </div>

                  {/* 2. Coming Soon Content */}
                  <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-8 relative">
                      
                      {/* Background decorative pattern (optional) */}
                      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#103c7f 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

                      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl flex flex-col items-center text-center max-w-lg z-10 animate-in slide-in-from-bottom-4 duration-500">
                          
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center text-[#103c7f] mb-6 shadow-inner border border-blue-200">
                              <Clock size={40} />
                          </div>
                          
                          <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-3">
                              Feature Coming Soon!
                          </h3>
                          
                        
                         
                          
                      </div>
                  </div>

              </div>
          </div>
      )}

    </div>
  );
}