"use client";
import React, { useState, useEffect } from "react";
import { 
  HelpCircle, Plus, Search, Edit, Trash2, FileText, 
  X, Building2, Briefcase, MessageSquare, AlertCircle, Printer
} from "lucide-react";

export default function FAQManagement() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pdfFAQ, setPdfFAQ] = useState(null); // State for PDF View
  
  // Form State
  const initialFormState = {
    id: null,
    client: "",
    profile: "",
    qaList: [{ question: "" }] // Removed answer
  };
  const [formData, setFormData] = useState(initialFormState);

  // Mock Dropdown Data
  const clientsList = ["TechNova Solutions", "Global Finance", "Urban Builders", "Apex Retail", "Stellar Jobs"];
  const profilesList = ["Frontend Developer", "Backend Developer", "Sales Executive", "HR Manager", "Data Analyst"];

  // Mock Table Data
  const [faqs, setFaqs] = useState([
    { 
      id: 1, client: "TechNova Solutions", profile: "Frontend Developer", 
      qaList: [
        { question: "Explain Virtual DOM in React." },
        { question: "What are React Hooks?" }
      ]
    },
    { 
      id: 2, client: "Global Finance", profile: "Data Analyst", 
      qaList: [
        { question: "Difference between LEFT JOIN and INNER JOIN?" },
        { question: "Explain Normalization." },
        { question: "What is a Primary Key?" }
      ]
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // --- Handlers ---
  const handleOpenModal = (faq = null) => {
    if (faq) {
      setFormData(faq);
      setIsEditing(true);
    } else {
      setFormData(initialFormState);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  const handleAddQuestion = () => {
    setFormData({ ...formData, qaList: [...formData.qaList, { question: "" }] });
  };

  const handleRemoveQuestion = (index) => {
    const updatedQA = formData.qaList.filter((_, i) => i !== index);
    setFormData({ ...formData, qaList: updatedQA });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQA = [...formData.qaList];
    updatedQA[index][field] = value;
    setFormData({ ...formData, qaList: updatedQA });
  };

  const handleSave = () => {
    if (!formData.client || !formData.profile || formData.qaList[0].question.trim() === "") {
      alert("Please fill in the Client, Profile, and at least one Question.");
      return;
    }

    if (isEditing) {
      setFaqs(faqs.map(f => f.id === formData.id ? formData : f));
    } else {
      setFaqs([{ ...formData, id: Date.now() }, ...faqs]);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if(confirm("Are you sure you want to delete this FAQ set?")) {
        setFaqs(faqs.filter(f => f.id !== id));
    }
  };

  return (
    <div className="p-4 bg-[#f8fafc] font-['Calibri'] min-h-screen text-slate-800 flex flex-col relative print:bg-white print:p-0">
      
      {/* Hide the main dashboard when printing */}
      <div className={`max-w-7xl mx-auto w-full space-y-4 ${pdfFAQ ? 'print:hidden' : ''}`}>
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h1 className="text-xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <HelpCircle size={20}/> Interview FAQ Repository
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Manage Client-Specific Interview Questions</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 focus-within:border-blue-400 transition-colors flex-1 sm:w-64">
                <Search size={14} className="text-gray-400" />
                <input 
                  type="text" placeholder="Search Client or Profile..." 
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => handleOpenModal()} 
                className="bg-[#103c7f] hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1 shrink-0"
              >
                <Plus size={14} /> Add FAQ
              </button>
            </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]"> 
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead className="sticky top-0 z-20 shadow-sm bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 border-b border-gray-200">Client Name</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 border-b border-gray-200">Profile / Role</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 border-b border-gray-200 text-center">No. of Questions</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-400 border-b border-gray-200 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {faqs
                          .filter(f => f.client.toLowerCase().includes(searchQuery.toLowerCase()) || f.profile.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((faq) => (
                            <tr key={faq.id} className="hover:bg-slate-50 transition-colors align-middle group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={14} className="text-[#103c7f]" />
                                        <span className="font-black text-[#103c7f] text-sm">{faq.client}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={14} className="text-orange-500" />
                                        <span className="font-bold text-slate-700">{faq.profile}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-black w-6 h-6 rounded-full border border-blue-100">
                                        {faq.qaList.length}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(faq)}
                                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-colors" title="Edit FAQ"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(faq.id)}
                                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-colors" title="Delete FAQ"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => setPdfFAQ(faq)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-md transition-colors text-[10px] font-black uppercase tracking-widest ml-2" title="View PDF"
                                        >
                                            <FileText size={12} /> View PDF
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {faqs.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-bold text-xs uppercase tracking-widest flex flex-col items-center gap-2">
                                    <AlertCircle size={24} /> No FAQs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Modal Header */}
                <div className="bg-[#103c7f] text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        {isEditing ? <Edit size={18} /> : <Plus size={18} />} 
                        {isEditing ? "Edit FAQ Set" : "Add New FAQ Set"}
                    </h2>
                    <button onClick={handleCloseModal} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                    
                    {/* Top Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Client</label>
                            <select 
                                className="bg-white border border-gray-200 text-sm font-bold text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-[#103c7f] shadow-sm"
                                value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})}
                            >
                                <option value="" disabled>-- Select Client --</option>
                                {clientsList.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Profile / Role</label>
                            <select 
                                className="bg-white border border-gray-200 text-sm font-bold text-slate-700 rounded-lg px-3 py-2.5 outline-none focus:border-[#103c7f] shadow-sm"
                                value={formData.profile} onChange={(e) => setFormData({...formData, profile: e.target.value})}
                            >
                                <option value="" disabled>-- Select Profile --</option>
                                {profilesList.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-200 mb-6"></div>

                    {/* Question List */}
                    <div className="space-y-4">
                        {formData.qaList.map((qa, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                <div className="absolute top-4 right-4">
                                    {formData.qaList.length > 1 && (
                                        <button 
                                            onClick={() => handleRemoveQuestion(index)}
                                            className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                                            title="Remove Question"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <MessageSquare size={14}/> Question {index + 1}
                                </h4>
                                
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1">
                                        <input 
                                            type="text" placeholder="e.g. What are the key responsibilities?" 
                                            className="bg-gray-50 border border-gray-200 text-sm font-semibold text-slate-800 rounded-lg px-3 py-2 outline-none focus:border-[#103c7f] focus:bg-white transition-all"
                                            value={qa.question} onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add More Button */}
                        <button 
                            onClick={handleAddQuestion}
                            className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Add Another Question
                        </button>

                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={handleCloseModal}
                        className="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-[#103c7f] hover:bg-blue-900 text-white shadow-md transition-all"
                    >
                        Save FAQ
                    </button>
                </div>

            </div>
        </div>
      )}

      {/* --- PDF PREVIEW / PRINT MODAL --- */}
      {pdfFAQ && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 print:p-0 print:block">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] print:max-h-none h-full print:h-auto rounded-xl shadow-2xl flex flex-col print:shadow-none print:border-none animate-in zoom-in-95 duration-200">
                
                {/* Non-printable header controls */}
                <div className="bg-slate-100 p-4 flex justify-between items-center shrink-0 print:hidden border-b border-gray-200 rounded-t-xl">
                    <h2 className="font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={18}/> PDF Preview Mode
                    </h2>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => window.print()} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
                        >
                            <Printer size={14}/> Save / Print PDF
                        </button>
                        <button 
                            onClick={() => setPdfFAQ(null)} 
                            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                        >
                            <X size={16}/>
                        </button>
                    </div>
                </div>

                {/* Printable A4 Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 bg-gray-200 print:bg-white custom-scrollbar">
                    <div className="bg-white max-w-[210mm] mx-auto min-h-[297mm] shadow-lg print:shadow-none p-10 md:p-14 border border-gray-200 print:border-none">
                        
                        {/* Document Header & Logo */}
                        <div className="flex justify-between items-start border-b-2 border-[#103c7f] pb-6 mb-8">
                            <div className="flex items-center gap-2">
                               <img 
                                    src="/maven-logo.png" // Apne logo ka exact path yahan dalein
                                    alt="Maven Logo" 
                                    className="h-12 object-contain print:h-12"
                                />
                            </div>
                            <div className="text-right">
                                <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">FAQ </h1>
                            </div>
                        </div>

                        {/* Client Meta Info */}
                        <div className="bg-slate-50 border border-gray-200 p-5 rounded-xl mb-8 flex flex-col gap-3">
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-black text-gray-500 uppercase tracking-widest">Client Name:</span>
                                <span className="text-sm font-black text-[#103c7f]">{pdfFAQ.client}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-black text-gray-500 uppercase tracking-widest">Profile / Role:</span>
                                <span className="text-sm font-bold text-slate-700">{pdfFAQ.profile}</span>
                            </div>
                        </div>

                        {/* Questions Content */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4">Question Bank</h3>
                            {pdfFAQ.qaList.map((qa, index) => (
                                <div key={index} className="break-inside-avoid">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-start gap-2 mb-2 leading-snug">
                                        <span className="text-[#103c7f] font-black shrink-0">Q{index + 1}.</span> {qa.question}
                                    </h3>
                                </div>
                            ))}
                        </div>
                        
                        {/* Footer */}
                        <div className="mt-20 pt-6 border-t border-gray-200 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Confidential Document - Maven Jobs
                        </div>

                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}