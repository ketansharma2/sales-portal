"use client";
import { useState } from "react";
import Image from "next/image";
import { 
  FileText, Plus, Search, Send, Download, Edit, Eye, 
  X, CheckCircle, Briefcase, MapPin, IndianRupee, Users,
  Printer, Share2, Calendar, Phone, Mail
} from "lucide-react";

export default function JobRequirementsPage() {
  
  // --- STATE ---
  const [jds, setJds] = useState([
    { 
      id: 1, 
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
      title: "", location: "", experience: "", empType: "", workingDays: "",
      timings: "", package: "", tools: "", summary: "", roles: "",
      skills: "", qualifications: "", offers: "", contact: ""
  };
  const [formData, setFormData] = useState(initialForm);

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
          setJds([{ ...formData, id: Date.now(), status: "Draft", cv_count: 0, applications: [] }, ...jds]);
      }
      setIsFormOpen(false);
      setFormData(initialForm);
  };

  const downloadPDF = () => {
      window.print(); 
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] p-6 relative z-0">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-end mb-6">
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative z-0">
         <table className="w-full text-left border-collapse">
            <thead className="bg-[#103c7f] text-white text-[11px] font-bold uppercase sticky top-0 z-10">
                <tr>
                    <th className="p-4 border-r border-blue-800">Job Title</th>
                    <th className="p-4 border-r border-blue-800">Location</th>
                    <th className="p-4 border-r border-blue-800">Package</th>
                    <th className="p-4 border-r border-blue-800 text-center">Status</th>
                    <th className="p-4 border-r border-blue-800 text-center">Applications</th>
                    <th className="p-4 text-center w-48">Actions</th>
                </tr>
            </thead>
            <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                {jds.map((jd) => (
                    <tr key={jd.id} className="hover:bg-blue-50/20 transition group">
                        <td className="p-4 border-r border-gray-100 font-bold text-[#103c7f] text-sm">{jd.title}</td>
                        <td className="p-4 border-r border-gray-100">{jd.location}</td>
                        <td className="p-4 border-r border-gray-100 font-mono font-bold text-gray-600">{jd.package}</td>
                        <td className="p-4 border-r border-gray-100 text-center">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${
                                jd.status === 'Sent to Poster' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                                {jd.status}
                            </span>
                        </td>
                        <td className="p-4 border-r border-gray-100 text-center">
                            <button onClick={() => { setSelectedJD(jd); setIsCVModalOpen(true); }} className="flex items-center justify-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded border border-purple-100 hover:bg-purple-100 transition mx-auto font-bold">
                                <Users size={12}/> {jd.cv_count} CVs
                            </button>
                        </td>
                        <td className="p-4 text-center flex justify-center gap-2">
                            <button onClick={() => handleSendToPoster(jd.id)} title="Send to Job Poster" disabled={jd.status === 'Sent to Poster'} className="p-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded hover:bg-blue-600 hover:text-white transition disabled:opacity-50">
                                <Send size={14}/>
                            </button>
                            <button onClick={() => handlePreview(jd)} title="Preview & Download PDF" className="p-1.5 bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-600 hover:text-white transition">
                                <FileText size={14}/>
                            </button>
                            <button onClick={() => handleEdit(jd)} title="Edit JD" className="p-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded hover:bg-gray-600 hover:text-white transition">
                                <Edit size={14}/>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>

      {/* --- 3. CREATE / EDIT FORM MODAL --- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[50] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 border-4 border-white">
                <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-lg uppercase flex items-center gap-2"><Edit size={20}/> {formData.id ? 'Edit' : 'Create'} Job Description</h3>
                    <button onClick={() => setIsFormOpen(false)}><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-4">
                    {/* (Same Fields as before - Keeping it concise for display) */}
                    <div className="col-span-2"><h4 className="text-xs font-black text-gray-400 uppercase border-b pb-1 mb-2">Job Details</h4></div>
                    <div><label className="label-text">Job Title</label><input type="text" className="input-field" value={formData.title} onChange={(e)=>setFormData({...formData, title: e.target.value})}/></div>
                    <div><label className="label-text">Location</label><input type="text" className="input-field" value={formData.location} onChange={(e)=>setFormData({...formData, location: e.target.value})}/></div>
                    <div><label className="label-text">Experience</label><input type="text" className="input-field" value={formData.experience} onChange={(e)=>setFormData({...formData, experience: e.target.value})}/></div>
                    <div><label className="label-text">Employment Type</label><input type="text" className="input-field" value={formData.empType} onChange={(e)=>setFormData({...formData, empType: e.target.value})}/></div>
                    <div><label className="label-text">Working Days</label><input type="text" className="input-field" value={formData.workingDays} onChange={(e)=>setFormData({...formData, workingDays: e.target.value})}/></div>
                    <div><label className="label-text">Timings</label><input type="text" className="input-field" value={formData.timings} onChange={(e)=>setFormData({...formData, timings: e.target.value})}/></div>
                    <div><label className="label-text">Package (LPA)</label><input type="text" className="input-field" value={formData.package} onChange={(e)=>setFormData({...formData, package: e.target.value})}/></div>
                    <div><label className="label-text">Tool Requirement</label><input type="text" className="input-field" value={formData.tools} onChange={(e)=>setFormData({...formData, tools: e.target.value})}/></div>

                    <div className="col-span-2 mt-4"><h4 className="text-xs font-black text-gray-400 uppercase border-b pb-1 mb-2">Description & Requirements</h4></div>
                    <div className="col-span-2"><label className="label-text">Job Summary</label><textarea className="input-area" value={formData.summary} onChange={(e)=>setFormData({...formData, summary: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className="label-text">Role & Responsibilities</label><textarea className="input-area h-24" value={formData.roles} onChange={(e)=>setFormData({...formData, roles: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className="label-text">Required Skills</label><textarea className="input-area h-20" value={formData.skills} onChange={(e)=>setFormData({...formData, skills: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className="label-text">Preferred Qualifications</label><textarea className="input-area h-20" value={formData.qualifications} onChange={(e)=>setFormData({...formData, qualifications: e.target.value})}></textarea></div>
                    <div className="col-span-2"><label className="label-text">What Company Offers</label><textarea className="input-area h-20" value={formData.offers} onChange={(e)=>setFormData({...formData, offers: e.target.value})}></textarea></div>
                    
                    <div className="col-span-2 mt-4"><h4 className="text-xs font-black text-gray-400 uppercase border-b pb-1 mb-2">Contact Info</h4></div>
                    <div className="col-span-2"><label className="label-text">Contact Details</label><textarea className="input-area" value={formData.contact} onChange={(e)=>setFormData({...formData, contact: e.target.value})}></textarea></div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button onClick={() => setIsFormOpen(false)} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSave} className="bg-[#103c7f] text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-900">Save JD</button>
                </div>
            </div>
        </div>
      )}

      {/* --- 4. PDF PREVIEW MODAL (FIXED Z-INDEX & STYLE) --- */}
      {isPreviewOpen && selectedJD && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-xl flex justify-center items-center z-[100] p-0 md:p-4">
            
            <div className="bg-transparent w-full max-w-[800px] h-full md:h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 relative shadow-2xl rounded-2xl">
                
                {/* Header (Blue Bar) */}
                <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 border-b border-blue-900">
                    <div className="flex items-center gap-3">
                        <FileText size={20} />
                        <h3 className="font-bold text-lg uppercase tracking-wide">Document Preview</h3>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={downloadPDF} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg uppercase tracking-wider">
                            <Download size={16}/> Print PDF
                        </button>
                        <button onClick={() => setIsPreviewOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition">
                            <X size={20}/>
                        </button>
                    </div>
                </div>

                {/* --- PDF CONTENT --- */}
                <div className="flex-1 overflow-y-auto bg-gray-200 p-4 md:p-8 custom-scrollbar flex justify-center">
                    {/* The Paper */}
                    <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[10mm] md:p-[15mm] shadow-xl text-black font-['Calibri'] relative" id="pdf-content">
                        
                        {/* 1. Header Logo */}
                        <div className="mb-10">
                            <Image src="/maven-logo.png" alt="Maven Jobs" width={220} height={70} className="object-contain" priority />
                        </div>

                        {/* 2. Bordered Container */}
                        <div className="border border-black p-8 min-h-[850px] relative">
                            
                            {/* Key Value Pairs */}
                            <div className="space-y-4 mb-10 text-[15px] leading-relaxed">
                                <p><span className="font-bold">JOB TITLE : </span> {selectedJD.title}</p>
                                <p><span className="font-bold">LOCATION : </span> {selectedJD.location}</p>
                                <p><span className="font-bold">EXPERIENCE : </span> {selectedJD.experience}</p>
                                <p><span className="font-bold">EMPLOYMENT TYPE : </span> {selectedJD.empType}</p>
                                <p><span className="font-bold">WORKING DAYS : </span> {selectedJD.workingDays}</p>
                                <p><span className="font-bold">TIMINGS : </span> {selectedJD.timings}</p>
                                <p><span className="font-bold">PACKAGE : </span> {selectedJD.package}</p>
                                <p><span className="font-bold">TOOL REQUIREMENT : </span> {selectedJD.tools}</p>
                            </div>

                            {/* Sections */}
                            <div className="space-y-8 text-[15px]">
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">Job Summary :</h4><p className="leading-relaxed text-justify text-gray-800">{selectedJD.summary}</p></div>
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">Role & Responsibilities :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.roles.split('\n').map((line, i) => line && <li key={i}>{line}</li>)}</ul></div>
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">Required Skills :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.skills.split('\n').map((line, i) => line && <li key={i}>{line}</li>)}</ul></div>
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">Preferred Qualifications :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.qualifications.split('\n').map((line, i) => line && <li key={i}>{line}</li>)}</ul></div>
                                <div><h4 className="font-bold mb-2 uppercase text-[16px]">What Company Offer :</h4><ul className="list-disc pl-5 space-y-1.5 text-gray-800">{selectedJD.offers.split('\n').map((line, i) => line && <li key={i}>{line}</li>)}</ul></div>
                                <div className="mt-12 pt-6 border-t border-black/20">
                                    <h4 className="font-bold mb-3 uppercase text-[16px]">Contact Us To Apply :</h4>
                                    <div className="whitespace-pre-line leading-loose text-gray-900 font-medium">{selectedJD.contact}</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
      )}

      {/* --- 5. VIEW APPLICANTS MODAL (UPDATED TO "VIEW MODAL" STYLE) --- */}
      {isCVModalOpen && selectedJD && (
          <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-[50] p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 border-4 border-white">
                  
                  {/* 1. Header */}
                  <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-start bg-white">
                        <div className="flex gap-4 items-center">
                            <div className="p-3 bg-blue-50 text-[#103c7f] rounded-xl border border-blue-100">
                                <Users size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#103c7f] uppercase tracking-tight">Applications Received</h2>
                                <div className="flex items-center gap-1 text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
                                    <Briefcase size={12} /> {selectedJD.title}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsCVModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                            <X size={24} />
                        </button>
                  </div>

                  {/* 2. Top Info Cards */}
                  <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
                        <div className="flex gap-4">
                            <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                                <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Users size={18}/></div>
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total CVs</p>
                                    <p className="text-lg font-black text-gray-800">{selectedJD.cv_count}</p>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                                <div className="bg-green-50 p-2 rounded-lg text-green-600"><CheckCircle size={18}/></div>
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Shortlisted</p>
                                    <p className="text-lg font-black text-gray-800">1</p>
                                </div>
                            </div>
                        </div>
                  </div>

                  {/* 3. List */}
                  <div className="flex-1 bg-white p-0 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left">
                          <thead className="bg-white text-[10px] font-bold text-gray-400 uppercase sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                              <tr>
                                  <th className="px-8 py-4">Candidate Name</th>
                                  <th className="px-8 py-4">Contact Info</th>
                                  <th className="px-8 py-4">Applied Date</th>
                                  <th className="px-8 py-4 text-center">Status</th>
                                  <th className="px-8 py-4 text-center">Resume</th>
                              </tr>
                          </thead>
                          <tbody className="text-xs divide-y divide-gray-50">
                              {selectedJD.applications && selectedJD.applications.length > 0 ? (
                                  selectedJD.applications.map((cv, idx) => (
                                      <tr key={idx} className="hover:bg-blue-50/20 transition duration-150 group">
                                          <td className="px-8 py-4 font-bold text-[#103c7f]">{cv.name}</td>
                                          <td className="px-8 py-4">
                                              <div className="flex flex-col">
                                                  <span className="font-bold text-gray-600 flex items-center gap-1"><Phone size={10}/> {cv.phone}</span>
                                                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><Mail size={10}/> {cv.email}</span>
                                              </div>
                                          </td>
                                          <td className="px-8 py-4 text-gray-500 font-mono">{cv.date}</td>
                                          <td className="px-8 py-4 text-center">
                                              <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                                                  cv.status === 'Shortlisted' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                              }`}>
                                                  {cv.status}
                                              </span>
                                          </td>
                                          <td className="px-8 py-4 text-center">
                                              <button className="text-blue-600 hover:text-blue-800 font-bold flex items-center justify-center gap-1 mx-auto bg-blue-50 p-2 rounded-lg transition">
                                                  <Download size={14}/> View PDF
                                              </button>
                                          </td>
                                      </tr>
                                  ))
                              ) : (
                                  <tr><td colSpan="5" className="p-12 text-center text-gray-400 uppercase font-bold tracking-widest">No Applications Yet</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>

              </div>
          </div>
      )}

      <style jsx>{`
        .label-text { @apply text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1; }
        .input-field { @apply w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#103c7f] outline-none font-medium; }
        .input-area { @apply w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#103c7f] outline-none h-20 resize-none font-medium; }
        
        @media print {
            body * { visibility: hidden; }
            #pdf-content, #pdf-content * { visibility: visible; }
            #pdf-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-shadow: none; border: none; }
        }
      `}</style>

    </div>
  );
}